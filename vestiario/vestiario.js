/* Vestiário — troca de uniformes, painel histórico, entrada e saída.
   Web Animations API + CSS; a entrada (intro.js) é um vídeo renderizado no Blender. Conteúdo em capitulos.json. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE_IN = "cubic-bezier(0.55, 0, 0.85, 0.25)";
const EASE_OUT = "cubic-bezier(0.2, 0, 0, 1)";
const EASE_PLATE = "cubic-bezier(0.33, 0, 0, 1)";
const DIM = { claro: 0.16, dramatico: 0.62, noite: 0.34, selecao: 0.1 };
const pad = (n) => String(n).padStart(2, "0");
const esc = (s = "") => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const anim = (el, frames, opts) =>
  el.animate(frames, { fill: "both", ...opts, duration: reduced ? Math.min(opts.duration ?? 300, 200) : opts.duration }).finished.catch(() => {});

/* entrada em vídeo: começa a carregar já, em paralelo com os dados e o primeiro retrato.
   O estouro de luz só acontece quando o palco estiver pronto (stageReady). */
let stageReady;
const ready = new Promise((r) => (stageReady = r));
const noIntro = reduced || new URLSearchParams(location.search).get("entrada") === "0";   // ?entrada=0 pula a entrada
const introRun = noIntro
  ? Promise.resolve(false)
  : import("./intro.js")
      .then((m) => m.playIntro({ ready, onFlash: () => enter({ doors: false }) }))
      .then(() => true, (err) => { console.warn("Entrada indisponível, usando as portas:", err); return false; });

const data = await fetch("capitulos.json").then((r) => r.json());
const CH = data.capitulos;
const fig = $("#fig");
const slots = $$(".fig-layer", fig);
let active = 0;          // slot visível
let cur = -1;            // capítulo atual
let target = -1;         // destino da troca em andamento (base para as setas)
let busy = false;
let queued = null;

/* ---------- retratos: carrega uma vez; sem arquivo → silhueta ---------- */
const portraits = new Map();
function portrait(c) {
  if (!portraits.has(c.id)) {
    portraits.set(c.id, new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.alt = `Neymar Jr com o uniforme ${c.nomeCurto || c.nome}, ${c.periodo}`;
      img.onload = () => img.decode().catch(() => {}).then(() => resolve({ ok: true, img }));
      img.onerror = () => resolve({ ok: false });
      img.src = c.retrato.arquivo;
    }));
  }
  return portraits.get(c.id);
}

function fillSlot(slot, c, p) {
  slot.replaceChildren();
  if (p.ok) {
    const a = c.retrato.ajuste || {};
    p.img.style.setProperty("--as", a.escala ?? 1);
    p.img.style.setProperty("--ax", `${a.x ?? 0}%`);
    p.img.style.setProperty("--ay", `${a.y ?? 0}%`);
    slot.append(p.img);
  } else {
    const s = document.createElement("div");
    s.className = "silhouette";
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", `Silhueta de Neymar Jr: retrato com o uniforme ${c.nomeCurto || c.nome} em produção`);
    slot.append(s);
  }
  fig.classList.toggle("is-pending", !p.ok);
}

/* ---------- ambiente: armários (um por capítulo) ---------- */
const lockers = $("#lockers");
const lockerEls = [];
CH.forEach((c, i) => {
  if (i === 3) {
    const gap = document.createElement("div");
    gap.className = "lk gap";
    lockers.append(gap);
  }
  const lk = document.createElement("div");
  lk.className = "lk";
  lk.innerHTML = `<i class="vents"></i><span class="plate">${pad(i + 1)}<small>${esc(c.seletor)}</small></span><i class="handle"></i><i class="led"></i>`;
  lockers.append(lk);
  lockerEls.push(lk);
});

/* ---------- seletor ---------- */
const list = $("#chapters");
CH.forEach((c, i) => {
  const li = document.createElement("li");
  if (c.tipo === "Seleção") li.className = "special";
  li.innerHTML = `<button class="ch" type="button" data-i="${i}"><small>${pad(i + 1)}</small><b>${esc(c.seletor)}</b><span>${esc(c.periodo.replace(" — ", "–"))}</span></button>`;
  list.append(li);
});
const chBtns = $$(".ch", list);
const bar = $("#chapters-bar");
$("#count-all").textContent = pad(CH.length);

function placeBar(i) {
  const b = chBtns[i];
  bar.style.width = `${b.offsetWidth}px`;
  bar.style.transform = `translateX(${b.offsetLeft}px)`;
  chBtns.forEach((x, k) => x.setAttribute("aria-current", k === i ? "true" : "false"));
  if (matchMedia("(max-width: 860px)").matches) b.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced ? "auto" : "smooth" });
}

/* ---------- tema e textos ---------- */
const washes = $$(".wash");
let washOn = 0;
function applyTheme(c, animate) {
  const t = c.tema;
  root.style.setProperty("--c1", t.cor);
  root.style.setProperty("--c2", t.cor2);
  root.style.setProperty("--luz", t.luz);
  root.style.setProperty("--dim", DIM[t.clima] ?? 0.16);
  root.dataset.clima = t.clima;
  const next = washes[1 - washOn];
  washes.forEach((w) => w.getAnimations().forEach((a) => a.commitStyles?.() ?? 0));
  washes.forEach((w) => w.getAnimations().forEach((a) => a.cancel()));
  next.style.setProperty("--w1", `color-mix(in srgb, ${t.cor} 26%, transparent)`);
  next.style.setProperty("--w2", `color-mix(in srgb, ${t.cor2} 26%, transparent)`);
  anim(next, [{ opacity: 0 }, { opacity: 1 }], { duration: animate ? 800 : 1, easing: EASE_PLATE });
  anim(washes[washOn], [{ opacity: 1 }, { opacity: 0 }], { duration: animate ? 800 : 1, easing: EASE_PLATE });
  washOn = 1 - washOn;
  lockerEls.forEach((lk, k) => lk.classList.toggle("on", k === CH.indexOf(c)));
}

const TROPHY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9 17h6"/></svg>`;

function factsHTML(c) {
  const nums = `<div class="rv"><h3>Números</h3><div class="nums${c.numeros.length === 2 ? " two" : ""}">${c.numeros
    .map((n) => `<div class="num"><b>${esc(n.valor)}</b><span>${esc(n.rotulo)}</span></div>`)
    .join("")}</div><p class="note">${esc(c.numerosNota)}</p></div>`;
  const recs = c.recordes?.length
    ? `<div class="rv"><h3>Recordes</h3><div class="records">${c.recordes.map((r) => `<div class="record"><b>${esc(r.titulo)}</b><span>${esc(r.texto)}</span></div>`).join("")}</div></div>`
    : "";
  const titles = c.conquistas.length
    ? `<div class="titles">${c.conquistas
        .slice(0, 4)
        .map((t) => `<div class="title-row">${TROPHY}<div><b>${esc(t.titulo)}</b><span>${esc(t.anos)}</span></div></div>`)
        .join("")}${c.conquistas.length > 4 ? `<p class="note">+ ${c.conquistas.length - 4} no painel do capítulo</p>` : ""}</div>`
    : `<p class="titles-empty">${esc(c.conquistasVazio)}</p>`;
  return `${nums}${recs}<div class="rv"><h3>Conquistas</h3>${titles}</div>`;
}

function writeText(c, i) {
  $("#ch-index").textContent = `Capítulo ${pad(i + 1)}`;
  $("#ch-type").textContent = c.tipo;
  $("#ch-name").textContent = c.nomeCurto && c.nome.length > 12 ? c.nomeCurto : c.nome;
  $("#ch-sub").textContent = c.subtitulo;
  $("#ch-period").textContent = c.periodo;
  $("#ch-shirt").textContent = c.camisa;
  $("#ch-lead").textContent = c.abertura;
  $("#ch-text").textContent = c.contexto;
  $("#facts").innerHTML = factsHTML(c);
  $("#count-now").textContent = pad(i + 1);
  const big = $("#bigname");
  big.textContent = c.nomeCurto || c.nome;
  big.style.setProperty("--chars", (c.nomeCurto || c.nome).length);
  document.title = `${c.nomeCurto || c.nome} · Vestiário · Neymar Jr`;
}

const textEls = () => [...$$(".rv", $("#info")), ...$$(".rv", $("#facts"))];

async function textOut() {
  const els = textEls();
  els.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  await Promise.all(els.map((el, k) =>
    anim(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-10px)" }], { duration: 200, delay: k * 14, easing: EASE_IN })));
}
function textIn(baseDelay = 0) {
  return Promise.all(textEls().map((el, k) =>
    anim(el, [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 480, delay: baseDelay + k * 38, easing: EASE_OUT })));
}

/* ---------- troca de capítulo ---------- */
async function go(i, dir) {
  i = (i + CH.length) % CH.length;
  if (busy) { if (i !== (queued?.[0] ?? target)) queued = [i, dir]; return; }
  if (i === cur) return;
  busy = true;
  target = i;
  const c = CH[i];
  dir = dir ?? (i > cur ? 1 : -1);

  // orientação imediata: seletor, armário, contador
  placeBar(i);
  history.replaceState(null, "", `#${c.id}`);

  // o retrato novo só entra depois de pronto; o atual fica na tela enquanto isso
  const loading = setTimeout(() => fig.classList.add("is-loading"), 140);
  const p = await portrait(c);
  clearTimeout(loading);
  fig.classList.remove("is-loading");

  const outSlot = slots[active];
  const inSlot = slots[1 - active];
  fillSlot(inSlot, c, p);
  inSlot.style.zIndex = 2;
  outSlot.style.zIndex = 1;

  const big = $("#bigname");
  big.getAnimations().forEach((a) => a.cancel());
  inSlot.getAnimations().forEach((a) => a.cancel());
  const shift = 7 * dir;
  const figOut = reduced
    ? anim(outSlot, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 })
    : anim(outSlot, [
        { clipPath: "inset(0 0 0 0)", transform: "none", opacity: 1 },
        { clipPath: dir > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)", transform: `translateX(${-shift}%) scale(0.985)`, opacity: 0.4 },
      ], { duration: 560, easing: EASE_IN });
  const figIn = reduced
    ? anim(inSlot, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 })
    : anim(inSlot, [
        { clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", transform: `translateX(${shift}%) scale(1.035)`, opacity: 1 },
        { clipPath: "inset(0 0 0 0)", transform: "none", opacity: 1 },
      ], { duration: 780, delay: 140, easing: EASE_OUT });

  const bigOut = anim(big, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-3 * dir}%)` }], { duration: 300, easing: EASE_IN });
  await Promise.all([textOut(), bigOut]);

  applyTheme(c, true);
  writeText(c, i);
  anim(big, [{ opacity: 0, transform: `translateX(${4 * dir}%)`, letterSpacing: "0.08em" }, { opacity: 1, transform: "none", letterSpacing: "-0.01em" }], { duration: 900, easing: EASE_OUT });
  await Promise.all([figIn, figOut, textIn()]);

  outSlot.replaceChildren();
  outSlot.getAnimations().forEach((a) => a.cancel());
  active = 1 - active;
  cur = i;
  if (panelOpen) renderPanel(c);
  busy = false;
  if (queued) { const [qi, qd] = queued; queued = null; go(qi, qd); }
}

/* ---------- painel histórico ---------- */
const panel = $("#panel");
const sheet = $("#panel-sheet");
let panelOpen = false;
let lastFocus = null;

function renderPanel(c) {
  $("#panel-eyebrow").textContent = `Capítulo ${pad(CH.indexOf(c) + 1)} · ${c.tipo}`;
  $("#panel-name").textContent = c.nome;
  $("#panel-period").textContent = `${c.periodo} · camisa ${c.camisa}`;
  const titles = c.conquistas.length
    ? `<div class="titles">${c.conquistas.map((t) => `<div class="title-row">${TROPHY}<div><b>${esc(t.titulo)}</b><span>${esc(t.anos)}${t.nota ? ` · ${esc(t.nota)}` : ""}</span></div></div>`).join("")}</div>`
    : `<p class="titles-empty">${esc(c.conquistasVazio)}</p>`;
  const recs = c.recordes?.length
    ? `<div class="records" style="margin-top:14px">${c.recordes.map((r) => `<div class="record"><b>${esc(r.titulo)}</b><span>${esc(r.texto)}</span></div>`).join("")}</div>`
    : "";
  const photos = c.fotos.map((f) => `<figure><img src="${esc(f.arquivo)}" alt="${esc(f.legenda)}" loading="lazy" decoding="async"><figcaption>${esc(f.legenda)}<small>Foto: <a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.autor)}</a> · ${esc(f.licenca)} · Wikimedia Commons</small></figcaption></figure>`).join("");
  $("#panel-body").innerHTML = `
    <section class="pblock"><p class="lead">${esc(c.abertura)}</p><p class="text">${esc(c.contexto)}</p></section>
    <section class="pblock"><h3>Momentos</h3><ol class="moments">${c.momentos.map((m) => `<li class="moment"><b>${esc(m.quando)}</b><span>${esc(m.texto)}</span></li>`).join("")}</ol></section>
    <section class="pblock"><h3>Conquistas</h3>${titles}${recs}</section>
    <section class="pblock"><h3>Números</h3><div class="nums${c.numeros.length === 2 ? " two" : ""}">${c.numeros.map((n) => `<div class="num"><b>${esc(n.valor)}</b><span>${esc(n.rotulo)}</span></div>`).join("")}</div><p class="note">${esc(c.numerosNota)}</p></section>
    <section class="pblock"><h3>Fotos</h3><div class="photos">${photos}</div></section>
    <section class="pblock"><h3>Fontes</h3><div class="sources">${data.fontes.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a>`).join("")}</div><p class="pnote">${esc(data.retratoCredito)} Dados conferidos em ${esc(data.atualizado.split("-").reverse().join("/"))}.</p></section>`;
}

async function openPanel() {
  if (panelOpen) return;
  panelOpen = true;
  lastFocus = document.activeElement;
  renderPanel(CH[cur]);
  root.classList.add("panel-open");
  panel.hidden = false;
  sheet.scrollTop = 0;
  sheet.focus({ preventScroll: true });
  anim($(".panel-scrim", panel), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE_PLATE });
  anim(sheet, [{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 620, easing: EASE_OUT });
  $$(".pblock", sheet).forEach((b, k) =>
    anim(b, [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: 220 + k * 70, easing: EASE_OUT }));
}
async function closePanel() {
  if (!panelOpen) return;
  panelOpen = false;
  await Promise.all([
    anim($(".panel-scrim", panel), [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: EASE_PLATE }),
    anim(sheet, [{ transform: "none" }, { transform: "translateX(100%)" }], { duration: 420, easing: EASE_IN }),
  ]);
  panel.hidden = true;
  root.classList.remove("panel-open");
  lastFocus?.focus({ preventScroll: true });
}
$("#explore").addEventListener("click", openPanel);
panel.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closePanel(); });
panel.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanel();
  if (e.key !== "Tab") return;
  const f = $$("a[href], button", sheet);
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});

/* ---------- controles ---------- */
const base = () => queued?.[0] ?? (busy ? target : cur);
$("#prev").addEventListener("click", () => go(base() - 1, -1));
$("#next").addEventListener("click", () => go(base() + 1, 1));
list.addEventListener("click", (e) => {
  const b = e.target.closest(".ch");
  if (b) go(Number(b.dataset.i));
});
document.addEventListener("keydown", (e) => {
  if (panelOpen || (e.target instanceof Element && e.target.closest("input, textarea"))) return;
  if (e.key === "ArrowRight") go(base() + 1, 1);
  if (e.key === "ArrowLeft") go(base() - 1, -1);
});
let swipe = null;
fig.addEventListener("pointerdown", (e) => { swipe = { x: e.clientX, y: e.clientY }; });
fig.addEventListener("pointerup", (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(base() + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});
addEventListener("resize", () => { if (cur >= 0) placeBar(cur); });   // a entrada pode redimensionar antes do primeiro capítulo
addEventListener("hashchange", () => {
  const i = CH.findIndex((c) => `#${c.id}` === location.hash);
  if (i >= 0 && i !== cur) go(i);
});

/* parallax leve do ambiente com o cursor */
if (!reduced && matchMedia("(hover: hover)").matches) {
  const lk = $("#lockers"), bigWrap = $(".bigname");
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  addEventListener("pointermove", (e) => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(step);
  });
  function step() {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    lk.style.transform = `translate3d(${x * -14}px, ${y * -8}px, 0)`;
    bigWrap.style.transform = `translate3d(${x * -26}px, ${y * -10}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(step) : 0;
  }
}

/* ---------- entrada ---------- */
const shutters = $("#shutters");
const doors = $$("i", shutters);
const ORDER = [2, 1, 0, 0, 1, 2];   // abre do centro para as bordas

const start = Math.max(0, CH.findIndex((c) => `#${c.id}` === location.hash));
CH.forEach((c, k) => { if (k !== start) portrait(c); });   // pré-carrega o resto em segundo plano
const first = await Promise.race([portrait(CH[start]), wait(2500).then(() => ({ ok: false }))]);
await Promise.race([document.fonts.ready, wait(1200)]);

cur = target = start;
fillSlot(slots[active], CH[start], first.ok ? first : await portrait(CH[start]));
slots[active].style.zIndex = 2;
applyTheme(CH[start], false);
writeText(CH[start], start);
placeBar(start);

let entered = false;
async function enter({ doors: withDoors = true } = {}) {
  if (entered) return;
  entered = true;
  const figEl = fig, lk = $("#lockers"), big = $("#bigname"), nav = $(".chapters"), top = $(".top");
  const hide = [figEl, big, nav, top, ...textEls(), $("#prev"), $("#next")];
  hide.forEach((el) => (el.style.opacity = 0));
  if (reduced) {
    shutters.classList.remove("is-closed");
    hide.forEach((el) => (el.style.opacity = ""));
    return;
  }
  if (withDoors) {
    doors.forEach((d, k) =>
      anim(d, [{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }], { duration: 760, delay: 80 + ORDER[k] * 70, easing: "cubic-bezier(0.7, 0, 0.2, 1)" }));
  } else {
    shutters.classList.remove("is-closed");   // vindo da entrada em vídeo: o branco já cobre a troca
  }
  anim(lk, [{ opacity: 0.2, transform: "translateY(4svh) scale(1.04)" }, { opacity: 1, transform: "none" }], { duration: 1100, delay: 200, easing: EASE_OUT })
    .then(() => lk.getAnimations().forEach((a) => a.cancel()));
  const mobile = matchMedia("(max-width: 860px)").matches;
  const reveal = (el, from, delay, duration = 800, to = "none") =>
    anim(el, [{ opacity: 0, ...from }, { opacity: 1, transform: to }], { duration, delay, easing: EASE_OUT }).then(() => { el.style.opacity = ""; el.getAnimations().forEach((a) => a.cancel()); });
  reveal(top, { transform: "translateY(-12px)" }, 450, 600);
  reveal(big, { transform: "translateY(6%)" }, 380, 1000);
  reveal(figEl, { transform: mobile ? "translateY(40px)" : "translate(-50%, 50px)" }, 420, 1000, mobile ? "none" : "translate(-50%, 0)");
  textEls().forEach((el, k) => reveal(el, { transform: "translateY(16px)" }, 620 + k * 55, 600));
  reveal(nav, { transform: mobile ? "translateY(20px)" : "translate(-50%, 24px)" }, 820, 700, mobile ? "none" : "translate(-50%, 0)");
  reveal($("#prev"), { transform: "translateX(-10px)" }, 900, 500);
  reveal($("#next"), { transform: "translateX(10px)" }, 900, 500);
  await wait(1700);
  shutters.classList.remove("is-closed");
  doors.forEach((d) => d.getAnimations().forEach((a) => a.cancel()));
}
stageReady();
if (!(await introRun)) enter();

/* ---------- saída para a página inicial ---------- */
$("#back").addEventListener("click", async (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const href = e.currentTarget.href;          // currentTarget some depois do primeiro await
  if (panelOpen) await closePanel();
  try { sessionStorage.setItem("njr-curtain", "1"); } catch {}
  if (!reduced) {
    anim(fig, [{ opacity: 1 }, { opacity: 0.3 }], { duration: 400, easing: EASE_IN });
    await Promise.all(doors.map((d, k) =>
      anim(d, [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 560, delay: (2 - ORDER[k]) * 60, easing: "cubic-bezier(0.7, 0, 0.2, 1)" })));
  }
  location.href = href;
});
/* voltando pelo histórico (bfcache): portas abertas de novo */
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  doors.forEach((d) => d.getAnimations().forEach((a) => a.cancel()));
  shutters.classList.remove("is-closed");
  fig.getAnimations().forEach((a) => a.cancel());
});
