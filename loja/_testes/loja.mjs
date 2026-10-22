// Testa a Loja em 1440x900 e 375x812: rolagem, filtros, produto em foco, lista, teclado e movimento reduzido.
import puppeteer from "file:///C:/Users/caiqu/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const exe = "C:/Users/caiqu/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe";
const out = process.argv[2] || ".";
const only = process.argv[3] || "all";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const errs = [];
const log = (...a) => console.log(...a);
async function run(tag, vp, reduced = false) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(`${tag} pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errs.push(`${tag} console: ${m.text()}`); });
  await page.setViewport(vp);
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto("http://localhost:8080/loja/", { waitUntil: "networkidle0" });
  await page.evaluate(() => { try { localStorage.removeItem("njr-loja-lista"); } catch {} });
  await sleep(2600);
  const shot = (n) => page.screenshot({ path: `${out}/${tag}-${n}.jpg`, type: "jpeg", quality: 78 });
  await shot("01-hero");
  const scrollTo = async (sel, frac = 0) => { await page.evaluate((s, f) => { const el = document.querySelector(s); const y = el.getBoundingClientRect().top + scrollY + f * (el.offsetHeight - innerHeight); window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); }, sel, frac); await sleep(1300); };
  await scrollTo("#foco", 0.32); await shot("02-foco-peito");
  await scrollTo("#foco", 0.62); await shot("03-foco-cordoes");
  await scrollTo("#foco", 0.98); await shot("04-foco-costas");
  await scrollTo("#vitrine"); await sleep(1200); await shot("05-vitrine");
  // filtros
  await page.click('button[data-cat="posteres"]'); await sleep(1200); await shot("06-filtro-posteres");
  await page.click('button[data-cat="todos"]'); await sleep(300);
  await page.click('button[data-color="verde"]'); await sleep(1200); await shot("07-filtro-verde");
  const nVerde = await page.$$eval(".card:not([hidden])", (l) => l.length);
  log(tag, "cards verdes:", nVerde);
  await page.click('button[data-color="verde"]'); await sleep(1000);
  // abrir produto
  await page.evaluate(() => document.querySelector('.card[data-id="camiseta-10"]').scrollIntoView({ block: "center" }));
  await sleep(800);
  await page.click('.card[data-id="camiseta-10"] .card-link');
  await sleep(350); await shot("08-foco-abrindo");
  await sleep(1500); await shot("09-produto");
  log(tag, "hash:", await page.evaluate(() => location.hash));
  // adicionar sem tamanho
  await page.click("#d-add"); await sleep(500);
  log(tag, "aviso:", await page.$eval("#d-hint", (e) => e.textContent));
  // vista costas, cor gelo, tamanho M
  await page.click("#d-thumbs button:nth-child(2)"); await sleep(900);
  await page.click('input[name="opt-cor"][value="gelo"] + span'); await sleep(700);
  await page.click('input[name="opt-tam"][value="M"] + span'); await sleep(300);
  await shot("10-variantes");
  await page.click("#d-add"); await sleep(400); await shot("11-adicionando"); await sleep(1200);
  log(tag, "bag:", await page.$eval("#bag-n", (e) => e.textContent), "ls:", await page.evaluate(() => localStorage.getItem("njr-loja-lista")));
  // próximo produto
  await page.click("#d-next"); await sleep(1400); await shot("12-proximo");
  // pôster: capa
  await page.evaluate(() => { location.hash = ""; });
  await sleep(1300);
  log(tag, "fechou por hash:", await page.$eval("#detail", (e) => e.hidden));
  await page.evaluate(() => document.querySelector('.card[data-id="poster-abas"]').scrollIntoView({ block: "center" }));
  await sleep(600);
  await page.click('.card[data-id="poster-abas"] .card-link'); await sleep(1500);
  await page.click('input[name="opt-capa"][value="vestiario"] + span'); await sleep(900);
  await page.click('input[name="opt-tam"][value="A2"] + span');
  await page.click("#d-thumbs button:nth-child(3)"); await sleep(1000);
  await shot("13-poster");
  await page.click("#d-add"); await sleep(1400);
  await page.click("#d-add"); await sleep(1400);
  // voltar à vitrine
  await page.click(".d-back"); await sleep(400); await shot("14-fechando"); await sleep(1200); await shot("15-fechado");
  // lista
  await page.click("#bag"); await sleep(1100); await shot("16-lista");
  await page.click('.dr-item [data-act="inc"]'); await sleep(400);
  await page.click("#dr-go"); await sleep(800); await shot("17-finalizar");
  await page.click('.dr-item [data-act="rm"]'); await sleep(1000); await shot("18-removido");
  log(tag, "itens na lista:", await page.$$eval(".dr-item", (l) => l.length), await page.$eval("#dr-count", (e) => e.textContent));
  await page.keyboard.press("Escape"); await sleep(800);
  log(tag, "gaveta fechada:", await page.$eval("#drawer", (e) => e.hidden));
  // teclado: Tab até um card, Enter, Esc
  await page.evaluate(() => document.querySelector('.card[data-id="bone-njr"] .card-link').focus());
  await page.keyboard.press("Enter"); await sleep(1500);
  log(tag, "teclado abriu:", await page.$eval("#detail", (e) => !e.hidden), "foco em:", await page.evaluate(() => document.activeElement.className));
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  log(tag, "foco preso no painel:", await page.evaluate(() => document.querySelector("#detail-sheet").contains(document.activeElement)));
  await page.keyboard.press("Escape"); await sleep(1300);
  log(tag, "Esc fechou:", await page.$eval("#detail", (e) => e.hidden), "foco voltou:", await page.evaluate(() => document.activeElement.closest(".card")?.dataset.id));
  // fundo
  await scrollTo("#sobre"); await sleep(1500); await shot("19-sobre");
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await sleep(1200); await shot("20-rodape");
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  log(tag, "overflow horizontal:", ov);
  await page.close();
}
try {
  if (only === "all" || only === "d") await run("d", { width: 1440, height: 900 });
  if (only === "all" || only === "m") await run("m", { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  if (only === "all" || only === "r") await run("r", { width: 1440, height: 900 }, true);
} catch (e) { errs.push("script: " + e.message); }
finally { await browser.close(); }
console.log("ERROS:", JSON.stringify(errs, null, 1));
