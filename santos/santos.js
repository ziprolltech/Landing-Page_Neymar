/* SANTOS — a história de Neymar com o clube.
   Abertura: as listras abrem, os refletores acendem a Vila e, na rolagem, uma fresta revela o menino de 2011.
   Depois: capítulos com seletor, a passagem do tempo (2011 → 2025) guiada pela rolagem, linha do tempo,
   camisas de costas, galeria com lightbox e registros oficiais. */
import {
  REDUCED, $, $$, clamp01, lerp, CFG, Spring, motion, splitText, buildHeading, forward, scrub,
  countUp, revealAll, depth, initPage, easeInOutCubic, easeOutCubic, tween, lenis,
} from "/shared/njr.js";

const seg = (p, a, b) => clamp01((p - a) / (b - a));
const EASE = "cubic-bezier(0.33, 0, 0, 1)";
const anim = (el, kf, o) => (REDUCED ? null : el.animate(kf, { easing: EASE, fill: "both", ...o }));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- dados (créditos e fontes) ---------- */
const dataP = fetch("santos.json").then((r) => r.json()).catch(() => null);

/* ---------- preparação antes de a placa sair ---------- */
const abH = buildHeading($("#ab-h"), { stagger: 90, config: CFG.TYPE });
const abEyebrow = motion($("#ab-eyebrow"), { y: "0.75rem", config: CFG.COPY });
const abLead = motion($("#ab-lead"), { y: "1rem", config: CFG.COPY });
const abHint = motion($("#ab-hint"), { config: CFG.LABEL });
const chapTxt = splitText($("#ab-chapter-txt"), $("#ab-chapter-txt").textContent.trim(), { stagger: 18, config: CFG.COPY2 });
const chapYear = motion($("#ab-year"), { y: "100%", config: CFG.YEAR });

const credits = `<p>Fotos: Wikimedia Commons (créditos completos em <a href="#registros">Registros</a>).</p>`;
const { header } = await initPage("/santos/", { onDark: true, credits, heroImage: $("#ab-img") });

/* =================================================================
   ABERTURA
   ================================================================= */
const ab = $("#abertura");
const abImg = $("#ab-img");
const abPhoto = $(".ab-photo");
const bigSpans = $$(".ab-big span");
const young = $("#ab-young");
const youngImg = $("img", young);
const edges = $$(".ab-young-edge", young);
const copy = $(".ab-copy");
const chapter = $("#ab-chapter");
const hintEl = $("#ab-hint");
let introLight = REDUCED ? 1 : 0.08;
let abP = 0;
let chapterOn = false;

function applyAb() {
  const p = abP;
  if (REDUCED) { abPhoto.style.setProperty("--lit", "0.55"); return; }
  const zoom = seg(p, 0, 0.7);
  abPhoto.style.setProperty("--ps", (1.06 + 0.2 * zoom).toFixed(4));
  abPhoto.style.setProperty("--lit", ((0.64 - 0.36 * seg(p, 0.05, 0.6)) * introLight).toFixed(4));
  const spread = easeOutCubic(seg(p, 0, 0.5));
  bigSpans[0].style.transform = `translateX(${(-14 * spread).toFixed(3)}vw)`;
  bigSpans[1].style.transform = `translateX(${(14 * spread).toFixed(3)}vw)`;
  $(".ab-big").style.setProperty("--bigo", (1 - seg(p, 0.3, 0.6)).toFixed(3));
  const out = seg(p, 0.06, 0.28);
  copy.style.opacity = String(1 - out);
  copy.style.transform = `translateY(${(-3 * out).toFixed(3)}rem)`;
  copy.style.visibility = out >= 1 ? "hidden" : "";
  const r = easeInOutCubic(seg(p, 0.16, 0.62));
  const side = (50 * (1 - r)).toFixed(3);
  young.style.clipPath = `inset(0 ${side}% 0 ${side}%)`;
  youngImg.style.setProperty("--ys", (1.35 - 0.35 * r).toFixed(4));
  const edgeO = r > 0.001 && r < 0.999 ? 1 : r >= 0.999 ? 0.25 : 0;
  edges.forEach((e) => e.style.setProperty("--edge", String(edgeO)));
  hintEl.style.visibility = p > 0.04 ? "hidden" : "";
  young.style.transform = `translateY(${(-2 * seg(p, 0.75, 1)).toFixed(3)}rem)`;
  const on = p > 0.56;
  if (on !== chapterOn) {
    chapterOn = on;
    if (on) { chapter.style.visibility = "visible"; chapYear.play(0); chapTxt.play(160); }
    else { chapYear.reverse(); chapTxt.reverse(); }
  }
}

if (!REDUCED) {
  scrub(ab, "top top", "bottom bottom", (p) => { abP = p; applyAb(); });
  abPhoto.dataset.depth = "0.35";
  $(".ab-big").dataset.depth = "0.7";
  depth($(".ab-stage"), [abPhoto, $(".ab-big")], { max: 18 });
} else {
  chapter.style.visibility = "visible";
  chapYear.spring.set(1); chapTxt.play(0);
  applyAb();
}

// entrada: listras se abrem, os refletores acendem em três tempos, o título sobe
(async function intro() {
  const stripes = $$("#ab-stripes li");
  if (REDUCED) {
    $("#ab-stripes").classList.add("is-done");
    abH.play(0); abEyebrow.play(0); abLead.play(0); abHint.play(0);
    return;
  }
  const done = stripes.map((li, i) => li.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }],
    { duration: 900, delay: 80 + Math.abs(i - 3.5) * 70, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" }).finished);
  // refletores: pisca, apaga, acende
  const steps = [[0.08, 0.55, 140], [0.55, 0.18, 90], [0.18, 0.85, 160], [0.85, 0.6, 120], [0.6, 1, 900]];
  setTimeout(async () => {
    for (const [a, b, d] of steps) {
      await new Promise((res) => tween(a, b, d, easeOutCubic, (v) => { introLight = v; applyAb(); }, res));
    }
  }, 380);
  abEyebrow.play(650);
  abH.play(760);
  abLead.play(1250);
  abHint.play(1700);
  await Promise.all(done);
  $("#ab-stripes").classList.add("is-done");
})();

/* =================================================================
   CAPÍTULOS
   ================================================================= */
const tabs = $$(".cap-tab");
const panels = tabs.map((t) => $("#" + t.getAttribute("aria-controls")));
const bar = $("#cap-bar");
let current = 0;

function prepPanel(panel) {
  const h = buildHeading($(".pn-h", panel), { stagger: 90, config: CFG.TYPE });
  const intro = [$(".pn-eyebrow", panel), $(".pn-lead", panel), ...$$(".pn-text p", panel)].map((el) => motion(el, { y: "1rem", config: CFG.COPY }));
  const figIn = $(".pn-fig-in", panel);
  const figImg = $(".pn-fig img", panel);
  const cap = motion($(".pn-fig figcaption", panel), { config: CFG.LABEL });
  const stats = $$(".stat", panel).map((el) => ({ el, m: motion(el, { y: "1rem", config: CFG.ITEM }), dd: $("dd", el) }));
  const cups = $$(".cups li", panel).map((el) => motion(el, { y: "0.75rem", config: CFG.ITEM }));
  const notes = $$(".pn-stats .note, .pn-now", panel).map((el) => motion(el, { config: CFG.LABEL }));
  const mos = $$(".mo", panel).map((el) => motion(el, { y: "1.5rem", config: CFG.ROW }));
  const moHead = motion($(".pn-moments > h4", panel), { config: CFG.LABEL });
  if (!REDUCED) figIn.style.clipPath = "inset(100% 0 0 0)";
  const blocks = {
    top(base = 0) {
      $(".pn-eyebrow", panel) && intro[0].play(base);
      h.play(base + 80);
      intro.slice(1).forEach((m, i) => m.play(base + 380 + i * 110));
      anim(figIn, [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1200, delay: base + 200 });
      anim(figImg, [{ transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 1600, delay: base + 200 });
      if (REDUCED) figIn.style.clipPath = "";
      cap.play(base + 900);
    },
    stats(base = 0) {
      stats.forEach((s, i) => { s.m.play(base + i * 90); countUp(s.dd, Number(s.dd.dataset.n), { delay: base + i * 90, duration: 1500 }); });
      cups.forEach((m, i) => m.play(base + 300 + i * 70));
      notes.forEach((m) => m.play(base + 500));
    },
    moments(base = 0) {
      moHead.play(base);
      mos.forEach((m, i) => m.play(base + 80 + i * 90));
    },
    reset() {
      h.reverse(); intro.forEach((m) => m.spring.set(0)); cap.spring.set(0);
      stats.forEach((s) => s.m.spring.set(0)); cups.forEach((m) => m.spring.set(0)); notes.forEach((m) => m.spring.set(0));
      mos.forEach((m) => m.spring.set(0)); moHead.spring.set(0);
      if (!REDUCED) figIn.style.clipPath = "inset(100% 0 0 0)";
      figIn.getAnimations().forEach((a) => a.cancel());
    },
  };
  return blocks;
}
const panelCtl = panels.map(prepPanel);

// o primeiro capítulo visível revela por blocos, conforme a rolagem
const firstTriggers = [];
function armScroll(i) {
  firstTriggers.forEach((io) => io.disconnect());
  firstTriggers.length = 0;
  const p = panels[i], c = panelCtl[i];
  firstTriggers.push(forward($(".pn-top", p), () => c.top(), null, "0px 0px -15% 0px"));
  firstTriggers.push(forward($(".pn-stats", p), () => c.stats(), null, "0px 0px -15% 0px"));
  firstTriggers.push(forward($(".pn-moments", p), () => c.moments(), null, "0px 0px -10% 0px"));
}

function placeBar() {
  const t = tabs[current];
  bar.style.width = `${t.offsetWidth}px`;
  bar.style.translate = `${t.offsetLeft}px 0`;
}

async function select(i, { focus = false, fromHash = false } = {}) {
  if (i === current && !fromHash) return;
  const prev = panels[current];
  tabs.forEach((t, k) => {
    t.setAttribute("aria-selected", String(k === i));
    t.tabIndex = k === i ? 0 : -1;
  });
  if (focus) tabs[i].focus();
  const old = current;
  current = i;
  placeBar();
  try { history.replaceState(null, "", i ? "#retorno" : "#primeira"); } catch {}
  if (old !== i && !prev.hidden) {
    const a = anim(prev, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-1rem)" }], { duration: 280, easing: "cubic-bezier(0.7, 0, 0.84, 0)" });
    if (a) await a.finished;
    prev.hidden = true;
    prev.getAnimations().forEach((x) => x.cancel());
    panelCtl[old].reset();
  }
  const next = panels[i];
  next.hidden = false;
  // se o seletor estiver acima da dobra, mantém o topo da seção à vista
  const head = $(".cap-head");
  if (head.getBoundingClientRect().top < -40 && !fromHash) {
    const y = head.getBoundingClientRect().top + scrollY - 80;
    lenis ? lenis.scrollTo(y, { duration: 0.9 }) : scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
  }
  panelCtl[i].top(60);
  panelCtl[i].stats(420);
  panelCtl[i].moments(700);
  armScroll(i);
}

tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
$(".cap-tabs").addEventListener("keydown", (e) => {
  const k = { ArrowRight: 1, ArrowLeft: -1, Home: "home", End: "end" }[e.key];
  if (k == null) return;
  e.preventDefault();
  const n = k === "home" ? 0 : k === "end" ? tabs.length - 1 : (current + k + tabs.length) % tabs.length;
  select(n, { focus: true });
});
addEventListener("resize", placeBar);
document.fonts?.ready.then(placeBar);
placeBar();
const capHead = motion($(".cap-head"), { y: "1.5rem", config: CFG.REVEAL });
forward($(".cap-head"), () => capHead.play(), () => capHead.reverse(), "0px 0px -10% 0px");

if (location.hash === "#retorno") {
  panels[0].hidden = true;
  current = 1;
  tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === 1)); t.tabIndex = k === 1 ? 0 : -1; });
  panels[1].hidden = false;
  placeBar();
}
armScroll(current);
addEventListener("hashchange", () => {
  if (location.hash === "#retorno" && current !== 1) select(1, { fromHash: true });
  if (location.hash === "#primeira" && current !== 0) select(0, { fromHash: true });
});

/* =================================================================
   O TEMPO — 2011 → 2025, guiado pela rolagem
   ================================================================= */
const tp = $("#tempo");
const tpH = buildHeading($("#tp-h"), { config: CFG.TYPE });
const tpEyebrow = motion($(".tp-head .eyebrow"), { config: CFG.LABEL });
forward(tp, () => { tpEyebrow.play(0); tpH.play(120); }, () => { tpEyebrow.reverse(); tpH.reverse(); }, "0px 0px -40% 0px");
if (!REDUCED) {
  const frame = $("#tp-frame");
  const then = $(".tp-then", frame), thenImg = $(".tp-then img", frame);
  const now = $(".tp-now", frame), nowImg = $(".tp-now img", frame);
  const clubs = $(".tp-clubs");
  const year = $("#tp-year");
  const stage = $(".tp-stage");
  let lastYear = 2011;
  scrub(tp, "top top", "bottom bottom", (p) => {
    const intro = easeOutCubic(seg(p, 0, 0.18));
    frame.style.setProperty("--fs", (0.92 + 0.08 * intro).toFixed(4));
    frame.style.setProperty("--eye", easeOutCubic(seg(p, 0.06, 0.22)).toFixed(4));
    const r = easeInOutCubic(seg(p, 0.24, 0.78));
    const band = (50 * (1 - r)).toFixed(3);
    now.style.clipPath = `inset(${band}% 0 ${band}% 0)`;
    nowImg.style.transform = `scale(${(1.14 - 0.14 * r).toFixed(4)})`;
    thenImg.style.transform = `translateY(${(-4 * r).toFixed(3)}%) scale(${(1 + 0.08 * r).toFixed(4)})`;
    thenImg.style.filter = `grayscale(1) contrast(1.08) brightness(${(1 - 0.45 * r).toFixed(3)})`;
    const y = Math.round(lerp(2011, 2025, seg(p, 0.24, 0.78)));
    if (y !== lastYear) { lastYear = y; year.textContent = String(y); }
    const cw = clubs.scrollWidth, vw = innerWidth;
    const cx = lerp(vw, -cw, seg(p, 0.12, 0.9));
    clubs.style.transform = `translateX(${cx.toFixed(1)}px)`;
    stage.style.setProperty("--clubs", (seg(p, 0.12, 0.24) * (1 - seg(p, 0.8, 0.92))).toFixed(3));
    stage.style.setProperty("--then", (1 - seg(p, 0.3, 0.48)).toFixed(3));
    stage.style.setProperty("--now", seg(p, 0.62, 0.8).toFixed(3));
    stage.style.setProperty("--rail", seg(p, 0.24, 0.78).toFixed(4));
  });
}

/* =================================================================
   LINHA DO TEMPO
   ================================================================= */
const ltItems = $$(".lt-item");
ltItems.forEach((li, i) => { li.dataset.reveal = "up"; li.dataset.delay = "0"; });
const ltFill = $("#lt-fill");
scrub($(".lt-wrap"), "top center", "bottom center", (p) => {
  ltFill.parentElement.style.setProperty("--fill", p.toFixed(4));
  const mid = innerHeight / 2;
  ltItems.forEach((li) => li.classList.toggle("is-on", li.getBoundingClientRect().top + 12 < mid));
});

/* =================================================================
   UNIFORMES — camisa de costas: 11 → 10, branca ↔ listrada
   ================================================================= */
const shirt = $("#shirt");
const numA = $("#shirt-num-a"), numB = $("#shirt-num-b");
let era = "11", kit = "branca", showing = numA;
const shirtCap = $("#shirt-cap");
const shirtTitle = $("#shirt-desc");
function shirtLabel() {
  const k = kit === "branca" ? "uniforme branco" : "uniforme listrado em preto e branco";
  const per = era === "11" ? "2009–2013" : "2025–";
  shirtCap.textContent = `Camisa ${era} · ${k} · ${per}`;
  shirtTitle.textContent = `Costas de uma camisa ${kit === "branca" ? "branca" : "listrada em preto e branco"} do Santos com o nome Neymar Jr e o número ${era}`;
}
function setEra(v) {
  if (v === era) return;
  era = v;
  const incoming = showing === numA ? numB : numA;
  incoming.textContent = v;
  if (REDUCED) { showing.setAttribute("opacity", "0"); incoming.setAttribute("opacity", "1"); }
  else {
    incoming.setAttribute("opacity", "1");
    showing.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-40%)", opacity: 0 }], { duration: 420, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" });
    incoming.animate([{ transform: "translateY(40%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 650, delay: 220, easing: EASE, fill: "both" });
    $("svg", shirt).animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-1.6deg)" }, { transform: "rotate(0.6deg)" }, { transform: "rotate(0deg)" }], { duration: 900, easing: "ease-out" });
  }
  showing = incoming;
  shirtLabel();
}
function setKit(v) {
  if (v === kit) return;
  kit = v;
  shirt.dataset.kit = v;
  shirtLabel();
}
function radios(group, attr, onPick) {
  const btns = $$("button", group);
  const pick = (b, focus) => {
    btns.forEach((x) => { x.setAttribute("aria-checked", String(x === b)); x.tabIndex = x === b ? 0 : -1; });
    if (focus) b.focus();
    onPick(b.dataset[attr]);
  };
  btns.forEach((b, i) => { b.tabIndex = i === 0 ? 0 : -1; b.addEventListener("click", () => pick(b)); });
  group.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const i = btns.findIndex((x) => x.getAttribute("aria-checked") === "true");
    pick(btns[(i + d + btns.length) % btns.length], true);
  });
}
const segs = $$(".un-controls .seg");
radios(segs[0], "era", setEra);
radios(segs[1], "kit", setKit);
shirt.dataset.kit = "branca";
// a camisa entra subindo, a foto real em máscara
const shirtM = motion(shirt, { y: "3rem", config: CFG.FIGURE });
forward(shirt, () => shirtM.play(100), null, "0px 0px -15% 0px");
const unPhoto = $(".un-photo-in");
forward(unPhoto, () => anim(unPhoto, [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1200, delay: 250 }), null, "0px 0px -10% 0px");

// cabeçalho escuro sobre a seção clara
const lightIO = new IntersectionObserver((es) => es.forEach((e) => header.el.classList.toggle("on-light", e.isIntersecting)),
  { rootMargin: "0px 0px -94% 0px" });
lightIO.observe($("#uniformes"));

/* =================================================================
   GALERIA + LIGHTBOX
   ================================================================= */
const gaItems = $$(".ga-item");
const filterBtns = $$(".ga-filters button");
const gaEmpty = $("#ga-empty");
let gaFilter = "todas";
const visibleItems = () => gaItems.filter((li) => !li.hidden);
async function applyFilter(f) {
  if (f === gaFilter) return;
  gaFilter = f;
  filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
  const want = (li) => f === "todas" || li.dataset.g.split(" ").includes(f);
  const leaving = gaItems.filter((li) => !li.hidden && !want(li));
  await Promise.all(leaving.map((li) => anim(li, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.97)" }], { duration: 220 })?.finished));
  gaItems.forEach((li) => { li.getAnimations().forEach((a) => a.cancel()); li.hidden = !want(li); });
  visibleItems().forEach((li, i) => anim(li, [{ opacity: 0, transform: "translateY(1.25rem)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: i * 60 }));
  gaEmpty.hidden = visibleItems().length > 0;
}
filterBtns.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.f)));
gaItems.forEach((li, i) => {
  const m = motion(li, { y: "2rem", config: CFG.ROW });
  forward(li, () => m.play((i % 3) * 90), null, "0px 0px -8% 0px");
});

const lb = $("#lb");
const lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbCredit = $("#lb-credit"), lbCount = $("#lb-count");
let lbIndex = 0;
function showLb(i, dir = 0) {
  const list = visibleItems();
  lbIndex = (i + list.length) % list.length;
  const li = list[lbIndex];
  const img = $("img", li);
  lbImg.src = img.currentSrc || img.src;
  lbImg.alt = img.alt;
  lbImg.width = img.width; lbImg.height = img.height;
  const cap = $(".ga-cap", li);
  lbCap.innerHTML = `<b>${esc($("b", cap).textContent)}</b> · ${esc(cap.lastChild.textContent.trim())}`;
  lbCredit.innerHTML = $(".ga-credit", li).innerHTML;
  lbCount.textContent = `${String(lbIndex + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
  anim(lbImg, [{ opacity: 0, transform: `translateX(${dir * 2}rem)` }, { opacity: 1, transform: "none" }], { duration: 550 });
}
gaItems.forEach((li) => $(".ga-btn", li).addEventListener("click", () => {
  showLb(visibleItems().indexOf(li));
  lb.showModal();
  lenis?.stop();
  anim($(".lb-in", lb), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
}));
$("#lb-prev").addEventListener("click", () => showLb(lbIndex - 1, -1));
$("#lb-next").addEventListener("click", () => showLb(lbIndex + 1, 1));
$("#lb-close").addEventListener("click", () => lb.close());
lb.addEventListener("close", () => lenis?.start());
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-in")) lb.close(); });
lb.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); showLb(lbIndex - 1, -1); }
  if (e.key === "ArrowRight") { e.preventDefault(); showLb(lbIndex + 1, 1); }
});

/* =================================================================
   REGISTROS + créditos e fontes vindos do JSON
   ================================================================= */
$$(".rg-list li").forEach((li, i) => {
  const m = motion(li, { y: "1rem", config: CFG.ROW });
  forward(li, () => m.play((i % 4) * 70), null, "0px 0px -6% 0px");
});
dataP.then((d) => {
  if (!d) return;
  $("#rg-src").innerHTML = d.fontes.map((f) => `<li><a href="${esc(f.url)}">${esc(f.nome)}</a></li>`).join("");
  $("#rg-credits").innerHTML = d.fotos.map((f) =>
    `<li>${esc(f.legenda)} — ${esc(f.autor)}, ${esc(f.licenca)}${f.url && f.url !== "/" ? ` · <a href="${esc(f.url)}">arquivo</a>` : ""} <span>(${esc(f.uso)})</span></li>`).join("");
});

/* revelações declarativas (títulos das seções, itens da linha do tempo) */
revealAll();
