const { chromium, devices } = require("playwright");
const path = require("path");
const FILE = "file://" + path.resolve(__dirname, "../../index.html");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--no-sandbox"];
async function launch() { return chromium.launch({ args: ARGS }); }
async function open(browser, seed, mobile, extra) {
  const ctxOpts = mobile ? { ...devices["Pixel 5"] } : { viewport: { width: 1100, height: 700 } };
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 4).join("\n")));
  page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE " + m.text()); });
  const t0 = Date.now();
  await page.goto(FILE + "?seed=" + encodeURIComponent(seed) + (extra || ""), { waitUntil: "load", timeout: 90000 });
  const loadMs = Date.now() - t0;
  return { ctx, page, errs, loadMs };
}
// drive frame() manually with an advancing timestamp
async function frames(page, n, stepMs) {
  await page.evaluate(([n, stepMs]) => { let t = Math.max(window.__ft || 0, performance.now());  /* never behind the page clock (dt would be <= 0) */ for (let i = 0; i < n; i++) { t += stepMs; frame(t); } window.__ft = t; }, [n, stepMs || 16.7]);
}
async function enter(page) {
  await page.evaluate(() => { const g = document.getElementById("entergate"); if (g) g.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.getElementById("startBtn").click(); });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { if (mode === "intro" && typeof finishIntro === "function") { intro = null; finishIntro(); } });
}
module.exports = { launch, open, frames, enter, FILE };
