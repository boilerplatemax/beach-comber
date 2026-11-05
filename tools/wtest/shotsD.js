// Part D screenshots → docs/shots/: the title overview of the whole archipelago, an island arrival with its
// name note, and one island's exposed hard main-biome shore vs its sheltered soft secondary shore.
//   node shotsD.js [seed]
const { launch, open, frames, enter } = require("./common");
const path = require("path"), fs = require("fs");
const SEED = process.argv[2] || "alpha";
const DIR = path.resolve(__dirname, "..", "..", "docs", "shots"); fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "warning" && /safetyCheck/.test(m.text())) console.log("WARN", m.text().slice(0, 200)); });
  await page.goto(require("./common").FILE + "?seed=" + SEED, { waitUntil: "load" });
  await page.waitForTimeout(600);
  // 1. title overview: let the orbit settle, hide the menu chrome so the islands show
  await page.evaluate(() => { const g = document.getElementById("entergate"); if (g) g.style.display = "none"; });
  await frames(page, 30, 33);
  await page.screenshot({ path: path.join(DIR, "arch-title-menu-" + SEED + ".png"), timeout: 120000 });   // as the player sees it
  await page.evaluate(() => { const o = document.getElementById("overlay"); if (o) o.style.visibility = "hidden"; });
  for (const [k, ang] of [["a", null], ["b", Math.PI * 0.66]]) {          // and the bare overview from two sides
    if (ang !== null) await page.evaluate((a) => { previewAngle += a; }, ang);
    await frames(page, 2, 33);
    await page.screenshot({ path: path.join(DIR, "arch-title-" + k + "-" + SEED + ".png"), timeout: 120000 });
  }
  await page.evaluate(() => { const o = document.getElementById("overlay"); if (o) o.style.visibility = ""; });
  // 2. arrival: enter, then land on another island and wait for its name note
  await enter(page); await frames(page, 5, 33);
  const arr = await page.evaluate(() => {
    const isl = ISLANDS.find(i => i.role === "main" && !i.far) || ISLANDS[1];
    const sh = marchToShore(1.0, isl) || { x: isl.x, z: isl.z, dx: 0, dz: 1 };
    // step inland from the waterline a little and look back across the water toward the home island
    let x = sh.x, z = sh.z; for (let k = 0; k < 40 && heightAt(x, z) < MAX_HIGH_TIDE + 1; k++) { x -= sh.dx; z -= sh.dz; }   /* onto dry ground */ player.x = x; player.z = z; player.swimming = false;
    player.feetY = surfaceAt(x, z).h; player.eyeY = player.feetY + EYE; cam.yaw = Math.atan2(sh.dx, -sh.dz); cam.pitch = -0.05;
    clock.paused = false; tideT = 0.72; dayNightEnabled = false; timeOfDay = 0.32; updateSun();
    return isl.name + " → placed on " + ((islandAt(x, z) || {}).name) + " mode " + mode + " intro " + !!intro;
  });
  console.log("arrival placed", arr);
  for (let k = 0; k < 30; k++) { await frames(page, 6, 33); if (await page.evaluate(() => document.getElementById("islandnote").classList.contains("show") && _noteIsl && islandAt(player.x, player.z) === _noteIsl)) break; }
  console.log("arrival state", await page.evaluate(() => [mode, (islandAt(player.x, player.z) || {}).name, _noteIsl && _noteIsl.name, _noteT.toFixed(2), document.getElementById("islandnote").className, player.swimming].join(" | ")));
  await page.evaluate(() => { _noteT = 99; });                              // the page's own rAF frames keep running while we wait: hold the note up
  await page.waitForTimeout(1400);                                         // the note fades in on a real-time CSS transition
  await page.screenshot({ path: path.join(DIR, "arch-arrival-" + SEED + ".png"), timeout: 120000 });
  await page.evaluate(() => { const n = document.getElementById("islandnote"); if (n) n.classList.remove("show"); });
  // 3. exposed vs sheltered: an island whose MAIN biome is hard (reef/cobble) with a soft secondary, else any mixed one
  const pick = await page.evaluate(() => {
    const mixed = ISLANDS.filter(i => i.sec && i.sec.length);
    const isl = mixed.find(i => HARD_BIOMES[i.biome] && i.sec.some(s => !HARD_BIOMES[s])) || mixed.find(i => i.sec.some(s => HARD_BIOMES[s] !== HARD_BIOMES[i.biome])) || mixed[0];
    // the most / least exposed shore cells just above the waterline, with their seaward direction
    let hi = -1, lo = -1;
    for (let i = 0; i < GRID * GRID; i++) { if (islandIdx[i] !== isl.id || shoreEx[i] < -8 || heightmap[i] < 0 || heightmap[i] > MAX_HIGH_TIDE) continue;
      if (hi < 0 || shoreEx[i] > shoreEx[hi]) hi = i; if (lo < 0 || shoreEx[i] < shoreEx[lo]) lo = i; }
    const at = (i) => ({ x: (i % GRID) * CELL - HALF, z: ((i / GRID) | 0) * CELL - HALF, b: BIOME_LIST[biomeMap[i]] });
    return { id: isl.id, name: isl.name, main: isl.biome, sec: isl.sec, hi: at(hi), lo: at(lo) };
  });
  for (const [tag, spot] of [["exposed", pick.hi], ["sheltered", pick.lo]]) {
    await page.evaluate((s) => {
      const gx = heightAt(s.x + 3, s.z) - heightAt(s.x - 3, s.z), gz = heightAt(s.x, s.z + 3) - heightAt(s.x, s.z - 3), L = Math.hypot(gx, gz) || 1, dx = -gx / L, dz = -gz / L;
      // hover offshore, looking back at that stretch of coast
      const cx = s.x + dx * 70, cz = s.z + dz * 70;
      window.__shoot({ x: cx, y: 34, z: cz, yaw: Math.atan2(-dx, dz), pitch: -0.36 });
      tideT = 0.72; dayNightEnabled = false; timeOfDay = 0.33; updateSun();
    }, spot);
    await frames(page, 4, 33); await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DIR, "arch-" + tag + "-" + SEED + ".png"), timeout: 120000 });
  }
  console.log(JSON.stringify({ arrival: arr, shore: pick }));
  if (errs.length) console.log("ERRORS", errs.slice(0, 5));
  await ctx.close(); await b.close();
})();
