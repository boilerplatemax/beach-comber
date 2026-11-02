// Headless screenshots for visual QA (software GL; colors/shapes are representative, FPS is not).
//
//   node tools/shoot.js <outPrefix> [seed] [mode]
//     mode = "walk"    (default) enter the game, screenshot at spawn + a slow 360° of yaws
//     mode = "preview" just the title orbit overview of the island
//
// Uses a tiny dev hook (window.__shoot) the game exposes to pose the free-fly camera, so shots
// are reproducible without pointer-lock mouse emulation.
const { chromium } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || "shot";
const SEED = process.argv[3] || "alpha";
const MODE = process.argv[4] || "walk";
const FILE = "file://" + path.resolve(__dirname, "..", "index.html") + "?seed=" + SEED;
const DIR = path.resolve(__dirname, "..", "docs", "shots");

(async () => {
  const fs = require("fs"); fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--no-sandbox"],
  });
  const page = await browser.newContext({ viewport: { width: 960, height: 600 } }).then((c) => c.newPage());
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(FILE, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(900);
  const shot = async (tag) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(DIR, OUT + "-" + tag + ".png") }); };

  if (MODE === "preview") { await shot("preview"); await browser.close(); if (errs.length) console.log("ERRORS:\n" + errs.join("\n")); return; }

  // pose the free-fly camera via the dev hook (hides the title screens + enters the world)
  const posed = await page.evaluate(() => typeof window.__shoot === "function");
  if (posed) {
    // a few vantages chosen to show material boundaries, shoreline and slopes
    const views = [
      ["spawn", null],
      ["coast", { x: 0, y: 14, z: 260, yaw: Math.PI, pitch: -0.20 }],
      ["hill",  { x: 40, y: 40, z: 120, yaw: Math.PI, pitch: -0.25 }],
      ["water", { x: 0, y: 6, z: 330, yaw: Math.PI, pitch: -0.08 }],
    ];
    for (const [tag, v] of views) { await page.evaluate((v) => window.__shoot(v), v); await shot(tag); }
  } else {
    await shot("spawn");
  }
  await browser.close();
  if (errs.length) console.log("ERRORS:\n" + errs.join("\n")); else console.log("shots written to " + DIR + " (" + OUT + "-*.png)");
})();
