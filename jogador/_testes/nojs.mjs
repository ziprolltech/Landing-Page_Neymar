// Verifica a página sem JavaScript (conteúdo deve continuar legível)
import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const browser = await puppeteer.launch({ executablePath: exe, headless: "shell" });
try {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 375, height: 812 });
  await page.goto("http://localhost:8080/jogador/", { waitUntil: "networkidle0" });
  await page.screenshot({ path: process.argv[2] + "/nojs-m.jpg", type: "jpeg", quality: 60, fullPage: true });
  console.log(await page.evaluate(() => document.querySelector(".mo-more").offsetHeight + " " + getComputedStyle(document.querySelector(".op-name")).visibility));
} finally { await browser.close(); }
