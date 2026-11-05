const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch();
  let { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(500); await enter(page); await frames(page, 5, 33);
  const r = await page.evaluate(() => {
    const out = {};
    const fruitN = () => life.filter(e => e.kind === "find" && (e.t === "coconut" || e.t === "pinecone" || e.t === "nut")).length;
    let dropped = null, tries = 0;
    for (const o of treeObjs) {
      if (tries > 40) break; tries++;
      player.x = o.x + 2; player.z = o.z; cam.pos[0] = player.x; cam.pos[2] = player.z;
      const n0 = fruitN();
      const ok = useToolOnTarget({ kind: "tree", obj: o, x: o.x, z: o.z });
      const n1 = fruitN();
      if (n1 > n0) { dropped = o; out.firstShake = { ok, n0, n1, species: o.species, ready: treeShakeReady(o) }; break; }
    }
    if (!dropped) return { fail: "no tree dropped in " + tries + " tries" };
    // shake again: cooldown, no fruit
    const n2 = fruitN(); useToolOnTarget({ kind: "tree", obj: dropped, x: dropped.x, z: dropped.z }); const n3 = fruitN();
    out.second = { n2, n3, ready: treeShakeReady(dropped), prompt: treePrompt(dropped) };
    // advance a day → ready again
    const t0 = tideDay; tideDay += 1.05; out.afterDay = treeShakeReady(dropped); tideDay = t0;
    out.tree = { i: dropped.i, species: dropped.species };
    saveWorld();
    // dig with the shovel
    const hb = Inv.hotbar.findIndex(c => c && c.id === "spade"); Inv.selected = hb;
    let dug = 0;
    for (let k = 0; k < 400 && !dug; k++) {
      const a = k * 2.4, r = 30 + k, x = player.x + Math.cos(a) * r, z = player.z + Math.sin(a) * r;
      if (surfaceKind(x, z) !== "wet" && surfaceKind(x, z) !== "dry") continue;
      if (waterDepthAt(x, z) > 0.05 || bigPropBlocking(x, z, 1.2)) continue;
      player.x = x + 1; player.z = z; player.airborne = false; stamina = 1; exhausted = false; digCommit = 0;
      const h0 = surfaceAt(x, z).h; digAt(x, z); const h1 = surfaceAt(x, z).h; dug = h0 - h1;
      out.dig = { kind: surfaceKind(x, z), h0: +h0.toFixed(2), h1: +h1.toFixed(2) };
    }
    out.kit = Inv.hotbar.filter(Boolean).map(c => c.id);
    out.items = ["axe", "pickaxe", "log", "stick", "quartz", "amethyst", "cassava", "seed_taro"].filter(k => ITEMS[k]);
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(500);
  const rl = await page.evaluate((t) => { const o = treeObjs.find(o => o.i === t.i && o.species === t.species); return { ready: treeShakeReady(o), shakeAt: o.shakeAt, tideDay }; }, r.tree);
  console.log("after reload:", JSON.stringify(rl));
  await ctx.close();
  await b.close();
  if (errs.length) console.log("ERRORS", errs);
})();
