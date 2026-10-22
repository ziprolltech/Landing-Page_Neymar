/* Carreira — a trajetória em capítulos.
   Motor compartilhado (/shared/njr.js) + cenas próprias:
   · cada capítulo abre com uma cena fixa conduzida pela rolagem (scrub com mola), com uma troca de época diferente
     (íris, deslocamento horizontal, escala, persianas, memória lado a lado, bandeira);
   · o ano "rola" como um odômetro do ano anterior para o novo; o nome do capítulo entra letra a letra;
   · a régua do tempo fixa embaixo mostra onde o visitante está (clubes num trilho, Seleção no trilho paralelo),
     com seleção direta, setas na tela e setas ← → do teclado. A rolagem nunca é bloqueada. */
import {
  initPage, REDUCED, $, $$, clamp01, lerp, scrub, motion, buildHeading, revealAll, depth, forward, lenis,
  CFG, easeInOutCubic, easeOutCubic,
} from "/shared/njr.js";

const ease = easeInOutCubic;
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const PHONE = matchMedia("(max-width: 1023.98px)");
const PORTRAIT = matchMedia("(max-aspect-ratio: 1/1)");
const SCALE = { a: 2009, b: 2027 };
const xOf = (y) => clamp01((y - SCALE.a) / (SCALE.b - SCALE.a));
const pad = (n) => String(n).padStart(2, "0");

const hero = $(".hero");
const ep = $(".ep");
const live = $("#live");
const CH = $$(".ch").map((el, i) => ({
  el, i, fx: el.dataset.fx, inicio: +el.dataset.inicio, fim: +el.dataset.fim, de: +el.dataset.de, para: +el.dataset.para,
  rotulo: el.dataset.rotulo, periodo: el.dataset.periodo, op: $(".op", el), stage: $(".op-stage", el), title: $(".op-title", el),
  selecao: el.id === "cap-selecao", top: 0, land: 0, end: 0,
}));
const LAST = CH.length - 1;

// ---------- a página começa (cabeçalho, rodapé, Lenis, placa); a montagem acontece por trás da placa ----------
const pageReady = initPage("/carreira/", {
  onDark: true,
  heroImage: $(".frame img"),
  credits: `<p>Fotos: Wikimedia Commons, com autor e licença junto de cada imagem e em <a href="#fontes">Fontes e créditos</a>.</p>`,
});

/* ================================================================
   odômetro: cada coluna é uma tira 0–9,0; o valor pode ser fracionário (o dígito rola)
   ================================================================ */
function odometer(el, digits = 4) {
  el.textContent = "";
  const rolls = [];
  for (let k = 0; k < digits; k++) {
    const col = document.createElement("span");
    col.className = "col";
    const roll = document.createElement("span");
    roll.className = "roll";
    roll.innerHTML = "01234567890".split("").map((d) => `<span>${d}</span>`).join("");
    col.append(roll);
    el.append(col);
    rolls.unshift(roll);   // rolls[0] = unidades
  }
  let last = null;
  return {
    set(v) {
      if (v === last) return;
      last = v;
      rolls.forEach((roll, k) => {
        const p10 = 10 ** k;
        let pos;
        if (k === 0) pos = ((v % 10) + 10) % 10;
        else {
          const base = Math.floor(v / p10) % 10;
          const r = v - Math.floor(v / p10) * p10;
          pos = base + Math.max(0, r - (p10 - 1));
        }
        roll.style.transform = `translateY(${(-pos / 11) * 100}%)`;
      });
    },
  };
}

/* ================================================================
   título do capítulo: letra a letra, com uma entrada diferente por época
   ================================================================ */
const TITLE_FX = {
  iris: (i) => ({ k: [{ transform: "translateY(160%)" }, { transform: "none" }], d: i * 32, dur: 950 }),
  slide: (i) => ({ k: [{ transform: "translateX(0.9em)", opacity: 0 }, { transform: "none", opacity: 1 }], d: i * 26, dur: 800 }),
  zoom: (i, n) => ({ k: [{ transform: "scale(2.4)", opacity: 0 }, { transform: "none", opacity: 1 }], d: ((i * 7) % n) * 24, dur: 900 }),
  slats: (i) => ({ k: [{ transform: `translateY(${i % 2 ? -160 : 160}%)` }, { transform: "none" }], d: i * 22, dur: 850 }),
  memoria: (i) => ({ k: [{ opacity: 0, filter: "blur(10px)", transform: "translateY(0.12em)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], d: i * 45, dur: 1100 }),
  bandeira: (i, n) => ({ k: [{ transform: "translateY(-160%)" }, { transform: "none" }], d: Math.abs(i - (n - 1) / 2) * 30, dur: 900 }),
};
function splitTitle(h, fx) {
  const text = h.textContent.trim();
  h.textContent = "";
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = text;
  h.append(sr);
  const letters = [];
  text.split(/\s+/).forEach((word, wi) => {
    if (wi) h.append(" ");
    const w = document.createElement("span");
    w.className = "w";
    w.setAttribute("aria-hidden", "true");
    for (const ch of word) {
      const l = document.createElement("span");
      l.className = "l";
      l.textContent = ch;
      w.append(l);
      letters.push(l);
    }
    h.append(w);
  });
  const n = letters.length;
  const anims = letters.map((l, i) => {
    const f = TITLE_FX[fx](i, n);
    const a = l.animate(f.k, { duration: f.dur, delay: f.d, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" });
    a.pause();
    a.currentTime = 0;
    return a;
  });
  return {
    show() { anims.forEach((a) => { if (a.playbackRate < 0) a.reverse(); else a.play(); }); },
    hide() { anims.forEach((a) => { if (a.playbackRate > 0) a.reverse(); }); },
  };
}

/* ================================================================
   cenas de abertura: p = 0 (cena chegando) → 1 (capítulo montado)
   ================================================================ */
function sceneFor(c) {
  const s = c.stage;
  const oldL = $(".op-old", s), oldI = oldL && $("img", oldL);
  const newL = $(".op-new", s), newI = $("img", newL);
  if (oldL) oldL.style.visibility = "visible";
  switch (c.fx) {
    case "iris": return (p) => {
      const t = ease(seg(p, 0.02, 0.78));
      newL.style.clipPath = t >= 1 ? "none" : `circle(${lerp(0, 78, t).toFixed(2)}% at 50% 48%)`;
      newI.style.transform = `scale(${lerp(1.35, 1, t).toFixed(4)})`;
    };
    case "slide": return (p) => {
      const t = ease(seg(p, 0.04, 0.8));
      oldL.style.transform = `translateX(${(-100 * t).toFixed(3)}%)`;
      oldI.style.transform = `translateX(${(55 * t).toFixed(3)}%) scale(${(1 + 0.08 * t).toFixed(4)})`;
      newL.style.transform = `translateX(${(100 * (1 - t)).toFixed(3)}%)`;
      newI.style.transform = `translateX(${(-55 * (1 - t)).toFixed(3)}%)`;
    };
    case "zoom": return (p) => {
      const t = ease(seg(p, 0.04, 0.8));
      const a = lerp(PORTRAIT.matches ? 26 : 30, 0, t), b = lerp(PORTRAIT.matches ? 22 : 39, 0, t);
      newL.style.clipPath = t >= 1 ? "none" : `inset(${a.toFixed(2)}% ${b.toFixed(2)}%)`;
      newI.style.transform = `scale(${lerp(1.28, 1, t).toFixed(4)})`;
      oldL.style.transform = `scale(${(1 + 0.35 * t).toFixed(4)})`;
      oldL.style.opacity = String(1 - 0.75 * t);
    };
    case "slats": {
      const N = 6;
      const src = newI;
      newL.textContent = "";
      const strips = Array.from({ length: N }, (_, k) => {
        const d = document.createElement("div");
        d.className = "slat";
        d.style.clipPath = `inset(${((k * 100) / N).toFixed(3)}% 0 ${(100 - ((k + 1) * 100) / N).toFixed(3)}% 0)`;
        const im = k === 0 ? src : src.cloneNode();
        if (k) { im.alt = ""; d.setAttribute("aria-hidden", "true"); }
        d.append(im);
        newL.append(d);
        return d;
      });
      return (p) => {
        const t = ease(seg(p, 0.04, 0.8));
        strips.forEach((d, k) => {
          const u = easeOutCubic(seg(p, 0.04 + k * 0.055, 0.46 + k * 0.055));
          d.style.transform = `translateX(${((k % 2 ? 1 : -1) * 100 * (1 - u)).toFixed(3)}%)`;
        });
        oldI.style.transform = `scale(${(1 + 0.1 * t).toFixed(4)})`;
        oldL.style.opacity = String(1 - 0.5 * t);
      };
    }
    case "memoria": {
      const tags = $$(".op-tag", s);
      return (p) => {
        const t = ease(seg(p, 0.04, 0.8));
        const port = PORTRAIT.matches;
        if (port) {
          oldL.style.clipPath = `inset(0 0 ${(50 * t).toFixed(3)}% 0)`;
          oldI.style.transform = `translateY(${(-14 * t).toFixed(3)}%)`;
          newL.style.clipPath = `inset(${lerp(100, 50, t).toFixed(3)}% 0 0 0)`;
        } else {
          oldL.style.clipPath = `inset(0 ${(50 * t).toFixed(3)}% 0 0)`;
          oldI.style.transform = `translateX(${(-18 * t).toFixed(3)}%)`;
          newL.style.clipPath = `inset(0 0 0 ${lerp(100, 50, t).toFixed(3)}%)`;
        }
        newI.style.transform = `scale(${lerp(1.18, 1, t).toFixed(4)})`;
        const o = String(seg(p, 0.55, 0.75));
        tags.forEach((g) => { g.style.opacity = o; });
      };
    }
    case "bandeira": {
      const flag = $(".op-flag", s);
      return (p) => {
        const t1 = ease(seg(p, 0.02, 0.5)), t2 = ease(seg(p, 0.32, 0.8));
        const k = lerp(0, 62, t1);
        flag.style.clipPath = `polygon(50% ${(50 - k).toFixed(2)}%, ${(50 + k).toFixed(2)}% 50%, 50% ${(50 + k).toFixed(2)}%, ${(50 - k).toFixed(2)}% 50%)`;
        const port = PORTRAIT.matches;
        newL.style.clipPath = `circle(${lerp(0, port ? 34 : 27, t2).toFixed(2)}% at 50% ${port ? 42 : 46}%)`;
        newI.style.transform = `scale(${lerp(1.3, 1, t2).toFixed(4)})`;
      };
    }
  }
  return () => {};
}

function initScene(c) {
  const year = odometer($(".op-year", c.stage));
  year.set(c.para);
  if (REDUCED) return;
  const apply = sceneFor(c);
  const title = splitTitle(c.title, c.fx);
  const bits = [$(".op-kicker", c.stage), $(".op-meta", c.stage), $(".op-note", c.stage)].map((el) => motion(el, { y: "0.75rem", config: CFG.COPY }));
  const credit = motion($(".op-credit", c.stage), { config: CFG.LABEL });
  let shown = false;
  const run = (p) => {
    apply(p);
    year.set(lerp(c.de, c.para, ease(seg(p, 0.05, 0.82))));
    if (!shown && p > 0.56) {
      shown = true;
      title.show();
      bits.forEach((b, i) => b.play(180 + i * 110));
      credit.play(500);
    } else if (shown && p < 0.3) {
      shown = false;
      title.hide();
      bits.forEach((b) => b.reverse());
      credit.reverse();
    }
  };
  scrub(c.op, "top top", "bottom bottom", run, { smooth: CFG.TRIGGER });
}

/* ================================================================
   corpo do capítulo: fio vertical, fotos com máscara, acontecimentos em sequência
   ================================================================ */
const PH_MASK = {
  iris: (t) => `circle(${lerp(0, 75, t).toFixed(2)}% at 50% 50%)`,
  slide: (t) => `inset(0 ${(100 * (1 - t)).toFixed(2)}% 0 0)`,
  zoom: (t) => `inset(${(32 * (1 - t)).toFixed(2)}% ${(32 * (1 - t)).toFixed(2)}%)`,
  slats: (t) => `inset(${(100 * (1 - t)).toFixed(2)}% 0 0 0)`,
  memoria: (t) => `inset(0 0 0 ${(100 * (1 - t)).toFixed(2)}%)`,
  bandeira: (t) => { const k = lerp(0, 75, t); return `polygon(50% ${50 - k}%, ${50 + k}% 50%, 50% ${50 + k}%, ${50 - k}% 50%)`; },
};
function initBody(c) {
  const body = $(".ch-body", c.el);
  const wire = $(".ch-wire i", body);
  if (REDUCED) return;
  scrub(body, "top bottom", "bottom bottom", (p) => { wire.style.transform = `scaleY(${p.toFixed(4)})`; });
  $$(".ph", body).forEach((fig) => {
    const mask = $(".ph-mask", fig), img = $("img", mask), cap = $("figcaption", fig);
    const capM = motion(cap, { y: "0.5rem", config: CFG.COPY });
    let capOn = false;
    scrub(fig, "top bottom", "center center", (p) => {
      const t = easeOutCubic(p);
      mask.style.clipPath = t >= 0.999 ? "none" : PH_MASK[c.fx](t);
      img.style.transform = `scale(${lerp(1.22, 1, t).toFixed(4)})`;
      if (!capOn && p > 0.6) { capOn = true; capM.play(); }
      else if (capOn && p < 0.2) { capOn = false; capM.reverse(); }
    }, { smooth: CFG.TRIGGER });
  });
  $$(".steps li", body).forEach((li) => {
    const a = motion($("time", li), { y: "0.6rem", config: CFG.ITEM });
    const b = motion($("p", li), { y: "0.6rem", config: CFG.COPY2 });
    forward(li, () => { li.classList.add("is-lit"); a.play(); b.play(90); }, () => { li.classList.remove("is-lit"); a.reverse(); b.reverse(); }, "0px 0px -18% 0px");
  });
  const par = $(".par", body);
  if (par) {
    const m = motion(par, { y: "1.5rem", config: CFG.REVEAL });
    const items = $$("li, .par-go", par).map((el) => motion(el, { y: "0.5rem", config: CFG.ITEM }));
    forward(par, () => { m.play(); items.forEach((x, i) => x.play(200 + i * 90)); }, () => { m.reverse(); items.forEach((x) => x.reverse()); }, "0px 0px -12% 0px");
  }
}

/* ================================================================
   régua do tempo + navegação
   ================================================================ */
const ARROW = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
function buildRail() {
  const nav = document.createElement("nav");
  nav.className = "rail";
  nav.setAttribute("aria-label", "Linha do tempo da carreira");
  const clubs = CH.filter((c) => !c.selecao), sel = CH.filter((c) => c.selecao);
  const segBtn = (c) => {
    const l = xOf(c.inicio) * 100, w = (xOf(c.fim) - xOf(c.inicio)) * 100;
    const color = c.el.style.getPropertyValue("--c") || "#fff";
    return `<button class="seg" type="button" data-go="${c.i}" style="left:${l.toFixed(3)}%;width:${w.toFixed(3)}%;--sc:${color}"
      aria-label="Capítulo ${pad(c.i + 1)}: ${c.rotulo}, ${c.periodo}"><span>${c.rotulo}</span></button>`;
  };
  const ticks = [];
  for (let y = 2009; y <= 2025; y += 2) ticks.push(`<span style="left:${(xOf(y) * 100).toFixed(3)}%">${y}</span>`);
  ticks.push(`<span style="left:${(xOf(2026.81) * 100).toFixed(3)}%">hoje</span>`);
  nav.innerHTML = `
    <button class="rail-now" type="button" aria-expanded="false" aria-controls="rail-list">
      <span class="odo" aria-hidden="true"></span>
      <span class="rail-name"><b></b><small></small></span>
      <span class="sr-only">: abrir a lista de capítulos</span>
    </button>
    <div class="rail-track">
      <div class="rail-row r1"><em>Clubes</em>${clubs.map(segBtn).join("")}</div>
      <div class="rail-row r2"><em>Seleção</em>${sel.map(segBtn).join("")}</div>
      <div class="rail-ticks" aria-hidden="true">${ticks.join("")}</div>
      <div class="head" aria-hidden="true"><i></i></div>
    </div>
    <div class="rail-arrows">
      <button type="button" class="prev" aria-label="Capítulo anterior (seta ←)">${ARROW("M15 5l-7 7 7 7")}</button>
      <button type="button" class="next" aria-label="Próximo capítulo (seta →)">${ARROW("M9 5l7 7-7 7")}</button>
    </div>`;
  const list = document.createElement("div");
  list.className = "rail-list";
  list.id = "rail-list";
  list.innerHTML = CH.map((c) => `<button type="button" data-go="${c.i}"><b>${pad(c.i + 1)} · ${c.rotulo}</b><small>${c.periodo}</small></button>`).join("");
  document.body.append(list, nav);
  return { nav, list };
}

function absTop(el) { return el.getBoundingClientRect().top + scrollY; }

function initNavigation() {
  const { nav, list } = buildRail();
  const odo = odometer($(".odo", nav));
  odo.set(2009);
  const nameB = $(".rail-name b", nav), nameS = $(".rail-name small", nav);
  const head = $(".head", nav), mark = $(".head i", nav), track = $(".rail-track", nav);
  const segs = $$(".seg", nav), listBtns = $$("button", list);
  const prevB = $(".prev", nav), nextB = $(".next", nav), nowB = $(".rail-now", nav);
  let epTop = 0, heroH = 0, vh = innerHeight, rowY = [0, 0], trackW = 1, active = -2, railOn = null;

  const measure = () => {
    vh = innerHeight;
    CH.forEach((c) => {
      c.top = absTop(c.el);
      c.land = Math.round(c.top + c.op.offsetHeight - vh);
      c.end = c.top + c.el.offsetHeight;
    });
    epTop = absTop(ep);
    heroH = hero.offsetHeight;
    trackW = track.clientWidth || 1;
    const hb = head.getBoundingClientRect();
    rowY = $$(".rail-row", nav).map((r) => { const b = r.getBoundingClientRect(); return b.top + b.height / 2 - hb.top; });
    update();
  };

  const current = () => {
    const y = scrollY;
    let i = -1;
    CH.forEach((c) => { if (y + vh * 0.5 >= c.top) i = c.i; });
    return i;
  };

  const update = () => {
    const y = scrollY;
    const i = current();
    // posição no tempo e trilho
    let year = 2009, row = 0;
    if (i >= 0) {
      const c = CH[i];
      if (y < c.land) {
        const u = clamp01((y - c.top) / Math.max(1, c.land - c.top));
        const from = i > 0 ? CH[i - 1].fim : c.inicio;
        year = lerp(from, c.inicio, ease(u));
        row = c.selecao ? ease(u) : 0;
      } else {
        year = lerp(c.inicio, c.fim, clamp01((y - c.land) / Math.max(1, c.end - c.land)));
        row = c.selecao ? 1 : 0;
      }
    }
    const x = xOf(year) * trackW;
    head.style.transform = `translateX(${x.toFixed(2)}px)`;
    const ry = lerp(rowY[0] || 0, rowY[1] || 0, row) - mark.offsetHeight / 2;
    mark.style.transform = `translateY(${ry.toFixed(2)}px) rotate(${(45 + xOf(year) * 720).toFixed(1)}deg)`;
    odo.set(Math.floor(year));
    const total = Math.max(1, epTop - vh - (CH[0]?.top || 0));
    nav.style.setProperty("--prog", clamp01((y - (CH[0]?.top || 0)) / total).toFixed(4));
    // mostra a régua entre o fim do herói e o epílogo
    const on = y > heroH * 0.55 && y + vh * 0.55 < epTop;
    if (on !== railOn) {
      railOn = on;
      nav.classList.toggle("is-on", on);
      nav.inert = !on;
      if (!on) closeList();
    }
    if (i !== active) {
      const was = active;
      active = i;
      const c = CH[Math.max(0, i)];
      nameB.textContent = `${pad(c.i + 1)} · ${c.rotulo}`;
      nameS.textContent = c.periodo;
      segs.forEach((s) => s.classList.toggle("is-on", +s.dataset.go === i));
      listBtns.forEach((b) => b.setAttribute("aria-current", String(+b.dataset.go === i)));
      prevB.disabled = i < 0;
      nextB.disabled = i >= LAST && y >= CH[LAST].land - 4;
      if (was !== -2 && i >= 0) live.textContent = `Capítulo ${pad(i + 1)} de ${pad(CH.length)}: ${c.rotulo}, ${c.periodo.replace("—", "a")}`;
    }
    if (i >= LAST) nextB.disabled = y >= CH[LAST].land - 4;
  };

  let queued = false;
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(measure));
  new ResizeObserver(() => requestAnimationFrame(measure)).observe(document.body);
  PORTRAIT.addEventListener("change", () => dispatchEvent(new Event("resize")));

  const scrollToY = (top) => {
    const target = Math.max(0, Math.round(top));
    if (REDUCED) { lenis?.scrollTo?.(target, { immediate: true }); scrollTo(0, target); return; }
    if (lenis) {
      const dist = Math.abs(target - scrollY) / vh;
      lenis.scrollTo(target, { duration: Math.min(2.6, 1 + dist * 0.1), easing: easeInOutCubic });
    } else scrollTo({ top: target, behavior: "smooth" });
  };
  const goTo = (k) => {
    if (k < 0) return scrollToY(0);
    if (k > LAST) return scrollToY(epTop);
    scrollToY(CH[k].land + 1);
  };
  const step = (dir) => {
    measure();
    const i = current(), y = scrollY;
    if (dir > 0) {
      if (i < 0) return goTo(0);
      if (y < CH[i].land - 8) return goTo(i);
      return goTo(Math.min(i + 1, LAST + (y >= CH[LAST].land - 8 ? 1 : 0)));
    }
    if (i < 0) return;
    if (y > CH[i].land + 8) return goTo(i);
    return goTo(i - 1);
  };
  prevB.addEventListener("click", () => step(-1));
  nextB.addEventListener("click", () => step(1));

  // lista de capítulos (régua compacta no celular e atalho no desktop)
  function closeList() { list.classList.remove("is-open"); nowB.setAttribute("aria-expanded", "false"); }
  nowB.addEventListener("click", () => {
    const open = !list.classList.contains("is-open");
    list.classList.toggle("is-open", open);
    nowB.setAttribute("aria-expanded", String(open));
    if (open) listBtns[Math.max(0, active)]?.focus();
  });
  document.addEventListener("click", (e) => {
    if (list.classList.contains("is-open") && !list.contains(e.target) && !nowB.contains(e.target)) closeList();
  });

  // seleção direta: rolo do herói, régua, lista, "ver a linha da Seleção"
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("[data-go]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    measure();
    const k = +a.dataset.go;
    const fromList = list.contains(a);
    if (fromList) { closeList(); nowB.focus(); }
    goTo(k);
    if (a.tagName === "A") {
      history.replaceState(null, "", `#${CH[k].el.id}`);
      CH[k].title.setAttribute("tabindex", "-1");
      setTimeout(() => CH[k].title.focus({ preventScroll: true }), REDUCED ? 0 : 900);
    }
  });

  // teclado: ← → trocam de capítulo; ↑ ↓, PageUp/PageDown e espaço continuam rolando normalmente
  addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (document.documentElement.classList.contains("menu-locked")) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "Escape" && list.classList.contains("is-open")) { closeList(); nowB.focus(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  });

  measure();
  return { measure };
}

/* ================================================================
   herói
   ================================================================ */
function initHero() {
  const h1 = $("#hero-h");
  const head = buildHeading(h1, { stagger: 90 });
  const eyebrow = motion($(".hero-eyebrow"), { y: "0.5rem", config: CFG.LABEL });
  const lead = motion($(".hero-lead"), { y: "0.75rem", config: CFG.COPY });
  const ruler = $(".hero-ruler");
  const frames = $$(".reel li");
  const hint = $(".hero-hint");
  if (REDUCED) { head.play(0); eyebrow.play(); lead.play(); return () => {}; }
  ruler.style.opacity = "0";
  frames.forEach((li) => { li.style.clipPath = "inset(100% 0 0 0)"; });
  hint.style.opacity = "0";
  depth(hero, $$("[data-depth]", hero), { max: 12 });
  // o rolo corre para a esquerda enquanto o herói sai: o tempo passando
  const reel = $(".reel");
  scrub(hero, "top top", "bottom top", (p) => {
    reel.style.transform = PHONE.matches ? "" : `translateX(${(-p * 14).toFixed(3)}vw)`;
    hint.style.translate = `0 ${(p * 2).toFixed(3)}rem`;
  });
  return () => {
    eyebrow.play(0);
    head.play(120);
    lead.play(520);
    ruler.style.opacity = "";
    ruler.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 300, fill: "backwards" });
    $(".hr-line", ruler).animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1600, delay: 350, easing: "cubic-bezier(0.33, 0, 0, 1)", fill: "backwards" });
    frames.forEach((li, i) => {
      const o = { duration: 1100, delay: 600 + i * 90, easing: "cubic-bezier(0.33, 0, 0, 1)", fill: "both" };
      li.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], o).finished.then(() => { li.style.clipPath = ""; }).catch(() => {});
      $("img", li).animate([{ transform: "scale(1.35)" }, { transform: "none" }], { ...o, duration: 1500 });
    });
    hint.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: 1500, fill: "forwards" });
  };
}

/* ================================================================
   cabeçalho claro sobre o amarelo da Seleção e sobre o epílogo
   ================================================================ */
function initHeaderTone(header) {
  const lights = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? lights.add(e.target) : lights.delete(e.target)));
    header.setDark(lights.size === 0);
  }, { rootMargin: "0px 0px -93% 0px" });
  $$('[data-header="light"]').forEach((el) => io.observe(el));
}

// ---------- montagem ----------
const playHero = initHero();
CH.forEach((c) => { initScene(c); initBody(c); });
const epHead = buildHeading($("#ep-h"));
forward($("#ep-h"), () => epHead.play(0), () => epHead.reverse());
revealAll();
const navCtl = initNavigation();

const { header } = await pageReady;
initHeaderTone(header);
navCtl.measure();
// chegada direta num capítulo (#cap-…): pousa com a cena já montada
const fromHash = CH.find((c) => `#${c.el.id}` === location.hash);
if (fromHash) { lenis?.scrollTo?.(fromHash.land + 1, { immediate: true }); scrollTo(0, fromHash.land + 1); }
playHero();
