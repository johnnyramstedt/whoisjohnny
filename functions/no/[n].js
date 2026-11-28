// /no/014 : the page for one Nobody.
// It is the same page as the front page (the browser draws the rest), but the
// link preview tags are changed so a shared link shows this Nobody, its name
// and where it lives, instead of the general picture.

import { nobody, isXmas, storyOf } from '../../assets/nobody.js';

const START = 50;

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const page = await env.ASSETS.fetch(new URL('/', url.origin));
  const n = parseInt(params.n, 10);
  if (!(n > 0)) return page;
  try {
    const ix = env.NOBODIES ? (await env.NOBODIES.get('index', 'json')) || { max: START, owned: {} } : { max: START, owned: {} };
    if (!(isXmas(n) || n <= ix.max)) return page;
    const b = nobody(n), o = ix.owned && ix.owned[n];
    const title = b.name + ', ' + b.label + ' · WhoIsJohnny?';
    const desc = o
      ? b.name + ' lives in ' + o.c + ' now. A Nobody: a small figure that exists once.'
      : (storyOf(n) || 'A small figure that exists once.') + ' On the shelf. Free.';
    const img = url.origin + '/og/' + b.num + '.png' + (o ? '?c=' + encodeURIComponent(o.c) : '');
    const set = v => ({ element(e) { e.setAttribute('content', v); } });
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(title); } })
      .on('meta[name="description"]', set(desc))
      .on('meta[property="og:title"]', set(title))
      .on('meta[property="og:description"]', set(desc))
      .on('meta[property="og:image"]', set(img))
      .on('meta[property="og:image:alt"]', set(b.name + ', ' + b.label + ', a small hand-drawn figure.'))
      .on('meta[property="og:type"]', { element(e) { e.after('<meta property="og:url" content="' + url.origin + '/no/' + b.num + '">', { html: true }); } })
      .transform(new Response(page.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } }));
  } catch (e) {
    return page;
  }
}
