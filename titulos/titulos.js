/* Títulos — a sala das conquistas.
   Abertura com o número da sala (rolagem controla a escala), gráfico ano a ano, parede por anos com filtros
   (FLIP) e o foco: a peça escolhida voa da parede para uma sala escura, com ano, nome e informações em sequência. */
import {
  REDUCED, FINE, CFG, $, $$, clamp01, lerp, wait, Spring, motion, splitText, buildHeading,
  inView, forward, scrub, countUp, revealAll, depth, initPage, lenis,
} from "/shared/njr.js";

const data = await fetch("/titulos/titulos.json").then((r) => r.json());
const ITEMS = data.itens;
const BY_ID = new Map(ITEMS.map((it) => [it.id, it]));
const ENT = data.entidades;
const IMG = data.imagens;
const pad = (n) => String(n).padStart(2, "0");
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const EASE_PLATE = "cubic-bezier(0.33, 0, 0, 1)";
const EASE_FLIP = "cubic-bezier(0.7, 0, 0.2, 1)";
const EASE_IN = "cubic-bezier(0.55, 0, 0.85, 0.25)";
const ms = (v) => (REDUCED ? Math.min(v, 1) : v);
const anim = (el, frames, o) => el.animate(frames, { fill: "both", easing: EASE, ...o, duration: ms(o.duration ?? 400), delay: REDUCED ? 0 : (o.delay ?? 0) });
const done = (a) => a.finished.catch(() => {});
const weight = (it) => (it.tipo === "premio" ? it.vezes || 1 : 1);
const isNarrow = () => matchMedia("(max-width: 1023px)").matches;
const scrollY = () => window.scrollY;
function scrollToY(y, { immediate = false, duration = 0.9 } = {}) {
  if (lenis && !REDUCED) return Promise.race([
    new Promise((res) => lenis.scrollTo(y, { immediate, duration, onComplete: res, force: true })),
    wait(immediate ? 60 : duration * 1000 + 150),
  ]);
  window.scrollTo({ top: y, behavior: "instant" });
  return Promise.resolve();
}

/* ---------- preparação (antes da placa sair) ---------- */
const heroImg = new Image();
heroImg.src = "/titulos/assets/confed-2013-taca.webp";

const heroHead = buildHeading($("#hero-h"));
const heroIntro = splitText($("#hero-intro"), $("#hero-intro").textContent.trim(), { stagger: 22, config: CFG.COPY2, gap: 0.24 });
const heroEyebrow = motion($("#hero-eyebrow"), { y: "0.6rem" });
const heroRule = motion($("#hero-rule"), { scaleX: !isNarrow(), opacity: isNarrow() });
const heroStats = $$(".hero-stat").map((el) => motion(el, { y: "0.75rem", config: CFG.ITEM }));
const heroCredit = motion($("#hero-credit"), { y: "0.5rem", config: CFG.COPY });
const heroCue = $("#hero-cue");
heroCue.style.opacity = "0";
const heroNum = $("#hero-num");
heroNum.style.opacity = "0";

document.querySelector(".wall").classList.add("js-wall");
const pieces = $$(".pc");
if (!REDUCED) pieces.forEach((p) => p.classList.add("pending"));

const { header } = await initPage("/titulos/", {
  heroImage: heroImg,
  credits: "<p>Fotos: Wikimedia Commons, com autor e licença em cada peça e na nota de curadoria.</p>",
});
void header;

/* ======================= 1 · abertura ======================= */
function heroEntrance() {
  heroEyebrow.play(0);
  heroNum.style.opacity = "";
  if (!REDUCED) {
    anim(heroNum, [{ clipPath: "inset(100% 0 0 0)", transform: "translateY(12%) scale(1.04)" }, { clipPath: "inset(0% 0 0 0)", transform: "none" }],
      { duration: 1500, easing: EASE_PLATE, delay: 80 });
  }
  countUp(heroNum, Number($("#stat-titulos").textContent), { duration: 1700, delay: 120 });
  heroHead.play(260);
  heroIntro.play(560);
  heroStats.forEach((m, i) => m.play(420 + i * 160));
  heroRule.play(520);
  countUp($("#stat-titulos"), Number($("#stat-titulos").textContent), { duration: 1500, delay: 420 });
  countUp($("#stat-premios"), Number($("#stat-premios").textContent), { duration: 1500, delay: 580 });
  heroCredit.play(1100);
  if (!REDUCED) anim(heroCue, [{ opacity: 0, translate: "0 0.75rem" }, { opacity: 1, translate: "0 0" }], { duration: 800, delay: 1300 });
  else heroCue.style.opacity = "1";
}
heroEntrance();
heroCue.addEventListener("click", (e) => {
  e.preventDefault();
  scrollToY($("#exposicao").getBoundingClientRect().top + scrollY(), { duration: 1.6 });
});

const heroWrap = $(".hero-num-wrap");
const heroCopy = $(".hero-copy");
const heroLegend = $("#hero-legend");
if (!REDUCED) {
  // a rolagem aproxima o número: a foto dentro dele desliza e o texto sai pelo alto
  scrub($("#hero"), "top top", "bottom bottom", (p) => {
    const narrow = isNarrow();
    const s = 1 + p * (narrow ? 0.35 : 0.55);
    heroWrap.style.transform = `translate3d(0, ${(-p * (narrow ? 4 : 10)).toFixed(3)}svh, 0) scale(${s.toFixed(4)})`;
    heroNum.style.setProperty("--by", `${(28 + p * 44).toFixed(2)}%`);
    heroNum.style.setProperty("--bx", `${(50 - p * 14).toFixed(2)}%`);
    const q = clamp01((p - 0.08) / 0.5);
    heroCopy.style.transform = `translate3d(0, ${(-q * 6).toFixed(3)}rem, 0)`;
    heroCopy.style.opacity = String(1 - q);
    heroLegend.style.opacity = String(1 - clamp01((p - 0.15) / 0.4));
    heroCue.style.visibility = p > 0.05 ? "hidden" : "";
  }, { smooth: CFG.TRIGGER });
  depth($("#hero-pin"), [heroWrap], { max: 14 });
}

/* ======================= 2 · ano a ano ======================= */
const years = [...new Set(ITEMS.map((i) => i.ordem))].sort((a, b) => a - b);
const yFirst = years[0], yLast = years[years.length - 1];
const chart = $("#rhythm-chart");
const cols = [];
for (let y = yFirst; y <= yLast; y++) {
  const its = ITEMS.filter((i) => i.ordem === y);
  const t = its.filter((i) => i.tipo === "titulo").length;
  const p = its.filter((i) => i.tipo === "premio").reduce((a, i) => a + weight(i), 0);
  const b = document.createElement("button");
  b.type = "button";
  b.className = "rh-col";
  b.setAttribute("aria-label", `${y}: ${t} ${t === 1 ? "título" : "títulos"} e ${p} ${p === 1 ? "prêmio" : "prêmios"}. Ir para a sala de ${y}.`);
  b.innerHTML = `<span class="rh-n" aria-hidden="true">${t + p || ""}</span><span class="rh-stack" aria-hidden="true">${
    '<i class="rh-u"></i>'.repeat(t)}${'<i class="rh-u p"></i>'.repeat(p)}</span><span class="rh-y" aria-hidden="true">${y}</span>`;
  b.addEventListener("click", () => goRoom(y));
  chart.append(b);
  cols.push({ el: b, units: $$(".rh-u", b), n: $(".rh-n", b) });
}
const legend = document.createElement("div");
legend.className = "rhythm-legend";
legend.innerHTML = `<span><i style="display:inline-block;width:.8rem;height:.8rem;background:var(--ink-950);vertical-align:-1px;margin-right:.5rem"></i>Títulos coletivos</span><span><i style="display:inline-block;width:.8rem;height:.8rem;background:var(--yellow);vertical-align:-1px;margin-right:.5rem"></i>Prêmios individuais</span>`;
chart.after(legend);

const rhHead = buildHeading($("#rhythm-h"));
const rhCopy = motion($("#rhythm-copy"), { y: "0.75rem", config: CFG.COPY });
forward($(".rhythm-head"), () => { rhHead.play(0); rhCopy.play(300); }, () => { rhHead.reverse(); rhCopy.reverse(); }, "0% 0% -15% 0%");
const nCol = cols.length;
const applyChart = (p) => {
  cols.forEach((c, k) => {
    const start = (k / nCol) * 0.55;
    let full = true;
    c.units.forEach((u, j) => {
      const v = clamp01((p - start - j * 0.035) / 0.12);
      if (v < 1) full = false;
      u.style.transform = `scaleY(${v.toFixed(4)})`;
    });
    c.n.style.opacity = full && c.units.length ? "1" : "0";
  });
};
if (REDUCED) applyChart(1);
else scrub(chart, "top bottom", "bottom center", applyChart, { smooth: CFG.TRIGGER });

async function goRoom(y) {
  // se o filtro esconde a sala, volta para "tudo"
  const room = $(`#sala-${y}`);
  if (!room) return;
  if (room.hidden) await setFilter("todos", "todos", { scroll: false });
  const top = room.getBoundingClientRect().top + scrollY() - filtersH() + 1;
  await scrollToY(top, { duration: 1.2 });
  const first = $(".pc:not([hidden]) .pc-hit", room);
  first?.focus({ preventScroll: true });
}

/* ======================= 3 · exposição ======================= */
const expoHead = buildHeading($("#expo-h"));
const expoCopy = motion($(".expo-copy"), { y: "0.75rem", config: CFG.COPY });
forward($(".expo-head"), () => { expoHead.play(0); expoCopy.play(260); }, () => { expoHead.reverse(); expoCopy.reverse(); }, "0% 0% -15% 0%");
const filters = $("#filters");
const filterRows = $$(".filter-row button", filters).map((b) => motion(b, { y: "0.6rem", config: CFG.ITEM }));
inView(filters, { once: true }, () => filterRows.forEach((m, i) => m.play(120 + i * 35)));
const filtersH = () => filters.getBoundingClientRect().height - 8;

const wall = $("#wall");
const rooms = $$(".room", wall);
const roomState = new Map();

// cada sala: o ano entra letra a letra, as peças sobem na prateleira em sequência
rooms.forEach((room) => {
  const yEl = $(".room-year", room);
  const yearSplit = splitText(yEl, yEl.textContent.trim(), { by: "letters", stagger: 40, config: CFG.YEAR });
  const count = motion($(".room-count", room), { y: "0.5rem", config: CFG.COPY });
  roomState.set(room, { yearSplit, count, seen: false });
  inView(room, { rootMargin: "0px 0px -18% 0px", once: true }, () => {
    const st = roomState.get(room);
    st.seen = true;
    yearSplit.play(0);
    count.play(200);
    revealPieces($$(".pc.pending:not([hidden])", room), 120);
  });
});

function revealPieces(list, base = 0) {
  list.forEach((pc, i) => {
    pc.classList.remove("pending");
    const d = base + i * 110;
    pc.style.setProperty("--d", `${d}ms`);
    if (REDUCED) return;
    const obj = $(".pc-obj", pc);
    const frame = $(".pc-frame", pc);
    const premio = pc.dataset.tipo === "premio";
    anim(obj, premio
      ? [{ opacity: 0, transform: "scale(0.82) rotate(-8deg)" }, { opacity: 1, transform: "none" }]
      : [{ opacity: 0, transform: "translateY(2.5rem)" }, { opacity: 1, transform: "none" }],
      { duration: 1100, delay: d, easing: EASE_PLATE }).finished.then((a) => a.cancel()).catch(() => {});
    if (!premio) anim(frame, [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1100, delay: d, easing: EASE_PLATE })
      .finished.then((a) => a.cancel()).catch(() => {});
    anim($(".pc-cap", pc), [{ opacity: 0, transform: "translateY(0.75rem)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: d + 260 })
      .finished.then((a) => a.cancel()).catch(() => {});
  });
}

// hover: a peça sobe, as outras apagam
if (FINE && !REDUCED) {
  pieces.forEach((pc) => {
    pc.addEventListener("pointerenter", () => { pc.classList.add("hot"); wall.classList.add("dimming"); });
    pc.addEventListener("pointerleave", () => { pc.classList.remove("hot"); wall.classList.remove("dimming"); });
  });
}

/* ---------- filtros ---------- */
const state = { cat: "todos", ent: "todos" };
const match = (it, cat = state.cat, ent = state.ent) => (cat === "todos" || it.categoria === cat) && (ent === "todos" || it.entidade === ent);
const sumW = (list) => ({ t: list.filter((i) => i.tipo === "titulo").length, p: list.filter((i) => i.tipo === "premio").reduce((a, i) => a + weight(i), 0) });
const catBtns = $$("#f-cat button");
const entBtns = $$("#f-ent button");
const fcT = $("#fc-t"), fcP = $("#fc-p");
const empty = $("#expo-empty");
let filtering = false;
let pendingFilter = null;

function tweenNum(el, to) {
  const from = Number(el.textContent) || 0;
  if (from === to || REDUCED) { el.textContent = String(to); return; }
  const s = new Spring(from, CFG.FIGURE, (v) => { el.textContent = String(Math.round(v)); });
  s.to(to);
}
function updateCounts() {
  catBtns.forEach((b) => {
    const { t, p } = sumW(ITEMS.filter((i) => match(i, b.dataset.cat, state.ent)));
    const n = t + p;
    b.querySelector("sup").textContent = String(n);
    b.classList.toggle("is-zero", n === 0);
  });
  entBtns.forEach((b) => {
    const sup = b.querySelector("sup");
    if (!sup) return;
    const { t, p } = sumW(ITEMS.filter((i) => match(i, state.cat, b.dataset.ent)));
    sup.textContent = String(t + p);
    b.classList.toggle("is-zero", t + p === 0);
  });
  const { t, p } = sumW(ITEMS.filter((i) => match(i)));
  tweenNum(fcT, t);
  tweenNum(fcP, p);
  catBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.cat === state.cat)));
  entBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.ent === state.ent)));
}

function roomCountText(list) {
  const { t, p } = sumW(list);
  const parts = [];
  if (t) parts.push(`${t} ${t === 1 ? "título" : "títulos"}`);
  if (p) parts.push(`${p} ${p === 1 ? "prêmio" : "prêmios"}`);
  return parts.join(" · ");
}

function emptyMessage() {
  if (state.ent === "santos-2025" && (state.cat === "clube" || state.cat === "selecao" || state.cat === "todos")) {
    const vazio = data.vazios["santos-2025"];
    if (state.cat === "selecao") return "Nenhuma peça neste filtro.<small>A Seleção não é um clube: escolha “Todos” para ver as conquistas pela Seleção.</small>";
    if (state.cat === "clube") return `Ainda sem taça na volta.<small>${esc(vazio)}</small>`;
  }
  return "Nenhuma peça neste filtro.<small>Combine outra categoria com outro clube.</small>";
}

async function setFilter(cat, ent, { scroll = true } = {}) {
  if (filtering) { pendingFilter = [cat, ent]; return; }
  if (cat === state.cat && ent === state.ent) return;
  filtering = true;
  state.cat = cat; state.ent = ent;
  updateCounts();

  // a parede volta ao começo se o visitante já estiver lá dentro
  // (o ponto em que a barra de filtros acaba de grudar no topo, para a mensagem de vazio ficar à vista)
  const stickAt = $(".expo-head").getBoundingClientRect().bottom + scrollY() + parseFloat(getComputedStyle(filters).marginTop);
  if (scroll && scrollY() > stickAt + 40) await scrollToY(stickAt, { duration: 0.6 });

  const visible = pieces.filter((p) => !p.hidden);
  const nextShow = new Set(pieces.filter((p) => match(BY_ID.get(p.dataset.id))));
  const leaving = visible.filter((p) => !nextShow.has(p));
  const staying = visible.filter((p) => nextShow.has(p));
  const entering = [...nextShow].filter((p) => p.hidden);
  const heads = rooms.filter((r) => !r.hidden).map((r) => $(".room-head", r));

  // 1 · quem sai, sai
  await Promise.all(leaving.map((p, i) => done(anim(p, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.9)" }],
    { duration: 220, delay: Math.min(i, 10) * 12, easing: EASE_IN }))));

  // 2 · FLIP de quem fica
  const first = new Map([...staying, ...heads].map((el) => [el, el.getBoundingClientRect()]));
  leaving.forEach((p) => { p.hidden = true; p.getAnimations().forEach((a) => a.cancel()); });
  entering.forEach((p) => { p.hidden = false; });
  rooms.forEach((room) => {
    const its = $$(".pc", room).filter((p) => !p.hidden);
    room.hidden = its.length === 0;
    $(".room-count", room).textContent = roomCountText(its.map((p) => BY_ID.get(p.dataset.id)));
  });
  const anyVisible = pieces.some((p) => !p.hidden);
  empty.hidden = anyVisible;
  if (!anyVisible) {
    empty.innerHTML = emptyMessage();
    if (!REDUCED) anim(empty, [{ opacity: 0, transform: "translateY(1rem)" }, { opacity: 1, transform: "none" }], { duration: 600 });
  }
  const moves = [];
  first.forEach((r0, el) => {
    if (el.closest(".room")?.hidden || el.hidden) return;
    const r1 = el.getBoundingClientRect();
    const dx = r0.left - r1.left, dy = r0.top - r1.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    moves.push(done(anim(el, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 750, easing: EASE_FLIP })));
  });
  // 3 · quem entra, entra
  const enterAnims = entering.map((p, i) => {
    const room = p.closest(".room");
    if (!roomState.get(room)?.seen) return Promise.resolve();   // a sala ainda vai fazer a própria entrada
    p.classList.remove("pending");
    return done(anim(p, [{ opacity: 0, transform: "translateY(1.25rem) scale(0.96)" }, { opacity: 1, transform: "none" }],
      { duration: 700, delay: 260 + Math.min(i, 14) * 45, easing: EASE_PLATE }));
  });
  await Promise.all([...moves, ...enterAnims]);
  [...staying, ...entering, ...heads].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  filtering = false;
  if (pendingFilter) { const [c, e] = pendingFilter; pendingFilter = null; setFilter(c, e, { scroll }); }
}
function showBtn(b) {
  const row = b.parentElement;
  if (row.scrollWidth <= row.clientWidth) return;
  row.scrollTo({ left: b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2, behavior: REDUCED ? "auto" : "smooth" });
}
catBtns.forEach((b) => b.addEventListener("click", () => { showBtn(b); setFilter(b.dataset.cat, state.ent); }));
entBtns.forEach((b) => b.addEventListener("click", () => { showBtn(b); setFilter(state.cat, b.dataset.ent); }));
// setas dentro de cada grupo de filtros (padrão de radiogroup)
[catBtns, entBtns].forEach((group) => group.forEach((b, i) => {
  b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
  b.addEventListener("keydown", (e) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const nb = group[(i + d + group.length) % group.length];
    nb.focus(); nb.click();
  });
}));
const syncTabIndex = () => [catBtns, entBtns].forEach((g) => g.forEach((b) => { b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1; }));
new MutationObserver(syncTabIndex).observe(filters, { subtree: true, attributes: true, attributeFilter: ["aria-checked"] });
updateCounts();

/* ======================= o foco ======================= */
const fx = $("#focus");
const fxFrame = $("#fx-frame");
const fxYear = $("#fx-year");
const fxName = $("#fx-name");
const fxKind = $("#fx-kind");
const fxMeta = $("#fx-meta");
const fxCap = $("#fx-cap");
const fxRail = $("#fx-rail");
const fxInfo = $("#fx-info");
fx.setAttribute("data-lenis-prevent", "");
let list = [];          // ids na ordem da parede, com o filtro atual
let cur = -1;
let open = false;
let busy = false;
let queued = null;
let lastFocus = null;
let yearCtl = null, nameCtl = null;

const currentList = () => pieces.filter((p) => !p.hidden).map((p) => p.dataset.id);
const pieceEl = (id) => pieces.find((p) => p.dataset.id === id);

function kindHTML(it) {
  if (it.tipo === "titulo") return `<i aria-hidden="true"></i>Título coletivo · ${it.categoria === "selecao" ? "Seleção Brasileira" : "Clube"}`;
  return `<i class="round" aria-hidden="true"></i>Prêmio individual · ${esc(it.classe || "")}`;
}
function frameRatio(it) {
  const img = IMG[it.img];
  if (it.tipo === "premio") return 1;
  return img ? img.w / img.h : 4 / 5;
}
function fillFrame(it) {
  const img = IMG[it.img];
  fxFrame.classList.toggle("is-medal", it.tipo === "premio");
  fxFrame.style.setProperty("--r", frameRatio(it).toFixed(4));
  fxFrame.replaceChildren();
  if (img) {
    const el = new Image();
    el.src = img.src; el.width = img.w; el.height = img.h; el.decoding = "async";
    el.alt = `${img.legenda} Foto: ${img.autor}, ${img.licenca}.`;
    el.style.objectPosition = img.pos || "50% 50%";
    fxFrame.append(el);
    fxCap.innerHTML = `${esc(img.legenda)} Foto: <a href="${esc(img.url)}" target="_blank" rel="noopener">${esc(img.autor)} · ${esc(img.licenca)}</a>`;
    return el.decode().catch(() => {});
  }
  const ty = document.createElement("div");
  ty.className = "fx-ty";
  ty.setAttribute("aria-hidden", "true");
  const yy = it.ano.split(" · ")[0];
  ty.innerHTML = `<b class="${yy.length > 4 ? "long" : ""}">${esc(yy)}</b><span>${esc(it.tipo === "premio" ? it.classe : it.competicao)}</span>`;
  fxFrame.append(ty);
  fxCap.textContent = "Composição tipográfica: não há fotografia com licença livre que represente bem esta conquista.";
  return Promise.resolve();
}
function metaHTML(it) {
  const ent = ENT[it.entidade];
  const quem = it.entidade === "carreira" ? "Carreira (não ligado a um clube)" : `${ent.nome}${ent.periodo ? ` · ${ent.periodo}` : ""}`;
  const rows = [
    ["Temporada", esc(it.temporada)],
    [it.entidade === "selecao" ? "Seleção" : it.entidade === "carreira" ? "Contexto" : "Clube", esc(quem)],
    ["Contexto", esc(it.contexto)],
  ];
  if (it.papel) rows.push(["Papel de Neymar", esc(it.papel), "is-role"]);
  rows.push(["Fontes", `<ul>${it.fontes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a></li>`).join("")}</ul>`]);
  const img = IMG[it.img];
  rows.push(["Imagem", img
    ? `${esc(img.legenda)} <a href="${esc(img.url)}" target="_blank" rel="noopener">${esc(img.autor)}, ${esc(img.licenca)}</a>, via Wikimedia Commons.`
    : "Sem fotografia: composição tipográfica do site."]);
  return rows.map(([k, v, c]) => `<div class="fx-row fx-rv ${c || ""}"><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}
function buildRail() {
  fxRail.innerHTML = list.map((id, i) => {
    const it = BY_ID.get(id);
    return `<li><button type="button" class="${it.tipo === "premio" ? "p" : ""}" data-i="${i}" aria-label="${esc(`${it.competicao}, ${it.ano}`)}"></button></li>`;
  }).join("");
  $$("button", fxRail).forEach((b) => b.addEventListener("click", () => goTo(Number(b.dataset.i))));
  $("#fx-all").textContent = pad(list.length);
}
function markRail() {
  $$("button", fxRail).forEach((b, i) => b.setAttribute("aria-current", String(i === cur)));
  $("#fx-now").textContent = pad(cur + 1);
}

// textos do foco: ano letra a letra, nome palavra a palavra, linhas em sequência
function writeText(it) {
  const yTxt = it.ano.replace(" · ", "–").length > 7 ? it.ano.split(" · ")[0] : it.ano;
  fxYear.style.setProperty("--fx-year-size", isNarrow() ? "34vw" : `${Math.min(34, 150 / Math.max(4, yTxt.length))}vw`);
  yearCtl = splitText(fxYear, yTxt, { by: "letters", stagger: 45, config: CFG.YEAR, sr: false });
  fxKind.innerHTML = kindHTML(it);
  nameCtl = splitText(fxName, it.competicao, { stagger: 70, config: CFG.NAME });
  fxMeta.innerHTML = metaHTML(it);
  fx.setAttribute("aria-label", `${it.competicao}, ${it.ano}`);
}
function textIn(base = 0) {
  fxName.getAnimations().forEach((a) => a.cancel());
  yearCtl.play(base);
  nameCtl.play(base + 120);
  const rows = [fxKind, ...$$(".fx-rv", fxMeta), fxCap];
  rows.forEach((el, k) => {
    el.getAnimations().forEach((a) => a.cancel());
    anim(el, [{ opacity: 0, transform: "translateY(0.9rem)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: base + (k === 0 ? 0 : 260 + k * 80), easing: EASE_PLATE });
  });
}
async function textOut(dir) {
  const rows = [fxKind, ...$$(".fx-rv", fxMeta), fxCap, fxName];
  yearCtl?.reverse();
  await Promise.all(rows.map((el, k) => done(anim(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translate(${-dir * 1.2}rem, 0)` }],
    { duration: 220, delay: k * 14, easing: EASE_IN }))));
}

function originRect(id) {
  const el = pieceEl(id);
  const f = el && $(".pc-frame", el);
  if (!f) return null;
  const r = f.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || !r.width) return null;
  return r;
}
function flipFrame(from, { reverse = false, duration = 1000 } = {}) {
  const to = fxFrame.getBoundingClientRect();
  const sx = from.width / to.width;
  const dx = from.left - to.left;
  const dy = from.top + from.height / 2 - (to.top + to.height * sx / 2);
  const a = [{ transform: `translate(${dx}px, ${dy}px) scale(${sx})` }, { transform: "none" }];
  return anim(fxFrame, reverse ? a.reverse() : a, { duration, easing: EASE_FLIP });
}

function lockPage(v) {
  document.documentElement.classList.toggle("fx-open", v);
  if (v) lenis?.stop(); else lenis?.start();
}

async function openFocus(id) {
  if (open || busy) return;
  list = currentList();
  cur = Math.max(0, list.indexOf(id));
  const it = BY_ID.get(list[cur]);
  busy = true; open = true;
  lastFocus = document.activeElement;
  const from = originRect(it.id);
  buildRail(); markRail();
  writeText(it);
  const ready = fillFrame(it);
  fx.hidden = false;
  lockPage(true);
  history.replaceState(null, "", `#peca=${it.id}`);
  fxInfo.scrollTop = 0; fx.scrollTop = 0;
  // o facho de luz abre a partir da peça
  const cx = from ? from.left + from.width / 2 : innerWidth / 2;
  const cy = from ? from.top + from.height / 2 : innerHeight / 2;
  const bg = $(".fx-bg", fx);
  const ui = [$(".fx-bar", fx), $("#fx-close"), $(".fx-hint", fx)];
  ui.forEach((el) => anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 650 }));
  anim(bg, [{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${cx}px ${cy}px)` }], { duration: 950, easing: EASE_FLIP });
  await Promise.race([ready, wait(700)]);
  if (from && !REDUCED) flipFrame(from, { duration: 1050 });
  else anim(fxFrame, [{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "none" }], { duration: 800, easing: EASE_PLATE });
  textIn(REDUCED ? 0 : 420);
  $("#fx-close").focus({ preventScroll: true });
  await wait(REDUCED ? 0 : 1050);
  busy = false;
  if (queued !== null) { const q = queued; queued = null; goTo(q); }
}

async function goTo(i, dir) {
  if (!open) return;
  i = (i + list.length) % list.length;
  if (busy) { queued = i; return; }
  if (i === cur) return;
  busy = true;
  dir = dir ?? (i > cur ? 1 : -1);
  const it = BY_ID.get(list[i]);
  cur = i;
  markRail();
  history.replaceState(null, "", `#peca=${it.id}`);
  // a peça atual sai para o lado; a nova entra por uma cortina na direção do movimento
  const out = done(anim(fxFrame, [{ opacity: 1, transform: "none", clipPath: "inset(0 0 0 0)" },
    { opacity: 0.2, transform: `translateX(${-dir * 6}%) scale(0.96)`, clipPath: dir > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" }],
    { duration: 420, easing: EASE_IN }));
  await Promise.all([out, textOut(dir)]);
  writeText(it);
  await Promise.race([fillFrame(it), wait(600)]);
  fxInfo.scrollTop = 0;
  if (isNarrow()) fx.scrollTo({ top: 0 });
  fxFrame.getAnimations().forEach((a) => a.cancel());
  anim(fxFrame, [{ opacity: 1, transform: `translateX(${dir * 5}%) scale(1.04)`, clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" },
    { opacity: 1, transform: "none", clipPath: "inset(0 0 0 0)" }], { duration: 900, easing: EASE_PLATE })
    .finished.then((a) => a.cancel()).catch(() => {});
  textIn(80);
  await wait(REDUCED ? 0 : 520);
  busy = false;
  if (queued !== null) { const q = queued; queued = null; goTo(q); }
}

async function closeFocus() {
  if (!open) return;
  if (busy) { await wait(400); if (busy) return; }
  busy = true;
  const id = list[cur];
  const el = pieceEl(id);
  // a parede, por trás, já se posiciona na peça vista por último
  if (el) {
    const r = el.getBoundingClientRect();
    const target = scrollY() + r.top - (innerHeight - r.height) / 2;
    lenis?.start();
    await scrollToY(Math.max(0, target), { immediate: true });
    lenis?.stop();
  }
  pieces.forEach((p) => p.classList.toggle("is-current", p.dataset.id === id));
  const to = originRect(id);
  const bg = $(".fx-bg", fx);
  [fxKind, fxName, fxMeta, fxCap, $(".fx-bar", fx), $("#fx-close"), $(".fx-hint", fx)].forEach((x) =>
    anim(x, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: EASE_IN }));
  yearCtl?.reverse();
  const cx = to ? to.left + to.width / 2 : innerWidth / 2;
  const cy = to ? to.top + to.height / 2 : innerHeight / 2;
  const fly = to && !REDUCED ? flipFrame(to, { reverse: true, duration: 850 }) : anim(fxFrame, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  const shut = anim(bg, [{ clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${cx}px ${cy}px)` }, { clipPath: `circle(0px at ${cx}px ${cy}px)` }],
    { duration: 850, delay: REDUCED ? 0 : 150, easing: EASE_FLIP });
  await Promise.all([done(fly), done(shut)]);
  fx.hidden = true;
  [fxFrame, bg, fxKind, fxName, fxMeta, fxCap, $(".fx-bar", fx), $("#fx-close"), $(".fx-hint", fx)].forEach((x) => x.getAnimations().forEach((a) => a.cancel()));
  open = false; busy = false; queued = null;
  lockPage(false);
  history.replaceState(null, "", location.pathname + location.search);
  (el ? $(".pc-hit", el) : lastFocus)?.focus({ preventScroll: true });
}

pieces.forEach((pc) => $(".pc-hit", pc).addEventListener("click", () => openFocus(pc.dataset.id)));
$("#fx-prev").addEventListener("click", () => goTo((queued ?? cur) - 1, -1));
$("#fx-next").addEventListener("click", () => goTo((queued ?? cur) + 1, 1));
$("#fx-close").addEventListener("click", closeFocus);
addEventListener("keydown", (e) => {
  if (!open) return;
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeFocus(); }
  else if (e.key === "ArrowRight" && !e.target.closest?.(".fx-rail")) { e.preventDefault(); goTo((queued ?? cur) + 1, 1); }
  else if (e.key === "ArrowLeft" && !e.target.closest?.(".fx-rail")) { e.preventDefault(); goTo((queued ?? cur) - 1, -1); }
  else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    const d = e.key === "ArrowRight" ? 1 : -1;
    const nb = $$("button", fxRail)[(cur + d + list.length) % list.length];
    goTo((queued ?? cur) + d, d);
    nb?.focus();
  } else if (e.key === "Tab") {
    const f = $$("button, a[href], [tabindex='0']", fx).filter((x) => x.offsetParent !== null || x === document.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}, true);
// toque: arrastar para os lados troca a peça
let sx0 = null, sy0 = null;
const stage = $("#fx-stage");
stage.addEventListener("pointerdown", (e) => { sx0 = e.clientX; sy0 = e.clientY; });
stage.addEventListener("pointerup", (e) => {
  if (sx0 === null) return;
  const dx = e.clientX - sx0, dy = e.clientY - sy0;
  sx0 = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo((queued ?? cur) + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});
stage.addEventListener("pointercancel", () => { sx0 = null; });

/* ======================= 4 · notas ======================= */
const notesHead = buildHeading($("#notes-h"));
forward($("#notas"), () => notesHead.play(0), () => notesHead.reverse(), "0% 0% -20% 0%");
revealAll($("#notas"));

/* link direto para uma peça: /titulos/#peca=<id> */
const deep = /#peca=([\w-]+)/.exec(location.hash)?.[1];
if (deep && BY_ID.has(deep)) {
  await wait(REDUCED ? 0 : 900);
  const el = pieceEl(deep);
  el?.closest(".room") && roomState.get(el.closest(".room")) && revealPieces($$(".pc.pending", el.closest(".room")));
  openFocus(deep);
}
