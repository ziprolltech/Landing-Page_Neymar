// Teste da aba Títulos: 1440x900 e 375x812, rolagem, filtros, foco (mouse, teclado), movimento reduzido.
// Uso: node titulos/_testes/testar.mjs [pasta-de-saida]
import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const out = process.argv[2] || "C:/Users/caiqu/Site-Neymar/titulos/_testes/shots";
const URL = "http://localhost:8080/titulos/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
import fs from "node:fs";
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const errs = [];
const log = (...a) => console.log(...a);
try {
  for (const vp of [{ name: "d", width: 1440, height: 900 }, { name: "m", width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => errs.push(`[${vp.name}] pageerror ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errs.push(`[${vp.name}] console ${m.text()}`); });
    page.on("requestfailed", (r) => errs.push(`[${vp.name}] falhou ${r.url()}`));
    await page.setViewport(vp);
    await page.goto(URL, { waitUntil: "networkidle0" });
    await sleep(2600);
    const shot = (n) => page.screenshot({ path: `${out}/${vp.name}-${n}.jpg`, type: "jpeg", quality: 72 });
    await shot("01-abertura");
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    log(vp.name, "altura", H);
    // rolagem em passos (lenis acompanha o scroll nativo)
    for (const [y, n] of [[0.5, "02-abertura-meio"], [1.15, "03-ritmo"]]) {
      await page.evaluate((y) => window.scrollTo(0, y * innerHeight), y); await sleep(1400); await shot(n);
    }
    await page.evaluate(() => { const r = document.querySelector("#exposicao"); window.scrollTo(0, r.getBoundingClientRect().top + scrollY); });
    await sleep(1200); await shot("04-exposicao");
    await page.evaluate(() => window.scrollBy(0, innerHeight * 0.9)); await sleep(1600); await shot("05-parede");
    // filtro: prêmios individuais
    await page.click('#f-cat button[data-cat="individual"]'); await sleep(1900); await shot("06-filtro-premios");
    const c1 = await page.evaluate(() => [document.querySelector("#fc-t").textContent, document.querySelector("#fc-p").textContent, document.querySelectorAll(".pc:not([hidden])").length]);
    log(vp.name, "filtro individual ->", c1);
    // filtro: clubes + PSG
    await page.click('#f-cat button[data-cat="clube"]'); await sleep(1500);
    await page.click('#f-ent button[data-ent="psg"]'); await sleep(1900); await shot("07-filtro-psg");
    const c2 = await page.evaluate(() => [document.querySelector("#fc-t").textContent, document.querySelector("#fc-p").textContent, document.querySelectorAll(".pc:not([hidden])").length]);
    log(vp.name, "filtro clube+psg ->", c2);
    // filtro vazio: Santos 25– com títulos por clubes
    await page.click('#f-ent button[data-ent="santos-2025"]'); await sleep(1500); await shot("08-filtro-vazio");
    log(vp.name, "vazio ->", await page.evaluate(() => !document.querySelector("#expo-empty").hidden && document.querySelector("#expo-empty").textContent.slice(0, 60)));
    // volta para tudo
    await page.click('#f-ent button[data-ent="todos"]'); await sleep(1300);
    await page.click('#f-cat button[data-cat="todos"]'); await sleep(1600);
    log(vp.name, "tudo ->", await page.evaluate(() => [document.querySelector("#fc-t").textContent, document.querySelector("#fc-p").textContent, document.querySelectorAll(".pc:not([hidden])").length]));
    // abrir a Libertadores 2011 pelo clique
    await page.evaluate(() => document.querySelector('[data-id="libertadores-2011"]').scrollIntoView({ block: "center" })); await sleep(1500);
    await page.click('[data-id="libertadores-2011"] .pc-hit'); await sleep(450); await shot("09-foco-abrindo");
    await sleep(1800); await shot("10-foco");
    log(vp.name, "foco aberto ->", await page.evaluate(() => [!document.querySelector("#focus").hidden, document.querySelector("#fx-now").textContent, location.hash]));
    // teclado: próxima e anterior
    await page.keyboard.press("ArrowRight"); await sleep(1600); await shot("11-foco-proxima");
    log(vp.name, "→ ->", await page.evaluate(() => [document.querySelector("#fx-now").textContent, location.hash]));
    await page.keyboard.press("ArrowRight"); await sleep(250); await page.keyboard.press("ArrowRight"); await sleep(1800);
    log(vp.name, "→→ (fila) ->", await page.evaluate(() => [document.querySelector("#fx-now").textContent, location.hash]));
    await page.keyboard.press("ArrowLeft"); await sleep(1600);
    if (vp.name === "m") { await page.evaluate(() => document.querySelector("#focus").scrollTo(0, 500)); await sleep(500); await shot("12-foco-info"); }
    // prêmio (medalhão)
    await page.click("#fx-rail li:nth-child(10) button"); await sleep(1700); await shot("13-foco-trilho");
    log(vp.name, "trilho ->", await page.evaluate(() => [document.querySelector("#fx-now").textContent, location.hash]));
    await page.keyboard.press("Escape"); await sleep(1500); await shot("14-fechado");
    log(vp.name, "Esc ->", await page.evaluate(() => [document.querySelector("#focus").hidden, document.activeElement?.className, document.querySelector(".pc.is-current")?.dataset.id, location.hash]));
    // teclado na parede: Enter abre
    await page.keyboard.press("Enter"); await sleep(1700);
    log(vp.name, "Enter ->", await page.evaluate(() => !document.querySelector("#focus").hidden));
    await page.click("#fx-close"); await sleep(1500);
    // gráfico ano a ano: clique em 2016 leva à sala
    await page.evaluate(() => document.querySelector("#ritmo").scrollIntoView()); await sleep(1200);
    await page.evaluate(() => [...document.querySelectorAll(".rh-col")].find((b) => b.getAttribute("aria-label").startsWith("2016")).click()); await sleep(2000);
    log(vp.name, "ritmo 2016 ->", await page.evaluate(() => Math.round(document.querySelector("#sala-2016").getBoundingClientRect().top)));
    await shot("15-sala-2016");
    await page.evaluate(() => document.querySelector("#notas").scrollIntoView()); await sleep(1500); await shot("16-notas");
    await page.close();
  }
  // movimento reduzido
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(`[r] pageerror ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errs.push(`[r] console ${m.text()}`); });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL + "#peca=ouro-olimpico-2016", { waitUntil: "networkidle0" });
  await sleep(1500);
  await page.screenshot({ path: `${out}/r-01-link-direto.jpg`, type: "jpeg", quality: 72 });
  log("r", "link direto ->", await page.evaluate(() => [!document.querySelector("#focus").hidden, document.querySelector("#fx-name").textContent]));
  await page.keyboard.press("Escape"); await sleep(400);
  await page.evaluate(() => window.scrollTo(0, document.querySelector("#exposicao").offsetTop + 900)); await sleep(800);
  await page.screenshot({ path: `${out}/r-02-parede.jpg`, type: "jpeg", quality: 72 });
  log("r", "peças visíveis com opacidade 1 ->", await page.evaluate(() => [...document.querySelectorAll(".pc-obj")].filter((o) => getComputedStyle(o).opacity !== "1").length));
  await page.close();
} finally {
  await browser.close();
}
console.log("erros:", JSON.stringify(errs, null, 1));
