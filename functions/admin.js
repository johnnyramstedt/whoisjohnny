// /admin?key=...  Everybody who took a Nobody, and who signed up for news. Only for Johnny.
// The key is not in the code, only its SHA-256 hash.
// /admin?key=...&csv=1 downloads the same list as a CSV file (opens in Excel and Google Sheets).
import { nameOf, label } from '../assets/nobody.js';

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
  const P = e => people[e] || (people[e] = { email: e, nobodies: [], city: '', news: '', first: 0 });

  for (const k of await listAll(kv, 'own:')) {
    const no = parseInt(k.name.slice(4), 10); const r = await kv.get(k.name, 'json');
    if (!r || !r.e) continue;
    const p = P(r.e); p.nobodies.push(nameOf(no) + ' (' + label(no) + ')'); p.city = r.c || p.city;
    if (!p.first || r.s < p.first) p.first = r.s;
  }
  // People who got a text on the earlier version of the site.
  for (const k of await listAll(kv, 'tget:')) {
    const p = P(k.name.slice(5)); const m = k.metadata || await kv.get(k.name, 'json') || {};
    if (!p.first && m.t) p.first = m.t;
  }
  for (const k of await listAll(kv, 'news:')) {
    const e = k.name.slice(5); const r = await kv.get(k.name, 'json') || {};
    const p = P(e); p.news = day(r.t) || 'yes'; if (!p.first || (r.t && r.t < p.first)) p.first = r.t || p.first;
  }
  const rows = Object.values(people).sort((a, b) => (b.first || 0) - (a.first || 0));

  if (url.searchParams.get('csv')) {
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = ['Email,Nobodies,City,News sign-up,First seen'].concat(rows.map(r => [r.email, r.nobodies.join('; '), r.city, r.news, day(r.first)].map(q).join(','))).join('\n');
    return new Response('﻿' + csv, { headers: { ...H, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="whoisjohnny-emails.csv"' } });
  }
  const tr = rows.map(r => `<tr><td>${esc(r.email)}</td><td>${esc(r.nobodies.join(', '))}</td><td>${esc(r.city)}</td><td>${esc(r.news)}</td><td>${esc(day(r.first))}</td></tr>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Admin · WhoIsJohnny?</title>
<style>body{font:15px Arial,sans-serif;margin:32px;color:#151515}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{font-size:12px;color:#6a675f}</style>
<h1>Emails · ${rows.length}</h1><p><a href="?key=${encodeURIComponent(key)}&csv=1">Download CSV</a></p>
<table><tr><th>Email</th><th>Nobodies</th><th>City</th><th>News sign-up</th><th>First seen</th></tr>${tr}</table>`;
  return new Response(html, { headers: { ...H, 'content-type': 'text/html; charset=utf-8' } });
}
