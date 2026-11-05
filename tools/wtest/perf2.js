const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch();
  const { page, ctx, errs, loadMs } = await open(b, SEED, false);
  await page.waitForTimeout(500); await enter(page); await frames(page, 20, 33);
  const r = await page.evaluate(() => {
    const out = [];
    const views = [[0, -0.05], [Math.PI / 2, -0.05], [Math.PI, -0.05], [-Math.PI / 2, -0.05]];
    for (const [yaw, pitch] of views) {
      cam.yaw = yaw; cam.pitch = pitch; player.yaw = yaw;
      const h0 = performance.memory ? performance.memory.usedJSHeapSize : 0;
      let t = window.__ft; let d = 0, tr = 0;
      for (let i = 0; i < 10; i++) { t += 33; frame(t); d = frameDraws; tr = frameTris; }
      window.__ft = t;
      out.push({ yaw: +yaw.toFixed(2), draws: d, tris: tr });
    }
    const heap = performance.memory ? (performance.memory.usedJSHeapSize / 1e6).toFixed(1) : "?";
    return { out, heap };
  });
  console.log("seed", SEED, "load", loadMs + "ms", "heapMB", r.heap);
  for (const o of r.out) console.log("  yaw", o.yaw, "draws", o.draws, "tris", o.tris);
  if (errs.length) console.log(errs.join("\n"));
  await ctx.close(); await b.close();
})();
