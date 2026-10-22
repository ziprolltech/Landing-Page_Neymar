import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const browser = await puppeteer.launch({ executablePath: exe, headless: "shell" });
try {
const page = await browser.newPage();
await page.setViewport({ width: 1460, height: 1200 });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto("http://localhost:8080/loja/_testes/arte.html", { waitUntil: "networkidle0" });
await page.waitForFunction(() => document.title === "ok");
await new Promise(r=>setTimeout(r,500));
await page.screenshot({ path: process.argv[2] || "arte.png", fullPage: true });
console.log("erros:", JSON.stringify(errs));
} finally { await browser.close(); }
