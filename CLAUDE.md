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
  procedural generation. Within one build, the same seed must produce an identical
  world (terrain, islands, POIs, placement, spawns), both on a fresh `?seed=` load
  and after an in-place `newIsland(seed)`. Anything that consumes `rng()`/`subStream()`
  during generation is order-sensitive, so keep draws in a fixed order.
  **Development phase:** seeds and saves do NOT need to stay compatible with earlier
  builds. Adding/removing generation draws (which reshuffles every seed's world) is
  fine, and removed features don't need to keep stub seeding calls. When a change
  breaks the save format, bump `SAVE_VERSION` instead of writing a migration: older
  saves are discarded per seed on load. Live (play-time) state uses `critRng`,
  `Math.random` or the per-seed grid hash, never the world-gen `rng()` stream.
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

## Archipelago

The world is a seeded archipelago inside the one world grid (`@section TERRAIN/archipelago`):
`ISLANDS[]` (home + main islands + islets), `RESERVED` (an empty spot for a future special
island), `CROSSINGS[]` (swim / far crossings: metadata only; islands are always separate land, with
no causeways, and `buildHeightmap` sinks any shallow saddle between two islands to swim depth below a
spring low tide), and `islandIdx[]` / `islandAt(x,z)` for "which island is this". Island silhouettes
come from `lobesOf()` + `islandCoastD()` (a core plus lobes / peninsula arms, two-scale domain warp,
smooth union) with coves, small points and inlets added in `islandHeight()`. Never place things by
distance from the map centre: sample with `islandXZ()` or use local conditions (height vs the tide,
substrate, biome). Biomes are a per-cell map (`biomeMap[]`, `coastBiomeAt`) laid out by local shore
exposure. The ground near water (sand / gravel / rock / mud / earth / marsh) is `computeGroundCover()`
(`@section TERRAIN/ground-cover`): two RGBA8 cover textures for the shader and `groundMat[]` for play
(`defaultMat()` / `groundAt()`); `material[]` holds player edits only. The world is `WORLD` = 1800 m on
a `GRID` = 577 heightmap (~3.1 m cells); terrain chunks draw at three distance LODs
(`@section RENDER/terrain-lod`). `tools/wtest/partD.js` checks a seed's layout.

## New Island

`newIsland(seed)` regenerates the world in place without a page reload:
`disposeWorldGL()` → `resetWorldState()` → `deriveSeedState()` → `generateWorld()`,
then updates the URL. Seed-dependent GPU buffers must be freed in
`disposeWorldGL()` before they are rebuilt.

## Creatures & Tri Soup

Creatures run on the shared creature runtime (`@section CREATURES/runtime`), a WebGL2 port of the **Tri Soup**
runtime. Tri Soup itself is in the repo: `tools/tri-soup.html` (open in a browser; a dev tool that uses CDN
libraries, never shipped in the game). Reference: `docs/tri-soup-reference.md`. How to bring an export into
the game (inline mesh `.js` + config, what's supported): `docs/tri-soup-workflow.md`. Live creatures use
`critRng` or the per-seed grid hash (`reefHash`), never the world-gen `rng()`.

## Testing (headless, Playwright + Chromium/SwiftShader)

Chromium + Playwright are preinstalled. Launch with the software-GL flags:

```
--use-gl=angle --use-angle=swiftshader --ignore-gpu-blocklist --enable-unsafe-swiftshader
```

Scripts in `tools/wtest/` (run them from that folder, e.g. `cd tools/wtest && node gl.js`):

- `check.sh` — extracts the main `<script>` and runs `node --check` on it.
- `gl.js [seeds]` — smoke test: loads 3 seeds × desktop/mobile, enters the game,
  drives frames, fails on any console error / page error.
- `det.js [seeds]` — determinism: same seed twice (reload) and once via in-place
  `newIsland()` → identical heights / materials / POIs / colliders / initial finds.
- `perf2.js [seed]` — drives `frame()` directly (bypassing rAF throttle) to read draw
  calls, triangles and heap at four view directions.
- `partA.js` … — headless gameplay exercises for specific features (see each file).
- `undef.py` — crude static scan for calls to names that are defined nowhere
  (run after `check.sh`; most hits are methods / GLSL builtins, look for real ones).

**SwiftShader caveat:** there is no real GPU, so wall-clock frame time / FPS are
software-rasterizer-bound and *not* representative. GPU-independent metrics
(draw calls, triangles, JS heap, allocation rate) are trustworthy; wall-clock
timing is not. `frame(now)` can be driven manually with an advancing timestamp.

To validate a change: run `node --check` on the extracted script, then `gl.js`
(no errors) and `det.js` (determinism holds). For anything touching stamina /
digging / interactions, also exercise it headlessly (dig, shake a tree, pick a
barnacle …) since a missed reference only throws at use time.
