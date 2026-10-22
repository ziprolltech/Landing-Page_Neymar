/* NEYMAR: THE EXPERIENCE — palco WebGL.
   Um único quad em tela cheia. O retrato do hero da home (foto + máscara + mapas de normal e de
   profundidade) é reiluminado por uma luz direcional, com contraluz, feixe volumétrico, poeira no ar,
   grão e vinheta. A "câmera" é um enquadramento sobre a imagem (foco, zoom, posição na tela) e a
   profundidade dá o parallax. Nada aqui deforma o rosto: o parallax é de poucos pixels e só no fundo da máscara. */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDiffuse, uAlpha, uNormal, uDepth, uOverlay, uBgTex;
uniform vec2 uRes;          // px
uniform float uImgAspect;   // largura / altura da imagem
uniform vec3 uCam;          // foco x, foco y (uv da imagem), zoom
uniform vec2 uScreenPos;    // onde o foco fica na tela (0..1)
uniform vec2 uPointer;      // -1..1
uniform vec2 uLight;        // direção xy da luz principal
uniform float uKey, uAmb, uRim, uRelight, uExposure, uDesat, uWarm;
uniform float uBeam, uBeamX, uBeamAngle, uBeamWidth, uDust, uGlow;
uniform float uLens, uLensR; uniform vec2 uLensPos;
uniform float uBgMix, uFloorFade, uTime, uParallax, uGrain;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  vec2 p = vUv;
  float A = uRes.x / uRes.y;
  float span = 1.0 / uCam.z;
  vec2 iuv = vec2(uCam.x + (p.x - uScreenPos.x) * span * A / uImgAspect, uCam.y + (p.y - uScreenPos.y) * span);
  // parallax: o fundo do retrato (profundidade baixa) anda mais que o rosto
  float d0 = texture2D(uDepth, iuv).r;
  iuv += uPointer * (0.6 - d0) * 0.012 * uParallax * span;
  float inside = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);

  // ---- fundo: escuro, com um brilho atrás do protagonista ----
  vec2 sp = vec2(p.x * A, p.y);
  vec2 fp = vec2(uScreenPos.x * A, uScreenPos.y + 0.05);
  float glow = exp(-pow(length(sp - fp) / 0.6, 2.0)) * uGlow;
  vec3 warm = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.86, 0.6), uWarm);
  vec3 col = vec3(0.006, 0.0065, 0.008) + glow * 0.06 * mix(vec3(0.6, 0.65, 0.75), warm, 0.5);
  if (uBgMix > 0.001) {
    // placa de fundo 16:9 (Higgsfield) em "cover", com um parallax mais lento que o do protagonista
    vec2 sc = vec2(min(1.0, A / 1.7778), min(1.0, 1.7778 / A));
    vec2 bu = (p - 0.5) * sc * 0.96 + 0.5 - uPointer * 0.006 * uParallax;
    col = mix(col, toLin(texture2D(uBgTex, bu).rgb), uBgMix);
  }

  // ---- feixe volumétrico vindo do alto ----
  vec2 bo = vec2(uBeamX * A, 1.15);
  vec2 bd = normalize(vec2(sin(uBeamAngle), -cos(uBeamAngle)));
  vec2 rel = sp - bo;
  float along = dot(rel, bd);
  float across = abs(rel.x * bd.y - rel.y * bd.x);
  float w = uBeamWidth * (0.25 + along * 0.55);
  float beam = exp(-pow(across / max(w, 0.001), 2.0)) * smoothstep(0.0, 0.35, along) * exp(-along * 0.55);
  beam *= 0.75 + 0.25 * noise(vec2(across * 6.0, along * 2.0 - uTime * 0.15));
  col += beam * uBeam * 0.55 * warm;

  // ---- protagonista reiluminado ----
  float a0 = texture2D(uAlpha, iuv).r;
  float m = smoothstep(0.5, 0.96, a0) * inside;          // máscara um pouco recolhida: sem o halo do fundo branco
  m *= smoothstep(0.0, uFloorFade, iuv.y);              // a base da foto se dissolve no escuro
  vec3 alb0 = texture2D(uDiffuse, iuv).rgb;
  alb0 = clamp((alb0 - (1.0 - a0)) / max(a0, 0.2), 0.0, 1.0);   // tira o branco que vaza na borda
  vec3 alb = toLin(alb0) * 0.82;
  vec3 n = normalize(texture2D(uNormal, iuv).xyz * 2.0 - 1.0);
  vec3 L = normalize(vec3(uLight, 0.65));
  float lam = max(dot(n, L), 0.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.2) * max(dot(normalize(n.xy + 1e-4), -normalize(uLight + 1e-4)), 0.0);
  // luz recortada: queda forte para o lado da sombra, como uma lâmpada de estúdio
  float pool = smoothstep(-0.2, 0.9, dot(normalize(vec2(sp.x - fp.x, p.y - uScreenPos.y) + 1e-4), normalize(uLight)) * 0.5 + 0.5);
  vec3 lit = alb * (uAmb + uKey * pow(lam, 1.7) * warm * 1.55 * mix(0.55, 1.0, pool)) + rim * uRim * vec3(1.0, 0.95, 0.85) * 0.9;
  vec3 subj = mix(alb * (uAmb + uKey * 0.55), lit, uRelight);
  // alter ego (o coringa da home), revelado por uma lente que segue o ponteiro
  if (uLens > 0.001) {
    vec4 ov = texture2D(uOverlay, iuv);
    float lens = smoothstep(uLensR, uLensR * 0.55, length(sp - vec2(uLensPos.x * A, uLensPos.y)));
    vec3 ovl = toLin(ov.rgb) * (uAmb + uKey * lam * 1.2) + rim * uRim * 0.6;
    subj = mix(subj, ovl, ov.a * lens * uLens);
    subj += lens * uLens * 0.02 * (1.0 - step(0.98, lens));
  }
  subj += beam * uBeam * 0.06;                          // o feixe também toca o protagonista
  col = mix(col, subj, m);

  // ---- poeira no ar: mais visível dentro do feixe ----
  if (uDust > 0.001) {
    for (int k = 0; k < 2; k++) {
      float sc = k == 0 ? 22.0 : 38.0;
      vec2 g = vec2(sp.x * sc, sp.y * sc * 0.6 - uTime * (0.25 + float(k) * 0.18));
      vec2 id = floor(g), f = fract(g) - 0.5;
      float h = hash(id + float(k) * 17.0);
      vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
      o += 0.18 * vec2(sin(uTime * 0.6 + h * 6.28), cos(uTime * 0.5 + h * 9.0));
      float s = smoothstep(0.06, 0.0, length(f - o * 0.8)) * step(0.78, h);
      col += s * (0.12 + beam * 1.4) * uDust * warm * (k == 0 ? 0.9 : 0.5);
    }
  }

  // ---- acabamento: exposição, tom, dessaturação, vinheta, grão ----
  col *= uExposure;
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);   // ACES
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(l), uDesat);
  float vig = smoothstep(1.25, 0.35, length((p - 0.5) * vec2(A * 0.9, 1.0)));
  col *= mix(0.4, 1.0, vig);
  col += (hash(p * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`;

export const DEFAULTS = {
  fx: 0.5, fy: 0.6, zoom: 1.2, sx: 0.62, sy: 0.5,
  lx: -0.7, ly: 0.35, key: 1.15, amb: 0.06, rim: 0.7, relight: 1, exposure: 1, desat: 0.15, warm: 0.6,
  beam: 0.5, beamX: 0.35, beamAngle: 0.35, beamWidth: 0.22, dust: 0.6, glow: 0.8,
  lens: 0, lensR: 0.32, bgMix: 0, floorFade: 0.16, parallax: 1, grain: 0.035,
};

export class Stage {
  constructor(canvas, { mobile = false } = {}) {
    this.canvas = canvas;
    this.mobile = mobile;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL indisponível");
    this.gl = gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    this.pr = pr;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.buf = buf;
    this.u = {};
    const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(pr, i); this.u[a.name] = gl.getUniformLocation(pr, a.name); }
    this.tex = {};
    ["uDiffuse", "uAlpha", "uNormal", "uDepth", "uOverlay", "uBgTex"].forEach((name, unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      // 1x1 preto até a imagem chegar: nada de tela vazia piscando
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, name === "uNormal" ? 255 : 0]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(this.u[name], unit);
      this.tex[name] = { t, unit };
    });
    this.state = { ...DEFAULTS };
    this.pointer = [0, 0];
    this.imgAspect = 2048 / 2336;
    this.resize();
  }
  async load(name, url) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const gl = this.gl, { t, unit } = this.tex[name];
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return img;
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, this.mobile ? 1.25 : 1.6);
    const w = Math.round(this.canvas.clientWidth * dpr), h = Math.round(this.canvas.clientHeight * dpr);
    if (w && h && (w !== this.canvas.width || h !== this.canvas.height)) { this.canvas.width = w; this.canvas.height = h; }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  render(time) {
    const gl = this.gl, s = this.state, u = this.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uImgAspect, this.imgAspect);
    gl.uniform3f(u.uCam, s.fx, s.fy, s.zoom);
    gl.uniform2f(u.uScreenPos, s.sx, s.sy);
    gl.uniform2f(u.uPointer, this.pointer[0], this.pointer[1]);
    gl.uniform2f(u.uLight, s.lx, s.ly);
    gl.uniform1f(u.uKey, s.key); gl.uniform1f(u.uAmb, s.amb); gl.uniform1f(u.uRim, s.rim);
    gl.uniform1f(u.uRelight, s.relight); gl.uniform1f(u.uExposure, s.exposure); gl.uniform1f(u.uDesat, s.desat);
    gl.uniform1f(u.uWarm, s.warm); gl.uniform1f(u.uBeam, s.beam); gl.uniform1f(u.uBeamX, s.beamX);
    gl.uniform1f(u.uBeamAngle, s.beamAngle); gl.uniform1f(u.uBeamWidth, s.beamWidth);
    gl.uniform1f(u.uDust, this.mobile ? s.dust * 0.6 : s.dust); gl.uniform1f(u.uGlow, s.glow);
    gl.uniform1f(u.uLens, s.lens); gl.uniform1f(u.uLensR, s.lensR); gl.uniform2f(u.uLensPos, s.lensX ?? 0.5, s.lensY ?? 0.6);
    gl.uniform1f(u.uBgMix, s.bgMix); gl.uniform1f(u.uFloorFade, s.floorFade);
    gl.uniform1f(u.uTime, time / 1000); gl.uniform1f(u.uParallax, s.parallax); gl.uniform1f(u.uGrain, s.grain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  dispose() {
    const gl = this.gl;
    Object.values(this.tex).forEach(({ t }) => gl.deleteTexture(t));
    gl.deleteBuffer(this.buf);
    gl.deleteProgram(this.pr);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
