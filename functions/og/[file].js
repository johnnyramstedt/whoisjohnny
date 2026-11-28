// /og/014.png : the link preview picture for one Nobody.
// Made once per state (on the shelf / adopted) and kept in KV, so it costs
// almost nothing after the first time. If anything goes wrong, the general
// share picture is used instead.

import { cardPng } from '../_lib/card.js';
import { isXmas } from '../../assets/nobody.js';

const PRICE = 0; // free for now (was 9)
const START = 50;

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const fallback = () => Response.redirect(url.origin + '/og-nobodies-free.png', 302);
  const m = /^(\d{1,5})\.png$/.exec(params.file || '');
  if (!m) return fallback();
  const n = parseInt(m[1], 10);
  try {
    const ix = env.NOBODIES ? (await env.NOBODIES.get('index', 'json')) || { max: START, owned: {} } : { max: START, owned: {} };
    if (!(isXmas(n) || (n >= 1 && n <= ix.max))) return fallback();
    const o = ix.owned && ix.owned[n];
    const info = o ? { owned: true, city: o.c } : { owned: false, price: PRICE };
    const cacheKey = 'og:' + n + ':' + (o ? 'o:' + o.c : 'f') + ':v1';
    let png = env.NOBODIES ? await env.NOBODIES.get(cacheKey, 'arrayBuffer') : null;
    if (!png) {
      png = await cardPng(env, url.origin, n, info);
      if (env.NOBODIES) await env.NOBODIES.put(cacheKey, png);
    }
    return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600' } });
  } catch (e) {
    return fallback();
  }
}
