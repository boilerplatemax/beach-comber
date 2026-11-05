// Seagull fleeing: startle a calm flock once (short escapes, nearby landings), then keep chasing it (farther flights).
const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch(); const { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(400); await enter(page); await frames(page, 3, 33);
  const r = await page.evaluate(() => {
    const out = { trials: [] };
    // a calm flock on the open sand a little way off, with the player standing still
    const near = (n) => { gulls.forEach(k => k.c.dispose()); gulls = []; let sp = null; tideT = 0.5; tideDay = 2; waterLevel = levelAt(tideT, tideDay); for (let t = 0; t < 60 && !sp; t++) sp = shorePointNear(6, 150, GULL.bandLo + 0.3, GULL.bandHi - 1, [0, 0]); if (!sp) return null; sp = sp.slice();
      window.__flock = []; for (let i = 0; i < n; i++) { const k = spawnGull(sp[0] + Math.cos(i * 2.4) * (1 + i * 0.5), sp[1] + Math.sin(i * 2.4) * (1 + i * 0.5), false); k.mode = "stand"; k.t = 5; window.__flock.push(k); }
      return sp; };
    const sp = near(8); if (!sp) return { fail: "no shore spot" };
    const step = (secs) => { let t = window.__ft || performance.now(); for (let i = 0; i < secs * 30; i++) { t += 33; frame(t); } window.__ft = t; };
    // approach the flock and stand right by it: one disturbance, then wait
    const visit = (label) => {
      const flock = window.__flock.filter(k => gulls.includes(k)); if (!flock.length) return { label, gone: true };
      const cx = flock.reduce((s, k) => s + k.c.x, 0) / flock.length, cz = flock.reduce((s, k) => s + k.c.z, 0) / flock.length;
      for (const k of flock) k.lastReact = null;
      const startPos = new Map(flock.map(k => [k, [k.c.x, k.c.z]]));
      player.x = cx + 3; player.z = cz + 3; player.feetY = surfaceAt(player.x, player.z).h; player.eyeY = player.feetY + EYE;
      const modes = {}; for (let i = 0; i < 12; i++) { step(0.1); for (const k of flock) modes[k.mode] = (modes[k.mode] || 0) + 1; }
      const reactions = {}; for (const k of flock) { const how = k.lastReact || "ignored"; reactions[how] = (reactions[how] || 0) + 1; }
      const stressNow = (flock.reduce((s, k) => s + (k.stress || 0), 0) / flock.length).toFixed(2);
      player.x += 60; player.z += 60;  // step back and let them settle
      step(10);
      const alive = flock.filter(k => gulls.includes(k)); const dists = alive.map(k => Math.hypot(k.c.x - startPos.get(k)[0], k.c.z - startPos.get(k)[1]));
      const settled = alive.filter(k => gullSettled(k)).length;
      return { label, stressAtStartle: stressNow, reactions, settledAfter10s: settled + "/" + alive.length, moved: dists.map(d => d.toFixed(0)).join(","), meanStress: (alive.reduce((s, k) => s + (k.stress || 0), 0) / Math.max(1, alive.length)).toFixed(2) };
    };
    for (let k = 0; k < 4; k++) out.trials.push(visit(k === 0 ? "first startle" : "chase #" + (k + 1)));
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  if (errs.length) console.log("ERRORS", errs.slice(0, 4));
  await ctx.close(); await b.close();
})();
