// Part C: tide encrustations. Pick a barnacle / oyster / salt patch down to nothing piece by piece,
// see new growth elsewhere, salt dissolving under water, and picked patches staying picked across a reload.
const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch();
  const { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(500); await enter(page); await frames(page, 3, 33);
  const r = await page.evaluate(() => {
    const out = { start: encStats() };
    const lowTide = () => { waterLevel = TIDE_MID - TIDE_RANGE * 0.7; };
    const pickHostClean = (type) => {
      lowTide();
      const counts = new Map(), bad = new Set(); for (const p of encPieces[type]) { counts.set(p.h, (counts.get(p.h) || 0) + 1); if (!encPickable(type, p)) bad.add(p.h); }
      for (const h of bad) counts.delete(h);   // a patch down in a held tide pool stays under water (not pickable): pick a bared one
      let best = -1, bn = 0; for (const [h, n] of counts) if (n > bn) { bn = n; best = h; }
      if (best < 0) return { type, fail: "no pieces" };
      const host = encHosts[best], item = ENC_ITEM[type], inv0 = Inv.count ? Inv.count(item) : 0;
      let picks = 0, steps = [];
      for (let guard = 0; guard < 200; guard++) {
        lowTide();
        const p = encPieces[type].find(q => q.h === best); if (!p) break;
        player.x = p.x + 0.8; player.z = p.z; cam.pos[0] = player.x; cam.pos[2] = player.z;
        const ok = pickEncrust({ kind: "encrust", obj: p, type }); if (ok) { picks++; steps.push(host.n); }
        else return { type, fail: "pick refused", picks };
      }
      return { type, host: best, kind: host.kind, startN: bn, picks, left: encPieces[type].filter(q => q.h === best).length, hostN: host.n, trail: steps.join(","),
        inv: (Inv.count ? Inv.count(item) - inv0 : "?") };
    };
    out.barn = pickHostClean("barn");
    out.oyst = pickHostClean("oyst");
    // underwater rule: a barnacle under deep water is not pickable; an oyster is
    { waterLevel = 50; const pb = encPieces.barn[0], po = encPieces.oyst[0];
      out.underwater = { barn: pb ? encPickable("barn", pb) : null, oyst: po ? encPickable("oyst", po) : null }; }
    // salt: none at start; grows on a sunny, windy, falling tide in recently wetted hollows
    dayNightEnabled = false; timeOfDay = 0.3; updateSun(); weather.rain = 0; weather.wind = 0.6;
    wetLevel = MAX_HIGH_TIDE; lowTide();
    const salt0 = encPieces.salt.length;
    for (let k = 0; k < 150; k++) { lowTide(); updateEncrust(ENC.tick); }
    out.saltGrown = encPieces.salt.length - salt0;
    out.salt = pickHostClean("salt");
    // returning water dissolves salt
    for (let k = 0; k < 60; k++) { lowTide(); updateEncrust(ENC.tick); }
    const sBefore = encPieces.salt.length; waterLevel = MAX_HIGH_TIDE + 2; updateEncrust(0.1); out.saltDissolve = { before: sBefore, after: encPieces.salt.length };
    saveWorld();
    out.afterPicks = encStats();
    // what the picked hosts hold at save time (live growth during the salt run may already have started a new piece)
    out.atSave = { barn: encHosts[out.barn.host].n, oyst: encHosts[out.oyst.host].n, salt: out.salt.host != null ? encHosts[out.salt.host].n : null,
      sig: encPieces.barn.length + "/" + encPieces.oyst.length + "/" + encPieces.salt.length };
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  // reload: the picked patches stay picked
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(400);
  const rl = await page.evaluate((r) => ({ sig: encPieces.barn.length + "/" + encPieces.oyst.length + "/" + encPieces.salt.length, stats: encStats(), barnHost: encPieces.barn.filter(p => p.h === r.barn.host).length, oystHost: encPieces.oyst.filter(p => p.h === r.oyst.host).length, saltHost: r.salt && r.salt.host != null ? encPieces.salt.filter(p => p.h === r.salt.host).length : null }), r);
  console.log("after reload:", JSON.stringify(rl));
  // new growth elsewhere over a few in-game days
  const g = await page.evaluate((r) => { const before = encPieces.barn.map(p => p.h); const n0 = encPieces.barn.length; const o0 = encPieces.oyst.length;
    const host = encHosts[r.barn.host]; const picked0 = host.n;
    for (let k = 0; k < 3 * DAY_PERIOD / ENC.tick; k++) { updateEncrust(ENC.tick); }
    const hostsNew = new Set(); for (const p of encPieces.barn) hostsNew.add(p.h);
    return { barn: [n0, encPieces.barn.length], oyst: [o0, encPieces.oyst.length], pickedHostNow: host.n, pickedHostBefore: picked0, hostsWithBarnacles: hostsNew.size, cap: host.cap }; }, r);
  console.log("growth over 3 days:", JSON.stringify(g));
  if (errs.length) console.log("ERRORS", errs);
  await ctx.close(); await b.close();
})();
