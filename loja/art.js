/* Loja — imagens dos produtos, desenhadas em SVG pelo próprio site.
   Nenhuma foto de terceiros, nenhum escudo, logo de clube, patrocinador ou fornecedora.
   Tudo cabe numa prancha 600×720 (5:6). As cores vêm por variáveis CSS (--b corpo, --p estampa,
   --a destaque) para que a troca de cor possa transicionar. */

export const PAL = {
  tinta: { b: "#17191f", p: "#f2f4f5", a: "#fedd00", n: "#fedd00" },
  gelo: { b: "#eceff1", p: "#0e0f14", a: "#f5cf00", n: "#0e0f14" },
  amarelo: { b: "#fedd00", p: "#0e0f14", a: "#0b8a3a", n: "#0e0f14" },
  verde: { b: "#0b8a3a", p: "#fedd00", a: "#ffffff", n: "#fedd00" },
};
const CAPAS = {
  jogador: { bg: "#0e0f14", fg: "#ffffff", ac: "#fedd00", n: "01" },
  carreira: { bg: "#eceff1", fg: "#0e0f14", ac: "#f5cf00", n: "02" },
  titulos: { bg: "#fedd00", fg: "#0e0f14", ac: "#0b8a3a", n: "03" },
  santos: { bg: "#f7fafb", fg: "#0e0f14", ac: "#f5cf00", n: "04" },
  vestiario: { bg: "#0b8a3a", fg: "#ffffff", ac: "#fedd00", n: "05" },
};
const OSW = "Oswald, Impact, sans-serif";
const SG = "'Space Grotesk', system-ui, sans-serif";

let seq = 0;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const T = (x, y, size, str, { anchor = "middle", fill = "var(--p)", ls = 0, w = 700, fam = OSW, op = 1, extra = "" } = {}) =>
  `<text x="${x}" y="${y}" font-family="${fam}" font-weight="${w}" font-size="${size}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ""}${op < 1 ? ` opacity="${op}"` : ""} style="fill:${fill}"${extra}>${str}</text>`;
const dotted = (str, dotFill) => `${esc(str)}<tspan style="fill:${dotFill}">.</tspan>`;

/* tipo da vista a partir do nome */
export function viewKind(name) {
  if (/costas|verso/i.test(name)) return "back";
  if (/detalhe/i.test(name)) return "zoom";
  if (/parede/i.test(name)) return "wall";
  return "front";
}

/* ---------- peças ---------- */
function defs(u) {
  return `<defs>
    <linearGradient id="${u}s" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".30"/><stop offset=".17" stop-color="#000" stop-opacity="0"/>
      <stop offset=".42" stop-color="#fff" stop-opacity=".10"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".84" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/>
    </linearGradient>
    <linearGradient id="${u}v" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".20"/>
    </linearGradient>
    <linearGradient id="${u}g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${u}w" cx=".5" cy=".28" r=".75">
      <stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="${u}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>`;
}
const shadow = (u, y, rx = 200, op = 0.2) => `<ellipse cx="300" cy="${y}" rx="${rx}" ry="16" fill="#000" opacity="${op}" filter="url(#${u}f)"/>`;
// corpo com cor + sombreamento independente da cor + contorno fino
const body = (u, d) => `<path d="${d}" style="fill:var(--b)"/><path d="${d}" fill="url(#${u}s)"/><path d="${d}" fill="url(#${u}v)"/>` +
  `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.5" stroke-linejoin="round"/>`;

const TEE = "M222 96 C252 124 348 124 378 96 L470 124 Q500 134 520 160 L566 226 L496 276 L462 238 L462 636 Q300 652 138 636 L138 238 L104 276 L34 226 L80 160 Q100 134 130 124 Z";
const TEE_BACK = "M222 96 C262 106 338 106 378 96 L470 124 Q500 134 520 160 L566 226 L496 276 L462 238 L462 636 Q300 652 138 636 L138 238 L104 276 L34 226 L80 160 Q100 134 130 124 Z";
function tee(u, p, back, cor) {
  const num = "var(--n)";
  let s = shadow(u, 664) + body(u, back ? TEE_BACK : TEE);
  if (!back) s += `<path d="M232 94 C262 114 338 114 368 94 C340 84 260 84 232 94 Z" fill="#000" opacity=".38"/>`;
  s += `<path d="${back ? "M222 96 C262 106 338 106 378 96" : "M222 96 C252 124 348 124 378 96"}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="10"/>
    <path d="M550 212 L488 262 M50 212 L112 262 M140 618 Q300 634 460 618" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="2"/>
    <path d="M196 300 Q214 450 186 620 M410 280 Q392 430 418 612" fill="none" stroke="#000" stroke-opacity=".05" stroke-width="22" stroke-linecap="round"/>`;
  if (p.arte === "dez") {
    s += back
      ? T(300, 250, 50, "NEYMAR JR", { ls: 3 }) + T(300, 520, 250, "10", { fill: num })
      : T(300, 236, 30, "NJR", { ls: 6 }) + T(300, 478, 230, "10", { fill: num });
  } else {
    if (back) {
      const xs = [180, 240, 300, 360, 420], ys = ["2009", "2013", "2017", "2023", "2025"];
      s += T(300, 236, 26, "DA VILA AO MUNDO", { ls: 2 }) +
        `<line x1="172" y1="300" x2="428" y2="300" style="stroke:var(--p)" stroke-width="2"/>` +
        xs.map((x, i) => `<circle cx="${x}" cy="300" r="${i === 4 ? 8 : 5}" style="fill:${i === 4 ? "var(--a)" : "var(--b)"};stroke:var(--p)" stroke-width="2"/>` +
          T(x, 336, 18, ys[i], { w: 500 })).join("") +
        T(300, 400, 13, "NEYMAR JR · 10", { fam: SG, w: 500, ls: 3, op: 0.7 });
    } else {
      s += T(186, 300, 58, "DA VILA", { anchor: "start" }) + T(186, 362, 58, dotted("AO MUNDO", "var(--a)"), { anchor: "start" }) +
        T(188, 398, 13, "NEYMAR JR · 10", { anchor: "start", fam: SG, w: 500, ls: 3, op: 0.7 });
    }
  }
  return s;
}

const HOOD_BODY = "M208 128 L118 160 Q78 176 70 230 L38 560 Q36 576 52 578 L98 582 Q112 582 114 568 L142 318 L142 640 Q300 658 458 640 L458 318 L486 568 Q488 582 502 582 L548 578 Q564 576 562 560 L530 230 Q522 176 482 160 L392 128 Z";
function hoodie(u, p, back, cor) {
  const dot = "var(--a)";
  let s = shadow(u, 668) + body(u, HOOD_BODY);
  s += `<path d="M40 546 L114 556 L114 568 Q112 582 98 582 L52 578 Q36 576 38 560 Z M560 546 L486 556 L486 568 Q488 582 502 582 L548 578 Q564 576 562 560 Z M142 612 Q300 630 458 612 L458 640 Q300 658 142 640 Z" fill="#000" opacity=".16"/>
    <path d="M150 320 Q170 460 150 600 M450 320 Q430 460 450 600 M92 300 L66 520 M508 300 L534 520" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="16" stroke-linecap="round"/>`;
  if (back) {
    s += body(u, "M214 130 C200 232 250 300 300 304 C350 300 400 232 386 130 Z") +
      `<path d="M300 140 L300 300" stroke="#000" stroke-opacity=".18" stroke-width="2"/>` +
      T(300, 560, 180, "NJR");
  } else {
    s += body(u, "M206 134 C190 60 250 30 300 30 C350 30 410 60 394 134 C370 154 230 154 206 134 Z") +
      `<path d="M232 136 C228 86 266 62 300 62 C334 62 372 86 368 136 C346 168 254 168 232 136 Z" fill="#000" opacity=".42"/>` +
      body(u, "M230 134 C254 166 346 166 370 134 L374 150 C350 188 250 188 226 150 Z") +
      `<path d="M270 176 L264 262 M330 176 L336 262" fill="none" style="stroke:var(--a)" stroke-width="5" stroke-linecap="round"/>
       <rect x="259" y="258" width="10" height="20" rx="3" style="fill:var(--p)"/><rect x="331" y="258" width="10" height="20" rx="3" style="fill:var(--p)"/>
       <path d="M196 470 L404 470 L436 604 L164 604 Z" fill="#000" fill-opacity=".05" stroke="#000" stroke-opacity=".22" stroke-width="2"/>
       <path d="M196 470 Q186 540 164 604 M404 470 Q414 540 436 604" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/>` +
      T(300, 360, 56, "OUSADIA", { ls: 1 }) + T(300, 424, 56, dotted("E ALEGRIA", dot), { ls: 1 });
  }
  return s;
}

function cap(u, p, back) {
  let s = shadow(u, 522, 210, 0.22);
  const crown = "M140 430 C136 290 214 214 300 212 C386 214 464 290 460 430 Z";
  if (back) {
    s += `<path d="M120 426 C200 474 400 474 480 426 C470 450 400 470 300 470 C200 470 130 450 120 426 Z" style="fill:var(--b)"/><path d="M120 426 C200 474 400 474 480 426 C470 450 400 470 300 470 C200 470 130 450 120 426 Z" fill="#000" opacity=".35"/>` +
      body(u, crown) +
      `<path d="M300 214 C262 260 236 340 226 430 M300 214 C338 260 364 340 374 430 M300 214 L300 378" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
       <path d="M246 431 C248 372 352 372 354 431 Z" fill="#000" opacity=".55"/>
       <rect x="236" y="398" width="128" height="14" rx="7" style="fill:var(--b)"/><rect x="236" y="398" width="128" height="14" rx="7" fill="#000" opacity=".22"/>
       <rect x="288" y="395" width="24" height="20" rx="3" style="fill:var(--a)"/>` +
      T(300, 350, 66, "10");
  } else {
    s += body(u, crown) +
      `<path d="M300 214 C262 260 236 340 226 430 M300 214 C338 260 364 340 374 430" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
       <circle cx="252" cy="268" r="4" fill="#000" opacity=".4"/><circle cx="348" cy="268" r="4" fill="#000" opacity=".4"/>` +
      T(300, 378, 84, "NJR", { ls: 2 }) +
      body(u, "M112 430 C190 404 410 404 488 430 C500 470 420 506 300 508 C180 506 100 470 112 430 Z") +
      `<path d="M112 430 C100 470 180 506 300 508 C420 506 500 470 488 430 C470 462 400 484 300 486 C200 484 130 462 112 430 Z" fill="#000" opacity=".25"/>
       <path d="M136 438 C220 418 380 418 464 438 M150 452 C230 432 370 432 450 452" fill="none" style="stroke:var(--p)" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="5 5"/>`;
  }
  s += `<circle cx="300" cy="214" r="10" style="fill:var(--a)"/><circle cx="300" cy="214" r="10" fill="url(#${u}v)"/>`;
  return s;
}

function mug(u, p, back, cor) {
  const flip = back ? ` transform="translate(600 0) scale(-1 1)"` : "";
  const num = "var(--n)";
  let s = shadow(u, 604, 190, 0.24) +
    `<g${flip}>${body(u, "M430 304 C526 300 530 476 430 486 L430 452 C488 446 490 334 430 336 Z")}</g>` +
    body(u, "M170 250 L170 560 Q170 592 202 592 L398 592 Q430 592 430 560 L430 250 Z") +
    `<ellipse cx="300" cy="250" rx="130" ry="24" style="fill:var(--b)"/><ellipse cx="300" cy="250" rx="130" ry="24" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.5"/>
     <ellipse cx="300" cy="252" rx="116" ry="18" fill="#000" opacity=".5"/>
     <path d="M196 270 L196 566" stroke="#fff" stroke-opacity=".16" stroke-width="10" stroke-linecap="round"/>`;
  s += back
    ? T(300, 412, 46, "OUSADIA", { ls: 1 }) + T(300, 466, 46, dotted("E ALEGRIA", "var(--a)"), { ls: 1 })
    : T(300, 330, 24, "NJR", { ls: 6 }) + T(300, 530, 190, "10", { fill: num });
  return s;
}

function tote(u) {
  return shadow(u, 664, 190, 0.22) +
    `<path d="M228 302 C214 130 386 130 372 302" fill="none" style="stroke:var(--b)" stroke-width="18"/><path d="M228 302 C214 130 386 130 372 302" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="18"/>
     <path d="M206 304 C188 166 412 166 394 304" fill="none" style="stroke:var(--b)" stroke-width="18"/><path d="M206 304 C188 166 412 166 394 304" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="18"/>` +
    body(u, "M160 300 L440 300 L458 652 L142 652 Z") +
    `<path d="M162 320 L438 320" stroke="#000" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="6 5"/>
     <path d="M230 340 Q240 500 220 640 M380 330 Q372 480 392 640" fill="none" stroke="#000" stroke-opacity=".05" stroke-width="20" stroke-linecap="round"/>` +
    T(300, 512, 150, "NJR", { ls: 2 }) + T(300, 556, 17, "SANTOS · BRASIL · 10", { fam: SG, w: 700, ls: 3 });
}

/* ---------- pôsteres (prancha local 360×540) ---------- */
function titleSize(word, max = 92) { return Math.min(max, Math.floor(316 / (word.length * 0.5 + 0.35))); }
function posterFrame(c, label, num, title, graphic) {
  const size = titleSize(title);
  return `<rect width="360" height="540" style="fill:${c.bg}"/>${graphic}
    ${T(22, 34, 10, "NJR · NEYMAR JR", { anchor: "start", fill: c.fg, fam: SG, w: 500, ls: 2, op: 0.75 })}
    ${T(338, 34, 10, num, { anchor: "end", fill: c.fg, fam: SG, w: 500, ls: 2, op: 0.75 })}
    <line x1="22" y1="398" x2="338" y2="398" style="stroke:${c.fg}" stroke-opacity=".3"/>
    ${T(20, 476, size, dotted(title.toUpperCase(), c.ac), { anchor: "start", fill: c.fg })}
    ${T(22, 514, 9, label, { anchor: "start", fill: c.fg, fam: SG, w: 500, ls: 1.6, op: 0.6 })}
    ${T(338, 514, 9, "ARTE CONCEITUAL", { anchor: "end", fill: c.fg, fam: SG, w: 500, ls: 1.6, op: 0.6 })}`;
}
function capaArt(id, u) {
  const c = CAPAS[id] || CAPAS.jogador;
  let g = "";
  if (id === "jogador") {
    for (let r = 20; r <= 220; r += 20) g += `<circle cx="250" cy="210" r="${r}" fill="none" style="stroke:${c.fg}" stroke-opacity="${(0.22 - r / 1400).toFixed(3)}"/>`;
    g += `<path d="M250 50 V370 M40 210 H350" style="stroke:${c.fg}" stroke-opacity=".25"/><circle cx="250" cy="210" r="7" style="fill:${c.ac}"/>` +
      T(262, 198, 10, "PLAYER_010", { anchor: "start", fill: c.fg, fam: SG, w: 500, ls: 1.5 });
  } else if (id === "carreira") {
    const xs = [42, 111, 180, 249, 318], ys = ["2009", "2013", "2017", "2023", "2025"];
    g += `<line x1="22" y1="210" x2="338" y2="210" style="stroke:${c.fg}" stroke-width="2"/>` +
      xs.map((x, i) => `<circle cx="${x}" cy="210" r="${i === 4 ? 8 : 5}" style="fill:${i === 4 ? c.ac : c.bg};stroke:${c.fg}" stroke-width="2"/>` +
        T(x, 186, 20, ys[i], { fill: c.fg, w: 500 })).join("") +
      T(180, 350, 118, "09→25", { fill: "none", extra: ` stroke="${c.fg}" stroke-opacity=".2" stroke-width="1.5"` });
  } else if (id === "titulos") {
    const star = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(" ");
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g += `<line x1="${(180 + Math.cos(a) * 140).toFixed(1)}" y1="${(222 + Math.sin(a) * 140).toFixed(1)}" x2="${(180 + Math.cos(a) * 168).toFixed(1)}" y2="${(222 + Math.sin(a) * 168).toFixed(1)}" style="stroke:${c.fg}" stroke-width="2" stroke-opacity=".5"/>`;
    }
    g += `<polygon points="${star(180, 228, 120, 50)}" fill="none" style="stroke:${c.fg}" stroke-width="2"/><polygon points="${star(180, 228, 44, 18)}" style="fill:${c.fg}"/>`;
  } else if (id === "santos") {
    g += `<clipPath id="${u}c"><circle cx="180" cy="220" r="150"/></clipPath><g clip-path="url(#${u}c)">` +
      Array.from({ length: 9 }, (_, i) => (i % 2 ? "" : `<rect x="${30 + i * 33.4}" y="60" width="33.4" height="330" style="fill:${c.fg}"/>`)).join("") +
      `</g><circle cx="180" cy="220" r="150" fill="none" style="stroke:${c.fg}" stroke-width="2"/><circle cx="318" cy="88" r="8" style="fill:${c.ac}"/>`;
  } else {
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 64, on = i === 2;
      g += `<rect x="${x}" y="70" width="56" height="300" rx="2" style="fill:${on ? c.ac : "none"};stroke:${c.fg}" stroke-opacity="${on ? 1 : 0.5}" stroke-width="1.5"/>` +
        [92, 102, 112].map((y) => `<line x1="${x + 14}" y1="${y}" x2="${x + 42}" y2="${y}" style="stroke:${on ? c.bg : c.fg}" stroke-opacity=".6" stroke-width="2"/>`).join("") +
        (on ? T(x + 28, 250, 40, "10", { fill: c.bg }) : "");
    }
  }
  return posterFrame(c, "CAPAS DAS ABAS", `${c.n} / 05`, (CAPAS_NOMES[id] || id), g);
}
const CAPAS_NOMES = { jogador: "Jogador", carreira: "Carreira", titulos: "Títulos", santos: "Santos", vestiario: "Vestiário" };
function trajArt(cor) {
  const pal = PAL[cor] || PAL.tinta;
  const c = { bg: pal.b, fg: pal.p, ac: cor === "gelo" ? "#f5cf00" : pal.a };
  const rows = [["2009", "SANTOS"], ["2013", "BARCELONA"], ["2017", "PARIS SAINT-GERMAIN"], ["2023", "AL-HILAL"], ["2025", "SANTOS"]];
  let g = `<line x1="40" y1="84" x2="40" y2="372" style="stroke:${c.fg}" stroke-width="2"/>`;
  rows.forEach(([y, n], i) => {
    const yy = 92 + i * 70, last = i === rows.length - 1;
    g += `<circle cx="40" cy="${yy}" r="${last ? 9 : 6}" style="fill:${last ? c.ac : c.bg};stroke:${c.fg}" stroke-width="2"/>` +
      T(64, yy + 14, 40, y, { anchor: "start", fill: c.fg }) +
      T(156, yy + 6, 11, n, { anchor: "start", fill: c.fg, fam: SG, w: 700, ls: 1.4 });
  });
  return posterFrame(c, "DESDE 2009", "NJR / 10", "Trajetória", g);
}
function poster(u, p, kind, opts) {
  const inner = p.tipo === "poster" ? capaArt(opts.capa, u) : trajArt(opts.cor);
  if (kind === "wall") {
    return `<rect width="600" height="720" fill="#e3e7ea"/><rect width="600" height="720" fill="url(#${u}w)"/>
      <rect y="600" width="600" height="120" fill="#cdd3d8"/><line x1="0" y1="600" x2="600" y2="600" stroke="#000" stroke-opacity=".12"/>
      <rect x="180" y="132" width="252" height="372" fill="#000" opacity=".28" filter="url(#${u}f)"/>
      <rect x="168" y="112" width="264" height="384" fill="#111"/>
      <g transform="translate(180 124) scale(.6667)">${inner}</g>
      <rect x="180" y="124" width="240" height="360" fill="url(#${u}g)"/>
      <rect x="130" y="560" width="340" height="10" fill="#b9c1c7"/><rect x="146" y="570" width="8" height="40" fill="#aab2b8"/><rect x="446" y="570" width="8" height="40" fill="#aab2b8"/>`;
  }
  return `<rect x="132" y="108" width="360" height="540" fill="#000" opacity=".22" filter="url(#${u}f)"/>
    <g transform="translate(120 84)">${inner}</g><rect x="120" y="84" width="360" height="540" fill="url(#${u}g)"/>`;
}

/* ---------- API ---------- */
export function art(p, { cor, capa, view = 0, cls = "art", label = "" } = {}) {
  const u = `a${++seq}-`;
  cor = cor || (p.cores && p.cores[0]) || "tinta";
  capa = capa || (p.capas && p.capas[0]) || "jogador";
  const name = (p.vistas && p.vistas[view]) || "Frente";
  const kind = viewKind(name);
  const pal = PAL[cor] || PAL.tinta;
  const back = kind === "back";
  let inner = "";
  switch (p.tipo) {
    case "camiseta": inner = tee(u, p, back, cor); break;
    case "moletom": inner = hoodie(u, p, back, cor); break;
    case "bone": inner = cap(u, p, back); break;
    case "caneca": inner = mug(u, p, back, cor); break;
    case "ecobag": inner = tote(u); break;
    default: inner = poster(u, p, kind, { cor, capa });
  }
  const vb = kind === "zoom" && p.zoom ? p.zoom : "0 0 600 720";
  const aria = label ? ` role="img" aria-label="${esc(label)}"` : ` aria-hidden="true"`;
  return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" data-kind="${kind}"${aria} style="--b:${pal.b};--p:${pal.p};--a:${pal.a};--n:${pal.n}">${defs(u)}${inner}</svg>`;
}
/* troca só as cores de uma arte já desenhada (a mudança transiciona pelo CSS) */
export function recolor(svg, cor) {
  const pal = PAL[cor];
  if (!svg || !pal) return;
  svg.style.setProperty("--b", pal.b); svg.style.setProperty("--p", pal.p); svg.style.setProperty("--a", pal.a); svg.style.setProperty("--n", pal.n);
}
