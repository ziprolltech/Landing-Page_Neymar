// Teste da aba Carreira: 1440x900 e 375x812, rolagem, controles, teclado, reduced-motion e console.
// Uso: node carreira/_testes/teste.mjs [pasta-de-saida]
import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const out = process.argv[2] || "C:/Users/caiqu/Site-Neymar/carreira/_testes/shots";
const only = process.argv[3] || "";
import fs from "node:fs";
fs.mkdirSync(out, { recursive: true });
const URL = "http://localhost:8080/carreira/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const report = {};
try {
  for (const vp of [{ name: "desk", width: 1440, height: 900 }, { name: "mob", width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]) {
    if (only && only !== vp.name) continue;
    const page = await browser.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
    page.on("requestfailed", (r) => errs.push("reqfail: " + r.url()));
    await page.setViewport(vp);
    await page.goto(URL, { waitUntil: "networkidle0" });
    await sleep(2600);
    await page.screenshot({ path: `${out}/${vp.name}-00-hero.jpg`, type: "jpeg", quality: 72 });
    const info = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth, sections: [...document.querySelectorAll(".ch")].map((s) => [s.id, Math.round(s.getBoundingClientRect().top + scrollY)]) }));
    // rola por cada abertura em 3 pontos (chegando, meio da troca, montada) e pelo corpo
    let k = 1;
    for (const [id, top] of info.sections) {
      const opH = await page.evaluate((id) => document.querySelector(`#${id} .op`).offsetHeight, id);
      for (const f of [0.25, 0.55, 1]) {
        const y = top + (opH - vp.height) * f;
        await page.evaluate((y) => { window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, y);
        await sleep(f === 1 ? 1700 : 900);
        await page.screenshot({ path: `${out}/${vp.name}-${String(k).padStart(2, "0")}-${id}-op${Math.round(f * 100)}.jpg`, type: "jpeg", quality: 70 });
        k++;
      }
      await page.evaluate((y) => { window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, top + opH + vp.height * 0.5);
      await sleep(1500);
      await page.screenshot({ path: `${out}/${vp.name}-${String(k).padStart(2, "0")}-${id}-body.jpg`, type: "jpeg", quality: 70 });
      k++;
      await page.evaluate((y) => { window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, top + opH + vp.height * 1.5);
      await sleep(1300);
      await page.screenshot({ path: `${out}/${vp.name}-${String(k).padStart(2, "0")}-${id}-body2.jpg`, type: "jpeg", quality: 70 });
      k++;
    }
    // controles: volta ao topo, setas do teclado e botões da régua
    await page.evaluate(() => { window.lenis ? window.lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0); });
    await sleep(600);
    const nav = [];
    if (vp.name === "desk") {
      for (let i = 0; i < 3; i++) { await page.keyboard.press("ArrowRight"); await sleep(2900); nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent])); }
      await page.screenshot({ path: `${out}/${vp.name}-90-teclado.jpg`, type: "jpeg", quality: 72 });
      await page.keyboard.press("ArrowLeft"); await sleep(2600);
      nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent]));
      await page.click('.rail .seg[data-go="5"]'); await sleep(3200);
      nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent]));
      await page.screenshot({ path: `${out}/${vp.name}-91-regua-selecao.jpg`, type: "jpeg", quality: 72 });
      await page.click(".rail .prev"); await sleep(3000);
      nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent]));
      await page.click(".rail-now"); await sleep(700);
      await page.screenshot({ path: `${out}/${vp.name}-92-lista.jpg`, type: "jpeg", quality: 72 });
      await page.keyboard.press("Escape"); await sleep(400);
    } else {
      await page.tap('.reel a[data-go="1"]'); await sleep(3000);
      nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent]));
      await page.tap(".rail .next"); await sleep(3000);
      nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent]));
      await page.tap(".rail-now"); await sleep(800);
      await page.screenshot({ path: `${out}/${vp.name}-92-lista.jpg`, type: "jpeg", quality: 72 });
      await page.tap('.rail-list button[data-go="4"]'); await sleep(3200);
      nav.push(await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent]));
      await page.screenshot({ path: `${out}/${vp.name}-93-lista-santos2.jpg`, type: "jpeg", quality: 72 });
    }
    // fim: epílogo + rodapé
    await page.evaluate(() => { const y = document.documentElement.scrollHeight; window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
    await sleep(1500);
    await page.screenshot({ path: `${out}/${vp.name}-99-fim.jpg`, type: "jpeg", quality: 72 });
    report[vp.name] = { ...info, nav, errs };
    await page.close();
  }
  // movimento reduzido (desktop)
  if (!only || only === "reduced") {
    const page = await browser.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: "networkidle0" });
    await sleep(1200);
    const top = await page.evaluate(() => document.querySelector("#cap-barcelona").getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y), top);
    await sleep(800);
    await page.screenshot({ path: `${out}/reduced-barcelona.jpg`, type: "jpeg", quality: 72 });
    await page.keyboard.press("ArrowRight"); await sleep(600);
    const after = await page.evaluate(() => [Math.round(scrollY), document.querySelector(".rail-name b")?.textContent, document.documentElement.scrollHeight]);
    await page.screenshot({ path: `${out}/reduced-seta.jpg`, type: "jpeg", quality: 72 });
    report.reduced = { after, errs };
    await page.close();
  }
  // sem JavaScript
  if (!only || only === "nojs") {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: "networkidle0" });
    const top = await page.evaluate(() => document.querySelector("#cap-psg").getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y), top + 900);
    await page.screenshot({ path: `${out}/nojs-psg.jpg`, type: "jpeg", quality: 72 });
    report.nojs = await page.evaluate(() => document.body.innerText.length);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(report, null, 1));
