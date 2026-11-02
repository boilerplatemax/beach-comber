# CODEMAP — start here

The whole game is one file, **`index.html`** (one `<style>`, one strict-mode `<script>`, no
build step). It's organized by **system**. Every section is tagged with a searchable label:

- `// @system WATER` — jump to a whole system (search `@system WATER`).
- `// @section WATER/surface-mesh` — jump to one part of it (search `@section WATER/surface-mesh`).

Search a tag in your editor and you land on the code. Each section's `§` banner above the tag
says what it does. Supporting docs: `docs/model-report.md` (per-mesh memory/triangles) and
`docs/perf-baseline.md` (draw calls / triangles / heap, how to measure with the **F3** overlay).

## Systems

| System | What it owns | Tags (search these) |
|---|---|---|
| **GEN** | Seeded PRNG + noise; the one shared `rng()` stream that makes every seed deterministic; world constants | `GEN/prng` `GEN/noise` `GEN/config` |
| **TERRAIN** | Heightmap shaping, coastal biomes, basins/pools, the terrain mesh + **color/material shader**, height data textures, dig/raise API | `TERRAIN/character` `TERRAIN/coastal-biomes` `TERRAIN/basins` `TERRAIN/mesh-shader` `TERRAIN/height-texture` `TERRAIN/api` |
| **WATER** | The water surface mesh + water shader (waves, shoreline, transparency) | `WATER/surface-mesh` |
| **TIDES** | `waterLevel` oscillation, slack/spring cycle, `wetLevel` | `TIDES/cycle` |
| **ATMO** | Sun + sky/fog palette from `timeOfDay`; toggleable atmosphere effects (tonemap, hemi, mist, grade, vignette…) | `ATMO/sky-palette` `ATMO/effects` |
| **WEATHER** | Per-day weather state machine (rain, storm, wind, lightning) | `WEATHER/state` |
| **RENDER** | mat4 math, GL helpers, sky pass, post pass (upscale + Bayer dither + palette), instanced prop renderer | `RENDER/math` `RENDER/gl` `RENDER/sky` `RENDER/post` `RENDER/instanced-props` |
| **PLAYER** | Free-fly + first-person walker, head-bob, swimming/breath, fall safety, circle collision, A* click-to-walk, camera | `PLAYER/camera` `PLAYER/walker` `PLAYER/swimming` `PLAYER/safety` `PLAYER/collision` `PLAYER/pathing` |
| **INPUT** | Keyboard/mouse handlers; touch/mobile controls | `INPUT/keyboard-mouse` `INPUT/touch` |
| **UI** | HUD, title screen, inventory/journal/satchel, the mini-3D inspect card, graphics settings panel | `UI/hud` `UI/title` `UI/inventory` `UI/inspect` |
| **SETTINGS** | Graphics presets + live knobs (saved to localStorage) | `SETTINGS/graphics` |
| **AUDIO** | Synthesized sound engine (no files); Simlish NPC voice framework (currently unused — no NPCs) | `AUDIO/engine` `AUDIO/voice` |
| **PROPS** | Tiny procedural prop/POI mesh builders (trees, rocks, kelp…) | `PROPS/meshes` |
| **WORLD** | POI placement, prop placement, finds (`life[]` = dropped items only — creatures removed), floating debris, barnacles, the zoned "living beach" find-restock | `WORLD/poi` `WORLD/placement` `WORLD/finds` `WORLD/flotsam` `WORLD/barnacles` `WORLD/eco` |
| **GAMEPLAY** | Digging, targeting, tools (chop/mine/plant), fishing, farming, flipping stones, heavy boulders, oysters, geodes, salt | `DIGGING/shovel` `GAMEPLAY/targeting` `GAMEPLAY/tools` `GAMEPLAY/fishing` `GAMEPLAY/farming` `GAMEPLAY/flip-stones` `GAMEPLAY/heave` `GAMEPLAY/oysters` `GAMEPLAY/geodes` `GAMEPLAY/salt` |
| **DRIVER** | Top-level build + `frame()` main loop; `newIsland()` in-place regeneration | `DRIVER/build-loop` `DRIVER/new-island` |
| **DEBUG** | F3 perf overlay, `modelReport()`, screenshot hook | `DEBUG/perf-overlay` `DEBUG/model-report` `DEBUG/shoot` |

## Where to change X

| I want to change… | Go to | Notes |
|---|---|---|
| **Brightness / exposure** | `@section RENDER/post` (post shader `uBrightness`) + `@section ATMO/effects` (`ATMO.exposure`) + `@section SETTINGS/graphics` (the slider) | Final gamma lift is in the post pass; exposure/grade in ATMO. |
| **Terrain colors** | `@section TERRAIN/mesh-shader` | The height-band base colors (`cSand*`, `cGrass`, `cRock`…) live in the fragment shader `main()`. |
| **Terrain material blending** | `@section TERRAIN/mesh-shader` (shader color logic) + `@section TERRAIN/api` (the baked material field) | Natural material = smooth height/slope bands in the shader; dug/placed material = `uMaterial` texture. |
| **Water surface / shoreline / foam** | `@section WATER/surface-mesh` | `buildWaterMesh` (the grid) + `waterVS`/`waterFS` (height, waves, shoreline discard, foam). |
| **Underwater effect / tint** | post pass `@section RENDER/post` (`uUnderwater`, `uBreathLow`) gated in `frame()` by `camUnderwater` (search `camUnderwater`) | Gating compares the camera Y against `waterSurfaceAt(cam.xz)` with `UW_ENTER`/`UW_EXIT` hysteresis. |
| **Swim behaviour** | `@section PLAYER/swimming` | `swimStep`, buoyancy, breath. |
| **Tide timing / range** | `@section TIDES/cycle` | `TIDE_*` constants; `waterLevel`, `wetLevel`. |
| **Add a dropped item / find (model)** | `@section WORLD/finds` | Add a `FINDS` entry `{ mesh:()=>xMesh(), base, max, label, desc, rare }`; add the mesh builder in `@section PROPS/meshes` or `@section WORLD/finds`. |
| **Add a prop type (instanced)** | `@section WORLD/placement` (`propTypes`) + mesh in `@section PROPS/meshes` | One draw call per type via `makeInstanced`. |
| **Tuning values** | Each section keeps its constants at the top; central gameplay tunables are `const TUNE` in `@section DIGGING/shovel` (debug sliders via `TUNABLES`). | |
| **Measure performance** | Press **F3** in game (`@section DEBUG/perf-overlay`); regenerate the per-mesh table with `node tools/model-report.js`. | |

## Invariants (don't break)
- **Determinism:** one seeded `rng()` stream (`@section GEN/prng`) drives all generation. Same
  seed → same island. (Order-sensitive; adding/removing draws changes every seed's world — the
  current owner is OK with seed shifts, but keep it *deterministic*.)
- **`"use strict"`** single file, no bundler/imports, no libraries.
- **Per-frame budget:** no allocations or avoidable math in `frame()` — reuse scratch arrays/vectors.
- **Mobile + debug** must keep working (`@system INPUT` touch controls; the F3 overlay).

## Removed features (gone; a few inert remnants remain — see `STRIP-REMNANTS-TODO.md`)
Kappas/villages, buckets, magic mushrooms/trips, **all moving creatures/animals** (the world now
spawns finds only), the spear, treasure chests, goblins/trading, goats. Fishing, the worm/bait
items, oysters, barnacles and storage boxes stay.
