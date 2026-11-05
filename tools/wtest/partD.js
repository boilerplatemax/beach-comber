// Part D: archipelago acceptance checks for a seed.
//  - island count & roles; all five coastal biomes are a MAIN biome (home + main islands); the reserved spot is empty
//  - at least one low-tide sandbar islet (dry at low tide, under water at high tide)
//  - every island stays a separate land mass: open water between each crossing pair even at a spring low tide
//  - hard biomes take the more exposed shore than soft ones on every mixed island (per-cell exposure)
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
    const springLow = TIDE_MID - TIDE_RANGE * 0.5 * SPRING_AMP;
    out.levels = { springLow: +springLow.toFixed(2), neapLow: +neapLow.toFixed(2), neapHigh: +neapHigh.toFixed(2) };
    // sandbar islets: crest height of their own cells
    out.sandbars = ISLANDS.filter(i => i.kind === "sandbar").map(i => { let top = -1e9; for (let k = 0; k < GRID*GRID; k++) if (islandIdx[k] === i.id) top = Math.max(top, heightmap[k]);
      return { name: i.name, top: +top.toFixed(2), dryAtLow: top > neapLow, underAtHigh: top < neapHigh }; });
    out.lowTideSandbar = out.sandbars.some(s => s.dryAtLow && s.underAtHigh);
    // reserved spot stays open sea
    if (RESERVED) { let mx = -1e9; for (let a = 0; a < 6.28; a += 0.3) for (let rr = 0; rr < RESERVED.R; rr += 6) mx = Math.max(mx, heightAt(RESERVED.x + Math.cos(a)*rr, RESERVED.z + Math.sin(a)*rr)); out.reservedMaxH = +mx.toFixed(1); }
    // separate islands: along the line between each crossing pair the water stays swim-deep even at a spring low tide
    out.crossings = CROSSINGS.map(c => { const A = ISLANDS[c.a], B = ISLANDS[c.b]; let minH = 1e9;
      for (let t = 0; t <= 1; t += 0.004) minH = Math.min(minH, heightAt(A.x + (B.x - A.x) * t, A.z + (B.z - A.z) * t));
      return { a: A.name, b: B.name, type: c.type, gap: +c.gap.toFixed(0), minH: +minH.toFixed(1), separate: minH < springLow - SWIM_START }; });   // swim-deep even at the lowest spring tide
    out.allSeparate = out.crossings.every(c => c.separate);
    // exposure ordering on mixed islands (mean smoothed shore exposure per biome)
    out.exposure = ISLANDS.filter(i => i.sec && i.sec.length).map(i => { const e = islandBiomeExposure(i);
      const avg = {}, share = {}; let n = 0; for (const b in e) n += e[b].n;
      for (const b in e) { avg[b] = +e[b].ex.toFixed(2); share[b] = +(e[b].n / n).toFixed(2); }
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
  if (errs.length) console.log("ERRORS", errs.slice(0, 5));
  await ctx.close(); await b.close();
})();
