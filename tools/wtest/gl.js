const { launch, open, frames, enter } = require("./common");
const SEEDS = (process.argv[2] || "alpha,beta,7k2x").split(",");
(async () => {
  const b = await launch(); let bad = 0;
  for (const seed of SEEDS) for (const mobile of [false, true]) {
    const { page, errs, ctx, loadMs } = await open(b, seed, mobile);
    await page.waitForTimeout(800);
    await enter(page);
    await frames(page, 30, 33);
    const info = await page.evaluate(() => ({ mode, touch: IS_TOUCH, x: player.x.toFixed(1), z: player.z.toFixed(1), extra: (window.__glinfo ? window.__glinfo() : "") }));
    console.log(`${seed} ${mobile ? "mobile " : "desktop"} load=${loadMs}ms mode=${info.mode} touch=${info.touch} player=(${info.x},${info.z}) ${info.extra} errors=${errs.length}`);
    if (errs.length) { bad++; console.log(errs.slice(0, 8).join("\n")); }
    await ctx.close();
  }
  await b.close();
  console.log(bad ? "FAIL" : "OK: no errors");
  process.exit(bad ? 1 : 0);
})();
