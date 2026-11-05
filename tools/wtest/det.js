const { launch, open } = require("./common");
const SEEDS = (process.argv[2] || "alpha,beta,7k2x").split(",");
const snap = () => {
  let h = 0; for (let i = 0; i < heightmap.length; i += 7) h = (h * 31 + Math.round(heightmap[i] * 1000)) | 0;
  let m = 0; for (let i = 0; i < material.length; i += 3) m = (m * 31 + material[i]) | 0;
  const pois = POIS.map(p => p.type + "@" + p.x.toFixed(2) + "," + p.z.toFixed(2)).join(";");
  const extra = (typeof window.__detExtra === "function") ? window.__detExtra() : "";
  const props = (typeof colliders !== "undefined") ? colliders.length + ":" + colliders.slice(0, 50).map(c => c.x.toFixed(2)).join(",") : "";
  const lifeN = window.eval("life.map(e=>e.t+e.x.toFixed(1)).join('|')");
  return { ch: (typeof CHARACTER !== "undefined" ? CHARACTER : ""), h, m, pois, props, extra, life: String(lifeN) };
};
(async () => {
  const b = await launch(); let bad = 0;
  for (const seed of SEEDS) {
    const r = [];
    for (let k = 0; k < 2; k++) { const { page, ctx, errs } = await open(b, seed, false); r.push(await page.evaluate(snap)); if (errs.length) console.log(errs.join("\n")); await ctx.close(); }
    // third: in-place newIsland onto the same seed from a different seed
    { const { page, ctx } = await open(b, seed + "_other", false); await page.evaluate((s) => newIsland(s), seed); r.push(await page.evaluate(snap)); await ctx.close(); }
    const keys = Object.keys(r[0]); const diffs = [];
    for (const k of keys) { if (k === 'life') { const L = r.map(x => new Set(x.life.split('|'))); for (let j = 1; j < 3; j++) { let sd = 0; for (const v of L[0]) if (!L[j].has(v)) sd++; for (const v of L[j]) if (!L[0].has(v)) sd++; if (sd > Math.max(4, 0.06 * L[0].size)) diffs.push('life' + j + '(' + sd + ')'); } continue; } if (r[0][k] !== r[1][k]) diffs.push(k + "(reload)"); if (r[0][k] !== r[2][k]) diffs.push(k + "(newIsland)"); }
    console.log(seed, diffs.length ? "DIFF " + diffs.join(" ") : "identical", "| h=" + r[0].h, "pois=" + r[0].pois.split(";").length, r[0].extra.slice(0, 160));
    if (diffs.length) bad++;
  }
  await b.close(); console.log(bad ? "FAIL" : "OK: deterministic"); process.exit(bad ? 1 : 0);
})();
