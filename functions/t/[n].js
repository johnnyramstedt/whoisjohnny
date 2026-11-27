// /t/012 : the page for one text.
// Same page as the front page (the browser draws the rest), with link preview
// tags that show this text instead of the general picture.

import { TEXT_COUNT, tpad, tlabel, textOf } from '../../assets/texts.js';

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const page = await env.ASSETS.fetch(new URL('/', url.origin));
  const n = parseInt(params.n, 10);
  if (!(n >= 1 && n <= TEXT_COUNT)) return page;
  try {
    const tix = env.NOBODIES ? (await env.NOBODIES.get('tindex', 'json')) || { owned: {} } : { owned: {} };
    const o = tix.owned[n];
    const t = textOf(n), title = tlabel(n) + ' · WhoIsJohnny?';
    const desc = '“' + t + '” ' + (o ? 'Lives in ' + o.c + ' now. A text that exists once.' : 'A text that exists once. Adopt it for free.');
    const img = url.origin + '/og/t' + tpad(n) + '.png' + (o ? '?c=' + encodeURIComponent(o.c) : '');
    const set = v => ({ element(e) { e.setAttribute('content', v); } });
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(title); } })
      .on('meta[name="description"]', set(desc))
      .on('meta[property="og:title"]', set(title))
      .on('meta[property="og:description"]', set(desc))
      .on('meta[property="og:image"]', set(img))
      .on('meta[property="og:image:alt"]', set(t))
      .on('meta[property="og:type"]', { element(e) { e.after('<meta property="og:url" content="' + url.origin + '/t/' + tpad(n) + '">', { html: true }); } })
      .transform(new Response(page.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } }));
  } catch (e) {
    return page;
  }
}
