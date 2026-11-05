# Archived: planting & farming

Planting and farming were cut from Beachcomber (cozy naturalist direction: progress comes from the
tide and from passive gear, the belt should not fill with tools and seeds). The system is archived
here because it may come back.

## Where to restore it from

- **Git tag:** `archive/planting`
- **Commit:** `73f73c8627d0e4990a4427468a3f13606a526c77` ("Gulls carry shells in their feet"), the last
  commit on `claude/crabs-and-gulls` before the cut. The tag points at this commit; if the tag is ever
  missing on the remote, the commit itself is on the branch history, so
  `git tag archive/planting 73f73c8 && git push origin archive/planting` recreates it.
- Everything lived in `index.html` (single file). In that commit, search the tags below.

```bash
git show archive/planting:index.html > /tmp/planting-index.html
```

## What it did

Two independent systems shared the "plant something, wait, it grows" loop.

### 1. Trees from seeds (and stumps that re-sprout)
- **Seeds:** the tree fruits doubled as plantable seeds: `coconut → palm`, `pinecone → pine`,
  `nut → broadleaf` (`const SEED_TREE`, and the reverse map `SEED_FOR`).
- **Planting:** hold a seed on the belt and click bare ground. `canPlant(species, x, z)` checks slope,
  water, the high-tide line (`spotUnderwater`), rock, a height band per species (palm 1.2–18 m on sand,
  others 5–32 m on soil) and spacing from colliders, POIs, stumps and other plantings.
  `plantAt(x, z)` spends the seed, pushes `{ species, x, z, plantedAt }` onto `planted[]` and adds a
  small `"planted"` collider.
- **Growth:** `plantStage(pl)` = 0..1 over `GROW_DAYS` (3 in-game days). `drawTools()` drew planted trees
  through the dynamic palm/pine/broadleaf meshes, scaled `1.2 → MATURE[species]`. When fully grown,
  `updateTools()` widened the collider to a real trunk radius.
- **Stumps:** felling a tree with the axe (`startFall → finishFall`), chopping the fallen trunk into logs
  (`chopFallen`), or a fallen trunk rotting away (`updateFallen`) left a stump
  `{ x, z, species, hp, sproutAt }` in `stumps[]`. After `SPROUT_DAYS` (2 days) `updateTools()` turned a
  stump into a new `planted` sapling at the same spot — the forest regrew forever. Digging next to a
  stump (`digAt`) or chopping/levering it (`stumpStrike`) removed it so it would not sprout.
- **Background scatter (kept, not archived):** `maybeScatterSeed()` dropped a loose seed-fruit under a
  random nearby tree every ~45 s while fewer than 10 lay around. This survives the cut as the tree-drop
  system (plus shaking).

### 2. Crops (`§17`, `@section GAMEPLAY/farming`)
- **Types:** `CROP_TYPES = cassava, banana, pineapple, taro`, each with a habitat band `CROP_HAB`
  (height lo/hi + max slope).
- **Wild crops:** `seedWildCrops()` placed up to 46 tries × 4 types of ripe wild crops at world-gen
  (consumed world `rng()` draws; claimed a footprint via `claimFootprint(..., "crop")`).
- **Harvest:** target kind `"crop"` → `harvestCrop(c)`: if ripe, gives `harvestYield(food)` of the food
  (`HARVEST_YIELD` ranges) and a 70% chance of the crop's seed (`CROP_FOOD_SEED`), then re-ripens after
  `CROP_REGROW_DAYS` (2 days). Crops were perennial.
- **Planting crops:** seed items `seed_cassava` (Cassava Cutting), `seed_banana` (Banana Sucker),
  `seed_pineapple` (Pineapple Crown), `seed_taro` (Taro Top) → `CROP_SEED` map. `canPlantCrop()` wants
  soil (pineapple tolerates sand), slope < 0.45, 1.5–32 m, dry, spaced 2.2 m; `plantCrop()` makes an
  unripe crop that ripens after `CROP_GROW_DAYS` (2.5 days).
- **Stages / render:** `cropStage(c)` → `sprout | grow | ripe`; `drawCrops()` groups by `type_stage` and
  draws each group with a lazily-built `makeDynamic(cropMesh(type, stage), 80)`.
- **Foods:** `cassava`, `banana`, `pineapple`, `taro` (`EDIBLE` values 0.22 / 0.18 / 0.2 / 0.22). Meshes:
  `cropMesh`, `pineappleCrown`, `cassavaFoodMesh`, `bananaIconMesh`, `pineappleFoodMesh`,
  `taroFoodMesh`, saplings `sproutMesh`, `cassavaSaplingMesh`, `taroSaplingMesh`,
  `pineappleSaplingMesh`, `bananaSaplingMesh` (all in `@section PROPS/meshes` / `§17` item block).

## Where it was wired in (search these in the tagged `index.html`)

| Piece | Location |
|---|---|
| Crop constants, wild seeding, stages, harvest, planting, drawing | `@section GAMEPLAY/farming` (`let crops`, `CROP_*`, `HARVEST_YIELD`, `seedWildCrops`, `cropStage`, `updateCrops`, `harvestCrop`, `canPlantCrop`, `plantCrop`, `drawCrops`) |
| Tree planting, stumps, sprouting, maturing | `@section GAMEPLAY/tools` (`SEED_TREE`, `GROW_DAYS`, `SPROUT_DAYS`, `MATURE`, `planted[]`, `stumps[]`, `/* ---- planting ---- */` `canPlant`/`plantAt`/`plantStage`, the stump/planted loops in `updateTools`, the planted-tree draw in `drawTools`) |
| Items | `§17 wild & farmed crops` block after the material `digItem`s (`digItem("cassava"…)` … `CROP_SEED`, `CROP_FOOD_SEED`); seed descriptions on `coconut`/`pinecone`/`nut` in both `FINDS` and `digItem` |
| Click / aim | `clickAt()` (`SEED_TREE[tool] → plantAt`, `CROP_SEED[tool] → plantCrop`), `aimInfo()` (planting ghost targets), `useToolOnTarget` case `"crop"`, `SOFT_INTERACT` has `"crop"`, `TOOL_FOR_KIND.crop`, `targetAlongRay` crop spheres, `interactWith` (`SEED_TREE[e.t]` → `Inv.autoHotbar`) |
| Stumps elsewhere | `digAt()` (digging near a stump removes it), `propRestHeight`, `drawBounds`, `targetAlongRay` stump capsule, `TOOLS_FOR_KIND.stump` |
| Saves | `saveWorld()/loadWorld()` (`bcw_<seed>`): `planted`, `stumps`, `crops` arrays |
| Update / draw loop | `updateTools()` (`updateCrops()`, stump sprouting, planted maturing), `drawCrops(view)`, `drawTools(view)` in `frame()` |
| Reset / regen | `resetWorldState()` (`planted = []; stumps = []`), `seedWildCrops()` in both the page-load init and `generateWorld()` |
| Sound | `onDig("plant")` → the `pat` sound |
| Docs | `docs/archive/planting.md` (this file) |

## Bringing it back: what needs rewiring

- **No axe, no chopping, no fallen trees, no stumps any more.** The stump → sapling loop depended on
  felling. To bring back regrowth, either restore stumps from a different source (storm-felled trees,
  a natural tree life cycle) or drop sprouting and keep only "plant a seed".
- **Tree fruits are no longer seeds.** `coconut` (food), `pinecone`, `nut` (collectible finds) had their
  "plant it…" descriptions and `"seed"` category removed. Re-add `SEED_TREE` and decide whether planting
  consumes collectibles.
- **Trees are plain scenery with colliders now** (`treeObjs` keep `species/x/z/scale`, plus the shake
  cooldown). The `hp/falling/fallen/notches` fields are gone; a planted tree system would need its own
  renderer path again (the old one reused `palmDyn`/`pineDyn`/`broadleafDyn` in `drawTools`).
- **Belt philosophy:** the belt is meant to stay free of tools. Planting by holding a seed on the belt
  conflicts with that; consider a passive gear ability or a contextual "plant" interaction instead.
- **World-gen stream:** `seedWildCrops()` consumed `rng()` during generation. Seeds are not kept
  compatible across builds now, so re-adding it just shifts worlds; keep it before/after the same
  neighbours to stay deterministic within a build.
- **Archipelago:** placement used `HALF * r` polar sampling around the map centre. The world is now an
  archipelago; sample per island (`ISLANDS`, `islandAt`) instead.
- **Saves:** bump `SAVE_VERSION` and add the `planted/stumps/crops` arrays back to `saveWorld/loadWorld`.
