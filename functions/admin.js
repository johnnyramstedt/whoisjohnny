// /admin?key=...  Everybody who got a text, and who said yes to news. Only for Johnny.
// The key is not in the code, only its SHA-256 hash.
// /admin?key=...&csv=1 downloads the same list as a CSV file (opens in Excel and Google Sheets).
import { textOf } from '../assets/texts.js';

const ADMIN_HASH = '15201e2ed80f029ee0472001b2208bb3a2f6f082b05750411bab1cff32fd7519';

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const day = t => t ? new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '';
const H = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' };

async function listAll(kv, prefix) {
  const out = []; let cursor;
  do { const r = await kv.list({ prefix, cursor }); out.push(...r.keys); cursor = r.list_complete ? null : r.cursor; } while (cursor);
  return out;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!key || await sha(key) !== ADMIN_HASH) return new Response('Not found', { status: 404, headers: H });
  const kv = env.NOBODIES, people = {};
  const P = e => people[e] || (people[e] = { email: e });

  for (const k of await listAll(kv, 'tget:')) {
    const p = P(k.name.slice(5)); const m = k.metadata || await kv.get(k.name, 'json') || {};
    p.got = m.t; p.no = m.no; p.gift = !!m.g;
  }
  for (const k of await listAll(kv, 'sub:')) {
    const p = P(k.name.slice(4)); const m = await kv.get(k.name, 'json') || {};
    p.yes = m.t; p.off = m.off; p.words = m.words;
  }
  for (const k of await listAll(kv, 'news:')) {            // the old news form from the Nobodies page
    const p = P(k.name.slice(5)); const m = await kv.get(k.name, 'json') || {};
    if (!p.yes) { p.yes = m.t; p.words = 'Signed up for news on the old Nobodies page.'; }
  }
  const rows = Object.values(people).sort((a, b) => (b.got || b.yes || 0) - (a.got || a.yes || 0));
  const status = p => p.off ? 'unsubscribed' : p.yes ? 'yes' : 'no';
  const send = rows.filter(p => status(p) === 'yes').length;

  if (url.searchParams.get('csv')) {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [['email', 'newsletter', 'said_yes_at', 'unsubscribed_at', 'text', 'got_text_at', 'as_gift', 'consent_words'].join(',')]
      .concat(rows.map(p => [p.email, status(p), day(p.yes), day(p.off), p.no ? textOf(p.no) : '', day(p.got), p.gift ? 'yes' : '', p.words || ''].map(q).join(',')));
    return new Response('﻿' + lines.join('\r\n'), { headers: { ...H, 'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="whoisjohnny-emails-' + new Date().toISOString().slice(0, 10) + '.csv"' } });
  }

  const tr = rows.map(p => `<tr><td>${esc(p.email)}</td><td class="${status(p)}">${status(p)}</td><td>${p.no ? esc(textOf(p.no)) : ''}${p.gift ? ' <span class=m>(gift)</span>' : ''}</td><td class=m>${day(p.got || p.yes)}</td></tr>`).join('');
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Emails · WhoIsJohnny?</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:40px auto;max-width:1000px;padding:0 20px;color:#151515}h1{margin:0 0 6px}p{color:#555;margin:0 0 20px}
a.b{display:inline-block;background:#151515;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;margin-bottom:24px}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:8px 10px;border-bottom:1px solid #e3e0d8;vertical-align:top}th{font-size:12px;color:#777;text-transform:uppercase}
.yes{color:#0a7a2f;font-weight:bold}.no{color:#999}.unsubscribed{color:#b00}.m{color:#888}</style>
<h1>Emails</h1><p>${rows.length} addresses. <b>${send}</b> said yes to news. Send newsletters only to the ones marked <span class=yes>yes</span>.</p>
<a class="b" href="?key=${encodeURIComponent(key)}&csv=1">Download as CSV</a>
<table><tr><th>Email</th><th>News</th><th>Text</th><th>When</th></tr>${tr}</table>`,
    { headers: { ...H, 'content-type': 'text/html; charset=utf-8' } });
}
