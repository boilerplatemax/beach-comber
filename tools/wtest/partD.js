// Part D: archipelago acceptance checks for a seed.
//  - island count & roles; all five coastal biomes are a MAIN biome (home + main islands); the reserved spot is empty
//  - at least one low-tide sandbar islet (dry at low tide, under water at high tide)
//  - a sandbar causeway that is walkable at low tide (we actually walk it) and cut off at high tide
//  - hard biomes take the more exposed bearings than soft ones on every mixed island
//  - Parts A-C on the new islands: trees to shake on several islands, encrustations on several islands
const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch();
  const { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(400); await enter(page); await frames(page, 3, 33);
  const r = await page.evaluate(() => {
    const out = { islands: ISLANDS.length, roles: {}, kinds: {} };
    for (const i of ISLANDS) { out.roles[i.role] = (out.roles[i.role] || 0) + 1; out.kinds[i.kind] = (out.kinds[i.kind] || 0) + 1; }
    const mainBiomes = new Set(ISLANDS.filter(i => i.role !== "islet").map(i => i.biome));
    out.mainBiomes = [...mainBiomes].sort().join(","); out.allFive = ["cobble","marsh","mudflat","reef","sandy"].every(b => mainBiomes.has(b));
    const neapLow = TIDE_MID - TIDE_RANGE * 0.5 * NEAP_AMP, neapHigh = TIDE_MID + TIDE_RANGE * 0.5 * NEAP_AMP;
    out.levels = { neapLow: +neapLow.toFixed(2), neapHigh: +neapHigh.toFixed(2), causeway: +causewayLevel().toFixed(2) };
    // sandbar islets: crest height of their own cells
    out.sandbars = ISLANDS.filter(i => i.kind === "sandbar").map(i => { let top = -1e9; for (let k = 0; k < GRID*GRID; k++) if (islandIdx[k] === i.id) top = Math.max(top, heightmap[k]);
      return { name: i.name, top: +top.toFixed(2), dryAtLow: top > neapLow, underAtHigh: top < neapHigh }; });
    out.lowTideSandbar = out.sandbars.some(s => s.dryAtLow && s.underAtHigh);
    // reserved spot stays open sea
    if (RESERVED) { let mx = -1e9; for (let a = 0; a < 6.28; a += 0.3) for (let rr = 0; rr < RESERVED.R; rr += 6) mx = Math.max(mx, heightAt(RESERVED.x + Math.cos(a)*rr, RESERVED.z + Math.sin(a)*rr)); out.reservedMaxH = +mx.toFixed(1); }
    // causeways: the bar between the two coasts (the stretch over sea floor) is dry at neap low, flooded at neap high
    out.causeways = CROSSINGS.filter(c => c.type === "causeway").map(c => {
      const A = ISLANDS[c.a], B = ISLANDS[c.b]; let minH = 1e9, maxH = -1e9, wet = 0, n = 0;
      for (let t = 0; t <= 1; t += 0.005) { const x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t, i = cellIndex(x, z);
        const base = Math.max(...[0,1].map(k => 0)); const h = heightAt(x, z);
        if (h > MAX_HIGH_TIDE) continue;                              // on an island
        n++; minH = Math.min(minH, h); maxH = Math.max(maxH, h); if (h < neapHigh) wet++; }
      return { a: A.name, b: B.name, gap: +c.gap.toFixed(0), samples: n, minH: +minH.toFixed(2), dryAtLow: minH > neapLow, cutAtHigh: wet > 0 };
    });
    // exposure ordering on mixed islands
    out.exposure = ISLANDS.filter(i => i.sec && i.sec.length).map(i => { const ex = islandExposure(i); const avg = {}; const cnt = {};
      for (let k = 0; k < BIOME_BINS; k++) { const b = i.segs[k]; avg[b] = (avg[b] || 0) + ex[k]; cnt[b] = (cnt[b] || 0) + 1; }
      for (const b in avg) avg[b] = +(avg[b] / cnt[b]).toFixed(2);
      const share = {}; for (const b in cnt) share[b] = +(cnt[b] / BIOME_BINS).toFixed(2);
      const ordered = Object.keys(avg).sort((a, b2) => BIOME_PREF[a] - BIOME_PREF[b2]); let ok = true; for (let k = 1; k < ordered.length; k++) if (avg[ordered[k]] > avg[ordered[k-1]] + 1e-6) ok = false;
      return { name: i.name, main: i.biome, share, avgExposure: avg, hardOnExposed: ok }; });
    // Parts A–C across islands
    const onIsl = (arr, f) => { const s = new Set(); for (const o of arr) { const isl = islandAt(f(o).x, f(o).z); if (isl) s.add(isl.id); } return s.size; };
    out.treesOnIslands = onIsl(treeObjs, o => o);
    out.encrustOnIslands = { barn: onIsl(encPieces.barn, p => p), oyst: onIsl(encPieces.oyst, p => p) };
    out.spawn = { x: +player.x.toFixed(1), z: +player.z.toFixed(1), island: (islandAt(player.x, player.z) || {}).name, home: ISLANDS[0].name };
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  // walk a causeway at low tide, then try at high tide
  const walk = await page.evaluate(() => {
    const c = CROSSINGS.find(c => c.type === "causeway"); if (!c) return { none: true };
    const A = ISLANDS[c.a], B = ISLANDS[c.b];
    // start on A's dry shore at the bar
    const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const tryWalk = (phase) => {
      clock.paused = false; tideT = phase; tideDay = 0; waterLevel = levelAt(tideT, tideDay);
      // the bar: the first stretch (going A → B) that dips below the spring-high line and stays low for a while
      let tBar = -1; for (let t = 0; t < L; t += 1) { let low = true; for (let k = 0; k < 12; k += 2) if (heightAt(A.x + ux * (t + k), A.z + uz * (t + k)) > causewayLevel() + 1.2) { low = false; break; } if (low) { tBar = t; break; } }
      let t0 = 0; for (let t = tBar; t > 0; t -= 1) if (heightAt(A.x + ux * t, A.z + uz * t) > MAX_HIGH_TIDE + 0.3) { t0 = t; break; }      // A's dry shore at the bar
      let t1 = L; for (let t = tBar + 12; t < L; t += 1) if (heightAt(A.x + ux * t, A.z + uz * t) > MAX_HIGH_TIDE + 0.3) { t1 = t; break; }  // B's dry shore
      player.x = A.x + ux * t0; player.z = A.z + uz * t0; player.swimming = false; player.feetY = surfaceAt(player.x, player.z).h; player.eyeY = player.feetY + EYE; player.vy = 0; stamina = 1; exhausted = false;
      cam.yaw = Math.atan2(ux, -uz); cam.pitch = 0; keys["KeyW"] = true; let swam = 0, frames = 0, t = window.__ft || performance.now();
      for (frames = 0; frames < 1500; frames++) { t += 33; cam.yaw = Math.atan2(ux, -uz); tideT = phase; frame(t); if (player.swimming) swam++;
        const along = (player.x - A.x) * ux + (player.z - A.z) * uz; if (along > t1 + 2) break; }
      keys["KeyW"] = false; window.__ft = t;
      const along = (player.x - A.x) * ux + (player.z - A.z) * uz;
      return { phase, water: +waterLevel.toFixed(2), barLength: +(t1 - t0).toFixed(0), reachedB: along > t1 + 2, swamFrames: swam, frames, onIsland: (islandAt(player.x, player.z) || {}).name };
    };
    return { from: A.name, to: B.name, low: tryWalk(0.75), high: tryWalk(0.25) };
  });
  console.log("causeway walk:", JSON.stringify(walk));
  if (errs.length) console.log("ERRORS", errs.slice(0, 5));
  await ctx.close(); await b.close();
})();
