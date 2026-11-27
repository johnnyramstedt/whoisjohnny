// /t/keep-out-of-reach-of-deadlines : the page for one text.
// Same page as the front page (the browser draws the rest), with link preview
// tags that show this text instead of the general picture.

import { tpad, textOf, bySlug, slugOf } from '../../assets/texts.js';

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const page = await env.ASSETS.fetch(new URL('/', url.origin));
  const n = bySlug(params.slug);
  if (!n) return page;
  try {
    const t = textOf(n), title = t + ' · WhoIsJohnny?';
    const desc = 'A deadpan text, chosen by Johnny. Free pictures for your phone and posters to print.';
    const img = url.origin + '/og/t' + tpad(n) + '.png';
    const set = v => ({ element(e) { e.setAttribute('content', v); } });
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(title); } })
      .on('meta[name="description"]', set(desc))
      .on('meta[property="og:title"]', set(title))
      .on('meta[property="og:description"]', set(desc))
      .on('meta[property="og:image"]', set(img))
      .on('meta[property="og:image:alt"]', set(t))
      .on('meta[property="og:type"]', { element(e) { e.after('<meta property="og:url" content="' + url.origin + '/t/' + slugOf(n) + '">', { html: true }); } })
      .transform(new Response(page.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } }));
  } catch (e) {
    return page;
  }
}
