// WhoIsJohnny? Nobodies: the server side.
// Runs on Cloudflare Pages Functions. Answers everything under /api/.
//
// Needs in Cloudflare (Settings > Bindings / Variables and secrets):
//   NOBODIES          KV namespace binding (the shelf and the register live here)
//   POLAR_TOKEN       Polar Organization Access Token (secret)
//   POLAR_PRODUCT_ID  Id of the EUR 9 product in Polar
//   RESEND_KEY        Resend API key (secret). Optional: without it no email is sent.
//   POLAR_API         Optional. Set to https://sandbox-api.polar.sh to test with Polar's sandbox.

import { nameOf, pad } from '../../assets/nobody.js';

const START = 50;        // Nobodies on the first shelf
const REFILL_AT = 20;    // when this few are left...
const LITTER = 30;       // ...this many new ones arrive
const HOLD_MS = 15 * 60 * 1000; // a chosen Nobody is held for 15 minutes while paying
const PRICE = 9;
const FROM = 'WhoIsJohnny? <hello@whoisjohnny.com>';

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  try {
    if (!env.NOBODIES) return json({ error: 'The KV binding NOBODIES is missing in Cloudflare.' }, 500);
    if (route === 'shelf' && request.method === 'GET') return json(await shelf(env, url, ctx));
    if (route === 'adopt' && request.method === 'POST') return await adopt(request, env, url);
    if (route === 'done' && request.method === 'GET') return await done(env, url, ctx);
    if (route === 'nobody' && request.method === 'GET') return await one(env, url);
    if (route === 'news' && request.method === 'POST') return await news(request, env);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
}

// ---------------------------------------------------------------- helpers
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
function clean(s, max) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// The whole shelf and register in one KV entry, so a page view costs one read.
async function getIndex(env) {
  const ix = await env.NOBODIES.get('index', 'json');
  return ix || { max: START, owned: {}, holds: {} };
}
async function putIndex(env, ix) { await env.NOBODIES.put('index', JSON.stringify(ix)); }

function freeList(ix) {
  const now = Date.now(), out = [];
  for (let n = 1; n <= ix.max; n++) {
    if (ix.owned[n]) continue;
    const h = ix.holds[n];
    if (h && h.u > now) continue;
    out.push(n);
  }
  return out;
}

async function polar(env, path, opts = {}) {
  const base = env.POLAR_API || 'https://api.polar.sh';
  const r = await fetch(base + path, {
    ...opts,
    headers: { authorization: 'Bearer ' + env.POLAR_TOKEN, 'content-type': 'application/json', accept: 'application/json' },
  });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = { raw: t }; }
  if (!r.ok) throw new Error('Polar said ' + r.status + ': ' + (d.detail ? JSON.stringify(d.detail) : t.slice(0, 300)));
  return d;
}

async function keyFor(checkoutId, no) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nobody:' + no + ':' + checkoutId));
  return [...new Uint8Array(buf)].slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- shelf
async function shelf(env, url, ctx) {
  const ix = await getIndex(env);
  let changed = false;
  const now = Date.now();

  // Holds that ran out: check with Polar whether they were paid after all.
  let checks = 0;
  for (const n of Object.keys(ix.holds)) {
    const h = ix.holds[n];
    if (h.u > now) continue;
    if (checks >= 3) continue;
    checks++;
    try {
      const co = await polar(env, '/v1/checkouts/' + h.k);
      if (co.status === 'succeeded') {
        const r = await finalize(env, co, ix); changed = true;
        if (r.isNew && env.RESEND_KEY && co.customer_email) ctx.waitUntil(sendMail(env, co.customer_email, r.no, url.origin + '/no/' + pad(r.no) + '?key=' + r.key, r.rec.c).catch(() => {}));
      }
      else if (co.status === 'open' || co.status === 'confirmed') { h.u = now + 5 * 60 * 1000; changed = true; }
      else { delete ix.holds[n]; changed = true; }
    } catch (e) {
      if (now - h.u > 24 * 3600 * 1000) { delete ix.holds[n]; changed = true; }
    }
  }

  // Refill: when only REFILL_AT are left, LITTER new ones arrive.
  if (freeList(ix).length <= REFILL_AT) { ix.max += LITTER; ix.lastLitter = ix.max - LITTER + 1; changed = true; }
  if (changed) await putIndex(env, ix);

  const held = Object.keys(ix.holds).map(Number).filter(n => ix.holds[n].u > now && !ix.owned[n]);
  const owned = Object.keys(ix.owned).map(Number).map(n => ({ no: n, owner: ix.owned[n].o, city: ix.owned[n].c, since: ix.owned[n].s }));
  return { price: PRICE, max: ix.max, newFrom: ix.lastLitter || 0, free: freeList(ix), held, owned };
}

// ---------------------------------------------------------------- adopt
async function adopt(request, env, url) {
  if (!env.POLAR_TOKEN || !env.POLAR_PRODUCT_ID) return json({ error: 'Polar is not set up yet (POLAR_TOKEN / POLAR_PRODUCT_ID).' }, 500);
  const body = await request.json().catch(() => ({}));
  const no = parseInt(body.no, 10);
  const city = clean(body.city, 40);
  const owner = clean(body.owner, 30);
  if (!city) return json({ error: 'Please tell us the city.' }, 400);

  const ix = await getIndex(env);
  if (!(no >= 1 && no <= ix.max)) return json({ error: 'That Nobody is not on the shelf.' }, 400);
  const done = await env.NOBODIES.get('own:' + no);
  if (ix.owned[no] || done) return json({ error: nameOf(no) + ' already belongs to somebody.', taken: true }, 409);
  const h = ix.holds[no];
  if (h && h.u > Date.now()) return json({ error: 'Somebody is adopting ' + nameOf(no) + ' right now. Pick another, or try again in 15 minutes.', taken: true }, 409);

  const co = await polar(env, '/v1/checkouts/', {
    method: 'POST',
    body: JSON.stringify({
      products: [env.POLAR_PRODUCT_ID],
      success_url: url.origin + '/done?checkout_id={CHECKOUT_ID}',
      return_url: url.origin + '/no/' + pad(no),
      metadata: { nobody: no, nobody_name: nameOf(no), city, owner: owner || 'Anonymous' },
    }),
  });

  ix.holds[no] = { u: Date.now() + HOLD_MS, k: co.id };
  await putIndex(env, ix);
  return json({ url: co.url });
}

// ---------------------------------------------------------------- after payment
async function finalize(env, co, ix) {
  const no = parseInt(co.metadata && co.metadata.nobody, 10);
  if (!no) throw new Error('This checkout is not for a Nobody.');
  const key = await keyFor(co.id, no);
  const existing = await env.NOBODIES.get('own:' + no, 'json');
  if (existing && existing.checkout !== co.id) throw new Error('This Nobody already belongs to somebody else.');
  const rec = existing || { key, checkout: co.id, o: clean(co.metadata.owner, 30) || 'Anonymous', c: clean(co.metadata.city, 40) || 'Somewhere', s: Date.now() };
  if (!existing) await env.NOBODIES.put('own:' + no, JSON.stringify(rec));
  ix.owned[no] = { o: rec.o, c: rec.c, s: rec.s };
  delete ix.holds[no];
  return { no, key, rec, isNew: !existing };
}

async function done(env, url, ctx) {
  const id = url.searchParams.get('checkout_id');
  if (!id || !/^[A-Za-z0-9-]{8,80}$/.test(id)) return json({ error: 'Missing checkout id.' }, 400);
  const co = await polar(env, '/v1/checkouts/' + id);
  if (co.status === 'open' || co.status === 'confirmed') return json({ pending: true });
  if (co.status !== 'succeeded') return json({ failed: true, status: co.status });

  const ix = await getIndex(env);
  const r = await finalize(env, co, ix);
  await putIndex(env, ix);
  const link = url.origin + '/no/' + pad(r.no) + '?key=' + r.key;
  if (r.isNew && env.RESEND_KEY && co.customer_email) {
    ctx.waitUntil(sendMail(env, co.customer_email, r.no, link, r.rec.c).catch(() => {}));
  }
  return json({ ok: true, no: r.no, name: nameOf(r.no), key: r.key });
}

async function sendMail(env, to, no, link, city) {
  const name = nameOf(no);
  const html = `<!doctype html><html><body style="margin:0;background:#f7f6f2;font-family:Arial,Helvetica,sans-serif;color:#151515">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="font-size:13px;color:#6a675f;margin:0 0 8px">WhoIsJohnny?</p>
<h1 style="font-size:34px;line-height:1.05;margin:0 0 14px">${esc(name)} is yours.</h1>
<p style="font-size:17px;line-height:1.5;margin:0 0 20px">You adopted ${esc(name)}, Nobody No. ${pad(no)}. It now lives in ${esc(city)}, in the register and on the world map. Nobody else will ever have this one.</p>
<p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#151515;color:#f7f6f2;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:999px">Get the pictures</a></p>
<p style="font-size:15px;line-height:1.5;color:#3a3833;margin:0 0 6px">The pictures are made for Instagram, TikTok, Snapchat and Facebook. Keep this email: the button is your own link.</p>
<p style="font-size:13px;line-height:1.5;color:#6a675f;margin:0 0 28px;word-break:break-all">${link}</p>
<p style="font-size:15px;font-weight:bold;margin:0 0 6px">Care instructions</p>
<p style="font-size:15px;line-height:1.6;color:#3a3833;margin:0 0 28px">Your Nobody does not eat. Please do not offer.<br>It lives in your phone. It will not mind.<br>It knows one command: Stay. It does this very well.<br>It cannot be returned. It has nowhere to go.</p>
<p style="font-size:13px;color:#6a675f;margin:0">Drawn by Johnny. Assembled by a machine. · whoisjohnny.com · @whoisjohnny2020</p>
</div></body></html>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.RESEND_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: 'hello@whoisjohnny.com', subject: name + ' is yours.', html }),
  });
  if (!r.ok) throw new Error('Resend ' + r.status);
}

// ---------------------------------------------------------------- one Nobody
async function one(env, url) {
  const no = parseInt(url.searchParams.get('no'), 10);
  const key = url.searchParams.get('key') || '';
  const ix = await getIndex(env);
  if (!(no >= 1 && no <= ix.max)) return json({ exists: false });
  const o = ix.owned[no];
  if (o) {
    let mine = false;
    if (key) { const rec = await env.NOBODIES.get('own:' + no, 'json'); mine = !!(rec && rec.key === key); }
    return json({ exists: true, owned: true, owner: o.o, city: o.c, since: o.s, mine });
  }
  const h = ix.holds[no];
  return json({ exists: true, owned: false, held: !!(h && h.u > Date.now()), price: PRICE });
}

// ---------------------------------------------------------------- news signup
async function news(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = clean(body.email, 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'That does not look like an email address.' }, 400);
  await env.NOBODIES.put('news:' + email, JSON.stringify({ t: Date.now() }));
  return json({ ok: true });
}
