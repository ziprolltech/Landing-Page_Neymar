// Teste da aba Jogador: 1440x900 e 375x812 (+ movimento reduzido), rolagem, controles, erros de console, screenshots.
// Uso: node teste.mjs <pasta-de-saída> [reduced]
import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const out = process.argv[2] || ".";
const reduced = process.argv[3] === "reduced";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const errs = [];
try {
  for (const [w, h, tag] of [[1440, 900, "d"], [375, 812, "m"]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    page.on("pageerror", (e) => errs.push(`${tag} pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errs.push(`${tag} console: ${m.text()}`); });
    page.on("requestfailed", (r) => errs.push(`${tag} reqfail: ${r.url()}`));
    await page.goto("http://localhost:8080/jogador/", { waitUntil: "networkidle0" });
    const pre = reduced ? "r" + tag : tag;
    await sleep(600); await page.screenshot({ path: `${out}/${pre}-00-entrada.jpg`, type: "jpeg", quality: 70 });
    await sleep(2600); await page.screenshot({ path: `${out}/${pre}-01-abertura.jpg`, type: "jpeg", quality: 70 });
    // mouse: profundidade
    if (tag === "d") { await page.mouse.move(200, 200, { steps: 8 }); await sleep(900); await page.screenshot({ path: `${out}/${pre}-02-mouse.jpg`, type: "jpeg", quality: 70 }); }
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const stopsAt = [0.5, 1.2, 1.9, 2.6].map((k) => k * h);
    const sel = async (s) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : 0; }, s);
    const targets = [
      ["03-recuo", h * 0.5], ["04-perfil", await sel("#perfil")], ["05-perfil-linhas", (await sel("#pf-rows")) + h * 0.6],
      ["06-trajetoria", (await sel("#pf-route")) - h * 0.3], ["07-clubes", (await sel("#nc")) - h * 0.15],
      ["08-selecao-ini", (await sel("#ns")) + h * 0.2], ["09-selecao-meio", (await sel("#ns")) + h * 1.3], ["10-selecao-fim", (await sel("#ns")) + h * 2.6],
      ["11-estilo", (await sel("#estilo")) + 10], ["12-estilo-meio", (await sel("#estilo")) + h * 0.6], ["13-estilo-fim", (await sel("#es-pin")) + (await page.evaluate(() => document.querySelector("#es-pin").offsetHeight)) - h - 5],
      ["14-momentos", await sel("#momentos")], ["15-fontes", total - h],
    ];
    void stopsAt;
    for (const [name, y] of targets) {
      await page.evaluate((y) => { if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, Math.max(0, y));
      await sleep(1500);
      await page.screenshot({ path: `${out}/${pre}-${name}.jpg`, type: "jpeg", quality: 70 });
    }
    // momentos: hover + abrir painel por teclado, avançar, fechar com Esc
    await page.evaluate((y) => { if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, (await sel("#mo-list")) - 150);
    await sleep(1200);
    if (tag === "d") { const b = await page.$$(".mo-btn"); const bb = await b[1].boundingBox(); await page.mouse.move(bb.x + 300, bb.y + bb.height / 2, { steps: 6 }); await sleep(900); await page.screenshot({ path: `${out}/${pre}-16-hover.jpg`, type: "jpeg", quality: 70 }); }
    await page.focus(".mo-item:nth-child(5) .mo-btn"); await page.keyboard.press("Enter"); await sleep(1600);
    await page.screenshot({ path: `${out}/${pre}-17-painel.jpg`, type: "jpeg", quality: 70 });
    await page.keyboard.press("ArrowRight"); await sleep(1500);
    const t1 = await page.$eval("#md-title", (e) => e.textContent);
    await page.screenshot({ path: `${out}/${pre}-18-painel-prox.jpg`, type: "jpeg", quality: 70 });
    await page.click("#md-next"); await sleep(1500);
    const t2 = await page.$eval("#md-title", (e) => e.textContent);
    await page.screenshot({ path: `${out}/${pre}-19-painel-tipo.jpg`, type: "jpeg", quality: 70 });
    await page.keyboard.press("Escape"); await sleep(800);
    const st = await page.evaluate(() => ({ open: document.querySelector("#md").open, focus: document.activeElement?.textContent?.slice(0, 40), sw: document.documentElement.scrollWidth, iw: innerWidth }));
    console.log(tag, "painel:", t1, "|", t2, "| depois do Esc:", JSON.stringify(st));
    await page.close();
  }
} finally {
  console.log("erros:", JSON.stringify(errs, null, 1));
  await browser.close();
}
