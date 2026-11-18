// WhoIsJohnny? library page: gallery, print window (modal), downloads, collection filter, email forms.
if (!EMAIL_ON) { $("news").classList.add("hidden"); $("navNews").classList.add("hidden"); }

let sel = 0, filter = "all", view = "sheet";
const tiles = [];

function buildGrid() {
  const g = $("grid"), anchor = $("empty");
  TEXTS.forEach((x, i) => {
    const b = document.createElement("button");
    b.className = "tile"; b.setAttribute("aria-label", "No. " + x.no + ": " + x.t);
    const c = document.createElement("canvas"); drawSheet(c, x, "a4", 360); b.appendChild(c);
    const s = document.createElement("div"); s.className = "cap" + (x.free ? " free" : "");
    s.textContent = "No. " + x.no + "  ·  " + (x.free ? "FREE" : "USD " + PRICE); b.appendChild(s);
    b.addEventListener("click", () => { if (pick.size) togglePick(i); else openModal(i); });
    tiles.push(b); g.insertBefore(b, anchor);
  });
}

// Pick mode: choose 10 or 20 texts for a bundle
const pick = { size: 0, set: new Set(), price: 0 };
function updatePickBar() {
  const n = pick.set.size, left = pick.size - n;
  $("pickCount").textContent = n + " / " + pick.size;
  $("pickMsg").textContent = left > 0 ? "Choose " + left + " more" : "Ready";
  $("pickGo").disabled = left > 0;
  $("pickGo").textContent = "Continue — USD " + pick.price;
  TEXTS.forEach((x, i) => tiles[i].classList.toggle("picked", pick.set.has(x.no)));
}
function startPick(size, price) {
  const cur = TEXTS[sel];
  closeModal();
  filter = "all"; refreshGrid();
  pick.size = size; pick.price = price; pick.set = new Set();
  if (!cur.free) pick.set.add(cur.no);
  document.body.classList.add("picking");
  $("pickbar").classList.remove("hidden");
  $("pickTitle").textContent = "Pick " + size + " texts";
  updatePickBar();
  track("started_pick", { product: "pack" + size, viewing: cur.no });
  window.scrollTo({ top: $("grid").getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
}
function endPick() {
  pick.size = 0; pick.set = new Set();
  document.body.classList.remove("picking");
  $("pickbar").classList.add("hidden");
  tiles.forEach(t => t.classList.remove("picked"));
}
function togglePick(i) {
  const x = TEXTS[i];
  if (x.free) return;
  if (pick.set.has(x.no)) pick.set.delete(x.no);
  else if (pick.set.size < pick.size) pick.set.add(x.no);
  updatePickBar();
}

function refreshGrid() {
  let n = 0;
  TEXTS.forEach((x, i) => {
    const show = filter !== "mine" || owned.has(x.no);
    tiles[i].classList.toggle("hidden", !show); if (show) n++;
    let bd = tiles[i].querySelector(".got");
    if (owned.has(x.no)) {
      if (!bd) { bd = document.createElement("span"); bd.className = "got"; bd.textContent = "✓"; tiles[i].appendChild(bd); }
    } else if (bd) bd.remove();
  });
  $("empty").classList.toggle("hidden", n > 0);
  $("count").textContent = filter === "mine" ? owned.size + " of " + TEXTS.length + " collected" : n + " texts";
  $("mineN").textContent = owned.size;
  document.querySelectorAll(".filter button").forEach(fb => fb.setAttribute("aria-pressed", fb.dataset.f === filter ? "true" : "false"));
}

function cell(x, k, locked) {
  const f = document.createElement("figure");
  if (locked) f.className = "locked";
  const c = document.createElement("canvas"); drawSheet(c, x, k, 240);
  const cap = document.createElement("figcaption");
  const c0 = FORMATS[k].cap.map(v => v.replace(/ /g, " "));
  cap.innerHTML = "<b>" + c0[0] + "</b><span>" + c0[1] + "</span>" + (c0[2] ? "<span>" + c0[2] + "</span>" : "");
  f.appendChild(c); f.appendChild(cap);
  return f;
}

function setView(v) {
  view = v;
  $("big").classList.toggle("hidden", v !== "sheet");
  $("mock").classList.toggle("hidden", v !== "wall");
  $("mockSave").classList.toggle("hidden", v !== "wall");
  document.querySelectorAll(".tabs button").forEach(t => t.setAttribute("aria-pressed", t.dataset.v === v ? "true" : "false"));
  if (v === "wall") drawMockup($("mock"), TEXTS[sel], 780);
}

function updateCollectUi() {
  const x = TEXTS[sel];
  $("collectBtn").textContent = owned.has(x.no) ? "In my collection ✓  (tap to remove)" : "Add to my collection";
}

function fillModal() {
  const x = TEXTS[sel];
  drawSheet($("big"), x, "a4", 780);
  $("modal").setAttribute("aria-label", "No. " + x.no + ": " + x.t);
  $("ttl").textContent = "No. " + x.no + (x.free ? " · FREE" : "");
  const sp = $("spec"); sp.innerHTML = "";
  ["a4", "poster", "us", "a6", "pc"].forEach(k => {
    const c = FORMATS[k].cap, li = document.createElement("li"), b = document.createElement("b"), sm = document.createElement("span");
    b.textContent = c[0]; sm.textContent = [c[1], c[2]].filter(Boolean).join("  /  ");
    li.appendChild(b); li.appendChild(sm); sp.appendChild(li);
  });
  const so = $("soc"); so.innerHTML = "";
  ["insta", "square", "story"].forEach(k => {
    const f = cell(x, k, false);
    const a = document.createElement("a"); a.href = "#"; a.textContent = "Save PNG";
    a.addEventListener("click", (e) => { e.preventDefault(); const c = document.createElement("canvas"); drawSheet(c, x, k, 1080); c.toBlob(b => saveBlob(b, "whoisjohnny-" + x.no + "-" + FORMATS[k].file + ".png")); });
    f.appendChild(a); so.appendChild(f);
  });
  const m = $("main");
  if (x.free) {
    $("gets").textContent = "Free: both packs. The print pack (A4, 50 x 70 cm, 18 x 24 in and two postcard sizes) and the social pack (three images), as a sample.";
    m.textContent = "Download everything, free"; m.className = "btn free";
    $("socBtn").classList.add("hidden");
  } else {
    $("gets").textContent = "The social pack is free. The print pack (A4, 50 x 70 cm, 18 x 24 in, A6 and 4 x 6 in postcards, as PDF) is USD " + PRICE + ".";
    m.textContent = "Get the print pack — USD " + PRICE; m.className = "btn";
    $("socBtn").classList.remove("hidden");
  }
  updateCollectUi();
  setView(view);
}

function isOpen() { return $("modal").classList.contains("open"); }
function openModal(i) {
  sel = i; fillModal();
  $("modal").classList.add("open"); $("modal").setAttribute("aria-hidden", "false"); $("modal").scrollTop = 0;
  document.body.style.overflow = "hidden";
  try { history.replaceState(null, "", "#" + TEXTS[i].no); } catch (e) {}
  $("mClose").focus();
}
function closeModal() {
  $("modal").classList.remove("open"); $("modal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
}
function step(d) {
  let list = TEXTS.map((x, i) => i).filter(i => filter !== "mine" || owned.has(TEXTS[i].no));
  if (list.indexOf(sel) < 0) list = TEXTS.map((x, i) => i);
  const pos = list.indexOf(sel);
  openModal(list[(pos + d + list.length) % list.length]);
}
function openFromHash() {
  const m = /^#(\d{3})$/.exec(location.hash);
  if (!m) return;
  const i = TEXTS.findIndex(t => t.no === m[1]);
  if (i >= 0) openModal(i);
}

function saveBlob(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
  files.forEach(f => {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(12, 33, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(14, 33, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  });
  let cd = 0; central.forEach(p => { cd += p.length; });
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cd, true); end.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
}
const canvasBytes = (c) => new Promise(res => c.toBlob(b => b.arrayBuffer().then(ab => res(new Uint8Array(ab))), "image/png"));

// Minimal PDF with one page holding one JPEG (the model uses 150 dpi rasters; the real files will be vector)
function pdfFromJpeg(jpeg, wPx, hPx, wPt, hPt) {
  const enc = new TextEncoder(), parts = [], offs = []; let pos = 0;
  const add = (u8) => { parts.push(u8); pos += u8.length; };
  const str = (t) => add(enc.encode(t));
  const obj = (n, head, stream) => {
    offs[n] = pos;
    if (!stream) { str(n + " 0 obj\n" + head + "\nendobj\n"); return; }
    str(n + " 0 obj\n" + head.replace("%LEN%", stream.length) + "\nstream\n"); add(stream); str("\nendstream\nendobj\n");
  };
  str("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + wPt.toFixed(2) + " " + hPt.toFixed(2) + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  obj(4, "<< /Type /XObject /Subtype /Image /Width " + wPx + " /Height " + hPx + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %LEN% >>", jpeg);
  obj(5, "<< /Length %LEN% >>", enc.encode("q " + wPt.toFixed(2) + " 0 0 " + hPt.toFixed(2) + " 0 0 cm /Im0 Do Q"));
  const xref = pos; let x = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) x += String(offs[i]).padStart(10, "0") + " 00000 n \n";
  str(x + "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  let n = 0; parts.forEach(p => { n += p.length; });
  const out = new Uint8Array(n); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
  return out;
}
const jpegBytes = (c) => new Promise(res => c.toBlob(b => b.arrayBuffer().then(ab => res(new Uint8Array(ab))), "image/jpeg", 0.93));
const PRINT_SPECS = { a4:{ name:"A4", px:1240, wPt:595.28, hPt:841.89 }, poster:{ name:"50x70cm", px:2953, wPt:1417.32, hPt:1984.25 }, us:{ name:"18x24in", px:2700, wPt:1296, hPt:1728 }, a6:{ name:"A6", px:620, wPt:297.64, hPt:419.53 }, pc:{ name:"4x6in", px:600, wPt:288, hPt:432 } };
function socialFiles(x) {
  return Promise.all(["insta", "square", "story"].map(k => {
    const c = document.createElement("canvas"); drawSheet(c, x, k, 1080);
    return canvasBytes(c).then(data => ({ name: "whoisjohnny-" + x.no + "-" + FORMATS[k].file + ".png", data: data }));
  }));
}
const b64u8 = (t) => Uint8Array.from(atob(t), c => c.charCodeAt(0));
function printFiles(x) {
  if (x.no === "001") return Promise.resolve(Object.keys(CMYK_001).map(n => ({ name: "whoisjohnny-001-" + n + "-CMYK.pdf", data: b64u8(CMYK_001[n]) })));
  return Promise.all(["a4", "poster", "us", "a6", "pc"].map(k => {
    const p = PRINT_SPECS[k], c = document.createElement("canvas"); drawSheet(c, x, k, p.px);
    return jpegBytes(c).then(j => ({ name: "whoisjohnny-" + x.no + "-" + p.name + ".pdf", data: pdfFromJpeg(j, c.width, c.height, p.wPt, p.hPt) }));
  }));
}


let last = "";
function door(product, label, extra) {
  last = product;
  track("clicked_buy", Object.assign({ product: product, referrer: document.referrer || "direct" }, extra || {}));
  $("oname").textContent = label;
  $("step1").classList.remove("hidden"); $("thanks").classList.add("hidden"); $("gate").classList.add("hidden");
  $("overlay").style.display = "flex";
}
function afterCollect() { refreshGrid(); updateCollectUi(); }
function downloadFree(x) {
  Promise.all([printFiles(x), socialFiles(x)]).then(r => saveBlob(makeZip(r[0].concat(r[1])), "whoisjohnny-" + x.no + ".zip"));
  track("downloaded_free_printpack", { text: x.t, no: x.no });
  collect(x.no, true); afterCollect();
}
let gateTarget = null;
function openGate(x) {
  gateTarget = x; $("gno").textContent = x.no; $("gateMsg").textContent = "";
  $("step1").classList.add("hidden"); $("thanks").classList.add("hidden"); $("gate").classList.remove("hidden");
  $("overlay").style.display = "flex"; $("gateEmail").focus();
}
const closeOverlay = () => { $("overlay").style.display = "none"; };

$("main").addEventListener("click", () => {
  const x = TEXTS[sel];
  if (x.free) {
    if (!EMAIL_ON || store.get("wij_email")) downloadFree(x); else openGate(x);
  } else {
    door("single", "the print pack", { text: x.t, no: x.no, price: String(PRICE) });
  }
});
$("socBtn").addEventListener("click", () => {
  const x = TEXTS[sel];
  socialFiles(x).then(f => saveBlob(makeZip(f), "whoisjohnny-" + x.no + "-social.zip"));
  track("downloaded_social", { text: x.t, no: x.no });
  collect(x.no, true); afterCollect();
});
$("pack10").addEventListener("click", () => startPick(10, PRICE10));
$("pack20").addEventListener("click", () => startPick(20, PRICE20));
$("pickCancel").addEventListener("click", endPick);
$("pickClear").addEventListener("click", () => { pick.set = new Set(); updatePickBar(); });
$("pickGo").addEventListener("click", () => {
  if (pick.set.size !== pick.size) return;
  const list = TEXTS.filter(x => pick.set.has(x.no)).map(x => x.no);
  door("pack" + pick.size, "the " + pick.size + "-text pack (No. " + list.join(", ") + ")", { price: String(pick.price), no: list.join(","), picks: list.join(",") });
  endPick();
});
$("collectBtn").addEventListener("click", () => { const x = TEXTS[sel]; collect(x.no, !owned.has(x.no)); afterCollect(); });
$("mockSave").addEventListener("click", (e) => {
  e.preventDefault(); const x = TEXTS[sel], c = document.createElement("canvas"); drawMockup(c, x, 1080);
  c.toBlob(b => saveBlob(b, "whoisjohnny-" + x.no + "-mockup.png"));
});
document.querySelectorAll(".tabs button").forEach(t => t.addEventListener("click", () => setView(t.dataset.v)));
document.querySelectorAll(".filter button").forEach(fb => fb.addEventListener("click", () => { filter = fb.dataset.f; refreshGrid(); }));
$("mClose").addEventListener("click", closeModal);
$("mPrev").addEventListener("click", () => step(-1));
$("mNext").addEventListener("click", () => step(1));
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", (e) => {
  if ($("overlay").style.display === "flex") { if (e.key === "Escape") closeOverlay(); return; }
  if (e.key === "Escape" && pick.size) { endPick(); return; }
  if (!isOpen()) return;
  if (e.key === "Escape") closeModal(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
});
window.addEventListener("hashchange", openFromHash);

$("close1").addEventListener("click", closeOverlay);
$("close2").addEventListener("click", closeOverlay);
$("overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeOverlay(); });
$("send").addEventListener("click", () => {
  const el = $("notify");
  if (!el.value || !el.checkValidity()) { el.focus(); return; }
  saveEmail(el.value.trim(), "door_" + last, { product: last });
  $("step1").classList.add("hidden"); $("thanks").classList.remove("hidden");
});
$("gateNo").addEventListener("click", closeOverlay);
$("gateGo").addEventListener("click", () => {
  const el = $("gateEmail"), msg = $("gateMsg");
  if ($("gateHp").value) return;
  if (!el.value || !el.checkValidity()) { msg.textContent = "Please check the email address."; el.focus(); return; }
  if (!$("gateOk").checked) { msg.textContent = "Tick the box to continue."; return; }
  const em = el.value.trim();
  saveEmail(em, "free_download_" + gateTarget.no, { no: gateTarget.no });
  store.set("wij_email", em);
  closeOverlay(); downloadFree(gateTarget);
});
$("newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const el = $("newsEmail"), msg = $("newsMsg");
  if ($("newsHp").value) return;
  if (!el.value || !el.checkValidity()) { msg.textContent = "Please check the email address."; el.focus(); return; }
  if (!$("newsOk").checked) { msg.textContent = "Tick the box so we know it is OK to write to you."; return; }
  const em = el.value.trim();
  saveEmail(em, "newsletter"); store.set("wij_email", em);
  msg.textContent = "Noted. You will hear from us when there is something new.";
  el.value = ""; $("newsOk").checked = false;
});

buildGrid(); refreshGrid(); openFromHash();
