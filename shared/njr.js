/* NJR — motor compartilhado das páginas internas.
   O núcleo (laço rAF único, molas, motion, splitText, buildHeading, inView, scrub) é o mesmo da home
   (index.html), copiado sem mudanças de comportamento. Em cima dele: cabeçalho, transição entre
   páginas (placa preta com filete amarelo), revelações por rolagem, contadores e profundidade. */

export const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED ? Math.min(ms, 50) : ms));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
if (REDUCED) document.documentElement.classList.add("njr-reduced");

export const PAGES = [
  { label: "Jogador", href: "/jogador/" },
  { label: "Carreira", href: "/carreira/" },
  { label: "Títulos", href: "/titulos/" },
  { label: "Santos", href: "/santos/" },
  { label: "Loja", href: "/loja/" },
];
export const nextPage = (href) => PAGES[(PAGES.findIndex((p) => p.href === href) + 1) % PAGES.length];

// ---- o laço rAF único ----
const subs = new Set();
let rafId = 0;
function loop(time) {
  rafId = requestAnimationFrame(loop);
  for (const s of [...subs]) {
    if (!subs.has(s)) continue;
    if (time - s.last > s.fr()) { s.last = time; s.cb(time); }
  }
}
export function subscribe(cb, fr = () => 0) {
  const s = { cb, fr, last: -Infinity };
  subs.add(s);
  if (!rafId) rafId = requestAnimationFrame(loop);
  return () => {
    subs.delete(s);
    if (!subs.size && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  };
}

// ---- Lenis (mesma versão da home) ----
export let lenis = null;
export function initLenis() {
  if (REDUCED) return Promise.resolve(null);
  subscribe((time) => lenis?.raf(time));
  return import("https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs")
    .then(({ default: Lenis }) => { lenis = new Lenis({ smoothWheel: true }); window.lenis = lenis; return lenis; })
    .catch(() => null);
}

// ---- molas (react-spring), iguais às da home ----
export const CFG = {
  REVEAL: { tension: 90, friction: 26 }, ROW: { tension: 170, friction: 24 }, ITEM: { tension: 170, friction: 24 },
  SHEET: { tension: 190, friction: 26 }, FIGURE: { tension: 200, friction: 24 }, TYPE: { tension: 210, friction: 24 },
  YEAR: { tension: 190, friction: 24 }, COPY: { tension: 110, friction: 26 }, COPY2: { tension: 150, friction: 24 },
  NAME: { tension: 190, friction: 24 }, CLEAR: { tension: 140, friction: 26 }, LABEL: { tension: 110, friction: 26 },
  YEAR_SETTLE: { tension: 32, friction: 26 }, TRIGGER: { tension: 140, friction: 30 }, NOW: { duration: 1 },
};
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const activeSprings = new Set();
let springUnsub = null;
function pumpSprings(now) {
  for (const s of [...activeSprings]) s.step(now);
  if (!activeSprings.size && springUnsub) { springUnsub(); springUnsub = null; }
}
export class Spring {
  constructor(value, config = CFG.REVEAL, onChange = null) {
    this.value = value; this.target = value; this.velocity = 0; this.config = config;
    this.onChange = onChange; this.onRest = null; this.startAt = 0; this.last = null; this.tFrom = null; this.tStart = 0;
  }
  to(target, { delay = 0, config } = {}) {
    if (config) this.config = config;
    if (REDUCED && !this.config.duration) delay = Math.min(delay, 0);
    this.target = target; this.startAt = performance.now() + delay; this.last = null; this.tFrom = null;
    activeSprings.add(this);
    if (!springUnsub) springUnsub = subscribe(pumpSprings);
    return this;
  }
  set(v) { this.value = this.target = v; this.velocity = 0; activeSprings.delete(this); this.onChange?.(v); }
  stop() { activeSprings.delete(this); }
  step(now) {
    if (now < this.startAt) return;
    const c = this.config;
    if (c.duration != null) {
      if (this.tFrom === null) { this.tFrom = this.value; this.tStart = now; }
      const u = c.duration <= 1 || REDUCED ? 1 : Math.min(1, (now - this.tStart) / c.duration);
      this.value = this.tFrom + (this.target - this.tFrom) * (c.easing ? c.easing(u) : u);
      this.onChange?.(this.value);
      if (u >= 1) { activeSprings.delete(this); this.onRest?.(); }
      return;
    }
    if (REDUCED) { this.set(this.target); this.onRest?.(); return; }
    if (this.last === null) this.last = Math.max(this.startAt, now - 16);
    const dt = Math.min(64, now - this.last);
    this.last = now;
    const { tension, friction } = c;
    let x = this.value, v = this.velocity;
    const to = this.target;
    const steps = Math.ceil(dt);
    for (let i = 0; i < steps; i++) {
      const a = -tension * 0.000001 * (x - to) - friction * 0.001 * v;
      v += a; x += v;
    }
    this.value = x; this.velocity = v;
    if (Math.abs(v) < 0.0001 && Math.abs(to - x) < 0.001) {
      this.value = to; this.velocity = 0; activeSprings.delete(this);
      this.onChange?.(to); this.onRest?.(); return;
    }
    this.onChange?.(x);
  }
}
export function tween(from, to, duration, easing, onChange, onRest) {
  const s = new Spring(from, { duration, easing }, onChange);
  s.onRest = onRest;
  s.to(to);
  return s;
}

// ---- um movimento de DOM: uma mola controla opacidade + translateY (+ scaleX) ----
export function motion(el, { y = null, scaleX = false, opacity = true, config = CFG.REVEAL } = {}) {
  let yv = 0, yu = "";
  if (y) { const m = /^(-?[\d.]+)(\D*)$/.exec(y); yv = parseFloat(m[1]); yu = m[2] || "px"; }
  const s = new Spring(0, config, (p) => {
    if (opacity) el.style.opacity = String(Math.min(1, Math.max(0, p)));
    const t = [];
    if (y) t.push(`translateY(${(yv * (1 - p)).toFixed(4)}${yu})`);
    if (scaleX) t.push(`scaleX(${Math.max(0, p)})`);
    if (t.length) el.style.transform = t.join(" ");
  });
  s.set(0);
  return {
    spring: s,
    play(delay = 0, config) { s.to(1, { delay, config }); return this; },
    reverse() { s.to(0); return this; },
    playTo(v, delay = 0, config) { s.to(v, { delay, config }); return this; },
  };
}

// ---- motor de texto ----
export function splitText(el, text, { by = "words", stagger = 110, config = CFG.REVEAL, gap = null, sr = true } = {}) {
  el.textContent = "";
  el.classList.add("split");
  if (gap != null) el.style.columnGap = `${gap}em`;
  if (sr) { const s = document.createElement("span"); s.className = "sr-only"; s.textContent = text; el.append(s); }
  const units = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (by === "words") {
      const u = document.createElement("span");
      u.className = "u"; u.setAttribute("aria-hidden", "true"); u.textContent = word;
      el.append(u); units.push({ el: u, y: 0.35 });
    } else {
      const w = document.createElement("span");
      w.className = "w"; w.setAttribute("aria-hidden", "true");
      for (const ch of word) {
        const u = document.createElement("span");
        u.className = "u"; u.textContent = ch; w.append(u); units.push({ el: u, y: 0.3 });
      }
      el.append(w);
    }
  }
  const springs = units.map((u) => {
    const s = new Spring(0, config, (p) => {
      u.el.style.opacity = String(Math.min(1, Math.max(0, p)));
      u.el.style.transform = `translateY(${(u.y * (1 - p)).toFixed(4)}em)`;
    });
    s.set(0);
    return s;
  });
  return {
    count: units.length,
    play(delay = 0) { springs.forEach((s, i) => s.to(1, { delay: delay + i * stagger })); return this; },
    reverse() { springs.forEach((s) => s.to(0)); return this; },
  };
}

// títulos: linhas separadas por "|" em data-lines + ponto final na cor de destaque
export function buildHeading(h2, { stagger = 110, config = CFG.REVEAL, lineDelay = 130 } = {}) {
  const lines = h2.dataset.lines.split("|");
  h2.textContent = "";
  const sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = lines.join(" ") + ".";
  h2.append(sr);
  const ctrls = [];
  let dot;
  lines.forEach((line, i) => {
    const holder = document.createElement("span");
    holder.setAttribute("aria-hidden", "true");
    holder.className = "hl-row";
    const sp = document.createElement("span");
    holder.append(sp);
    if (i === lines.length - 1) { dot = document.createElement("span"); dot.className = "dot-accent"; dot.textContent = "."; holder.append(dot); }
    h2.append(holder);
    ctrls.push(splitText(sp, line, { stagger, config, sr: false }));
  });
  const dotM = motion(dot, { config });
  return {
    play(base = 0) { ctrls.forEach((c, i) => c.play(base + i * lineDelay)); dotM.play(base + lineDelay + 110); return this; },
    reverse() { ctrls.forEach((c) => c.reverse()); dotM.reverse(); return this; },
  };
}

// ---- portões de visibilidade ----
export function inView(el, { rootMargin = "0px", threshold = 0, once = false } = {}, enter, leave) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { enter?.(e); if (once) io.disconnect(); }
      else leave?.(e);
    }
  }, { rootMargin, threshold });
  io.observe(el);
  return io;
}
// "forward": toca ao entrar; só desfaz quando o bloco volta para baixo da dobra
export function forward(el, play, reverse, rootMargin = "0px") {
  let played = false;
  return inView(el, { rootMargin }, () => { if (!played) { played = true; play(); } }, () => {
    if (!played) return;
    if (el.getBoundingClientRect().top > 0) { played = false; reverse?.(); }
  });
}

// ---- gatilhos de rolagem ----
export function triggerProgress(el, start, end) {
  const bb = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const poses = {
    top_top: bb.top, center_top: bb.top + bb.height / 2, bottom_top: bb.bottom,
    top_bottom: bb.top - vh, center_bottom: bb.top + bb.height / 2 - vh, bottom_bottom: bb.bottom - vh,
    top_center: bb.top - vh / 2, center_center: bb.top + bb.height / 2 - vh / 2, bottom_center: bb.bottom - vh / 2,
  };
  const s = poses[start.replace(" ", "_")], e = poses[end.replace(" ", "_")];
  const length = Math.abs(s - e) || 1;
  return Math.min(Math.max(0, 1 - (s + length) / length), 1);
}
/* scrub: progresso de rolagem aplicado direto, ou por uma mola quando `smooth` é passado.
   Roda só enquanto o elemento está perto da tela. Devolve uma função que desliga. */
export function scrub(el, start, end, cb, { smooth = null } = {}) {
  const spring = smooth ? new Spring(0, smooth, cb) : null;
  const compute = () => {
    const p = triggerProgress(el, start, end);
    if (spring) { if (Math.abs(spring.target - p) > 1e-5) spring.to(p); } else cb(p);
  };
  compute();
  let unsub = null;
  const io = inView(el, { rootMargin: "50% 0px" }, () => { if (!unsub) unsub = subscribe(compute); }, () => { unsub?.(); unsub = null; compute(); });
  addEventListener("resize", compute);
  return () => { unsub?.(); io.disconnect(); removeEventListener("resize", compute); spring?.stop(); };
}

// ---- números: contador discreto (formato pt-BR) ----
const fmt = new Intl.NumberFormat("pt-BR");
export function countUp(el, to = Number(el.dataset.count), { duration = 1400, delay = 0, decimals = 0 } = {}) {
  const f = decimals ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : fmt;
  el.textContent = f.format(0);
  return new Promise((done) => setTimeout(() => {
    tween(0, to, duration, easeOutCubic, (v) => { el.textContent = f.format(decimals ? v : Math.round(v)); }, done);
  }, REDUCED ? 0 : delay));
}

/* ---- revelações declarativas ----
   data-reveal="up" | "mask" | "wipe" | "split" | "heading" | "scale"; data-delay="ms"; [data-count] conta ao aparecer. */
export function revealAll(root = document) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      playReveal(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal], [data-count]", root).forEach((el) => {
    if (el.dataset.reveal === "split") el._split = splitText(el, el.textContent.trim(), { by: el.dataset.by || "words", stagger: Number(el.dataset.stagger || 60) });
    if (el.dataset.reveal === "heading") el._split = buildHeading(el);
    io.observe(el);
  });
  return io;
}
export function playReveal(el) {
  const d = Number(el.dataset.delay || 0);
  const kind = el.dataset.reveal;
  el.classList.add("is-in");
  if (el._split) el._split.play(d);
  else if (kind && !REDUCED) {
    const o = { duration: 1000, delay: d, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" };
    if (kind === "up") el.animate([{ opacity: 0, transform: "translateY(1.5rem)" }, { opacity: 1, transform: "none" }], o);
    if (kind === "mask") el.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { ...o, duration: 1100, easing: "cubic-bezier(0.33, 0, 0, 1)" });
    if (kind === "wipe") el.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { ...o, duration: 1100, easing: "cubic-bezier(0.33, 0, 0, 1)" });
    if (kind === "scale") el.animate([{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "none" }], { ...o, duration: 1300 });
  }
  if (el.hasAttribute("data-count")) countUp(el, Number(el.dataset.count), { delay: d });
}

/* ---- profundidade: camadas [data-depth="0.2"] seguem o mouse dentro de `area` ----
   Desligado em toque e com movimento reduzido. Devolve uma função que desliga. */
export function depth(area, layers = $$("[data-depth]", area), { max = 24 } = {}) {
  if (REDUCED || !FINE) return () => {};
  let tx = 0, ty = 0, x = 0, y = 0, unsub = null;
  const move = (e) => {
    const r = area.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!unsub) unsub = subscribe(tick);
  };
  const leave = () => { tx = 0; ty = 0; };
  const tick = () => {
    x = lerp(x, tx, 0.08); y = lerp(y, ty, 0.08);
    layers.forEach((l) => {
      const k = Number(l.dataset.depth) * max;
      l.style.translate = `${(-x * k).toFixed(2)}px ${(-y * k).toFixed(2)}px`;
    });
    if (Math.abs(x - tx) < 0.001 && Math.abs(y - ty) < 0.001) { unsub?.(); unsub = null; }
  };
  area.addEventListener("pointermove", move);
  area.addEventListener("pointerleave", leave);
  return () => { area.removeEventListener("pointermove", move); area.removeEventListener("pointerleave", leave); unsub?.(); };
}

/* ---- transição entre páginas ----
   Saída: a placa preta sobe com o nome do destino; a navegação acontece por trás dela.
   Chegada: <html class="njr-arriving"> (posto no <head>) mantém a placa cobrindo até a página estar pronta. */
const PLATE_KEY = "njr-plate";
function plateEl() {
  let p = $(".njr-plate");
  if (!p) {
    p = document.createElement("div");
    p.className = "njr-plate";
    p.setAttribute("aria-hidden", "true");
    p.innerHTML = "<i></i><b></b>";
    document.body.append(p);
  }
  return p;
}
export async function leaveTo(href, label = "") {
  const vest = /\/vestiario\/?$/.test(new URL(href, location.href).pathname);
  // o Vestiário tem a própria abertura (a entrada em vídeo começa no escuro): não leva a placa
  if (!vest) try { sessionStorage.setItem(PLATE_KEY, label || "1"); } catch {}
  if (REDUCED) { location.href = href; return; }
  const p = plateEl();
  p.style.visibility = "visible";
  const b = p.querySelector("b");
  b.innerHTML = label ? `<small>NJR · Neymar Jr</small>${label}` : "";
  lenis?.stop();
  await p.querySelector("i").animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
    { duration: 650, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" }).finished;
  if (label) await b.animate([{ opacity: 0, transform: "translateY(30%)" }, { opacity: 1, transform: "none" }],
    { duration: 380, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" }).finished;
  location.href = href;
}
/* Chamada pela página quando o conteúdo está pronto: a placa sai pelo alto.
   Resolve quando a placa já liberou boa parte da tela, para a entrada da página emendar. */
export function arrive() {
  const root = document.documentElement;
  let label = null;
  try { label = sessionStorage.getItem(PLATE_KEY); sessionStorage.removeItem(PLATE_KEY); } catch {}
  if (!root.classList.contains("njr-arriving")) return Promise.resolve();
  const p = plateEl();
  const b = p.querySelector("b");
  if (label && label !== "1") { b.innerHTML = `<small>NJR · Neymar Jr</small>${label}`; b.style.opacity = 1; }
  if (REDUCED) { root.classList.remove("njr-arriving"); return Promise.resolve(); }
  b.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-20%)" }], { duration: 300, easing: "ease-in", fill: "forwards" });
  const a = p.querySelector("i").animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
    { duration: 900, delay: 180, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" });
  a.finished.then(() => { root.classList.remove("njr-arriving"); p.style.visibility = ""; a.cancel(); b.style.opacity = ""; });
  return wait(520);
}
// links internos (data-plate ou qualquer link de página) usam a placa
export function bindLinks(root = document) {
  root.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.hash && url.pathname === location.pathname) return;
    const page = PAGES.find((p) => url.pathname.replace(/\/?$/, "/") === p.href);
    const home = url.pathname === "/" || url.pathname === "/index.html";
    const vest = /^\/vestiario\/?$/.test(url.pathname);
    if (!page && !home && !vest) return;
    e.preventDefault();
    leaveTo(url.pathname.replace(/^\/(jogador|carreira|titulos|santos|loja|vestiario)$/, "/$1/") + url.search + url.hash,
      page?.label || (vest ? "Vestiário" : "Início"));
  });
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    const p = $(".njr-plate");
    if (p) { p.style.visibility = ""; p.querySelectorAll("i, b").forEach((x) => x.getAnimations().forEach((an) => an.cancel())); }
    document.documentElement.classList.remove("njr-arriving");
    lenis?.start();
  });
}

/* ---- cabeçalho: logo, navegação principal (com a página atual marcada), Vestiário, menu do celular ---- */
export function mountHeader(current, { onDark = false } = {}) {
  const h = document.createElement("header");
  h.className = "njr-header" + (onDark ? " on-dark" : "");
  h.innerHTML = `
    <a href="/" class="njr-logo" aria-label="NJR · Neymar Jr, página inicial"><img src="/assets/ui/njr-logo.png" width="888" height="218" alt=""></a>
    <nav class="njr-nav" aria-label="Principal"><ul>${PAGES.map((p) => `<li><a href="${p.href}"${p.href === current ? ' aria-current="page"' : ""}>${p.label}</a></li>`).join("")}</ul></nav>
    <a class="njr-garage" href="/vestiario/"><span aria-hidden="true">[ </span>Vestiário<span aria-hidden="true"> → ]</span></a>
    <button class="njr-burger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-haspopup="dialog"><span></span><span></span></button>`;
  document.body.prepend(h);
  const burger = $(".njr-burger", h);
  let sheet = null, spring = null, lastFocus = null;
  const close = () => {
    if (!sheet) return;
    const el = sheet; sheet = null;
    burger.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("menu-locked");
    lenis?.start();
    spring.onRest = () => el.remove();
    spring.to(0);
    lastFocus?.focus?.();
  };
  const open = () => {
    if (sheet) return;
    lastFocus = document.activeElement;
    sheet = document.createElement("div");
    sheet.className = "njr-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Menu");
    const links = [{ label: "Início", href: "/" }, ...PAGES, { label: "Vestiário", href: "/vestiario/" }];
    sheet.innerHTML = `
      <div class="njr-sheet-top">
        <a href="/" aria-label="NJR · Neymar Jr"><img src="/assets/ui/njr-logo.png" alt="" width="888" height="218"></a>
        <button class="njr-sheet-close" type="button" aria-label="Fechar menu"><span></span><span></span></button>
      </div>
      <nav aria-label="Celular"><ul>${links.map((p) => `<li><a class="hov" href="${p.href}"${p.href === current ? ' aria-current="page"' : ""}>${p.label}</a></li>`).join("")}</ul></nav>`;
    document.body.append(sheet);
    $(".njr-sheet-close", sheet).addEventListener("click", close);
    const s = sheet;
    spring = new Spring(0, CFG.SHEET, (v) => { s.style.opacity = String(clamp01(v)); });
    spring.to(1);
    $$("li a", sheet).map((a) => motion(a, { y: "0.75rem", config: CFG.ITEM })).forEach((m, i) => m.play(120 + i * 55));
    burger.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("menu-locked");
    lenis?.stop();
    $(".njr-sheet-close", sheet).focus();
  };
  const onScroll = () => h.classList.toggle("is-scrolled", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", open);
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  matchMedia("(min-width: 1280px)").addEventListener("change", (e) => { if (e.matches) close(); });
  // entrada do cabeçalho
  const items = [$(".njr-logo", h), ...$$(".njr-nav li", h), $(".njr-garage", h), burger];
  items.map((el) => motion(el, { y: "-0.5rem", config: CFG.ITEM })).forEach((m, i) => m.play(200 + i * 50));
  return { el: h, setDark(v) { h.classList.toggle("on-dark", v); }, close };
}

/* ---- rodapé curto: próxima página + créditos ---- */
export function mountFooter(current, { credits = "" } = {}) {
  const nx = nextPage(current);
  const f = document.createElement("footer");
  f.className = "njr-foot";
  f.innerHTML = `
    <a class="next" href="${nx.href}"><small>Próximo</small>${nx.label} →</a>
    <div>${credits}<p>Site de fã, sem vínculo com Neymar Jr, clubes ou patrocinadores. <a href="/">Início</a> · <a href="/vestiario/">Vestiário</a></p></div>`;
  document.body.append(f);
  return f;
}

/* ---- inicialização padrão de uma página interna ----
   Monta cabeçalho e rodapé, liga Lenis, links com placa e revelações; espera fontes e a imagem
   principal (opcional) e tira a placa. Resolve quando a página pode começar a sua entrada. */
export async function initPage(current, { onDark = false, credits = "", lenis: useLenis = true, heroImage = null, footer = true } = {}) {
  document.documentElement.classList.remove("no-js");
  const header = mountHeader(current, { onDark });
  if (footer) mountFooter(current, { credits });
  bindLinks();
  if (useLenis) initLenis();
  const imgReady = heroImage ? (heroImage.decode?.().catch(() => {}) ?? Promise.resolve()) : Promise.resolve();
  await Promise.race([Promise.all([document.fonts?.ready, imgReady]), wait(2500)]);
  await arrive();
  return { header };
}
