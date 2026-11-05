// Sea stars: look at one in reach (prompt), pick it up (inventory + journal), it's gone, can't be taken twice, and stays gone after a reload.
const { launch, open, frames, enter } = require("./common");
const SEED = process.argv[2] || "alpha";
(async () => {
  const b = await launch(); const { page, ctx, errs } = await open(b, SEED, false);
  await page.waitForTimeout(400); await enter(page); await frames(page, 3, 33);
  const r = await page.evaluate(() => {
    const s = STARS.find(s => s.y > waterLevel + 0.1) || STARS[0];
    const id = STAR.species[s.sp].id, inv0 = Inv.count(id);
    // stand beside it and aim at it: the crosshair target + prompt
    player.x = s.x + 1.2; player.z = s.z; player.swimming = false; player.feetY = surfaceAt(player.x, player.z).h; player.eyeY = player.feetY + EYE;
    cam.pos[0] = player.x; cam.pos[1] = player.eyeY; cam.pos[2] = player.z;
    cam.yaw = Math.atan2(s.x - player.x, -(s.z - player.z)); cam.pitch = -Math.atan2(player.eyeY - s.y, 1.2);
    let t = window.__ft || performance.now(); for (let i = 0; i < 3; i++) { t += 33; frame(t); } window.__ft = t;
    const tgt = targetAlongRay(rayFromNDC(0, 0), null), prompt = document.getElementById("prompt").textContent;
    const ok = useToolOnTarget({ kind: "seastar", obj: s, x: s.x, z: s.z });
    const again = pickSeastar(s);
    const tgt2 = targetAlongRay(rayFromNDC(0, 0), null);
    return { id: s.id, species: id, aimedKind: tgt && tgt.kind, prompt, picked: ok, inv: Inv.count(id) - inv0, discovered: discovered.has("f_" + id), secondPick: again, targetAfter: tgt2 && tgt2.kind === "seastar" && tgt2.obj === s, stats: starStats() };
  });
  console.log(JSON.stringify(r));
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(400);
  console.log("after reload:", JSON.stringify(await page.evaluate((id) => ({ taken: starTaken.has(id), stats: starStats() }), r.id)));
  if (errs.length) console.log("ERRORS", errs.slice(0, 4));
  await ctx.close(); await b.close();
})();
