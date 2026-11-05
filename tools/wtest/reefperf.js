// Anemones / sea stars: draws, triangles and JS cost at the densest anemone spot of a seed (looking all round).
const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch(); const { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(400); await enter(page); await frames(page, 3, 33);
  const r = await page.evaluate(() => {
    // densest 40 m disc of laid-out anemones
    let best = null, bn = 0;
    for (let i = 0; i < ANEMS.length; i += 7) { const a = ANEMS[i]; let n = 0; for (const b of ANEMS) if ((b.x - a.x) ** 2 + (b.z - a.z) ** 2 < 1600) n++; if (n > bn) { bn = n; best = a; } }
    player.x = best.x; player.z = best.z; player.swimming = true; player.eyeY = Math.min(waterLevel - 0.5, best.y + 2.2); player.feetY = player.eyeY - 1;
    const out = { within40m: bn, views: [] };
    let t = window.__ft || performance.now();
    for (let i = 0; i < 8; i++) { t += 33; frame(t); }
    const t0 = performance.now(); for (let i = 0; i < 200; i++) updateReef(0.016, 0); const reefMs = (performance.now() - t0) / 200;   // incl. timer ticks
    const t1 = performance.now(); for (let i = 0; i < 200; i++) CREATURE_RT.update(0.016); const rtMs = (performance.now() - t1) / 200;
    for (const yaw of [0, 1.57, 3.14, -1.57]) { cam.yaw = yaw; player.yaw = yaw; cam.pitch = -0.35; for (let i = 0; i < 4; i++) { t += 33; frame(t); } out.views.push({ yaw, draws: frameDraws, tris: frameTris }); }
    window.__ft = t;
    out.stats = reefStatsText(); out.stars = starStats(); out.reefUpdateMs = +reefMs.toFixed(3); out.runtimeUpdateMs = +rtMs.toFixed(3); out.instances = CREATURE_RT.instances.length;
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); if (errs.length) console.log("ERRORS", errs.slice(0, 4));
  await ctx.close(); await b.close();
})();
