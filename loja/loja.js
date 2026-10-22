/* LOJA — vitrine demonstrativa NJR.
   Não existe catálogo, estoque, pagamento nem backend: as peças são conceitos desenhados em SVG (art.js),
   o preço é "a definir" e a "lista" é um carrinho de demonstração guardado só neste navegador. */
import {
  initPage, REDUCED, FINE, $, $$, CFG, motion, splitText, buildHeading, inView, forward, scrub, revealAll, depth,
  lenis, clamp01, lerp, easeInOutCubic,
} from "/shared/njr.js";
import { art, recolor } from "./art.js";

const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const EASE_PLATE = "cubic-bezier(0.33, 0, 0, 1)";
const pad = (n) => String(n).padStart(2, "0");
const html = document.documentElement;
const anim = (el, kf, o) => (REDUCED || !el ? null : el.animate(kf, { easing: EASE, fill: "backwards", ...o }));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const dataP = fetch("loja.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
const ready = initPage("/loja/", {
  credits: `<p>Todas as imagens de produtos foram desenhadas em código (SVG) para esta vitrine: nenhuma foto de terceiros, nenhum escudo, patrocínio ou logo de fornecedora. Vitrine demonstrativa — nenhum produto está à venda.</p>`,
});

/* ---------- estados iniciais da abertura (antes da placa sair) ---------- */
const hero = $("#topo"), heroStage = $("#hero-stage"), heroArt = $("#hero-art");
const heroHead = buildHeading($("#hero-h"));
const heroM = ["#hero-eyebrow", "#hero-lead", "#hero-seal", "#hero-cta"].map((s) => motion($(s), { y: "1rem", config: CFG.COPY2 }));
const capM = [$(".hero-cap"), $(".hero-ctrl")].map((el) => motion(el, { y: "0.75rem", config: CFG.ITEM }));
if (!REDUCED) heroStage.style.clipPath = "inset(100% 0 0 0)";

let data;
try { data = await dataP; } catch (err) {
  await ready;
  heroHead.play(0); heroM.forEach((m) => m.play()); capM.forEach((m) => m.play()); heroStage.style.clipPath = "";
  $("#grid").insertAdjacentHTML("beforebegin", `<p class="empty">Não foi possível carregar a vitrine agora. A lista abaixo mostra as peças sem interação.</p>`);
  throw err;
}
const P = data.produtos;
const byId = Object.fromEntries(P.map((p) => [p.id, p]));
const CAT = Object.fromEntries(data.categorias.map((c) => [c.id, c.nome]));
const colorName = (c) => data.cores[c]?.nome || c;
const capaName = (c) => data.capas[c]?.nome || c;
const isPoster = (p) => p.tipo === "poster" || p.tipo === "trajetoria";
const tamLabel = (p) => (isPoster(p) ? "Formato" : "Tamanho");

/* ================= ABERTURA: destaques que giram ================= */
const FEAT = [
  { id: "moletom-ousadia", cor: "tinta" },
  { id: "camiseta-10", cor: "amarelo" },
  { id: "poster-abas", capa: "titulos" },
];
heroArt.innerHTML = FEAT.map((f, i) => `<span class="hero-slide" data-i="${i}" style="position:absolute;inset:0;${i ? "opacity:0;visibility:hidden" : ""}">${art(byId[f.id], f)}</span>`).join("");
const slides = $$(".hero-slide", heroArt);
const heroName = $("#hero-name"), heroIdx = $("#hero-idx"), meter = $("#hero-meter");
$("#hero-dots").innerHTML = FEAT.map((f, i) => `<li><button type="button" aria-label="Destaque ${i + 1}: ${esc(byId[f.id].nome)}"${i ? "" : ' aria-current="true"'}></button></li>`).join("");
const dots = $$("#hero-dots button");
let heroI = 0, nameCtl = splitText(heroName, byId[FEAT[0].id].nome, { by: "words", stagger: 70, config: CFG.NAME });
const DWELL = 5200;
let meterAnim = null;
const pauses = new Set(REDUCED ? ["user"] : []);
const pauseBtn = $("#hero-pause");
if (REDUCED) { pauseBtn.textContent = "Reproduzir"; pauseBtn.setAttribute("aria-pressed", "true"); }

function showHero(i, dir = 1) {
  i = (i + FEAT.length) % FEAT.length;
  if (i === heroI) return;
  const out = slides[heroI], inn = slides[i];
  heroI = i;
  inn.style.visibility = "visible"; inn.style.opacity = "1";
  if (!REDUCED) {
    out.animate([{ opacity: 1, transform: "none", filter: "blur(0px)" }, { opacity: 0, transform: `translateX(${-9 * dir}%) scale(0.94)`, filter: "blur(6px)" }],
      { duration: 650, easing: "cubic-bezier(0.5, 0, 0.75, 0)" }).finished.then(() => { if (slides[heroI] !== out) { out.style.opacity = "0"; out.style.visibility = "hidden"; } });
    inn.animate([{ opacity: 0, transform: `translateX(${10 * dir}%) scale(1.05)`, filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
      { duration: 1100, delay: 260, easing: EASE, fill: "backwards" });
  } else { out.style.opacity = "0"; out.style.visibility = "hidden"; }
  nameCtl = splitText(heroName, byId[FEAT[i].id].nome, { by: "words", stagger: 70, config: CFG.NAME });
  nameCtl.play(REDUCED ? 0 : 380);
  heroIdx.textContent = `${pad(i + 1)} / ${pad(FEAT.length)}`;
  anim(heroIdx, [{ opacity: 0, transform: "translateY(0.5rem)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 300 });
  dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
  runMeter();
}
function runMeter() {
  meterAnim?.cancel();
  if (REDUCED) return;
  meterAnim = meter.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DWELL, easing: "linear", fill: "forwards" });
  meterAnim.onfinish = () => showHero(heroI + 1, 1);
  if (pauses.size) meterAnim.pause();
}
const setPause = (why, on) => {
  if (on) pauses.add(why); else pauses.delete(why);
  if (!meterAnim) return;
  if (pauses.size) meterAnim.pause(); else if (meterAnim.playState === "paused") meterAnim.play();
};
$("#hero-prev").addEventListener("click", () => showHero(heroI - 1, -1));
$("#hero-next").addEventListener("click", () => showHero(heroI + 1, 1));
dots.forEach((d, k) => d.addEventListener("click", () => showHero(k, k > heroI ? 1 : -1)));
pauseBtn.addEventListener("click", () => {
  const on = !pauses.has("user");
  setPause("user", on);
  pauseBtn.setAttribute("aria-pressed", String(on));
  pauseBtn.textContent = on ? "Reproduzir" : "Pausar";
  if (!on && !meterAnim) runMeter();
});
heroStage.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setPause("hover", true); });
heroStage.addEventListener("pointerleave", () => setPause("hover", false));
heroStage.addEventListener("focusin", () => setPause("focus", true));
heroStage.addEventListener("focusout", () => setPause("focus", false));
document.addEventListener("visibilitychange", () => setPause("tab", document.hidden));
inView(hero, { threshold: 0.15 }, () => setPause("view", false), () => setPause("view", true));
$("#hero-hit").addEventListener("click", () => {
  const f = FEAT[heroI];
  openProduct(f.id, { cor: f.cor, capa: f.capa }, slides[heroI], "hero");
});
depth(hero, [$(".hero-word span"), heroArt], { max: 18 });

/* faixa corrida */
const PHRASES = ["Vitrine demonstrativa", "Nenhum produto está à venda", "Preço a definir", "Peças conceituais NJR", "Sem escudos, sem patrocínios", "Desenhado em código"];
const ribbon = $("#ribbon");
ribbon.innerHTML = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES].map((t) => `<span>${t}</span>`).join("");
inView(ribbon, {}, () => { ribbon.style.animationPlayState = "running"; }, () => { ribbon.style.animationPlayState = "paused"; });

/* ================= PEÇA EM FOCO: a câmera percorre o moletom com a rolagem ================= */
const focusSec = $("#foco");
const fP = byId["moletom-ousadia"];
$("#focus-front").innerHTML = art(fP, { cor: "tinta", view: 0 });
$("#focus-back").innerHTML = art(fP, { cor: "tinta", view: 1 });
const fFront = $("#focus-front svg"), fBack = $("#focus-back svg"), fBackWrap = $("#focus-back");
const FULL = [0, 0, 600, 720], CHEST = [120, 240, 360, 432], STRINGS = [190, 70, 220, 264];
const KEYS = [[0, FULL], [0.1, FULL], [0.3, CHEST], [0.42, CHEST], [0.58, STRINGS], [0.68, STRINGS], [0.86, FULL], [1, FULL]];
const STEP_VB = [FULL, CHEST, STRINGS, FULL];
const steps = $$("#focus-steps li"), lens = $("#focus-lens"), fMeter = $("#focus-meter");
let stepOn = 0;
function camAt(p) {
  for (let k = 1; k < KEYS.length; k++) {
    if (p <= KEYS[k][0]) {
      const [a0, va] = KEYS[k - 1], [a1, vb] = KEYS[k];
      const t = easeInOutCubic(clamp01((p - a0) / (a1 - a0 || 1)));
      return va.map((v, i) => lerp(v, vb[i], t));
    }
  }
  return FULL;
}
function setCam(p) {
  const step = p < 0.2 ? 0 : p < 0.5 ? 1 : p < 0.77 ? 2 : 3;
  const vb = REDUCED ? STEP_VB[step] : camAt(p);
  const s = vb.map((v) => v.toFixed(2)).join(" ");
  fFront.setAttribute("viewBox", s); fBack.setAttribute("viewBox", s);
  const back = REDUCED ? (step === 3 ? 1 : 0) : clamp01((p - 0.7) / 0.16);
  fBackWrap.style.opacity = back.toFixed(3);
  fFront.parentElement.style.opacity = (1 - back).toFixed(3);
  fMeter.style.transform = `scaleX(${clamp01(p).toFixed(4)})`;
  lens.textContent = `Lente ${(600 / vb[2]).toFixed(1).replace(".", ",")}×${step === 3 && back > 0.5 ? " · costas" : ""}`;
  if (step !== stepOn) { steps[stepOn].classList.remove("is-on"); steps[step].classList.add("is-on"); stepOn = step; }
}
scrub(focusSec, "top top", "bottom bottom", setCam, REDUCED ? {} : { smooth: CFG.TRIGGER });
$("#focus-open").addEventListener("click", () => openProduct("moletom-ousadia", { cor: "tinta" }, null, "focus"));

/* ================= VITRINE ================= */
const grid = $("#grid");
const S = { cat: "todos", color: null };
const cardColor = (p) => (S.color && p.cores?.includes(S.color) ? S.color : p.cores?.[0]);
grid.innerHTML = P.map((p, i) => `
  <li class="card is-pre" data-id="${p.id}">
    <a class="card-link" href="#${p.id}">
      <div class="card-stage">
        <div class="card-art">${art(p, { cor: cardColor(p) })}</div>
        <span class="card-n mono-num" aria-hidden="true">${pad(i + 1)}</span>
        ${p.destaque ? '<span class="card-tag">Destaque</span>' : ""}
        <span class="bk tl" aria-hidden="true"></span><span class="bk br" aria-hidden="true"></span>
        <span class="card-look" aria-hidden="true"><span>Ver de perto</span><span>→</span></span>
      </div>
      <div class="card-meta">
        <h3 class="card-name">${esc(p.nome)}</h3>
        <p class="card-sum">${esc(p.resumo)}</p>
        <div class="card-row"><span class="card-price">${data.preco}</span>
          <span class="card-dots">${(p.cores || []).map((c) => `<i style="background:${data.cores[c].hex}" title="${colorName(c)}"></i>`).join("")}<span class="sr-only">${p.cores ? "Cores: " + p.cores.map(colorName).join(", ") : p.capas.length + " capas"}</span></span>
        </div>
      </div>
    </a>
  </li>`).join("");
const cards = $$(".card", grid);
const cardOf = (id) => cards.find((c) => c.dataset.id === id);

// entrada da galeria: cortina de cada palco + peça subindo, em sequência
let gridShown = false;
function playGrid() {
  gridShown = true;
  cards.filter((c) => !c.hidden).forEach((c, i) => {
    c.classList.remove("is-pre");
    const d = 80 + i * 85;
    anim($(".card-stage", c), [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1000, delay: d, easing: EASE_PLATE });
    anim($(".card-art", c), [{ opacity: 0, translate: "0 10%" }, { opacity: 1, translate: "0 0" }], { duration: 1200, delay: d + 180 });
    anim($(".card-meta", c), [{ opacity: 0, transform: "translateY(0.75rem)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: d + 260 });
  });
}
inView(grid, { rootMargin: "0px 0px -15% 0px", once: true }, playGrid);

// luz que segue o ponteiro + leve deslocamento da peça + foco na peça sob o mouse
if (FINE && !REDUCED) {
  cards.forEach((c) => {
    const stage = $(".card-stage", c), a = $(".card-art", c);
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      stage.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      stage.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      a.style.translate = `${((x - 0.5) * -10).toFixed(1)}px ${((y - 0.5) * -8).toFixed(1)}px`;
    });
    stage.addEventListener("pointerleave", () => { stage.style.removeProperty("--mx"); stage.style.removeProperty("--my"); a.style.translate = ""; });
    c.addEventListener("pointerenter", () => { c.classList.add("hot"); grid.classList.add("dimming"); });
    c.addEventListener("pointerleave", () => { c.classList.remove("hot"); grid.classList.remove("dimming"); });
  });
}
grid.addEventListener("click", (e) => {
  const a = e.target.closest(".card-link");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const c = a.closest(".card");
  openProduct(c.dataset.id, { cor: cardColor(byId[c.dataset.id]) }, $(".card-art", c), "card");
});

/* ---------- filtros ---------- */
const catsEl = $("#cats"), ink = $("#cats-ink"), colorsEl = $("#colors"), countEl = $("#count"), empty = $("#empty");
const catCount = (id) => P.filter((p) => id === "todos" || p.categoria === id).length;
catsEl.insertAdjacentHTML("beforeend", data.categorias.map((c) =>
  `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === S.cat}">${c.nome}<sup aria-hidden="true">${pad(catCount(c.id))}</sup></button>`).join(""));
const FILTER_COLORS = Object.keys(data.cores);
colorsEl.insertAdjacentHTML("beforeend", FILTER_COLORS.map((c) =>
  `<button type="button" data-color="${c}" aria-pressed="false" aria-label="Cor: ${colorName(c)}" title="${colorName(c)}"><i style="background:${data.cores[c].hex}"></i></button>`).join(""));
function placeInk(instant = false) {
  const b = $(`button[aria-pressed="true"]`, catsEl);
  if (!b) return;
  if (instant) ink.style.transition = "none";
  ink.style.width = `${b.offsetWidth}px`;
  ink.style.height = `${b.offsetHeight}px`;
  ink.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
  if (instant) { void ink.offsetWidth; ink.style.transition = ""; }
}
placeInk(true);
addEventListener("resize", () => placeInk(true));
document.fonts?.ready.then(() => placeInk(true));

const want = (p) => (S.cat === "todos" || p.categoria === S.cat) && (!S.color || (p.cores || []).includes(S.color));
const visibleIds = () => cards.filter((c) => !c.hidden).map((c) => c.dataset.id);
function setCount() {
  const n = cards.filter((c) => !c.hidden).length;
  countEl.textContent = `${pad(n)} ${n === 1 ? "peça" : "peças"}`;
  empty.hidden = n > 0;
}
function syncCardArt(c) {
  const p = byId[c.dataset.id], cor = cardColor(p);
  if (!p.cores || c.dataset.cor === cor) return;
  c.dataset.cor = cor;
  const holder = $(".card-art", c);
  if (isPoster(p)) holder.innerHTML = art(p, { cor });
  else recolor($("svg", holder), cor);
}
cards.forEach((c) => { c.dataset.cor = cardColor(byId[c.dataset.id]) || ""; });
let chain = Promise.resolve();
const applyFilter = () => (chain = chain.then(runFilter).catch(() => {}));
async function runFilter() {
  const show = cards.filter((c) => want(byId[c.dataset.id]));
  const leaving = cards.filter((c) => !c.hidden && !show.includes(c));
  const entering = show.filter((c) => c.hidden);
  const staying = show.filter((c) => !c.hidden);
  if (!REDUCED && leaving.length) {
    await Promise.all(leaving.map((c) => c.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.94)" }],
      { duration: 240, easing: "cubic-bezier(0.4, 0, 1, 1)" }).finished));
  }
  const first = new Map(staying.map((c) => [c, c.getBoundingClientRect()]));
  leaving.forEach((c) => { c.hidden = true; });
  entering.forEach((c) => { c.hidden = false; c.classList.remove("is-pre"); });
  show.forEach(syncCardArt);
  setCount();
  if (REDUCED) return;
  staying.forEach((c) => {
    const a = first.get(c), b = c.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) + Math.abs(dy) > 1) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 750, easing: EASE });
  });
  entering.forEach((c, i) => c.animate([{ opacity: 0, transform: "translateY(1.5rem) scale(0.97)" }, { opacity: 1, transform: "none" }],
    { duration: 750, delay: 140 + i * 70, easing: EASE, fill: "backwards" }));
}
catsEl.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-cat]");
  if (!b || b.dataset.cat === S.cat) return;
  S.cat = b.dataset.cat;
  $$("button[data-cat]", catsEl).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  placeInk();
  applyFilter();
});
colorsEl.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-color]");
  if (!b) return;
  S.color = S.color === b.dataset.color ? null : b.dataset.color;
  $$("button[data-color]", colorsEl).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.color === S.color)));
  applyFilter();
});
$("#empty-reset").addEventListener("click", () => {
  S.cat = "todos"; S.color = null;
  $$("button[data-cat]", catsEl).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cat === "todos")));
  $$("button[data-color]", colorsEl).forEach((x) => x.setAttribute("aria-pressed", "false"));
  placeInk(); applyFilter();
  $("button[data-cat]", catsEl).focus();
});
setCount();

/* ================= LISTA (carrinho de demonstração, só neste navegador) ================= */
const KEY = "njr-loja-lista";
const MAXQ = 10;
function loadCart() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((i) => i && byId[i.id] && Number.isInteger(i.qty) && i.qty > 0)
      .map((i) => ({ ...i, qty: Math.min(MAXQ, i.qty) })) : [];
  } catch { return []; }
}
let cart = loadCart();
function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* armazenamento indisponível: a lista vale só nesta visita */ } }
const totalQty = () => cart.reduce((n, i) => n + i.qty, 0);
const variantText = (i) => {
  const p = byId[i.id];
  return [i.cor && colorName(i.cor), i.capa && `Capa ${capaName(i.capa)}`, i.tam && (i.tam === "Único" ? "Tamanho único" : `${tamLabel(p)} ${i.tam}`)].filter(Boolean).join(" · ");
};
const bag = $("#bag"), bagN = $("#bag-n"), bagSr = $("#bag-sr");
function updateBag(bump = false) {
  const n = totalQty();
  const old = $("span", bagN);
  bag.setAttribute("aria-label", `Abrir lista de demonstração, ${n} ${n === 1 ? "item" : "itens"}`);
  bagSr.textContent = n === 1 ? "item" : "itens";
  if (old && old.textContent === String(n)) return;
  const neu = document.createElement("span");
  neu.textContent = String(n);
  if (bump && !REDUCED && old) {
    bagN.style.position = "relative";
    old.style.position = "absolute";
    old.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-120%)", opacity: 0 }], { duration: 380, easing: EASE_PLATE, fill: "forwards" }).finished.then(() => old.remove());
    bagN.append(neu);
    neu.animate([{ transform: "translateY(120%)" }, { transform: "none" }], { duration: 520, easing: EASE });
    bag.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 520, easing: EASE_PLATE });
  } else { bagN.replaceChildren(neu); }
}
updateBag();

/* ================= PRODUTO EM FOCO ================= */
const detail = $("#detail"), sheet = $("#detail-sheet"), scrim = $(".detail-scrim", detail);
const dArt = $("#d-art"), dStage = $("#d-stage"), dLight = $(".d-light", dStage), dThumbs = $("#d-thumbs"), dOpts = $("#d-opts");
const dHint = $("#d-hint"), dAdd = $("#d-add"), dAddLabel = $("#d-add-label"), dView = $("#d-view");
const D = { open: false, p: null, sel: {}, view: 0, src: null, kind: null, pushed: false, list: [], last: null, origin: [0, 0], busy: null };

function artFor(p, view = D.view, extra = {}) {
  return art(p, { cor: D.sel.cor, capa: D.sel.capa, view, label: `${p.nome}, ${p.vistas[view].toLowerCase()}`, ...extra });
}
function radio(key, value, label, inner, checked) {
  return `<label><input type="radio" name="opt-${key}" value="${value}"${checked ? " checked" : ""}>${inner}<span class="sr-only">${esc(label)}</span></label>`;
}
function renderOpts(p) {
  let h = "";
  if (p.cores) h += `<fieldset class="opt" data-key="cor"><legend>Cor <b>${colorName(D.sel.cor)}</b></legend><div class="opt-row">${
    p.cores.map((c) => radio("cor", c, colorName(c), `<span class="sw" aria-hidden="true"><i style="background:${data.cores[c].hex}"></i></span>`, D.sel.cor === c)).join("")}</div></fieldset>`;
  if (p.capas) h += `<fieldset class="opt" data-key="capa"><legend>Capa <b>${capaName(D.sel.capa)}</b></legend><div class="opt-row">${
    p.capas.map((c) => radio("capa", c, "", `<span class="sz">${capaName(c)}</span>`, D.sel.capa === c)).join("")}</div></fieldset>`;
  const one = p.tamanhos.length === 1;
  h += `<fieldset class="opt" data-key="tam"><legend>${tamLabel(p)} <b>${one ? "Único" : D.sel.tam || "— escolha"}</b></legend><div class="opt-row">${
    p.tamanhos.map((t) => radio("tam", t, "", `<span class="sz">${t}</span>`, D.sel.tam === t)).join("")}</div></fieldset>`;
  dOpts.innerHTML = h;
}
function renderThumbs(p) {
  dThumbs.innerHTML = p.vistas.map((v, i) => `<button type="button" aria-pressed="${i === D.view}" aria-label="Imagem ${i + 1}: ${v}">${artFor(p, i, { label: "" })}</button>`).join("");
}
function setAddLabel(state = "idle") {
  const t = D.sel.tam && D.p.tamanhos.length > 1 ? ` · ${D.sel.tam}` : "";
  dAddLabel.textContent = state === "done" ? "Adicionado à lista" : `Adicionar à lista${t}`;
}
let nameCtlD = null;
function renderDetail(p) {
  $("#d-eyebrow").textContent = `${CAT[p.categoria]} · ${pad(P.indexOf(p) + 1)} · Conceito`;
  nameCtlD = splitText($("#d-name"), p.nome, { by: "words", stagger: 70, config: CFG.NAME });
  $("#d-desc").textContent = p.descricao;
  $("#d-details").innerHTML = p.detalhes.map((d) => `<li>${esc(d)}</li>`).join("");
  renderOpts(p);
  renderThumbs(p);
  dArt.innerHTML = artFor(p);
  dView.textContent = p.vistas[D.view];
  dHint.textContent = ""; dHint.classList.remove("is-warn");
  dAdd.classList.remove("is-done");
  setAddLabel();
  const i = D.list.indexOf(p.id);
  $("#d-pos").textContent = `${pad(i + 1)} / ${pad(D.list.length)}`;
}
const infoParts = () => [$(".d-top", sheet), dThumbs, $("#d-eyebrow"), $("#d-desc"), $("#d-price"), ...$$(".opt", dOpts), dHint, $("#d-actions"), $("#d-details")];
function playInfo(base = 0) {
  nameCtlD?.play(base + 120);
  if (REDUCED) return;
  infoParts().forEach((el, k) => anim(el, [{ opacity: 0, transform: "translateY(1rem)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: base + k * 55 }));
}

function setOrigin(src) {
  const main = $("#main"), mr = main.getBoundingClientRect();
  let cx = innerWidth / 2, cy = innerHeight / 2;
  if (src) { const r = src.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
  D.origin = [cx, cy];
  main.style.transformOrigin = `${(cx - mr.left).toFixed(1)}px ${(cy - mr.top).toFixed(1)}px`;
}

function openProduct(id, init = {}, src = null, kind = null, { push = true } = {}) {
  const p = byId[id];
  if (!p) return;
  if (D.open) { switchTo(id, 1, init); return; }
  detail.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  D.pendingTarget?.style && (D.pendingTarget.style.visibility = "");
  D.open = true; D.p = p; D.kind = kind; D.view = 0;
  D.list = visibleIds().includes(id) ? visibleIds() : P.map((x) => x.id);
  D.sel = { cor: init.cor || p.cores?.[0], capa: init.capa || p.capas?.[0], tam: p.tamanhos.length === 1 ? p.tamanhos[0] : null };
  D.last = document.activeElement;
  renderDetail(p);
  if (push) { history.pushState({ produto: id }, "", `#${id}`); D.pushed = true; }
  setPause("detail", true);
  setOrigin(src);
  detail.hidden = false;
  sheet.scrollTop = 0; $("#d-info").scrollTop = 0;
  lenis?.stop();
  html.classList.add("is-focus");
  const to = dArt.getBoundingClientRect();
  if (src && !REDUCED) {
    const from = src.getBoundingClientRect();
    const s = from.width / to.width;
    D.src = src; src.style.visibility = "hidden";
    dArt.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})` }, { transform: "none" }], { duration: 1000, easing: EASE });
  } else {
    D.src = null;
    anim(dArt, [{ opacity: 0, transform: "scale(0.9)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 900, delay: 120 });
  }
  anim(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
  anim(dLight, [{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 220 });
  $$(".bk", dStage).forEach((b, k) => anim(b, [{ opacity: 0, transform: `translate(${k % 2 ? -1 : 1}rem, ${k < 2 ? 1 : -1}rem)` }, { opacity: 1, transform: "none" }], { duration: 800, delay: 520 }));
  anim(dView, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 700 });
  playInfo(260);
  $(".d-back", sheet).focus({ preventScroll: true });
}

function closeProduct({ fromPop = false } = {}) {
  if (!D.open) return;
  D.open = false;
  D.busy?.cancel?.();
  const p = D.p;
  let target = null;
  if (D.kind === "hero" && FEAT[heroI].id === p.id) target = slides[heroI];
  else { const c = cardOf(p.id); if (c && !c.hidden && D.kind !== "focus") target = $(".card-art", c); }
  if (D.src && D.src !== target) D.src.style.visibility = "";
  let flip = null;
  if (target && !REDUCED) {
    const r = target.getBoundingClientRect();
    const sc = r.width / (target.offsetWidth || r.width) || 1;
    const [ox, oy] = D.origin;
    const cx = ox + (r.left + r.width / 2 - ox) / sc, cy = oy + (r.top + r.height / 2 - oy) / sc;
    const w = target.offsetWidth, h = target.offsetHeight;
    if (cy > -h / 2 && cy < innerHeight + h / 2) flip = { left: cx - w / 2, top: cy - h / 2, w };
  }
  html.classList.remove("is-focus");
  D.pendingTarget = target;
  const done = () => {
    if (D.open) return;
    detail.hidden = true;
    detail.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    if (target) target.style.visibility = "";
    if (D.src) D.src.style.visibility = "";
    D.src = null;
    if ($("#drawer").hidden) lenis?.start();
    setPause("detail", false);
  };
  if (REDUCED) done();
  else {
    infoParts().concat($("#d-name"), dLight, dView).forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" }));
    scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: 150, easing: "ease-in-out", fill: "forwards" });
    let a;
    if (flip) {
      if (target) target.style.visibility = "hidden";
      const to = dArt.getBoundingClientRect();
      a = dArt.animate([{ transform: "none" }, { transform: `translate(${flip.left - to.left}px, ${flip.top - to.top}px) scale(${flip.w / to.width})` }],
        { duration: 850, easing: "cubic-bezier(0.6, 0, 0.1, 1)", fill: "forwards" });
    } else {
      a = dArt.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.92)", filter: "blur(8px)" }], { duration: 500, easing: "ease-in", fill: "forwards" });
    }
    a.finished.then(done, done);
  }
  if (!fromPop) {
    if (D.pushed) { D.pushed = false; history.back(); }
    else history.replaceState(null, "", location.pathname + location.search);
  }
  const back = target?.closest(".card")?.querySelector(".card-link") || (D.kind === "hero" ? $("#hero-hit") : D.last);
  back?.focus?.({ preventScroll: true });
}

function switchTo(id, dir = 1, init = {}) {
  const p = byId[id];
  if (!p || p === D.p) return;
  if (D.src) { D.src.style.visibility = ""; D.src = null; }
  D.kind = "card";
  D.p = p; D.view = 0;
  if (!D.list.includes(id)) D.list = P.map((x) => x.id);
  D.sel = { cor: init.cor || cardColor(p), capa: init.capa || p.capas?.[0], tam: p.tamanhos.length === 1 ? p.tamanhos[0] : null };
  const old = dArt.firstElementChild;
  renderDetail(p);
  history.replaceState({ produto: id }, "", `#${id}`);
  if (REDUCED) return;
  if (old) {
    old.style.position = "absolute"; old.style.inset = "0";
    dArt.prepend(old);
    old.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-14 * dir}%) scale(0.94)`, filter: "blur(6px)" }],
      { duration: 480, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" }).finished.then(() => old.remove(), () => old.remove());
  }
  anim(dArt.lastElementChild, [{ opacity: 0, transform: `translateX(${16 * dir}%) scale(1.04)`, filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 950, delay: 220 });
  playInfo(120);
}
const step = (dir) => {
  const i = D.list.indexOf(D.p.id);
  switchTo(D.list[(i + dir + D.list.length) % D.list.length], dir);
};
$("#d-prev").addEventListener("click", () => step(-1));
$("#d-next").addEventListener("click", () => step(1));
$$("[data-close]", detail).forEach((b) => b.addEventListener("click", () => closeProduct()));

/* vistas: miniaturas, deslize no toque */
function setView(i, dir = 1) {
  const p = D.p;
  i = (i + p.vistas.length) % p.vistas.length;
  if (i === D.view) return;
  D.view = i;
  $$("button", dThumbs).forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  dView.textContent = p.vistas[i];
  swapArt(dir);
}
function swapArt(dir = 1) {
  const old = $$("svg", dArt);
  dArt.insertAdjacentHTML("beforeend", artFor(D.p));
  const neu = dArt.lastElementChild;
  if (REDUCED) { old.forEach((o) => o.remove()); return; }
  neu.style.position = "absolute"; neu.style.inset = "0";
  neu.animate([{ clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", transform: "scale(1.05)" }, { clipPath: "inset(0 0 0 0)", transform: "none" }],
    { duration: 750, easing: EASE_PLATE }).finished.then(() => { old.forEach((o) => o.remove()); neu.style.position = ""; neu.style.inset = ""; }, () => {});
  old.forEach((o) => o.animate([{ opacity: 1, transform: "none" }, { opacity: 0.2, transform: `translateX(${-6 * dir}%)` }], { duration: 750, easing: EASE_PLATE, fill: "forwards" }));
}
dThumbs.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const i = $$("button", dThumbs).indexOf(b);
  setView(i, i > D.view ? 1 : -1);
});
let swipeX = null;
dStage.addEventListener("pointerdown", (e) => { swipeX = e.clientX; });
dStage.addEventListener("pointerup", (e) => {
  if (swipeX == null) return;
  const dx = e.clientX - swipeX; swipeX = null;
  if (Math.abs(dx) > 40) setView(D.view + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});

/* variantes */
dOpts.addEventListener("change", (e) => {
  const input = e.target;
  const fs = input.closest(".opt"), key = fs.dataset.key, v = input.value, p = D.p;
  D.sel[key] = v;
  $("legend b", fs).textContent = key === "cor" ? colorName(v) : key === "capa" ? capaName(v) : v;
  anim(input.nextElementSibling, [{ transform: "scale(0.88)" }, { transform: "none" }], { duration: 450, easing: EASE_PLATE });
  if (key === "cor") {
    if (isPoster(p)) { swapArt(1); renderThumbs(p); }
    else { $$("svg", dArt).forEach((s) => recolor(s, v)); $$("svg", dThumbs).forEach((s) => recolor(s, v)); }
  }
  if (key === "capa") { swapArt(1); renderThumbs(p); }
  if (key === "tam") {
    dHint.classList.remove("is-warn");
    dHint.textContent = `${tamLabel(p)} ${v} selecionado.`;
  }
  dAdd.classList.remove("is-done");
  setAddLabel();
});

/* adicionar à lista */
let doneT = 0;
dAdd.addEventListener("click", () => {
  const p = D.p;
  if (!D.sel.tam) {
    const fs = $('.opt[data-key="tam"]', dOpts);
    dHint.classList.add("is-warn");
    dHint.textContent = `Escolha um ${tamLabel(p).toLowerCase()} antes de adicionar.`;
    anim(fs, [{ transform: "translateX(0)" }, { transform: "translateX(-0.5rem)" }, { transform: "translateX(0.4rem)" }, { transform: "translateX(-0.25rem)" }, { transform: "none" }], { duration: 420, easing: "ease-out" });
    $("input", fs).focus();
    return;
  }
  const item = { id: p.id, cor: p.cores ? D.sel.cor : null, capa: p.capas ? D.sel.capa : null, tam: D.sel.tam };
  const key = [item.id, item.cor, item.capa, item.tam].join("|");
  const found = cart.find((i) => [i.id, i.cor, i.capa, i.tam].join("|") === key);
  let capped = false;
  if (found) { if (found.qty < MAXQ) found.qty++; else capped = true; } else cart.push({ ...item, qty: 1 });
  saveCart();
  dAdd.classList.add("is-done");
  setAddLabel("done");
  clearTimeout(doneT);
  doneT = setTimeout(() => { dAdd.classList.remove("is-done"); setAddLabel(); }, 2200);
  fly(() => updateBag(true));
  toast(capped ? `Limite de ${MAXQ} unidades por variação na lista.` : `Adicionado à lista: <b>${esc(p.nome)}</b> · ${esc(variantText(item))}`);
  if (!$("#drawer").hidden) renderDrawer();
});
function fly(after) {
  if (REDUCED) { after(); return; }
  const from = dArt.getBoundingClientRect(), to = bag.getBoundingClientRect();
  const g = document.createElement("div");
  g.className = "ghost";
  g.innerHTML = artFor(D.p, 0, { label: "" });
  g.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px`;
  document.body.append(g);
  const s = 56 / from.width;
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
  g.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.25 - 140}px) scale(${Math.max(s, 0.3)}) rotate(-6deg)`, opacity: 1, offset: 0.45 },
    { transform: `translate(${dx}px, ${dy}px) scale(${s * 0.6}) rotate(4deg)`, opacity: 0.4 },
  ], { duration: 900, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" }).finished.then(() => { g.remove(); after(); });
}
const toastEl = $("#toast");
let toastT = 0;
function toast(msg) {
  toastEl.innerHTML = `<span>${msg}</span><button type="button">Ver lista</button>`;
  $("button", toastEl).addEventListener("click", () => openDrawer());
  toastEl.classList.add("is-on");
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove("is-on"), 4200);
}

/* ---------- gaveta da lista ---------- */
const drawer = $("#drawer"), dsheet = $("#drawer-sheet"), dItems = $("#dr-items"), dEmpty = $("#dr-empty"), dFoot = $("#dr-foot");
const drGo = $("#dr-go"), drWhy = $("#dr-why");
let drLast = null;
function renderDrawer() {
  dItems.innerHTML = cart.map((i) => {
    const p = byId[i.id], k = [i.id, i.cor, i.capa, i.tam].join("|");
    return `<li class="dr-item" data-k="${esc(k)}">
      <div class="dr-thumb">${art(p, { cor: i.cor, capa: i.capa })}</div>
      <div class="dr-body">
        <p class="dr-name">${esc(p.nome)}</p>
        <p class="dr-var">${esc(variantText(i))}</p>
        <p class="dr-price">${data.preco} · ${data.disponibilidade}</p>
        <div class="dr-row">
          <div class="qty" role="group" aria-label="Quantidade de ${esc(p.nome)}">
            <button type="button" data-act="dec" aria-label="Diminuir quantidade"${i.qty <= 1 ? " disabled" : ""}>−</button>
            <output aria-live="polite">${i.qty}</output>
            <button type="button" data-act="inc" aria-label="Aumentar quantidade"${i.qty >= MAXQ ? " disabled" : ""}>+</button>
          </div>
          <button type="button" class="dr-remove" data-act="rm" aria-label="Remover ${esc(p.nome)} (${esc(variantText(i))}) da lista">Remover</button>
        </div>
      </div>
    </li>`;
  }).join("");
  const n = totalQty();
  $("#dr-count").textContent = String(n);
  dEmpty.hidden = cart.length > 0;
  dItems.hidden = cart.length === 0;
  drGo.disabled = false;
}
function openDrawer() {
  if (!drawer.hidden) return;
  drLast = document.activeElement;
  renderDrawer();
  drWhy.hidden = true; drGo.setAttribute("aria-expanded", "false");
  drawer.hidden = false;
  bag.classList.add("is-hidden");
  toastEl.classList.remove("is-on");
  lenis?.stop();
  anim($(".drawer-scrim", drawer), [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
  anim(dsheet, [{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 750, easing: EASE_PLATE });
  $$(".dr-item, .dr-empty, .dr-foot", dsheet).forEach((el, k) => anim(el, [{ opacity: 0, transform: "translateX(2rem)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 200 + k * 60 }));
  $(".dr-close", dsheet).focus();
}
function closeDrawer() {
  if (drawer.hidden) return;
  const end = () => {
    drawer.hidden = true;
    drawer.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    bag.classList.remove("is-hidden");
    if (!D.open) lenis?.start();
  };
  if (REDUCED) end();
  else {
    $(".drawer-scrim", drawer).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
    dsheet.animate([{ transform: "none" }, { transform: "translateX(100%)" }], { duration: 480, easing: "cubic-bezier(0.6, 0, 0.8, 0.2)", fill: "forwards" }).finished.then(end, end);
  }
  (drLast && document.contains(drLast) ? drLast : bag).focus({ preventScroll: true });
}
bag.addEventListener("click", openDrawer);
$$("[data-dclose]", drawer).forEach((b) => b.addEventListener("click", () => {
  closeDrawer();
  if (b.dataset.goto) {
    if (D.open) closeProduct();
    const t = $(`#${b.dataset.goto}`);
    setTimeout(() => (lenis ? lenis.scrollTo(t, { offset: -40 }) : t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" })), REDUCED ? 0 : 500);
  }
}));
dItems.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const li = b.closest(".dr-item"), k = li.dataset.k;
  const idx = cart.findIndex((i) => [i.id, i.cor, i.capa, i.tam].join("|") === k);
  if (idx < 0) return;
  const act = b.dataset.act;
  if (act === "inc" || act === "dec") {
    cart[idx].qty = Math.max(1, Math.min(MAXQ, cart[idx].qty + (act === "inc" ? 1 : -1)));
    saveCart(); updateBag(true);
    const out = $("output", li);
    out.textContent = String(cart[idx].qty);
    anim(out, [{ transform: `translateY(${act === "inc" ? 40 : -40}%)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 400 });
    $('[data-act="dec"]', li).disabled = cart[idx].qty <= 1;
    $('[data-act="inc"]', li).disabled = cart[idx].qty >= MAXQ;
    $("#dr-count").textContent = String(totalQty());
    return;
  }
  // remover: a linha sai pela direita e as de baixo sobem (FLIP)
  const removed = cart.splice(idx, 1)[0];
  saveCart(); updateBag(true);
  const finish = () => {
    const rest = $$(".dr-item", dItems).filter((x) => x !== li);
    const first = new Map(rest.map((x) => [x.dataset.k, x.getBoundingClientRect().top]));
    renderDrawer();
    if (!REDUCED) $$(".dr-item", dItems).forEach((x) => {
      const dy = (first.get(x.dataset.k) ?? 0) - x.getBoundingClientRect().top;
      if (dy) x.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 500, easing: EASE });
    });
    const next = $$(".dr-item", dItems)[Math.min(idx, cart.length - 1)];
    (next ? $(".dr-remove", next) : $(".dr-empty button", drawer) || $(".dr-close", dsheet)).focus();
    toast(`Removido da lista: <b>${esc(byId[removed.id].nome)}</b>`);
  };
  if (REDUCED) finish();
  else li.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(3rem)" }], { duration: 300, easing: "ease-in", fill: "forwards" }).finished.then(finish);
});
drGo.addEventListener("click", () => {
  const open = drWhy.hidden;
  drWhy.hidden = !open;
  drGo.setAttribute("aria-expanded", String(open));
  if (open) {
    anim(drWhy, [{ opacity: 0, transform: "translateY(0.75rem)" }, { opacity: 1, transform: "none" }], { duration: 600 });
  }
});
$("#dr-clear").addEventListener("click", () => {
  cart = []; saveCart(); updateBag(true); renderDrawer();
  drWhy.hidden = true; drGo.setAttribute("aria-expanded", "false");
  toast("Lista apagada deste navegador.");
  $(".dr-empty button", drawer).focus();
});

/* ---------- teclado: Esc, setas e foco preso nos diálogos ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trap(container, e) {
  const list = $$(FOCUSABLE, container).filter((el) => el.getClientRects().length && !(el.type === "radio" && !el.checked && $$(`input[name="${el.name}"]:checked`, container).length));
  if (!list.length) return;
  const first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!container.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
}
addEventListener("keydown", (e) => {
  if (!drawer.hidden) {
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(); } else if (e.key === "Tab") trap(dsheet, e);
    return;
  }
  if (!D.open) return;
  if (e.key === "Escape") { e.preventDefault(); closeProduct(); return; }
  if (e.key === "Tab") { trap(sheet, e); return; }
  const inRadio = e.target.type === "radio";
  if (!inRadio && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1); }
});
addEventListener("popstate", () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (byId[id]) { if (D.open) switchTo(id); else openProduct(id, {}, null, "link", { push: false }); }
  else if (D.open) { D.pushed = false; closeProduct({ fromPop: true }); }
});

/* ---------- cabeçalho claro/escuro conforme a seção sob ele ---------- */
const { header } = await ready;
new IntersectionObserver((es) => es.forEach((e) => header.setDark(e.isIntersecting)), { rootMargin: "0px 0px -93% 0px" }).observe($("#sobre"));

/* ================= ENTRADA ================= */
heroHead.play(0);
heroM.forEach((m, i) => m.play(160 + i * 110));
if (!REDUCED) {
  heroStage.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1200, delay: 120, easing: EASE_PLATE, fill: "forwards" })
    .finished.then((a) => { heroStage.style.clipPath = ""; a?.cancel?.(); });
  heroArt.animate([{ opacity: 0, transform: "translateX(-50%) translateY(8%) scale(0.94)" }, { opacity: 1, transform: "translateX(-50%)" }], { duration: 1400, delay: 520, easing: EASE, fill: "backwards" });
  $$(".bk", heroStage).forEach((b, k) => b.animate([{ opacity: 0, transform: `translate(${k % 2 ? -1.5 : 1.5}rem, ${k < 2 ? 1.5 : -1.5}rem)` }, { opacity: 1, transform: "none" }], { duration: 900, delay: 900, easing: EASE, fill: "backwards" }));
}
nameCtl.play(800);
capM.forEach((m, i) => m.play(700 + i * 140));
setTimeout(() => runMeter(), REDUCED ? 0 : 1400);

revealAll();
// "Vitrine, não loja": filetes crescem, números e textos entram em sequência
const aboutItems = $$("#about-list li");
const aboutM = aboutItems.map((li) => ({
  rule: motion($(".about-rule", li), { scaleX: true, opacity: false, config: CFG.ROW }),
  n: splitText($(".about-n", li), $(".about-n", li).textContent, { by: "letters", stagger: 40, config: CFG.FIGURE }),
  txt: [$("b", li), $("p", li)].map((el) => motion(el, { y: "0.75rem", config: CFG.COPY2 })),
}));
forward($("#about-list"), () => aboutM.forEach((m, i) => { const d = i * 160; m.rule.play(d); m.n.play(d + 120); m.txt.forEach((t, k) => t.play(d + 220 + k * 90)); }),
  () => aboutM.forEach((m) => { m.rule.reverse(); m.n.reverse(); m.txt.forEach((t) => t.reverse()); }), "0% 0% -15% 0%");

/* link direto para um produto (#id) */
const startId = decodeURIComponent(location.hash.slice(1));
if (byId[startId]) setTimeout(() => openProduct(startId, {}, null, "link", { push: false }), REDUCED ? 0 : 900);
if (!gridShown && grid.getBoundingClientRect().top < innerHeight) playGrid();
