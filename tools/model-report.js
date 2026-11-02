// Regenerate docs/model-report.md.
//
//   node tools/model-report.js [seed]
//
// Loads index.html headlessly (software GL), waits for world generation, calls the
// in-game modelReport() dev command, and writes the markdown table to docs/model-report.md.
// Vertex/instance counts are GPU-independent, so the numbers are accurate under SwiftShader.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SEED = process.argv[2] || "alpha";
const FILE = "file://" + path.resolve(__dirname, "..", "index.html") + "?seed=" + SEED;
const OUT = path.resolve(__dirname, "..", "docs", "model-report.md");

(async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--no-sandbox"],
  });
  const page = await browser.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(FILE, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1500); // let top-level generation finish
  const md = await page.evaluate(() => (typeof window.modelReport === "function" ? window.modelReport() : null));
  await browser.close();
  if (!md) { console.error("modelReport() not found or returned nothing" + (errs.length ? "; page errors:\n" + errs.join("\n") : "")); process.exit(1); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, md);
  console.log("wrote " + OUT + " (seed " + SEED + ")");
})();
