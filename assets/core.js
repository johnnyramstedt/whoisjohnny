// WhoIsJohnny? shared code: texts, sheet drawing, wall mockup, tracking, collection. Used by / and /library/.
// ---- CONFIG ---------------------------------------------------------------
const SHEETS_URL = "";   // paste the Google Apps Script web-app URL here (see _paid-packs/google-sheets-setup.md). Empty = only logged in the browser console.
const PRICE = 4, PRICE10 = 30, PRICE20 = 50;
// Polar checkout links per text (production). Texts without a link fall back to the email overlay.
const CHECKOUT = {
 "002": "https://buy.polar.sh/polar_cl_jgrnjMLjspRxBn6g54rxMpDA9TAv4bQFsFIVa1zLRWs",
 "003": "https://buy.polar.sh/polar_cl_4S5yCdnhwaLi6stF8BTODh23PJoFxoR8GxyqA4GoP8Y",
 "004": "https://buy.polar.sh/polar_cl_yzpKuO6mYnm9LxAirAYJaArAuG0hgojhEh1jz4S9YdV",
 "005": "https://buy.polar.sh/polar_cl_t10BTcfInJ4mZKttUL16ZjBCEC974Q5dsuxAw3wA4Eo",
 "006": "https://buy.polar.sh/polar_cl_EwlsjQVFxguSa3RM1ai5oS7ceuuuHV7RF18rP2SULQj",
 "007": "https://buy.polar.sh/polar_cl_Yq0pWPWZe8Npd8LzYyUPHbNLGv1hzY79NXgEU2fYflE",
 "008": "https://buy.polar.sh/polar_cl_C3egr4KdWhkgIszKxwKM7dTsL8B1GEUcpuy1A2oq5pp",
 "009": "https://buy.polar.sh/polar_cl_XHfHMSv88pnpZ0BuJh8dCbO66XX0SEKhauw9i1oa1y0",
 "010": "https://buy.polar.sh/polar_cl_bDjynzjRyrsXci0oOLelc8tkkwjqvxG3zJvpR0keC0X",
 "011": "https://buy.polar.sh/polar_cl_xEkpcpIuIrUPL0idERu9vPNl4CPO8MjkCCLu308wayX",
 "012": "https://buy.polar.sh/polar_cl_5q9ZaULuy42oaHBJeIliBmgm3ieeSXxjm9Upa2WNtnL",
 "013": "https://buy.polar.sh/polar_cl_tTcibtaYYIRJgetVM5UPYN7FcaphGW4rR0ebx2x91yj",
 "014": "https://buy.polar.sh/polar_cl_D4IKnpwCQp2BtRBvjn9CvdnxCd3mFKiJmXrAw1FHGJb",
 "015": "https://buy.polar.sh/polar_cl_gYRSnwIKXJNH5nXnUh4HGVaXLct2eiSAV6Rpg3Mp4Nm",
 "016": "https://buy.polar.sh/polar_cl_eL2nSmxeOX5HwGSZta8hkrXEhl2Fj0CqTaB7Z1WZBF9",
 "017": "https://buy.polar.sh/polar_cl_OdMMRSjb5avxQnSUCBNDugFDiWPuFKKD2z55b21HIWA",
 "018": "https://buy.polar.sh/polar_cl_Wrl58lOxWFBqCuxioKKJTpJYFC9VRBC1ViyrJ2mHkS8",
 "019": "https://buy.polar.sh/polar_cl_DAtFdSbftFiWFlIldmYwF8yvz1D66hIeqRjnZ21boks",
 "020": "https://buy.polar.sh/polar_cl_aB4SySWR3Sv9Bp9NkpoPAwS2ttMoqAyIGaqsX3dwjvc",
 "021": "https://buy.polar.sh/polar_cl_7l2Ho5ix17K5SoypwmoXHUY8OrAH4FeGRHgqN3r3XIl",
 "022": "https://buy.polar.sh/polar_cl_EQjlJDrmMQRg2L9g8BD5N6fuTCzx03WTXTPXi0Cr7Qi",
 "023": "https://buy.polar.sh/polar_cl_fs9GO4vbF3HlTRNHzG86tuKs1mXCvYcZuAnU63Dt5HG",
 "024": "https://buy.polar.sh/polar_cl_CyFaxTfENpOE75LID5QZs0wG2pNkbUpCIyImN2K7o2I",
 "025": "https://buy.polar.sh/polar_cl_ZFYwxSEpXTKyZ6OtIwgVlt5Txy6wkYrJzphJX2eVoF9",
 "026": "https://buy.polar.sh/polar_cl_a5edZ0pI63NvU3mZB39rb3VunzcLa38O2UnLS1tWNtE",
 "027": "https://buy.polar.sh/polar_cl_XPgZ7HKkJw4NQLjOxSPveAM4F8lSYALN7vkbw0Rkhog",
 "028": "https://buy.polar.sh/polar_cl_v7CdjbaJU8d8ixPqbQYZfyXyacgWHFvVrjzV50weg2u",
 "029": "https://buy.polar.sh/polar_cl_g6xlQ7eSmXUIueBD0lILM3AFHcwl76HRkU1bE2FZe6T",
 "030": "https://buy.polar.sh/polar_cl_zVtTXJBLvnmmzz7akaugIpot2YNyyBAP4lhVK0K149m",
 "031": "https://buy.polar.sh/polar_cl_xe8zUSLDmeBeFs5nLGqcOUVbvs75RywcspHf60OiO0M",
 "032": "https://buy.polar.sh/polar_cl_8ibPFvDWSUAuQV7AGUGufFjM0yuu3ChsMbO6R2plA6O",
 "033": "https://buy.polar.sh/polar_cl_emqOpJ4AJdOB4bh3MJLTX5oSKy81kAEbGmTLg4LmW5B",
 "034": "https://buy.polar.sh/polar_cl_FHJMV3t8Cbnp5lC6Vv3gBO39MSJdR1cwrU7iP4FjVyY",
 "035": "https://buy.polar.sh/polar_cl_fND5yCjE7epUF02CmtaC82mnn5J20QgH6aeQE3sdMvE",
 "036": "https://buy.polar.sh/polar_cl_Ekq9aOjZ0jrmVjx6VMkZudd4uKM0b0SRcSMyx0gDmmQ",
 "037": "https://buy.polar.sh/polar_cl_wjCOIwnZYQhns5dbQLL1KrB2V65OBqNEs3xnG3Fz3qY",
 "038": "https://buy.polar.sh/polar_cl_Rkl0Va5DljLK6lm35lT6Y4KsXdHJ3T6089WDD2Ao3Rj",
 "039": "https://buy.polar.sh/polar_cl_RD8X4wAhqFYGqyX4e8ZuXcmeDW3hGTcxpqagX0T29qN",
 "040": "https://buy.polar.sh/polar_cl_Qlu7NVFhvGWTWZYHNnyxgUHLEXBD0l7dFl9Yp27wD6P",
 "041": "https://buy.polar.sh/polar_cl_orzoDDW6QXyfY9CI4vHCPj8qYVja423Ifl0yX1urfzV",
 "042": "https://buy.polar.sh/polar_cl_svGwDFc80GLk5TIOfzvpBJZun0kTh1hKnk1O80d1pu4",
 "043": "https://buy.polar.sh/polar_cl_jWRYrYe5B2jclMMCxkC8wzdJoZ1QIGChNMnuq3KfHaA",
 "044": "https://buy.polar.sh/polar_cl_tNmcKEGuyMppbQjvf9oQYEvIwJGoY1G3EUP9I13M1Gg"
};
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

// free: true = the print pack is free too (only No. 001)
const TEXTS = [
  { t:"BE KIND. IT IS CHEAPER." },
  { t:"YOU ARE NOT BEHIND. THERE IS NO FRONT." },
  { t:"THIS WEEK: NOTHING IS REQUIRED OF YOU." },
  { t:"THE MEETING COULD HAVE BEEN AN EMAIL." },
  { t:"I'M FINE." },
  { t:"NOT TODAY." },
  { t:"SEEN." },
  { t:"MAYBE LATER." },
  { t:"NO." },
  { t:"EVERYTHING IS UNDER CONTROL. NOBODY IS IN CONTROL." },
  { t:"THANK YOU FOR YOUR PATIENCE. IT IS RUNNING OUT." },
  { t:"PLEASE HOLD. YOUR FEELINGS ARE IMPORTANT TO US." },
  { t:"OUT OF OFFICE. SPIRITUALLY AS WELL." },
  { t:"I WILL BE FINE. GIVE ME A MINUTE." },
  { t:"ASK ME AGAIN AFTER COFFEE." },
  { t:"HAVE YOU TRIED DOING LESS?" },
  { t:"NOTHING TO REPORT." },
  { t:"THE SUN HAS BEEN INFORMED." },
  { t:"YOU DID ENOUGH TODAY." },
  { t:"THIS TOO WILL BE FORWARDED." },
  { t:"SORRY FOR THE DELAY. I WAS BUSY BEING HUMAN." },
  { t:"NO NEW NOTIFICATIONS THAT MATTER." },
  { t:"CALL SOMEONE YOU HAVE NOT CALLED." },
  { t:"YOU ARE ALLOWED TO REST. IT IS IN WRITING." },
  { t:"WARNING: THIS PRODUCT MAY CONTAIN FEELINGS." },
  { t:"IN CASE OF EMERGENCY, DO NOTHING SLOWLY." },
  { t:"NOT SUITABLE FOR PEOPLE WHO ARE ALWAYS RIGHT." },
  { t:"READ THE INSTRUCTIONS. THEN IGNORE THEM." },
  { t:"NO USER-SERVICEABLE PARTS INSIDE. NOT EVEN YOU." },
  { t:"KEEP OUT OF REACH OF DEADLINES." },
  { t:"SOME ASSEMBLY OF CONFIDENCE REQUIRED." },
  { t:"BATTERIES NOT INCLUDED. NEITHER IS MOTIVATION." },
  { t:"WARRANTY VOID IF OPENED BY A COLLEAGUE." },
  { t:"PLEASE DISPOSE OF YOUR EXPECTATIONS RESPONSIBLY." },
  { t:"THIS SIDE UP. IT IS ALL YOU CAN DO." },
  { t:"STEP 1: BREATHE. STEP 2: SEE STEP 1." },
  { t:"FOR BEST RESULTS, REPEAT TOMORROW." },
  { t:"TROUBLESHOOTING: HAVE YOU TRIED RESTING?" },
  { t:"THE MANUFACTURER IS NOT RESPONSIBLE FOR YOUR MONDAY." },
  { t:"CAUTION: CONTENTS UNDER PRESSURE. ASK ABOUT IT." },
  { t:"DO NOT OPERATE HEAVY MACHINERY OR OPINIONS." },
  { t:"THIS DOCUMENT HAS BEEN INTENTIONALLY LEFT HOPEFUL." },
  { t:"PLEASE KEEP THIS MANUAL. YOU WILL NOT READ IT AGAIN." },
  { t:"END OF INSTRUCTIONS. YOU ARE ON YOUR OWN." }
];
// each text has its own number and date (here: sample dates)
const MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
TEXTS.forEach((x, i) => {
  const d = new Date(2026, 10, 16 - (TEXTS.length - 1 - i) * 2);
  x.no = String(i + 1).padStart(3, "0");
  x.date = String(d.getDate()).padStart(2, "0") + MON[d.getMonth()] + d.getFullYear();
});

TEXTS[0].free = true;   // only No. 001: the whole print pack is free, as a sample

const FORMATS = {
  a4:     { cap:["A4","21 x 29.7 cm","8.3 x 11.7 in"], w:210, h:297, note:"A4: 21 x 29.7 cm (8.3 x 11.7 in). Print-ready CMYK PDF." },
  poster: { cap:["50 x 70 cm","19.7 x 27.6 in",""], w:500, h:700, note:"50 x 70 cm (19.7 x 27.6 in). Print-ready CMYK PDF. The text is sharp at any size." },
  us:     { cap:["18 x 24 in","45.7 x 61 cm",""], w:18,  h:24,  note:"18 x 24 in (45.7 x 61 cm). Print-ready CMYK PDF. Fits standard US frames." },
  a6:     { cap:["A6 postcard","10.5 x 14.8 cm","4.1 x 5.8 in"], w:105, h:148 },
  pc:     { cap:["4 x 6 in postcard","10.2 x 15.2 cm",""], w:4, h:6 },
  insta:  { cap:["4:5 feed","1080 x 1350 px",""], file:"4x5",  w:1080, h:1350 },
  square: { cap:["1:1 square","1080 x 1080 px",""], file:"1x1",  w:1080, h:1080 },
  story:  { cap:["9:16 story","1080 x 1920 px",""], file:"9x16", w:1080, h:1920 }
};
const FONT = (px) => "bold " + px + 'px Arial, Helvetica, "Liberation Sans", sans-serif';

// Draws one text onto a canvas. All sizes are relative to the sheet width, so every format looks alike.
function drawSheet(canvas, x, fmtKey, pxWidth) {
  const f = FORMATS[fmtKey], W = pxWidth, H = Math.round(W * f.h / f.w), u = W / 100;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  const social = fmtKey === "insta" || fmtKey === "square" || fmtKey === "story";
  const lift = fmtKey === "story" ? 22 * u : 0;
  const M = 8 * u, top = (fmtKey === "story" ? 24 : 9) * u, reserve = (social ? 23.5 : 13) * u + lift;
  const maxW = W - 2 * M, maxH = H - top - reserve;
  let size = 26 * u, lines = [];
  for (; size >= 5 * u; size -= 0.5 * u) {
    ctx.font = FONT(size);
    lines = wrap(ctx, x.t, maxW);
    const widest = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
    if (lines.length * size * 1.02 <= maxH && widest <= maxW) break;
  }
  ctx.font = FONT(size); ctx.fillStyle = "#e4002b"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  try { ctx.letterSpacing = (-size * 0.02) + "px"; } catch (e) {}
  lines.forEach((l, k) => ctx.fillText(l, M, top + size * 0.86 + k * size * 1.02));
  try { ctx.letterSpacing = "0px"; } catch (e) {}
  ctx.fillStyle = "#111";
  if (social) {
    // Social images keep the full footer: this is the part that travels
    ctx.font = FONT(3.4 * u); ctx.fillText("WhoIsJohnny?", M, H - lift - 15 * u);
    ctx.font = (2.9 * u) + "px Arial, Helvetica, 'Liberation Sans', sans-serif";
    ctx.fillText("whoisjohnny.com", M, H - lift - 11.5 * u);
    ctx.fillText("@whoisjohnny2020", M, H - lift - 8 * u);
    ctx.fillText("No. " + x.no + "  ·  " + x.date, M, H - lift - 4.6 * u);
  } else {
    // Prints: only the text, and a small number
    ctx.font = (2.9 * u) + "px Arial, Helvetica, 'Liberation Sans', sans-serif";
    ctx.fillText("No. " + x.no, M, H - 4.6 * u);
  }
  // The logo: a question mark, bottom right, on everything that is downloaded
  ctx.fillStyle = "#e4002b"; ctx.font = FONT(8 * u); ctx.textAlign = "right";
  ctx.fillText("?", W - M, H - lift - 4.6 * u); ctx.textAlign = "left";
}
function wrap(ctx, text, maxW) {
  // pieces: words, and words broken after a hyphen (no space is added between hyphen pieces)
  const pieces = [];
  text.split(/\s+/).filter(Boolean).forEach(w => {
    w.split(/(?<=-)/).forEach((p, k) => pieces.push({ t: p, sep: k === 0 ? " " : "" }));
  });
  const lines = []; let cur = "";
  pieces.forEach(p => {
    const t = cur ? cur + p.sep + p.t : p.t;
    if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = p.t; }
  });
  if (cur) lines.push(cur); return lines;
}

// Wall mockup: framed 50 x 70 cm poster and framed A4, plus two postcards on a shelf, all at true relative scale.
function drawMockup(canvas, x, W) {
  const H = Math.round(W * 1.25), u = W / 1080, ctx = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  const wall = ctx.createLinearGradient(0, 0, W, H);
  wall.addColorStop(0, "#f1f0ec"); wall.addColorStop(1, "#e0dfda");
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
  const fl = 1090 * u;
  const dusk = ctx.createLinearGradient(0, fl - 80 * u, 0, fl);
  dusk.addColorStop(0, "rgba(0,0,0,0)"); dusk.addColorStop(1, "rgba(0,0,0,.07)");
  ctx.fillStyle = dusk; ctx.fillRect(0, fl - 80 * u, W, 80 * u);
  ctx.fillStyle = "#d3d1ca"; ctx.fillRect(0, fl, W, H - fl);
  ctx.fillStyle = "#c6c4bc"; ctx.fillRect(0, fl, W, 3 * u);
  const S = 8.2 * u;
  const soft = (blur, dy, a) => { ctx.shadowColor = "rgba(0,0,0," + a + ")"; ctx.shadowBlur = blur * u; ctx.shadowOffsetY = dy * u; };
  const flat = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };
  const art = (fmt, wcm, hcm) => {
    const w = wcm * S, h = hcm * S, c = document.createElement("canvas");
    drawSheet(c, x, fmt, Math.max(120, Math.round(w * 2)));
    return { c: c, w: w, h: h };
  };
  const label = (t, cx, y) => {
    ctx.fillStyle = "#8b8b86"; ctx.font = "400 " + (14 * u) + 'px "Space Grotesk", Arial, sans-serif'; ctx.textAlign = "center";
    try { ctx.letterSpacing = (2.4 * u) + "px"; } catch (e) {}
    ctx.fillText(t.toUpperCase(), cx, y);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.textAlign = "left";
  };
  const framed = (fmt, wcm, hcm, px, py, name) => {
    const a = art(fmt, wcm, hcm), t = 5 * u, m = 14 * u, ow = a.w + 2 * (t + m), oh = a.h + 2 * (t + m);
    soft(30, 14, .26); ctx.fillStyle = "#111"; ctx.fillRect(px, py, ow, oh); flat();
    ctx.fillStyle = "#fbfbf9"; ctx.fillRect(px + t, py + t, ow - 2 * t, oh - 2 * t);
    ctx.drawImage(a.c, px + t + m, py + t + m, a.w, a.h);
    ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = u; ctx.strokeRect(px + t + m, py + t + m, a.w, a.h);
    label(name, px + ow / 2, py + oh + 38 * u);
    return { w: ow, h: oh };
  };
  const px0 = 120 * u, top = 250 * u;
  const P = framed("poster", 50, 70, px0, top, "50 x 70 cm");
  const ax = px0 + P.w + 64 * u;
  framed("a4", 21, 29.7, ax, top, "A4");
  const sy = top + P.h, sx0 = ax - 10 * u, sx1 = W - 120 * u;
  soft(18, 8, .22); ctx.fillStyle = "#1a1a1a"; ctx.fillRect(sx0, sy, sx1 - sx0, 9 * u); flat();
  const card = (fmt, wcm, hcm, cx, rot) => {
    const a = art(fmt, wcm, hcm);
    ctx.save(); ctx.translate(cx, sy); ctx.rotate(rot);
    soft(14, 6, .28); ctx.fillStyle = "#fff"; ctx.fillRect(-a.w / 2, -a.h, a.w, a.h); flat();
    ctx.drawImage(a.c, -a.w / 2, -a.h, a.w, a.h);
    ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = u; ctx.strokeRect(-a.w / 2, -a.h, a.w, a.h);
    ctx.restore();
  };
  card("a6", 10.5, 14.8, sx0 + 72 * u, -0.035);
  card("pc", 10.16, 15.24, sx0 + 168 * u, 0.045);
  const book = (bx, by, bw, bh, fill) => {
    soft(10, 4, .2); ctx.fillStyle = fill; ctx.fillRect(bx, by, bw, bh); flat();
    ctx.strokeStyle = "rgba(0,0,0,.14)"; ctx.lineWidth = u; ctx.strokeRect(bx, by, bw, bh);
  };
  book(sx0 + 238 * u, sy - 24 * u, 88 * u, 24 * u, "#f3f2ee");
  book(sx0 + 246 * u, sy - 42 * u, 72 * u, 18 * u, "#e4002b");
  label("A6 + 4 x 6 in postcards", sx0 + 120 * u, sy + 44 * u);
  const SANS = 'Arial, Helvetica, "Liberation Sans", sans-serif';
  ctx.fillStyle = "#111"; ctx.font = "700 " + (30 * u) + "px " + SANS; ctx.fillText("WhoIsJohnny?", 120 * u, H - 120 * u);
  ctx.font = "400 " + (22 * u) + "px " + SANS;
  ctx.fillText("No. " + x.no + "  ·  " + x.date, 120 * u, H - 86 * u);
  ctx.fillText("whoisjohnny.com", 120 * u, H - 56 * u);
  ctx.fillStyle = "#e4002b"; ctx.font = "700 " + (110 * u) + "px " + SANS; ctx.textAlign = "right";
  ctx.fillText("?", W - 120 * u, H - 56 * u); ctx.textAlign = "left";
}

// ---- tracking: only buys, free downloads and the email you choose to leave. Everything goes to a Google Sheet. ----
function send(payload) {
  console.log("sheet", payload);
  if (!SHEETS_URL) return;
  fetch(SHEETS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }).catch(() => {});
}
function track(event, extra) {
  send(Object.assign({ type: "event", event: event, referrer: document.referrer || "direct" }, extra || {}));
}
function saveEmail(email, source, extra) {
  send(Object.assign({ type: "email", email: email, consent: true, source: source, referrer: document.referrer || "direct" }, extra || {}));
}
const EMAIL_ON = !!SHEETS_URL;   // e-mail features are only on once SHEETS_URL is filled in
const store = {
  get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
// My collection: kept in this browser only (localStorage), no login.
let owned = new Set();
try { owned = new Set(JSON.parse(store.get("wij_collection") || "[]")); } catch (e) { owned = new Set(); }
function collect(no, on) { if (on) owned.add(no); else owned.delete(no); store.set("wij_collection", JSON.stringify(Array.from(owned))); }
