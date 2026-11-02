// Capture perf-overlay numbers at spawn and at a second ("busy") vantage.
//
//   node tools/perf-capture.js [seed]
//
// NOTE: this runs under SwiftShader (software GL), so FPS and frame-ms are NOT representative
// of real hardware — read those from the in-game F3 overlay on your GTX 1650 / phone. Draw
// calls, triangles and JS heap ARE GPU-independent and trustworthy here.
const { chromium } = require("playwright");
const path = require("path");
const SEED = process.argv[2] || "alpha";
const FILE = "file://" + path.resolve(__dirname, "..", "index.html") + "?seed=" + SEED;

const sample = async (page) => {
  // read the #perfhud text (FPS/frame/draws/tris/heap), driven by countDraw() this frame
  return page.evaluate(() => document.getElementById("perfhud").textContent);
};

(async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--no-sandbox"],
  });
  const page = await browser.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  await page.goto(FILE, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(700);
  await page.click("#startBtn").catch(() => {});
  await page.waitForTimeout(3200);                 // let the swoop-in finish → walk mode
  await page.keyboard.press("F3");                 // show the perf overlay
  await page.waitForTimeout(800);
  console.log("=== SPAWN ===\n" + (await sample(page)));
  // walk inland for a few seconds to a denser vantage
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(5000);
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(800);
  console.log("\n=== BUSY SPOT (after walking inland ~5s) ===\n" + (await sample(page)));
  await browser.close();
})();
