/* NEYMAR: THE EXPERIENCE
   Uma narrativa curta em quatro atos, aberta pelo botão "ver perfil" da home.
   - Na home: a câmera avança para dentro do retrato do hero, uma íris fecha no rosto e a experiência
     abre por cima da página (a URL vira /experiencia/; voltar no navegador ou Esc fazem o caminho inverso).
   - Direto em /experiencia/: a mesma experiência começa do escuro.
   Palco: gl.js (retrato do hero reiluminado em WebGL). Cenas de foto: imagens licenciadas do Wikimedia
   Commons já usadas no site. Artes da Higgsfield entram pelo manifesto assets/higgsfield.json. */

import { Stage, DEFAULTS } from "./gl.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOBILE = matchMedia("(max-width: 767.98px)").matches;
const COARSE = matchMedia("(hover: none)").matches;
const BASE = "/experiencia/";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED ? Math.min(ms, 60) : ms));
const anim = (el, kf, o) => el.animate(kf, { fill: "both", easing: "cubic-bezier(0.2, 0, 0, 1)", ...o, duration: REDUCED ? 1 : o.duration, delay: REDUCED ? 0 : o.delay || 0 });
// tween genérico por rAF (para máscaras e uniformes)
function tween(dur, fn, ease = easeInOut) {
  return new Promise((done) => {
    if (REDUCED || dur <= 0) { fn(1); done(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / dur);
      fn(ease(u));
      if (u < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}

/* ---------------- fotos (créditos do Wikimedia Commons, os mesmos do Vestiário) ---------------- */
const PHOTOS = {
  talento: { src: "/vestiario/assets/historia/santos1-mundial-2011.webp", legenda: "Final do Mundial de Clubes, Yokohama, 2011.", autor: "Christopher Johnson", licenca: "CC BY-SA 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Neymar_2011_FIFA_Club_World_Cup_Final.jpg" },
  garra: { src: "/vestiario/assets/historia/barca-remontada-2017.webp", legenda: "Barcelona 6 x 1 PSG, Camp Nou, 8 de março de 2017.", autor: "Hugo Pérez Marsol", licenca: "CC BY 2.0",
    url: "https://commons.wikimedia.org/wiki/File:Bar%C3%A7a_6_-_PSG_1;_Dimecres_8_de_mar%C3%A7_de_2017.jpg" },
  impacto: { src: "/vestiario/assets/historia/selecao-copa-2026.webp", legenda: "Na Copa do Mundo de 2026.", autor: "YantsImages", licenca: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Neymar_at_2026_FIFA_World_Cup_by_YantsImages.jpg" },
};

/* Artes da Higgsfield (ver HIGGSFIELD.md). Só entram quando o manifesto marca "pronto": true,
   ou seja, quando o arquivo foi gerado e colocado no caminho esperado. Até lá, o site usa o que já existe. */
let ART = {};
const artReady = fetch(`/experiencia/assets/higgsfield.json`).then((r) => (r.ok ? r.json() : { artes: [] }))
  .then((m) => { (m.artes || []).forEach((a) => { if (a.pronto) ART[a.id] = a; }); })
  .catch(() => {});

const ACTS = ["A entrada", "O protagonista", "A identidade", "O legado"];
const ROMAN = ["I", "II", "III", "IV"];

/* ---------------- as cenas ----------------
   gl: enquadramento e luz do palco; m: ajustes no celular; photo: cena de foto (o palco apaga). */
const SCENES = [
  { id: "entrada", act: 0, label: "A entrada", dur: 6500,
    gl: { fx: 0.5, fy: 0.66, zoom: 1.32, sx: 0.64, sy: 0.5, lx: -0.85, ly: 0.25, key: 1.25, amb: 0.035, rim: 0.9, beam: 0.55, beamX: 0.66, beamAngle: -0.2, beamWidth: 0.2, dust: 0.55, glow: 0.9, desat: 0.1 },
    m: { sx: 0.5, sy: 0.6, zoom: 1.0, fy: 0.62 } },
  { id: "protagonista", act: 1, label: "O protagonista", dur: 8000,
    gl: { fx: 0.5, fy: 0.6, zoom: 1.08, sx: 0.68, sy: 0.47, lx: -0.45, ly: 0.4, key: 1.2, amb: 0.05, rim: 0.75, beam: 0.3, beamX: 0.8, beamAngle: -0.28, beamWidth: 0.22, dust: 0.4, glow: 1, desat: 0.08 },
    m: { sx: 0.5, sy: 0.64, zoom: 0.92 } },
  { id: "talento", act: 2, label: "Talento", dur: 6500, photo: "talento", gl: { exposure: 0, zoom: 2.2, fy: 0.72, beam: 0, dust: 0 } },
  { id: "criatividade", act: 2, label: "Criatividade", dur: 7500,
    gl: { fx: 0.5, fy: 0.715, zoom: 2.25, sx: 0.5, sy: 0.48, lx: 0.55, ly: 0.35, key: 1.15, amb: 0.04, rim: 0.55, beam: 0, dust: 0.25, glow: 0.35, lens: 1, lensR: 0.3, desat: 0.04 },
    m: { zoom: 1.75, sy: 0.55 } },
  { id: "garra", act: 2, label: "Competitividade", dur: 6500, photo: "garra", gl: { exposure: 0, beam: 0, dust: 0, lens: 0 } },
  { id: "rota", act: 2, label: "Trajetória", dur: 7000,
    gl: { fx: 0.5, fy: 0.56, zoom: 0.92, sx: 0.2, sy: 0.43, lx: 0.95, ly: 0.12, key: 0.08, amb: 0.004, rim: 2.6, beam: 0, dust: 0.22, glow: 0.12, desat: 0.55, lens: 0 },
    m: { sx: 0.5, sy: 0.7, zoom: 0.78 } },
  { id: "impacto", act: 2, label: "Impacto", dur: 6500, photo: "impacto", gl: { exposure: 0, beam: 0, dust: 0 } },
  { id: "legado", act: 3, label: "O legado", dur: 0,
    gl: { fx: 0.55, fy: 0.55, zoom: 0.5, sx: 0.5, sy: 0.4, lx: 0, ly: 0.95, key: 1.1, amb: 0.04, rim: 0.9, beam: 1.25, beamX: 0.5, beamAngle: 0, beamWidth: 0.3, dust: 1, glow: 1.15, warm: 0.85, floorFade: 0.3, desat: 0.05 },
    m: { zoom: 0.62, sy: 0.42 } },
];
const PLATE = { entrada: "entrada-fundo", protagonista: "entrada-fundo", legado: "legado-fundo" };
const glFor = (s) => ({ ...DEFAULTS, exposure: 1, lens: 0, ...s.gl, ...(MOBILE ? s.m : null), bgMix: ART[PLATE[s.id]] ? 0.9 : 0 });

/* ---------------- marcação ---------------- */
const letters = (txt) => [...txt].map((c) => (c === " " ? " " : `<span class="u">${c}</span>`)).join("");
const words = (txt) => txt.split(" ").map((w) => `<span class="mask"><span class="u">${w}</span></span>`).join(" ");
const credit = (p) => `<figcaption><b>${p.legenda}</b>Foto: <a href="${p.url}" target="_blank" rel="noopener">${p.autor}</a> · ${p.licenca} · Wikimedia Commons</figcaption>`;

function applyArt() {
  for (const id of ["talento", "garra"]) {
    const a = ART[id];
    if (!a) continue;
    PHOTOS[id] = { ...PHOTOS[id], src: `/experiencia/${a.arquivo}`, legenda: a.legenda || PHOTOS[id].legenda, autor: "Arte digital gerada com Higgsfield", licenca: "não documental", url: "/experiencia/HIGGSFIELD.md" };
  }
}
function markup() {
  const hint = COARSE ? "Deslize para avançar" : "Role, use ← → ou os controles";
  return `
  <canvas class="xp-gl" aria-hidden="true"></canvas>
  <div class="xp-fallback" aria-hidden="true"><img src="/assets/hero/person-diffuse.webp" alt=""></div>

  <figure class="xp-photo" data-s="talento"><div class="ph"><img alt="Neymar de perfil, no escuro, na final do Mundial de Clubes de 2011" src="${PHOTOS.talento.src}"></div><div class="sweep" aria-hidden="true"></div><div class="shade"></div>${credit(PHOTOS.talento)}</figure>
  <figure class="xp-photo" data-s="garra"><div class="ph">${Array.from({ length: 6 }, (_, k) => `<div class="slice" style="top:${(k * 100) / 6}%;height:${100 / 6 + 0.2}%"><img alt="" src="${PHOTOS.garra.src}" style="top:${(-k * 100)}%"></div>`).join("")}</div><div class="shade"></div>${credit(PHOTOS.garra)}</figure>
  <figure class="xp-photo" data-s="impacto"><div class="ph"><img alt="Neymar cercado por fotógrafos na Copa do Mundo de 2026" src="${PHOTOS.impacto.src}"></div><div class="shade"></div>${credit(PHOTOS.impacto)}</figure>

  <div class="xp-route" aria-hidden="true"><svg viewBox="0 0 1000 120" preserveAspectRatio="none">
    <line class="rail" x1="0" y1="60" x2="1000" y2="60" vector-effect="non-scaling-stroke"/>
    <line class="run" x1="0" y1="60" x2="1000" y2="60" vector-effect="non-scaling-stroke" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
  </svg></div>

  <section class="xp-scene" data-s="entrada" aria-label="Ato I, a entrada">
    <div class="box">
      <p class="ey">Ato I · A entrada</p>
      <h1 class="xp-name" aria-label="Neymar Jr"><span class="row">${letters("NEYMAR")}</span><span class="row">${letters("JR")}<span class="u dot">.</span></span></h1>
      <p class="hint"><i></i>Um retrato em quatro atos</p>
    </div>
  </section>
  <section class="xp-scene" data-s="protagonista" aria-label="Ato II, o protagonista">
    <div class="box">
      <p class="ey">Ato II · O protagonista</p>
      <p class="ph-line">${words("Antes do drible, existe o olhar.")}</p>
      <p class="hint"><i></i>${COARSE ? "Toque e arraste: a luz acompanha" : "Mova o mouse: a luz acompanha"}</p>
    </div>
  </section>
  <section class="xp-scene" data-s="talento" aria-label="Talento">
    <p class="word" aria-hidden="true">${letters("TALENTO")}</p>
    <div class="box"><p class="ey">Ato III · Talento</p><p class="ph-line">${words("Ele enxerga o espaço um instante antes de o espaço existir.")}</p></div>
  </section>
  <section class="xp-scene" data-s="criatividade" aria-label="Criatividade">
    <p class="word" aria-hidden="true">${letters("CRIATIVIDADE")}</p>
    <div class="box"><p class="ey">Ato III · Criatividade</p><p class="ph-line">${words("Toda jogada começa como uma ideia que ninguém mais teve coragem de tentar.")}</p>
    <p class="hint"><i></i>${COARSE ? "Arraste sobre o rosto" : "Passe o mouse sobre o rosto"}</p></div>
  </section>
  <section class="xp-scene" data-s="garra" aria-label="Competitividade">
    <p class="word" aria-hidden="true">${letters("GARRA")}</p>
    <div class="box"><p class="ey">Ato III · Competitividade</p><p class="ph-line">${words("Placar contra é só o começo da conversa.")}</p></div>
  </section>
  <section class="xp-scene" data-s="rota" aria-label="Trajetória">
    <p class="word" aria-hidden="true">${letters("TRAJETÓRIA")}</p>
    <div class="box"><p class="ey">Ato III · Trajetória</p><p class="ph-line">${words("Quatro clubes. Três continentes. O mesmo jeito de jogar.")}</p></div>
  </section>
  <section class="xp-scene" data-s="impacto" aria-label="Impacto">
    <p class="word" aria-hidden="true">${letters("IMPACTO")}</p>
    <div class="box"><p class="ey">Ato III · Impacto cultural</p><p class="ph-line">${words("Quando ele entra em campo, as lentes mudam de direção.")}</p></div>
  </section>
  <section class="xp-scene" data-s="legado" aria-label="Ato IV, o legado">
    <div class="head">
      <p class="ey">Ato IV · O legado</p>
      <h2 class="word"><span class="mask">${letters("A OUSADIA")}</span><br><span class="mask">${letters("FICA")}<span class="u dot">.</span></span></h2>
      <p class="ph-line">${words("O jogo termina no apito. O jeito de jogar fica na memória de quem viu.")}</p>
      <div class="xp-again"><button type="button" data-act="restart">↺ Rever do início</button><button type="button" data-act="exit">Voltar ao início do site</button></div>
    </div>
    <nav class="xp-paths" aria-label="Continue explorando">
      <a href="/carreira/"><small>A trajetória</small><b>Carreira</b></a>
      <a href="/titulos/"><small>As conquistas</small><b>Títulos</b></a>
      <a href="/santos/"><small>Onde começou</small><b>Santos</b></a>
      <a href="/vestiario/"><small>As camisas</small><b>Vestiário</b></a>
    </nav>
  </section>

  <header class="xp-top">
    <p class="xp-brand"><b>Neymar</b> <span>· The Experience</span></p>
    <p class="xp-act" aria-hidden="true"></p>
    <button class="xp-exit" type="button" data-act="exit"><span>Sair</span><i aria-hidden="true"></i></button>
  </header>
  <div class="xp-ctrl">
    <div class="xp-btns">
      <button type="button" class="prev" aria-label="Cena anterior"><svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5"/></svg></button>
      <button type="button" class="pp" aria-label="Pausar" aria-pressed="false"><svg viewBox="0 0 14 14"><g class="pa"><path d="M4.5 2.5v9M9.5 2.5v9"/></g><g class="pl"><path d="M4 2.5l7 4.5-7 4.5z"/></g></svg></button>
      <button type="button" class="next" aria-label="Próxima cena"><svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5"/></svg></button>
    </div>
    <div class="xp-prog" role="group" aria-label="Atos">
      ${ACTS.map((a, i) => `<button type="button" data-act-i="${i}"><i></i>${i === 2 ? `<span class="ticks" aria-hidden="true">${"<span></span>".repeat(6)}</span>` : ""}<span>${ROMAN[i]} · ${a}</span></button>`).join("")}
    </div>
    <p class="xp-hint">${hint}</p>
  </div>
  <div class="xp-black"></div>
  <div class="xp-loading" aria-hidden="true"><span>NJR</span><i></i></div>
  <p class="sr-only" aria-live="polite" data-live></p>`;
}

/* ---------------- a experiência ---------------- */
let active = null;
let prefetched = null;

export function prefetch() {
  if (prefetched) return prefetched;
  const big = !MOBILE;
  const urls = [big ? "/assets/hero/person-diffuse.webp" : `${BASE}assets/person-diffuse-1024.webp`,
    big ? "/assets/hero/person-alpha.webp" : `${BASE}assets/person-alpha-1024.webp`,
    `${BASE}assets/person-normal-suave.png`, `${BASE}assets/person-depth-suave.png`];
  prefetched = Promise.all(urls.map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); }));
  return prefetched;
}

/* origin: "home" (camada sobre a home, com a transição pelo retrato) ou "direct" (página /experiencia/) */
export async function openExperience({ origin = "direct", onExit } = {}) {
  if (active) return;
  await Promise.race([artReady, wait(600)]);
  applyArt();
  const ac = new AbortController();
  const on = (t, ev, fn, o = {}) => t.addEventListener(ev, fn, { ...o, signal: ac.signal });
  const root = document.createElement("div");
  root.className = "xp";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Neymar: The Experience");
  root.tabIndex = -1;
  root.innerHTML = markup();
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const black = $(".xp-black"), loading = $(".xp-loading"), live = $("[data-live]");
  const sceneEl = (id) => $(`.xp-scene[data-s="${id}"]`);
  const photoEl = (id) => $(`.xp-photo[data-s="${id}"]`);
  const lastFocus = document.activeElement;

  // ---- palco ----
  let stage = null;
  try {
    stage = new Stage($(".xp-gl"), { mobile: MOBILE });
  } catch (e) {
    root.classList.add("no-gl");
  }
  const st = { ...glFor(SCENES[0]), exposure: 0 };     // estado-base (interpolado entre cenas)
  let cur = 0, busy = false, queued = null, paused = REDUCED, closing = false, t0 = performance.now(), sceneT = 0;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, sx: 0.5, sy: 0.6, last: 0 };
  let raf = 0;
  let glTween = null;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
    if (glTween) glTween(now);
    // cena viva: a câmera respira, a luz segue o ponteiro, a lente procura o rosto
    const s = { ...st };
    const t = (now - t0) / 1000;
    const id = SCENES[cur].id;
    if (!REDUCED) {
      s.zoom *= 1 + Math.min(sceneT, 12) * 0.006;
      s.sx += ptr.x * 0.012; s.sy -= ptr.y * 0.008;
      if (id === "protagonista" || id === "entrada") { s.lx += ptr.x * 0.9; s.ly += -ptr.y * 0.5; }
      if (id === "legado") { s.beamAngle += Math.sin(t * 0.25) * 0.05; s.lx += ptr.x * 0.4; }
      if (id === "rota") { s.lx = 0.95 - Math.sin(t * 0.4) * 0.1; }
    }
    if (st.lens > 0.01) {
      const idle = COARSE || now - ptr.last > 2200;
      const tt = REDUCED ? 0.6 : t;
      const ax = 0.5 + Math.cos(tt * 0.7) * 0.12, ay = 0.56 + Math.sin(tt * 0.9) * 0.1;
      s.lensX = idle ? ax : ptr.sx; s.lensY = idle ? ay : ptr.sy;
      if (COARSE && now - ptr.last < 2200) { s.lensX = ptr.sx; s.lensY = ptr.sy; }
    }
    if (stage) {
      stage.pointer[0] = ptr.x; stage.pointer[1] = -ptr.y;
      Object.assign(stage.state, s);
      if (st.exposure > 0.002 || stage.dirty) { stage.render(now); stage.dirty = st.exposure > 0.002; }
    }
    // relógio da cena (autoplay)
    if (!paused && !busy && !closing && SCENES[cur].dur) {
      sceneT += 1 / 60;
      const p = clamp01((sceneT * 1000) / SCENES[cur].dur);
      setProgress(p);
      if (p >= 1) go(cur + 1);
    }
  };

  function tweenStage(target, dur, ease = easeInOut) {
    const from = { ...st };
    const t1 = performance.now();
    return new Promise((done) => {
      if (REDUCED || dur <= 0) { Object.assign(st, target); glTween = null; done(); return; }
      glTween = (now) => {
        const u = Math.min(1, (now - t1) / dur), e = ease(u);
        for (const k in target) if (typeof target[k] === "number") st[k] = from[k] + (target[k] - from[k]) * e;
        if (u >= 1) { glTween = null; done(); }
      };
    });
  }

  // ---- interface ----
  const actEl = $(".xp-act"), progBtns = $$(".xp-prog button"), ppBtn = $(".pp"), prevBtn = $(".prev"), nextBtn = $(".next");
  function setProgress(p) {
    const s = SCENES[cur];
    progBtns.forEach((b, i) => {
      let v = 0;
      if (i < s.act) v = 1;
      else if (i === s.act) {
        const inAct = SCENES.filter((x) => x.act === i);
        const k = inAct.indexOf(s);
        v = s.dur ? (k + p) / inAct.length : 1;
      }
      b.querySelector("i").style.transform = `scaleX(${v})`;
      b.classList.toggle("is-on", i === s.act);
      b.toggleAttribute("aria-current", i === s.act);
    });
  }
  function updateUI() {
    const s = SCENES[cur];
    actEl.innerHTML = `Ato ${ROMAN[s.act]} · <b>${s.act === 2 ? s.label : ACTS[s.act]}</b>`;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === SCENES.length - 1;
    live.textContent = `Ato ${ROMAN[s.act]}, ${s.label}. Cena ${cur + 1} de ${SCENES.length}.`;
    setProgress(0);
  }
  function setPaused(v) {
    paused = v;
    ppBtn.setAttribute("aria-pressed", String(v));
    ppBtn.setAttribute("aria-label", v ? "Continuar" : "Pausar");
  }

  // ---- entradas e saídas de texto: cada cena tem a sua coreografia ----
  function textIn(id, dir) {
    const el = sceneEl(id);
    el.classList.add("is-on");
    el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    const us = [...el.querySelectorAll(".word .u, .xp-name .u")];
    const ws = [...el.querySelectorAll(".ph-line .u")];
    const rest = [...el.querySelectorAll(".ey, .hint, .xp-paths, .xp-again")];
    const D = { entrada: 900, protagonista: 500, talento: 450, criatividade: 650, garra: 350, rota: 600, impacto: 900, legado: 900 }[id] ?? 400;
    if (id === "entrada") us.forEach((u, k) => anim(u, [{ transform: "translateY(105%)" }, { transform: "none" }], { duration: 1100, delay: D + k * 55, easing: "cubic-bezier(0.33, 0, 0, 1)" }));
    else if (id === "criatividade") us.forEach((u, k) => anim(u, [{ opacity: 0, transform: `translateY(${k % 2 ? "" : "-"}40%) rotate(${k % 2 ? 6 : -6}deg)` }, { opacity: 1, transform: "none" }], { duration: 900, delay: D + k * 35 }));
    else if (id === "garra") us.forEach((u, k) => anim(u, [{ opacity: 0, transform: "scale(1.6)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 520, delay: D + k * 60, easing: "cubic-bezier(0.2, 0.9, 0.1, 1)" }));
    else if (id === "rota") us.forEach((u, k) => anim(u, [{ opacity: 0, transform: "translateX(-0.4em)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: D + k * 40 }));
    else if (id === "legado") us.forEach((u, k) => anim(u, [{ opacity: 0, transform: "translateY(60%)" }, { opacity: 1, transform: "none" }], { duration: 1200, delay: D + k * 45, easing: "cubic-bezier(0.33, 0, 0, 1)" }));
    else us.forEach((u, k) => anim(u, [{ opacity: 0, transform: `translateX(${dir >= 0 ? 0.3 : -0.3}em)` }, { opacity: 1, transform: "none" }], { duration: 900, delay: D + k * 45 }));
    ws.forEach((u, k) => anim(u, [{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 900, delay: D + 350 + k * 40, easing: "cubic-bezier(0.33, 0, 0, 1)" }));
    rest.forEach((r, k) => anim(r, [{ opacity: 0, transform: "translateY(0.6rem)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: D + 200 + k * 160 + (r.matches(".xp-paths") ? 700 : 0) }));
    if (id === "legado") $$(".xp-paths a").forEach((a, k) => anim(a, [{ opacity: 0, transform: "translateY(1.5rem)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: D + 1300 + k * 90 }));
  }
  async function textOut(id) {
    const el = sceneEl(id);
    const a = anim(el, [{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(6px)" }], { duration: 380, easing: "ease-in" });
    await a.finished.catch(() => {});
    el.classList.remove("is-on");
    a.cancel();
  }

  // ---- fotos ----
  async function photoIn(id, dir) {
    const f = photoEl(id), ph = f.querySelector(".ph");
    f.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    f.classList.add("is-on");
    if (REDUCED || dir < 0) { await anim(f, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 }).finished; return; }
    if (id === "talento") {
      anim(f, [{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1300, easing: "cubic-bezier(0.7, 0, 0.2, 1)" });
      anim(ph, [{ transform: "scale(1.2) translateX(4%)" }, { transform: "scale(1.04)" }], { duration: 7000, easing: "cubic-bezier(0.2, 0, 0, 1)" });
      anim(f.querySelector(".sweep"), [{ transform: "translateX(-60%)" }, { transform: "translateX(60%)" }], { duration: 3800, delay: 700, easing: "ease-in-out", iterations: 1 });
      await wait(1300);
    } else if (id === "garra") {
      f.querySelectorAll(".slice").forEach((s, k) => anim(s, [{ transform: `translateX(${k % 2 ? 100 : -100}%)` }, { transform: "none" }], { duration: 950, delay: k * 70, easing: "cubic-bezier(0.7, 0, 0.2, 1)" }));
      anim(ph, [{ transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 6500 });
      await wait(1300);
    } else if (id === "impacto") {
      anim(f, [{ clipPath: "inset(49.8% 0 49.8% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1000, easing: "cubic-bezier(0.7, 0, 0.2, 1)" });
      anim(ph, [{ transform: "scale(2.3)", transformOrigin: "60% 38%" }, { transform: "scale(1.02)", transformOrigin: "60% 38%" }], { duration: 3200, delay: 300, easing: "cubic-bezier(0.6, 0, 0.1, 1)" });
      await wait(1100);
    }
  }
  async function photoOut(id, toId, dir) {
    const f = photoEl(id), ph = f.querySelector(".ph");
    let a;
    if (REDUCED || dir < 0) a = anim(f, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    else if (id === "garra" && toId === "rota") {
      // a foto desmorona numa linha, que vira a linha da trajetória
      a = anim(f, [{ transform: "none", filter: "brightness(1)" }, { transform: "scaleY(0.003)", filter: "brightness(4)" }], { duration: 800, easing: "cubic-bezier(0.7, 0, 0.2, 1)" });
    } else if (id === "talento") {
      a = anim(f, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(1.25)" }], { duration: 800, easing: "cubic-bezier(0.7, 0, 0.84, 0)" });
    } else {
      anim(ph, [{ transform: getComputedStyle(ph).transform }, { transform: "scale(0.92)" }], { duration: 900, easing: "ease-in" });
      a = anim(f, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: "ease-in" });
    }
    await a.finished.catch(() => {});
    f.classList.remove("is-on");
    f.getAnimations({ subtree: true }).forEach((x) => x.cancel());
  }
  // trajetória: a linha corre e acende as cidades
  const ROUTE = [["Santos", "Brasil"], ["Barcelona", "Espanha"], ["Paris", "França"], ["Riade", "Arábia Saudita"], ["Santos", "de volta"]];
  function routeIn(fromLine) {
    const r = $(".xp-route"), run = r.querySelector(".run");
    r.querySelectorAll(".lab").forEach((l) => l.remove());
    const x0 = MOBILE ? 9 : 47, x1 = MOBILE ? 91 : 95;     // % da largura
    const D = fromLine ? 500 : 300, RUN = 2600;
    ROUTE.forEach(([c, sub], k) => {
      const x = x0 + ((x1 - x0) * k) / (ROUTE.length - 1);
      const l = document.createElement("div");
      l.className = "lab";
      l.style.left = `${x}%`;
      l.dataset.up = k % 2 ? "0" : "1";
      l.innerHTML = `<i></i><p><b>${c}</b><small>${sub}</small></p>`;
      r.append(l);
      const at = D + RUN * (x / 100);
      anim(l.querySelector("i"), [{ transform: "translate(-50%, -50%) scale(0)" }, { transform: "translate(-50%, -50%) scale(1)" }], { duration: 500, delay: at, easing: "cubic-bezier(0.2, 0.9, 0.1, 1.4)" });
      anim(l.querySelector("p"), [{ opacity: 0, transform: `translate(-50%, ${k % 2 ? 8 : -8}px)` }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 700, delay: at + 150 });
    });
    r.classList.add("is-on");
    anim(r, [{ opacity: fromLine ? 1 : 0 }, { opacity: 1 }], { duration: 400 });
    anim(run, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: RUN, delay: D, easing: "cubic-bezier(0.45, 0, 0.2, 1)" });
  }
  async function routeOut(toId) {
    const r = $(".xp-route");
    const a = toId === "impacto" && !REDUCED
      ? anim(r, [{ opacity: 1, transform: "scaleX(1)" }, { opacity: 0, transform: "scaleX(1.05)" }], { duration: 600 })
      : anim(r, [{ opacity: 1 }, { opacity: 0 }], { duration: 450 });
    await a.finished.catch(() => {});
    r.classList.remove("is-on");
    r.getAnimations({ subtree: true }).forEach((x) => x.cancel());
  }

  // ---- troca de cena ----
  async function go(n, { force = false } = {}) {
    if (closing) return;
    n = Math.max(0, Math.min(SCENES.length - 1, n));
    if (n === cur && !force) return;
    if (busy) { queued = n; return; }
    busy = true;
    const from = SCENES[cur], to = SCENES[n], dir = n > cur ? 1 : -1;
    cur = n; sceneT = 0;
    updateUI();
    if (to.id === "criatividade") loadOverlay();
    loadPlate(to.id);
    const out = [textOut(from.id)];
    if (from.photo) out.push(photoOut(from.photo, to.id, dir));
    if (from.id === "rota") out.push(routeOut(to.id));
    const target = glFor(to);
    // o palco: cada passagem tem o seu movimento de câmera
    let camDur = 1500, camEase = easeInOut;
    if (to.photo) { camDur = 900; camEase = easeIn; }
    if (from.photo && !to.photo) { Object.assign(st, { ...target, exposure: 0, zoom: target.zoom * (dir > 0 ? 1.35 : 0.8) }); camDur = 1700; camEase = easeOut; }
    if (to.id === "legado" && dir > 0) { Object.assign(st, { ...target, exposure: 0, beam: 0, zoom: target.zoom * 1.25, sy: target.sy - 0.08 }); camDur = 2600; camEase = easeOut; }
    const cam = tweenStage(target, camDur, camEase);
    if (from.photo) await Promise.all(out); else await Promise.race([Promise.all(out), wait(420)]);
    if (to.photo) { await wait(to.id === "talento" ? 350 : 150); photoIn(to.photo, dir); }
    if (to.id === "rota") routeIn(from.id === "garra" && dir > 0);
    textIn(to.id, dir);
    await Promise.race([cam, wait(900)]);
    busy = false;
    if (queued !== null) { const q = queued; queued = null; go(q); }
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);

  let plateNow = null;
  function loadPlate(id) {
    const a = ART[PLATE[id]];
    if (!a || !stage || plateNow === a.id) return;
    plateNow = a.id;
    stage.load("uBgTex", `/experiencia/${a.arquivo}`).catch(() => {});
  }
  let overlayLoading = false;
  function loadOverlay() {
    if (overlayLoading || !stage) return;
    overlayLoading = true;
    stage.load("uOverlay", MOBILE ? `${BASE}assets/overlay-1024.webp` : "/assets/hero/overlay.webp").catch(() => {});
  }

  // ---- entrada de interação ----
  on(root, "pointermove", (e) => {
    ptr.tx = (e.clientX / innerWidth) * 2 - 1; ptr.ty = (e.clientY / innerHeight) * 2 - 1;
    ptr.sx = e.clientX / innerWidth; ptr.sy = 1 - e.clientY / innerHeight; ptr.last = performance.now();
  }, { passive: true });
  let down = null;
  on(root, "pointerdown", (e) => { if (e.pointerType !== "mouse") down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  on(root, "pointerup", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (e.target.closest("a, button")) return;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    const fwd = Math.abs(dx) > Math.abs(dy) ? dx < 0 : dy < 0;
    fwd ? next() : prev();
  });
  let wheelAcc = 0, wheelLock = 0;
  on(root, "wheel", (e) => {
    e.preventDefault();
    const now = performance.now();
    if (now < wheelLock) return;
    wheelAcc += e.deltaY + e.deltaX;
    if (Math.abs(wheelAcc) > 60) { wheelLock = now + 1100; wheelAcc > 0 ? next() : prev(); wheelAcc = 0; }
  }, { passive: false });
  on(document, "keydown", (e) => {
    const k = e.key;
    const onCtl = e.target.closest?.("a, button");
    if (k === "Escape") { e.preventDefault(); requestExit(); }
    else if (["ArrowRight", "ArrowDown", "PageDown"].includes(k) || (k === " " && !onCtl)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); prev(); }
    else if (k === "Home") { e.preventDefault(); go(0); }
    else if (k === "End") { e.preventDefault(); go(SCENES.length - 1); }
    else if (k === "p" || k === "k") setPaused(!paused);
    else if (k === "Tab") {
      // foco preso na experiência
      const f = $$("a[href], button:not(:disabled)").filter((x) => x.offsetParent !== null && !x.closest(".xp-scene:not(.is-on)"));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  on(prevBtn, "click", prev);
  on(nextBtn, "click", next);
  on(ppBtn, "click", () => setPaused(!paused));
  progBtns.forEach((b, i) => on(b, "click", () => go(SCENES.findIndex((s) => s.act === i))));
  $$('[data-act="exit"]').forEach((b) => on(b, "click", requestExit));
  on($('[data-act="restart"]'), "click", () => go(0));
  on(document, "visibilitychange", () => { if (document.hidden && !paused) { setPaused(true); resumeOnShow = true; } else if (!document.hidden && resumeOnShow) { resumeOnShow = false; setPaused(false); } });
  let resumeOnShow = false;
  on(window, "resize", () => stage?.resize());

  // ---- saída ----
  let exitResolve;
  const exited = new Promise((r) => (exitResolve = r));
  function requestExit() {
    if (closing) return;
    if (origin === "home" && history.state?.njrXp) { history.back(); return; }   // popstate fecha
    doExit();
  }
  async function doExit() {
    if (closing) return;
    closing = true;
    setPaused(true);
    textOut(SCENES[cur].id);
    if (SCENES[cur].photo) photoOut(SCENES[cur].photo, null, -1);
    if (SCENES[cur].id === "rota") routeOut(null);
    await tweenStage({ exposure: 0, zoom: st.zoom * 1.15 }, 650, easeIn);
    if (origin === "home") await heroIn(root, black);
    else { await onExit?.(); }
    cleanup();
    exitResolve();
  }
  on(window, "popstate", () => { if (origin === "home" && !history.state?.njrXp) doExit(); });

  function cleanup() {
    cancelAnimationFrame(raf);
    ac.abort();
    stage?.dispose();
    root.remove();
    document.documentElement.classList.remove("xp-open");
    active = null;
    lastFocus?.focus?.({ preventScroll: true });
  }

  // ---- abertura ----
  active = { root };
  document.body.append(root);
  stage?.resize();                                     // só agora o canvas tem tamanho de verdade
  const ro = new ResizeObserver(() => stage?.resize());
  ro.observe(root);
  ac.signal.addEventListener("abort", () => ro.disconnect());
  document.documentElement.classList.add("xp-open");
  setPaused(paused);
  updateUI();
  $(".xp-ctrl").style.opacity = 0; $(".xp-top").style.opacity = 0;

  if (origin === "home") {
    root.style.background = "transparent";
    $(".xp-gl").style.opacity = 0;
    if (!history.state?.njrXp) history.pushState({ njrXp: 1 }, "", BASE);
    await heroOut(root, black);
    root.style.background = "";
    $(".xp-gl").style.opacity = "";
  } else {
    black.style.opacity = 1;
  }

  // texturas: o retrato aparece só quando chegou (o indicador cobre a espera)
  loading.style.opacity = 0;
  const showLoad = setTimeout(() => (loading.style.opacity = 1), 350);
  if (stage) {
    const big = !MOBILE;
    await Promise.race([Promise.all([
      stage.load("uDiffuse", big ? "/assets/hero/person-diffuse.webp" : `${BASE}assets/person-diffuse-1024.webp`),
      stage.load("uAlpha", big ? "/assets/hero/person-alpha.webp" : `${BASE}assets/person-alpha-1024.webp`),
      stage.load("uNormal", `${BASE}assets/person-normal-suave.png`),
      stage.load("uDepth", `${BASE}assets/person-depth-suave.png`),
    ]).catch(() => root.classList.add("no-gl")), wait(8000)]);
  }
  clearTimeout(showLoad);
  loading.style.opacity = 0;
  setTimeout(() => loading.remove(), 450);
  loadPlate("entrada");
  raf = requestAnimationFrame(frame);

  // ATO I: do escuro (de dentro do olho) a câmera recua e a luz varre o rosto
  black.style.opacity = 0;
  Object.assign(st, glFor(SCENES[0]), { exposure: 0, zoom: (MOBILE ? 2.6 : 3.4), fy: 0.735, lx: -1.5, key: 0.5, beam: 0 });
  sceneEl("entrada").classList.add("is-on");
  textIn("entrada", 1);
  tweenStage(glFor(SCENES[0]), 2800, easeOut);
  anim($(".xp-top"), [{ opacity: 0, transform: "translateY(-0.5rem)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 1400 });
  anim($(".xp-ctrl"), [{ opacity: 0, transform: "translateY(0.5rem)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 1700 });
  $(".xp-ctrl").style.opacity = ""; $(".xp-top").style.opacity = "";
  root.focus({ preventScroll: true });
  return exited;
}

/* ---------------- transição a partir da home: a câmera entra no retrato ---------------- */
function heroParts() {
  const hero = document.getElementById("hero");
  return {
    hero,
    scene: document.getElementById("hero-scene") || hero?.querySelector(".hero-fallback"),
    ramp: hero?.querySelector(".hero-ramp"),
    ui: [document.getElementById("hero-header"), hero?.querySelector(".hero-identity"), hero?.querySelector(".hero-panels"), document.getElementById("hero-actions")].filter(Boolean),
  };
}
function facePoint() {
  const box = document.getElementById("hero-fitbox");
  if (box && box.offsetParent !== null) {
    const b = box.getBoundingClientRect();
    if (b.height > 50) return { x: b.left + b.width / 2, y: b.top + b.height * 0.27 };
  }
  return { x: innerWidth / 2, y: innerHeight * 0.36 };
}
function irisMask(el, x, y, r) {
  const m = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #000 ${r + 1.5}px)`;
  el.style.webkitMaskImage = m; el.style.maskImage = m;
}
async function heroOut(root, black) {
  const { scene, ramp, ui } = heroParts();
  const f = facePoint();
  const R = Math.hypot(Math.max(f.x, innerWidth - f.x), Math.max(f.y, innerHeight - f.y));
  window.lenis?.stop();
  black.style.opacity = 1;
  irisMask(black, f.x, f.y, R);
  if (REDUCED) { irisMask(black, f.x, f.y, 0); black.style.maskImage = black.style.webkitMaskImage = "none"; return; }
  ui.forEach((el, k) => anim(el, [{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: ["translateY(-1.5rem)", "translateX(-2.5rem)", "translateX(2.5rem)", "translateY(1.5rem)"][k] || "none", filter: "blur(6px)" }],
    { duration: 520, delay: k * 40, easing: "cubic-bezier(0.7, 0, 0.84, 0)" }));
  if (ramp) anim(ramp, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
  if (scene) {
    const r = scene.getBoundingClientRect();
    scene.style.transformOrigin = `${f.x - r.left}px ${f.y - r.top}px`;
    anim(scene, [{ transform: "none", filter: "brightness(1)" }, { transform: "scale(3.2)", filter: "brightness(0.55)" }], { duration: 1150, easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
  }
  // a íris fecha no rosto enquanto a câmera avança
  await wait(260);
  await tween(900, (e) => irisMask(black, f.x, f.y, R * (1 - e)), (t) => t * t * (3 - 2 * t));
  black.style.maskImage = black.style.webkitMaskImage = "none";
}
async function heroIn(root, black) {
  const { scene, ramp, ui } = heroParts();
  const f = facePoint();
  const R = Math.hypot(Math.max(f.x, innerWidth - f.x), Math.max(f.y, innerHeight - f.y));
  root.style.background = "transparent";
  root.querySelector(".xp-gl").style.opacity = 0;
  root.querySelectorAll(".xp-top, .xp-ctrl, .xp-scene, .xp-photo").forEach((el) => (el.style.visibility = "hidden"));
  black.style.opacity = 1;
  irisMask(black, f.x, f.y, 0);
  if (scene) {
    scene.getAnimations().forEach((a) => a.cancel());
    anim(scene, [{ transform: "scale(2.4)", filter: "brightness(0.6)" }, { transform: "none", filter: "brightness(1)" }], { duration: 1200, easing: "cubic-bezier(0.2, 0, 0, 1)" });
  }
  ui.forEach((el, k) => { el.getAnimations().forEach((a) => a.cancel()); anim(el, [{ opacity: 0, transform: "translateY(0.8rem)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 500 + k * 70 }); });
  if (ramp) { ramp.getAnimations().forEach((a) => a.cancel()); anim(ramp, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 400 }); }
  await tween(REDUCED ? 0 : 1000, (e) => irisMask(black, f.x, f.y, R * e), (t) => 1 - Math.pow(1 - t, 3));
  window.lenis?.start();
  // limpa os estilos deixados na home quando as animações terminam
  setTimeout(() => {
    if (scene) { scene.getAnimations().forEach((a) => a.cancel()); scene.style.transformOrigin = ""; }
    ui.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    ramp?.getAnimations().forEach((a) => a.cancel());
  }, REDUCED ? 0 : 1500);
}
