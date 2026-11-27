// WhoIsJohnny? Nobodies: link preview pictures.
// Draws a 1200 x 630 PNG for one Nobody (shown when someone shares /no/014
// on WhatsApp, iMessage, Facebook, X, LinkedIn and so on).
// The figure comes from assets/nobody.js, the same machine the web page uses.

import { initWasm, Resvg } from './resvg.mjs';
import wasm from './resvg.wasm';
import { nobody } from '../../assets/nobody.js';
import { textOf, tlabel } from '../../assets/texts.js';

let ready = null;
function start() { return ready || (ready = initWasm(wasm)); }

let fonts = null;
async function loadFonts(env, origin) {
  if (fonts) return fonts;
  const get = async f => new Uint8Array(await (await env.ASSETS.fetch(new URL('/assets/fonts/' + f, origin))).arrayBuffer());
  fonts = await Promise.all([get('InstrumentSans-400.ttf'), get('InstrumentSans-600.ttf')]);
  return fonts;
}

const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fit = (text, max, width) => Math.min(max, Math.floor(width / (Math.max(1, text.length) * 0.56)));

// info: { owned, city, price }
export function cardSvg(n, info) {
  const b = nobody(n);
  const fig = b.svg.replace('<svg ', '<svg x="60" y="30" width="430" height="572" ');
  const name = b.name + '.';
  const line = info.owned ? 'Lives in ' + info.city + '.' : (info.price ? 'On the shelf. Adopt for €' + info.price + '.' : 'On the shelf. Adopt for free.');
  const L = 560, W = 580;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${b.paper}"/>
${fig}
<g font-family="Instrument Sans">
<text x="${L}" y="96" font-size="28" font-weight="600" fill="#151515">WhoIsJohnny?</text>
<text x="${L}" y="232" font-size="34" fill="#3a3833">${x(b.label)}</text>
<text x="${L}" y="${232 + 18 + fit(name, 124, W)}" font-size="${fit(name, 124, W)}" font-weight="600" fill="#151515" letter-spacing="-3">${x(name)}</text>
<text x="${L}" y="452" font-size="${fit(line, 38, W)}" fill="#3a3833">${x(line)}</text>
<text x="${L}" y="560" font-size="26" fill="#6a675f">whoisjohnny.com</text>
</g>
</svg>`;
}

export async function cardPng(env, origin, n, info) {
  await start();
  const fontBuffers = await loadFonts(env, origin);
  const r = new Resvg(cardSvg(n, info), {
    font: { fontBuffers, defaultFontFamily: 'Instrument Sans', loadSystemFonts: false },
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = r.render().asPng();
  r.free && r.free();
  return png;
}

// ---------------------------------------------------------------- texts
// 1200 x 630 link preview for one text: the text in red on white, like the sheet.
function wrapEst(text, size, width) {
  const per = Math.max(1, Math.floor(width / (size * 0.62)));
  const lines = []; let cur = '';
  for (const w of text.split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (t.length <= per || !cur) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); return lines;
}
export function textCardSvg(n, info) {
  const t = textOf(n), W = 760, Hmax = 430;
  let size = 110, lines = [];
  for (; size > 28; size -= 4) { lines = wrapEst(t, size, W); if (lines.length * size * 1.02 <= Hmax && lines.every(l => l.length * size * 0.62 <= W)) break; }
  const line = info.owned ? 'Lives in ' + info.city + '.' : 'Exists once. Adopt it for free.';
  const body = lines.map((l, k) => `<text x="60" y="${100 + size * 0.86 + k * size * 1.02}" font-size="${size}" font-weight="600" fill="#e4002b" letter-spacing="${-size * 0.02}">${x(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#ffffff"/>
<g font-family="Instrument Sans">${body}
<text x="60" y="80" font-size="26" font-weight="600" fill="#151515">WhoIsJohnny?</text>
<text x="1140" y="80" font-size="26" fill="#3a3833" text-anchor="end">${x(tlabel(n))}</text>
<text x="60" y="576" font-size="${fit(line, 32, 900)}" fill="#3a3833">${x(line)}</text>
<text x="60" y="606" font-size="22" fill="#6a675f">whoisjohnny.com</text>
<text x="1140" y="600" font-size="120" font-weight="600" fill="#e4002b" text-anchor="end">?</text>
</g>
</svg>`;
}
export async function textCardPng(env, origin, n, info) {
  await start();
  const fontBuffers = await loadFonts(env, origin);
  const r = new Resvg(textCardSvg(n, info), { font: { fontBuffers, defaultFontFamily: 'Instrument Sans', loadSystemFonts: false }, fitTo: { mode: 'width', value: 1200 } });
  const png = r.render().asPng();
  r.free && r.free();
  return png;
}
