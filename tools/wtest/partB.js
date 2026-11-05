// Part B: the Plastic Beach Spade is the only digging tool and digs like the old shovel did.
const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch();
  const { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(500); await enter(page); await frames(page, 5, 33);
  const r = await page.evaluate(() => {
    const out = { kit: Inv.hotbar.filter(Boolean).map(c => c.id), item: ITEMS.spade && ITEMS.spade.name, shovel: !!ITEMS.shovel,
      icon: !!(ITEMS.spade && ITEMS.spade.icon), tris: beachToyShovelMesh().pos.length / 9 };
    Inv.selected = Inv.hotbar.findIndex(c => c && c.id === "spade");
    const kinds = {}; let finds = 0, worms = 0; const lifeN0 = life.length;
    // dig many spots on wet + dry ground; count finds revealed and the kinds dug
    let n = 0;
    for (let k = 0; k < 3000 && n < 60; k++) {
      const a = k * 2.39996, rr = 8 + (k % 400), x = player.x + Math.cos(a) * rr, z = player.z + Math.sin(a) * rr;
      const kind = surfaceKind(x, z); if (kind === "rock" || waterDepthAt(x, z) > 0.05 || bigPropBlocking(x, z, 1.2)) continue;
      player.x = x + 1; player.z = z; player.airborne = false; stamina = 1; exhausted = false; digCommit = 0;
      const h0 = surfaceAt(x, z).h; digAt(x, z); const h1 = surfaceAt(x, z).h;
      if (h1 < h0 - 0.05) { kinds[kind] = (kinds[kind] || 0) + 1; n++; }
    }
    out.dugKinds = kinds; out.lifeDelta = life.length - lifeN0;
    out.wormsAlive = (typeof worms !== "undefined" && window.eval("typeof worms") !== "undefined") ? window.eval("worms.length") : -1;
    // try rock → clack, not a dig
    out.selected = selectedTool();
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await page.screenshot({ path: "/tmp/partB-held.png" });
  if (errs.length) console.log("ERRORS", errs);
  await ctx.close(); await b.close();
})();
