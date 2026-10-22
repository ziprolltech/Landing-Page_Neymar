/* Entrada do Vestiário: vídeo da câmera entrando num vestiário de estádio moderno (piso branco
   brilhante, teto com spots, cabines brancas com capô curvo preto, banco estofado, TV suspensa)
   até perto da parede do fundo, onde a luz estoura em branco e revela o palco 2D.
   O vídeo é um render fotorrealista do Blender (render/cena.py) finalizado no HyperFrames
   (render/entrada/). As cabines exibem as camisas da carreira de Neymar, sem escudos nem patrocínios.

   playIntro({ ready, onFlash }) → Promise que resolve quando a entrada termina (ou é pulada).
   No auge do branco espera `ready` e chama onFlash(): é quando o palco por trás deve aparecer. */

const SRC = { k4: "assets/entrada/entrada-4k.mp4", hd: "assets/entrada/entrada-1080.mp4" };
const LOAD_LIMIT = 8000;   // sem dados suficientes nesse tempo, a entrada é pulada

const span = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

export async function playIntro({ ready, onFlash } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "intro";
  wrap.innerHTML = `
    <video class="intro-video" muted playsinline preload="auto" disablepictureinpicture aria-hidden="true"></video>
    <div class="intro-loading" aria-hidden="true"><b>NJR</b><i></i></div>
    <div class="intro-title" aria-hidden="true"><small>Neymar Jr · 2009 — 2026</small><b>Vestiário</b></div>
    <div class="intro-white" aria-hidden="true"></div>
    <button class="intro-skip" type="button">Pular entrada <span aria-hidden="true">→</span></button>`;
  document.body.append(wrap);
  const video = wrap.querySelector("video");
  const whiteEl = wrap.querySelector(".intro-white");
  const title = wrap.querySelector(".intro-title");

  // 4K só em telas que mostram a diferença; o resto recebe 1080p (bem mais leve)
  const px = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2);
  video.src = px > 2200 ? SRC.k4 : SRC.hd;

  let skip = false, raf = 0;
  const doSkip = () => { skip = true; };
  wrap.querySelector(".intro-skip").addEventListener("click", doSkip);
  const onKey = (e) => { if (["Escape", " ", "Enter"].includes(e.key)) doSkip(); };
  addEventListener("keydown", onKey);

  // espera o vídeo poder tocar até o fim sem travar (ou o visitante pular)
  const loaded = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), LOAD_LIMIT);
    const ok = () => { clearTimeout(t); resolve(true); };
    video.addEventListener("canplaythrough", ok, { once: true });
    video.addEventListener("error", () => { clearTimeout(t); resolve(false); }, { once: true });
    const poll = setInterval(() => { if (skip) { clearInterval(poll); clearTimeout(t); resolve(false); } }, 100);
    video.addEventListener("canplaythrough", () => clearInterval(poll), { once: true });
  });
  wrap.querySelector(".intro-loading")?.remove();

  if (loaded && !skip) {
    await video.play().catch(() => { skip = true; });
    await new Promise((resolve) => {
      const frame = () => {
        const t = video.currentTime, dur = video.duration || 5.4;
        // título no meio do percurso
        const tt = span(t, 1.7, 2.2) * (1 - span(t, 3.4, 3.9));
        title.style.opacity = tt;
        title.style.transform = `translate(-50%, -50%) scale(${0.97 + span(t, 1.7, 3.9) * 0.05})`;
        title.style.letterSpacing = `${0.26 - span(t, 1.7, 3.9) * 0.2}em`;
        // o vídeo já termina em branco; a camada branca só garante a emenda com o palco
        whiteEl.style.opacity = span(t, dur - 0.25, dur - 0.05);
        if (skip || video.ended || t >= dur - 0.05) { resolve(); return; }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  }
  cancelAnimationFrame(raf);
  removeEventListener("keydown", onKey);
  title.style.opacity = 0;
  // pulo: um branco curto, para a emenda com o palco ser a mesma
  if (getComputedStyle(whiteEl).opacity < 1) {
    await whiteEl.animate([{ opacity: getComputedStyle(whiteEl).opacity }, { opacity: 1 }], { duration: 220, easing: "ease-out", fill: "forwards" }).finished;
  }
  whiteEl.style.opacity = 1;
  video.pause();
  await ready;                               // o palco precisa estar montado antes de aparecer
  onFlash?.();
  video.style.opacity = 0;
  wrap.style.background = "transparent";
  wrap.querySelector(".intro-skip").remove();
  await whiteEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 750, easing: "cubic-bezier(0.33, 0, 0, 1)", fill: "forwards" }).finished;
  video.removeAttribute("src");
  video.load();
  wrap.remove();
}
