// Testa a aba Santos: 1440x900 e 375x812, rolagem, controles, teclado, reduced-motion e console.
// Uso: node testar.mjs <pasta-de-saida> [reduced]
import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const out = process.argv[2] || ".";
const reduced = process.argv[3] === "reduced";
const URL = "http://localhost:8080/santos/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const errs = [];
const results = [];
try {
  for (const [w, h, tag] of [[1440, 900, "d"], [375, 812, "m"]]) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => errs.push(`[${tag}] pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errs.push(`[${tag}] console: ${m.text()}`); });
    page.on("requestfailed", (r) => errs.push(`[${tag}] falhou: ${r.url()}`));
    page.on("response", (r) => { if (r.status() >= 400) errs.push(`[${tag}] ${r.status()}: ${r.url()}`); });
    await page.setViewport({ width: w, height: h });
    if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(URL, { waitUntil: "networkidle0" });
    await sleep(3200);
    const shot = (n) => page.screenshot({ path: `${out}/${tag}${reduced ? "r" : ""}-${n}.jpg`, type: "jpeg", quality: 72 });
    await shot("01-abertura");
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const abH = await page.evaluate(() => document.querySelector("#abertura").offsetHeight);
    // rolagem pela abertura (scrub)
    for (const f of [0.35, 0.7, 1]) {
      await page.evaluate((y) => { (window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y)); }, Math.round((abH - h) * f));
      await sleep(900);
      await shot(`02-abertura-${Math.round(f * 100)}`);
    }
    const go = async (sel, off = 0) => {
      await page.evaluate((s, o) => { const y = document.querySelector(s).getBoundingClientRect().top + scrollY + o; window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, sel, off);
      await sleep(1500);
    };
    await go("#capitulos");
    await shot("03-cap1");
    await go("#painel-primeira .pn-stats", -200);
    await shot("04-cap1-numeros");
    await go("#painel-primeira .pn-moments", -100);
    await shot("05-cap1-momentos");
    // troca de capítulo por clique
    await go("#capitulos");
    await page.click("#tab-retorno");
    await sleep(1800);
    await shot("06-cap2");
    const sel = await page.evaluate(() => [document.querySelector("#tab-retorno").getAttribute("aria-selected"), document.querySelector("#painel-retorno").hidden, document.querySelector("#painel-primeira").hidden, location.hash]);
    results.push(`[${tag}] clique retorno -> ${JSON.stringify(sel)}`);
    // teclado: seta para a esquerda volta à primeira
    await page.focus("#tab-retorno");
    await page.keyboard.press("ArrowLeft");
    await sleep(1200);
    const kb = await page.evaluate(() => [document.activeElement.id, document.querySelector("#painel-primeira").hidden]);
    results.push(`[${tag}] teclado ArrowLeft -> ${JSON.stringify(kb)}`);
    // o tempo (scrub)
    const tpH = await page.evaluate(() => document.querySelector("#tempo").offsetHeight);
    const tpTop = await page.evaluate(() => document.querySelector("#tempo").getBoundingClientRect().top + scrollY);
    for (const f of [0.1, 0.5, 0.95]) {
      await page.evaluate((y) => { window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, Math.round(tpTop + (tpH - h) * f));
      await sleep(900);
      await shot(`07-tempo-${Math.round(f * 100)}`);
    }
    results.push(`[${tag}] ano no fim do tempo: ${await page.evaluate(() => document.querySelector("#tp-year").textContent)}`);
    await go("#linha", 400);
    await shot("08-linha");
    await go("#uniformes");
    await shot("09-uniformes");
    await page.click('[data-era="10"]');
    await page.click('[data-kit="listrada"]');
    await sleep(1300);
    await shot("10-uniformes-10-listrada");
    results.push(`[${tag}] camisa: ${await page.evaluate(() => document.querySelector("#shirt-cap").textContent)}`);
    await go("#galeria");
    await shot("11-galeria");
    await page.click('[data-f="retorno"]');
    await sleep(1200);
    results.push(`[${tag}] filtro retorno: ${await page.evaluate(() => [...document.querySelectorAll(".ga-item")].filter((x) => !x.hidden).length)} fotos`);
    await shot("12-galeria-filtro");
    await page.click(".ga-item:not([hidden]) .ga-btn");
    await sleep(900);
    await page.keyboard.press("ArrowRight");
    await sleep(700);
    await shot("13-lightbox");
    results.push(`[${tag}] lightbox: ${await page.evaluate(() => [document.querySelector("#lb").open, document.querySelector("#lb-count").textContent])}`);
    await page.keyboard.press("Escape");
    await sleep(500);
    results.push(`[${tag}] lightbox fechado: ${await page.evaluate(() => !document.querySelector("#lb").open)}`);
    await go("#registros");
    await shot("14-registros");
    await page.evaluate(() => { window.lenis ? window.lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true }) : scrollTo(0, 1e6); });
    await sleep(1000);
    await shot("15-fim");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    results.push(`[${tag}] altura ${total}px, overflow horizontal: ${overflow}px`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(results.join("\n"));
console.log("erros:", errs.length ? "\n" + errs.join("\n") : "nenhum");
