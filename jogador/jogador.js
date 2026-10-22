/* JOGADOR — retrato em profundidade, perfil, números, estilo e momentos.
   Motor: /shared/njr.js (molas, splitText, buildHeading, scrub, depth, countUp). */
import {
  initPage, revealAll, depth, scrub, forward, inView, subscribe, motion, splitText, Spring, CFG, REDUCED, FINE,
  $, $$, clamp01, lerp, easeInOutCubic, easeOutCubic, lenis,
} from "/shared/njr.js";

const root = document.documentElement;
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n, k = 2) => String(n).padStart(k, "0");
const mq = (q) => matchMedia(q);
const LETTER = { tension: 250, friction: 19 };   // mola com leve sobra: as letras "assentam"

const data = await fetch("jogador.json").then((r) => r.json()).catch(() => null);

/* ---------------- grade de análise (fundo da abertura) ---------------- */
function buildGrid(svg) {
  const W = 1440, H = 900, cx = 840, cy = 300;
  let s = "";
  for (let x = 0; x <= W; x += 120) s += `<line class="g draw" pathLength="1" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 60; y <= H; y += 120) s += `<line class="g draw" pathLength="1" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  s += `<line class="g2" x1="${cx}" y1="0" x2="${cx}" y2="${H}"/><line class="g2" x1="0" y1="${cy}" x2="${W}" y2="${cy}"/>`;
  [90, 170, 300].forEach((r) => { s += `<circle class="ring draw" pathLength="1" cx="${cx}" cy="${cy}" r="${r}"/>`; });
  const a0 = -0.9, a1 = 0.35, r = 170;
  s += `<path class="arc draw" pathLength="1" d="M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}"/>`;
  s += `<text x="${cx + 8}" y="${cy - 8}">x 0.58 · y 0.33</text><text x="80" y="${60 + 120 * 3 - 8}">ANÁLISE · RETRATO</text>`;
  s += `<text x="${W - 190}" y="${H - 72}">NJR / 010 · 1992</text>`;
  svg.innerHTML = s;
}
buildGrid($("#op-grid"));

/* ---------------- nome: letra a letra, com máscara ---------------- */
const nameEl = $("#op-name");
const nameSprings = [];
nameEl.innerHTML = `<span class="sr-only">Neymar Jr</span>` + ["Neymar", "Jr"].map((w, i) =>
  `<span class="op-row" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join("")}${i ? '<b class="dot-accent ch">.</b>' : ""}</span>`).join("");
$$(".ch", nameEl).forEach((el, i) => {
  const s = new Spring(0, LETTER, (p) => { el.style.transform = `translateY(${((1 - p) * 108).toFixed(2)}%) rotate(${((1 - p) * 7).toFixed(2)}deg)`; });
  s.set(REDUCED ? 1 : 0);
  nameSprings.push(s);
});

const credits = `<p>Retrato: foto de estúdio da página inicial. Fotos dos momentos: Wikimedia Commons, com autores e licenças em “Fontes e créditos”.</p>`;
const { header } = await initPage("/jogador/", { credits, heroImage: $("#op-img") });
root.classList.add("jg-ready");

/* ---------------- entrada da abertura ---------------- */
const opStage = $("#op-stage");
const grid = $("#op-grid");
const fig = $("#op-fig");
const scan = $("#op-scan");
const idM = motion($("#op-id"), { y: "0.75rem" });
const dek = splitText($("#op-dek"), $("#op-dek").textContent.trim(), { stagger: 30, config: CFG.COPY2, gap: 0.22 });
const metaM = $$("#op-meta li").map((li) => motion(li, { y: "0.75rem" }));
const cueM = motion($("#op-cue"), { y: "0.75rem" });
const marks = $$("#op-marks .mk").map((mk) => ({
  dot: motion(mk.querySelector(".mk-dot"), { config: CFG.FIGURE }),
  line: motion(mk.querySelector(".mk-line"), { scaleX: true, opacity: false, config: CFG.ROW }),
  tag: motion(mk.querySelector(".mk-tag"), { y: "0.5rem", config: CFG.ITEM }),
}));

function scrambleId() {
  const num = $("#op-num");
  if (REDUCED) { num.textContent = "010"; return; }
  const t0 = performance.now();
  const off = subscribe((now) => {
    const k = (now - t0) / 750;
    if (k >= 1) { num.textContent = "010"; off(); return; }
    num.textContent = [0, 1, 2].map((i) => (k > 0.45 + i * 0.18 ? "010"[i] : Math.floor(Math.random() * 10))).join("");
  }, () => 45);
}

function opening() {
  grid.classList.add("is-in");
  idM.play(0); scrambleId();
  nameSprings.forEach((s, i) => s.to(1, { delay: 120 + i * 48 }));
  if (!REDUCED) {
    const h = fig.offsetHeight;
    fig.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], { duration: 1500, delay: 250, easing: "cubic-bezier(0.33, 0, 0, 1)", fill: "both" });
    scan.animate([{ transform: `translateY(${h}px)`, opacity: 1 }, { transform: "translateY(0)", opacity: 1, offset: 0.92 }, { transform: "translateY(0)", opacity: 0 }],
      { duration: 1700, delay: 250, easing: "cubic-bezier(0.33, 0, 0, 1)", fill: "both" });
  } else fig.style.clipPath = "none";
  marks.forEach((m, i) => { const d = 1250 + i * 160; m.dot.play(d); m.line.play(d + 80); m.tag.play(d + 220); });
  dek.play(700);
  metaM.forEach((m, i) => m.play(600 + i * 110));
  cueM.play(1500);
}
opening();
const stopDepth = depth($("#abertura"), $$("[data-depth]", opStage), { max: 22 });
void stopDepth;

/* ---------------- a abertura recua quando o perfil sobe por cima ---------------- */
const opInner = $("#op-inner"), opShade = $("#op-shade"), pin = $("#pin");
const phone = mq("(max-width: 639px)");
scrub($(".jg-body"), "top bottom", "top top", (p) => {
  const k = phone.matches ? 0 : 0.1;
  opInner.style.transform = p > 0 ? `translateY(${(-6 * p).toFixed(2)}svh) scale(${(1 - k * p).toFixed(4)})` : "";
  opShade.style.opacity = String(0.6 * p);
  pin.style.visibility = p >= 1 ? "hidden" : "";
});

/* ---------------- cabeçalho claro/escuro conforme a seção sob ele ---------------- */
const darkZones = [$("#perfil"), $(".ns-sticky"), $("#momentos")];
let lastDark = null;
subscribe(() => {
  const y = 40;
  const dark = darkZones.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
  if (dark !== lastDark) { lastDark = dark; header.setDark(dark); }
}, () => 120);

/* revelações declarativas (títulos com ponto amarelo, contadores) */
revealAll();

/* ---------------- A. PERFIL ---------------- */
const ruler = $("#pf-ruler");
ruler.innerHTML = Array.from({ length: 41 }, (_, i) => `<i class="${i % 5 ? "" : "l"}" style="top:${(i / 40) * 100}%"></i>`).join("");
const rows = $$("#pf-rows .pf-row");
rows.forEach((row) => {
  const line = new Spring(0, CFG.ROW, (v) => row.style.setProperty("--line", clamp01(v).toFixed(4)));
  line.set(REDUCED ? 1 : 0);
  const dt = motion(row.querySelector("dt"), { y: "0.5rem" });
  const dd = motion(row.querySelector("dd"), { y: "1.25rem", config: CFG.COPY2 });
  forward(row, () => { line.to(1); dt.play(80); dd.play(160); }, () => { line.to(0); dt.reverse(); dd.reverse(); }, "0px 0px -12% 0px");
});
const pfScan = $("#pf-scan"), pfRead = $("#pf-read"), pfFig = $("#pf-fig");
const wide = mq("(min-width: 1024px)");
let readN = -1;
const readOut = (p) => {
  pfScan.style.transform = `translateY(${(p * pfFig.clientHeight).toFixed(1)}px)`;
  const mid = innerHeight * 0.55;
  let n = 0;
  rows.forEach((r, i) => { const on = r.getBoundingClientRect().top < mid; if (on) n = i + 1; r.classList.toggle("is-on", on && i === n - 1); });
  if (n !== readN) { readN = n; pfRead.textContent = pad(n); }
};
scrub($("#pf-rows"), "top center", "bottom center", (p) => { if (wide.matches) readOut(p); });
scrub(pfFig, "top bottom", "bottom top", (p) => { if (!wide.matches) readOut(p); });

// trajetória: a linha corre e acende as paradas
const rtRun = $("#rt-run"), rtRun2 = $("#rt-run2");
const stops = $$(".rt-stops li").map((li) => ({ li, x: parseFloat(li.style.getPropertyValue("--x")) }));
const drawRoute = (p) => {
  rtRun.setAttribute("x2", String(p * 1000));
  rtRun2.setAttribute("x2", String(58 + Math.max(0, p * 1000 - 58)));
  stops.forEach(({ li, x }) => {
    const k = clamp01((p - x) / 0.06 + 0.3);
    li.style.setProperty("--o", (0.25 + 0.75 * k).toFixed(3));
    li.style.setProperty("--s", k.toFixed(3));
  });
};
if (REDUCED) drawRoute(1);
else scrub($("#rt"), "top bottom", "center center", (p) => drawRoute(wide.matches ? p : 1), { smooth: CFG.TRIGGER });

/* ---------------- B. NÚMEROS — clubes ---------------- */
$$("#nc-rows .nc-row").forEach((row, i) => {
  const g = row.querySelector(".t-g"), y = row.querySelector(".t-y");
  const sg = new Spring(0, CFG.REVEAL, (v) => g.style.setProperty("--k", clamp01(v).toFixed(4)));
  const sy = new Spring(0, CFG.REVEAL, (v) => y.style.setProperty("--k", clamp01(v).toFixed(4)));
  sg.set(REDUCED ? 1 : 0); sy.set(REDUCED ? 1 : 0);
  const m = motion(row, { y: "1rem", config: CFG.ROW });
  forward(row, () => { m.play(i * 40); sg.to(1, { delay: 120 }); sy.to(1, { delay: 320 }); },
    () => { m.reverse(); sg.to(0); sy.to(0); }, "0px 0px -10% 0px");
});

/* ---------------- B. NÚMEROS — Seleção, ano a ano ---------------- */
const years = data?.selecaoPorAno ?? [];
const marcos = data?.selecaoMarcos ?? {};
if (years.length) {
  let cg = 0, ca = 0;
  const cum = years.map((y) => { cg += y.gols; ca += y.jogos; return { ...y, cg, ca }; });
  const bars = $("#ns-bars");
  bars.innerHTML = cum.map((y) => `<li style="--c:${Math.max(y.cg, 0.001)};--g:${y.gols}"><i class="b"></i><span class="y">${String(y.ano).slice(2)}</span></li>`).join("");
  const lis = $$("li", bars);
  const yearEl = $("#ns-year"), goalsEl = $("#ns-goals"), appsEl = $("#ns-apps"), sayEl = $("#ns-say");
  const N = cum.length;
  let curI = -1, curSay = null;
  const say = (text) => {
    if (text === curSay) return;
    curSay = text;
    if (REDUCED) { sayEl.textContent = text; return; }
    sayEl.getAnimations().forEach((a) => a.cancel());
    sayEl.textContent = text;
    sayEl.animate([{ opacity: 0, transform: "translateY(0.5rem)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(0.2, 0, 0, 1)" });
  };
  const race = (p) => {
    const f = clamp01(p) * N;
    const i = Math.min(N - 1, Math.floor(f));
    const frac = p >= 1 ? 1 : f - i;
    lis.forEach((li, k) => li.querySelector(".b").style.setProperty("--k", clamp01(f - k).toFixed(4)));
    const prevG = i ? cum[i - 1].cg : 0, prevA = i ? cum[i - 1].ca : 0;
    goalsEl.textContent = String(Math.round(lerp(prevG, cum[i].cg, easeOutCubic(clamp01(frac)))));
    appsEl.textContent = String(Math.round(lerp(prevA, cum[i].ca, clamp01(frac))));
    if (i !== curI) {
      curI = i;
      yearEl.textContent = String(cum[i].ano);
      lis.forEach((li, k) => li.classList.toggle("cur", k === i));
    }
    let text = "";
    for (let k = 0; k <= i; k++) if (marcos[cum[k].ano]) text = `${cum[k].ano}: ${marcos[cum[k].ano]}`;
    if (p >= 0.995) text = "Maior artilheiro da história da Seleção em jogos reconhecidos pela FIFA.";
    say(text);
  };
  if (REDUCED) race(1);
  else scrub($("#ns"), "top top", "bottom bottom", (p) => race(p * 1.04), { smooth: CFG.TRIGGER });
  const cups = $$("#ns-cups li").map((li) => motion(li, { y: "0.5rem" }));
  forward($("#ns-cups"), () => cups.forEach((c, k) => c.play(k * 90)), () => cups.forEach((c) => c.reverse()));
}

/* ---------------- C. ESTILO — faixa horizontal + cenas ---------------- */
const es = $("#estilo"), esPin = $("#es-pin"), track = $("#es-track"), esBar = $("#es-bar");
let stopEs = null;
function setupEs() {
  stopEs?.(); stopEs = null;
  track.style.transform = ""; esPin.style.height = "";
  const pinned = wide.matches && !REDUCED;
  es.classList.toggle("is-pinned", pinned);
  if (!pinned) return;
  const over = () => Math.max(0, track.scrollWidth - innerWidth);
  esPin.style.height = `${innerHeight + over()}px`;
  stopEs = scrub(esPin, "top top", "bottom bottom", (p) => {
    track.style.transform = `translate3d(${(-p * over()).toFixed(1)}px,0,0)`;
    esBar.style.transform = `scaleX(${p.toFixed(4)})`;
  }, { smooth: CFG.TRIGGER });
}
setupEs();
wide.addEventListener("change", setupEs);
let rsz = 0;
addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(setupEs, 200); });

const SCENES = {
  drible(svg) {
    const run = $(".run", svg), ball = $(".ball", svg), foes = $$(".foe circle", svg), L = run.getTotalLength();
    const base = foes.map((f) => [Number(f.getAttribute("cx")), Number(f.getAttribute("cy"))]);
    return { still: 0.8, draw(t) {
      const u = easeInOutCubic(clamp01(t / 0.7)), fade = t > 0.86 ? 1 - (t - 0.86) / 0.14 : 1;
      run.style.strokeDashoffset = String(1 - u);
      const pt = run.getPointAtLength(u * L);
      ball.setAttribute("cx", pt.x.toFixed(1)); ball.setAttribute("cy", pt.y.toFixed(1));
      foes.forEach((f, i) => {
        const [x, y] = base[i], d = Math.hypot(pt.x - x, pt.y - y), k = Math.max(0, 1 - d / 60);
        f.setAttribute("cx", (x + (x - pt.x) * 0.25 * k).toFixed(1)); f.setAttribute("cy", (y + (y - pt.y) * 0.25 * k).toFixed(1));
      });
      run.style.opacity = ball.style.opacity = String(fade);
    } };
  },
  criatividade(svg) {
    const paths = $$(".links path:not(.alt)", svg), ball = $(".ball", svg), Ls = paths.map((p) => p.getTotalLength());
    return { still: 0.8, draw(t) {
      const fade = t > 0.88 ? 1 - (t - 0.88) / 0.12 : 1;
      let pt = null;
      paths.forEach((p, i) => {
        const u = easeInOutCubic(clamp01((t - i * 0.24) / 0.24));
        p.style.strokeDashoffset = String(1 - u); p.style.opacity = String(fade);
        if (u > 0 && (u < 1 || i === paths.length - 1)) pt = p.getPointAtLength(u * Ls[i]);
      });
      if (!pt) pt = { x: 60, y: 160 };
      ball.setAttribute("cx", pt.x.toFixed(1)); ball.setAttribute("cy", pt.y.toFixed(1)); ball.style.opacity = String(fade);
    } };
  },
  velocidade(svg) {
    const runner = $(".runner", svg), streaks = $(".streaks", svg);
    return { still: 0.6, draw(t) {
      const k = clamp01(t / 0.78), u = k * k, x = 30 + 262 * u, speed = k;
      const fade = t > 0.86 ? 1 - (t - 0.86) / 0.14 : 1;
      runner.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
      runner.style.opacity = String(fade);
      streaks.setAttribute("transform", `translate(${(x - 175).toFixed(1)} 0)`);
      $$("line", streaks).forEach((l, i) => { l.style.opacity = String(Math.max(0, speed - 0.25 - i * 0.05) * 0.9 * fade * (t < 0.8 ? 1 : 0)); });
    } };
  },
  finalizacao(svg) {
    const shot = $(".shot", svg), ball = $(".ball", svg), hit = $(".hit", svg), net = $(".net line", svg), L = shot.getTotalLength();
    return { still: 0.52, draw(t) {
      const u = easeOutCubic(clamp01(t / 0.42)), fade = t > 0.86 ? 1 - (t - 0.86) / 0.14 : 1;
      shot.style.strokeDashoffset = String(1 - u); shot.style.opacity = String(fade);
      const pt = shot.getPointAtLength(u * L);
      ball.setAttribute("cx", pt.x.toFixed(1)); ball.setAttribute("cy", pt.y.toFixed(1)); ball.style.opacity = String(fade);
      const h = clamp01((t - 0.42) / 0.3);
      hit.setAttribute("r", (4 + 24 * easeOutCubic(h)).toFixed(1));
      hit.style.opacity = String(h > 0 ? 1 - h : 0);
      net.style.opacity = String(h > 0 ? fade : 0);
      net.setAttribute("transform", `translate(${(Math.sin(h * Math.PI) * 6).toFixed(2)} 0)`);
    } };
  },
  criacao(svg) {
    const pass = $(".pass", svg), shot = $(".shot", svg), ball = $(".ball", svg), zone = $(".zone", svg);
    const Lp = pass.getTotalLength(), Ls = shot.getTotalLength();
    return { still: 0.8, draw(t) {
      const fade = t > 0.88 ? 1 - (t - 0.88) / 0.12 : 1;
      const a = easeInOutCubic(clamp01(t / 0.4)), b = easeOutCubic(clamp01((t - 0.52) / 0.22));
      pass.style.strokeDashoffset = String(1 - a); shot.style.strokeDashoffset = String(1 - b);
      pass.style.opacity = shot.style.opacity = String(fade);
      const pt = b > 0 ? shot.getPointAtLength(b * Ls) : pass.getPointAtLength(a * Lp);
      ball.setAttribute("cx", pt.x.toFixed(1)); ball.setAttribute("cy", pt.y.toFixed(1)); ball.style.opacity = String(fade);
      zone.style.opacity = String(clamp01((t - 0.3) / 0.15) * fade);
    } };
  },
};
$$(".sc").forEach((card, i) => {
  const svg = $(".sc-svg", card);
  const scene = SCENES[card.dataset.scene]?.(svg);
  if (!scene) return;
  scene.draw(REDUCED ? scene.still : 0);
  const m = motion(card, { y: "2rem", config: CFG.ROW });
  forward(card, () => m.play(REDUCED ? 0 : (i % 3) * 90), () => m.reverse(), "0px 0px -6% 0px");
  if (REDUCED) return;
  const PERIOD = 3600;
  let off = null, t0 = 0;
  inView(card, { threshold: 0.35 }, () => {
    if (off) return;
    t0 = performance.now() - i * 400;
    off = subscribe((now) => scene.draw(((now - t0) % PERIOD) / PERIOD));
  }, () => { off?.(); off = null; });
});

/* ---------------- D. MOMENTOS ---------------- */
const items = $$("#mo-list .mo-item");
items.forEach((it, i) => {
  const m = motion(it, { y: "1.5rem", config: CFG.ROW });
  forward(it, () => m.play((i % 4) * 70), () => m.reverse(), "0px 0px -6% 0px");
});

// prévia da foto que segue o cursor
if (FINE && !REDUCED) {
  const peek = $("#mo-peek"), peekImg = $("#mo-peek-img");
  let tx = 0, ty = 0, x = 0, y = 0, off = null, shown = false;
  const vis = new Spring(0, CFG.FIGURE, (v) => { peek.style.opacity = String(clamp01(v)); peek.style.scale = String(0.85 + 0.15 * clamp01(v)); });
  const tick = () => {
    x = lerp(x, tx, 0.14); y = lerp(y, ty, 0.14);
    peek.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${((tx - x) * 0.03).toFixed(2)}deg)`;
    if (!shown && Math.abs(x - tx) < 0.5 && Math.abs(y - ty) < 0.5) { off?.(); off = null; }
  };
  const place = (e) => { tx = e.clientX + 24; ty = e.clientY - peek.offsetHeight / 2; };
  items.forEach((it) => {
    const btn = $(".mo-btn", it);
    btn.addEventListener("pointerenter", (e) => {
      if (!it.dataset.img) return;
      peekImg.src = it.dataset.img;
      if (!shown) { place(e); x = tx; y = ty; }
      shown = true; vis.to(1);
      if (!off) off = subscribe(tick);
    });
    btn.addEventListener("pointermove", place);
    btn.addEventListener("pointerleave", () => { shown = false; vis.to(0); });
  });
}

// painel de detalhe
const md = $("#md"), mdMedia = $("#md-media");
const mdCopyEls = ["#md-date", "#md-title", "#md-club", "#md-text", "#md-credit"].map((s) => $(s));
let mdI = 0, mdBusy = false;
$("#md-n").textContent = pad(items.length);
function fill(i) {
  const it = items[i], btn = $(".mo-btn", it);
  $("#md-i").textContent = pad(i + 1);
  $("#md-date").textContent = btn.querySelector("time").textContent;
  $("#md-title").textContent = btn.querySelector("b").textContent;
  $("#md-club").textContent = btn.querySelector("span").textContent;
  $("#md-text").innerHTML = $(".mo-more", it).innerHTML;
  if (it.dataset.img) {
    mdMedia.innerHTML = `<img src="${esc(it.dataset.img)}" width="${it.dataset.w}" height="${it.dataset.h}" alt="${esc(it.dataset.alt)}">`;
    $("#md-credit").innerHTML = `Foto: <a href="${esc(it.dataset.creditUrl)}" target="_blank" rel="noopener">${esc(it.dataset.credit)}</a> · Wikimedia Commons`;
  } else {
    mdMedia.innerHTML = `<div class="md-type" aria-hidden="true">${esc(it.dataset.type)}<small>gols pela Seleção<br>Pelé: 77</small></div>`;
    $("#md-credit").textContent = "";
  }
}
function playIn(fromSide = 0) {
  if (REDUCED) return Promise.resolve();
  const media = mdMedia.firstElementChild;
  const a = mdMedia.animate([{ clipPath: fromSide ? `inset(0 ${fromSide > 0 ? 0 : 100}% 0 ${fromSide > 0 ? 100 : 0}%)` : "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
    { duration: 900, easing: "cubic-bezier(0.33, 0, 0, 1)", fill: "both" });
  media?.animate([{ transform: "scale(1.14)" }, { transform: "scale(1)" }], { duration: 1400, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" });
  mdCopyEls.forEach((el, k) => el.animate([{ opacity: 0, transform: "translateY(1rem)" }, { opacity: 1, transform: "none" }],
    { duration: 700, delay: 180 + k * 70, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" }));
  return a.finished.catch(() => {});
}
function openMo(i) {
  mdI = i; fill(i);
  md.showModal();
  lenis?.stop();
  if (!REDUCED) $("#md-sheet").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
  playIn();
  $("#md-close").focus();
}
async function closeMo() {
  if (!md.open) return;
  if (!REDUCED) await $("#md-sheet").animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(2%)" }],
    { duration: 320, easing: "cubic-bezier(0.55, 0, 0.85, 0.25)" }).finished.catch(() => {});
  md.close();
  lenis?.start();
  $(".mo-btn", items[mdI]).focus();
}
async function step(d) {
  if (mdBusy) return;
  mdBusy = true;
  const n = (mdI + d + items.length) % items.length;
  if (!REDUCED) await Promise.all(mdCopyEls.map((el) => el.animate([{ opacity: 1 }, { opacity: 0, transform: `translateX(${-d * 1}rem)` }],
    { duration: 200, easing: "ease-in", fill: "both" }).finished.catch(() => {})));
  mdI = n; fill(n);
  await playIn(d);
  mdBusy = false;
}
items.forEach((it, i) => $(".mo-btn", it).addEventListener("click", () => openMo(i)));
$("#md-close").addEventListener("click", closeMo);
$("#md-prev").addEventListener("click", () => step(-1));
$("#md-next").addEventListener("click", () => step(1));
md.addEventListener("cancel", (e) => { e.preventDefault(); closeMo(); });
md.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
});

/* ---------------- fontes e créditos ---------------- */
if (data) {
  $("#fo-data").innerHTML = data.fontes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a></li>`).join("");
  $("#fo-img").innerHTML = data.imagens.map((f) => `<li>${esc(f.uso)}: ${f.url.startsWith("http") ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.autor)}</a>` : esc(f.autor)} · ${esc(f.licenca)}</li>`).join("");
}
