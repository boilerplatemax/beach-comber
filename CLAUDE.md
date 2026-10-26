# Beachcomber — project guide

A first-person, low-poly beachcombing game. **Raw WebGL2, vanilla JS, no
libraries, no build step, no external asset files** (fonts are embedded, audio
is synthesized). The whole game is one deployable file: `index.html`.

## Layout

Everything lives in `index.html`:

- `<style>` — all CSS (HUD, menus, title screen, overlays).
- One `<script>` (strict mode) — the entire engine and game.
- A few `.mp3` music tracks loaded at runtime are the only external files.

The script opens with a **TABLE OF CONTENTS** comment. Sections are marked with
`/* === § NAME === */` banners; jump to one by searching its `§ NAME`. Rough
order: generation/world data → systems (sound, weather) → renderer → player →
UI → world content → interaction → driver (`frame()` main loop).

Because it is a single strict-mode script, top-level `let`/`const` are module
globals and function declarations are hoisted. There is no module system by
design — keep it one file (reorganize *within* the file rather than splitting).

## Invariants (do not break)

- **Determinism.** One seeded PRNG stream (`§ PRNG`, mulberry32) drives *all*
  procedural generation. The same seed must produce an identical island
  (terrain, POIs, placement, spawns). Anything that consumes `rng()`/`subStream()`
  during generation is order-sensitive: never reorder or add/remove draws from
  the stream without intending to change every seed's world. Some removed
  features keep their seeding calls (e.g. `seedHeaveBoulders`) purely to hold
  the stream position — leave them.
- **`"use strict"`.** Assigning an undeclared global throws. Declare before use.
- **Single file.** No bundler, no `import`/`export`.
- **Mobile + debug.** Keep touch controls (`§ MOBILE CONTROLS`) and the debug
  overlay working.

## Gameplay tunables

Central config: `const TUNE = {...}` in `§ DIGGING` holds the stamina / effort /
drain / regen balance values. Read them as `TUNE.NAME`. The debug panel mutates
`TUNE` live via the `TUNABLES` table + `DBG_GET`/`DBG_SET`. To add a tunable:
add a field to `TUNE` and one row to `TUNABLES` (gives it a slider).

## Saves

Per-seed `localStorage` keys: `bc_<seed>` (player state), `bcw_<seed>` (world),
`bcd_<seed>` (drops), `bcs_<seed>` (storage), `bcsets_<seed>` (collections).
`SAVE_VERSION` gates loads; older versions are discarded per seed on load.

## New Island

`newIsland(seed)` regenerates the world in place without a page reload:
`disposeWorldGL()` → `resetWorldState()` → `deriveSeedState()` → `generateWorld()`,
then updates the URL. Seed-dependent GPU buffers must be freed in
`disposeWorldGL()` before they are rebuilt.

## Testing (headless, Playwright + Chromium/SwiftShader)

Chromium + Playwright are preinstalled. Launch with the software-GL flags:

```
--use-gl=angle --use-angle=swiftshader --ignore-gpu-blocklist --enable-unsafe-swiftshader
```

Scripts in `/tmp/wtest/`:

- `gl.js` — smoke test: loads 3 seeds × desktop/mobile, checks for console errors.
- `det.js` — determinism: same seed twice → identical POIs / character / heights.
- `perf2.js` — drives `frame()` directly (bypassing rAF throttle) to read draw
  calls, triangles, and heap/allocation per frame.

**SwiftShader caveat:** there is no real GPU, so wall-clock frame time / FPS are
software-rasterizer-bound and *not* representative. GPU-independent metrics
(draw calls, triangles, JS heap, allocation rate) are trustworthy; wall-clock
timing is not. `frame(now)` can be driven manually with an advancing timestamp.

To validate a change: run `node --check` on the extracted script, then `gl.js`
(no errors) and `det.js` (determinism holds). For anything touching stamina /
tools / digging, also exercise a dig/chop headlessly since a missed reference
only throws at use time.
