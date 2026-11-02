# Performance baseline

Baseline captured **before** any optimization (Task 1), on branch `stripped-features`.

## How to measure
- In-game: press **F3** to toggle the dev perf overlay (FPS, frame time ms, draw calls,
  triangles on screen, JS heap). Always available, no debug mode needed.
- Headless regen of the trustworthy numbers: `node tools/perf-capture.js <seed>` (draw
  calls / triangles / heap) and `node tools/model-report.js <seed>` (per-model table →
  `docs/model-report.md`).

## ⚠ Measurement caveat
These numbers were captured in CI under **SwiftShader (software GL)**. Draw calls,
triangles and JS heap are GPU-independent and **trustworthy**. **FPS and frame-time are
NOT** representative of a GTX 1650 or a phone — read those from the F3 overlay on real
hardware and fill the bracketed cells below.

## Fixed test: seed `alpha`

| Metric | At spawn | Busy spot (inland ~5 s walk) | Trustworthy under SwiftShader? |
|---|--:|--:|---|
| Draw calls | 31 | 31 | ✅ yes |
| Triangles on screen | ~1,246,000 | ~1,246,000 | ✅ yes |
| JS heap (used) | ~15 MB | ~15 MB | ✅ yes |
| FPS | _[measure on HW]_ (SwiftShader: 43) | _[measure on HW]_ (SwiftShader: 47) | ❌ no |
| Frame time | _[measure on HW]_ (SwiftShader: 82 ms) | _[measure on HW]_ (SwiftShader: 61 ms) | ❌ no |

Spots: **spawn** = first-person spawn on the shore after the intro swoop; **busy spot** =
after holding forward (`W`) ~5 s, walking inland through foliage/terrain.

## Findings that set the Task-4 targets
- **No view-dependent culling.** Triangles submitted are identical at both vantages
  (~1.25 M), i.e. the whole island's geometry is drawn every frame regardless of where the
  camera looks. Frustum/distance culling is the biggest available win.
- **Triangle budget (per `docs/model-report.md`)** is dominated by:
  - **Foliage instances** — kelp ~577 k, seamoss ~230 k, redalgae ~100 k, eelgrass ~92 k
    tris. Instanced (so draw-call-cheap) but every copy is submitted regardless of distance.
  - **Terrain** — 16 chunks × ~18.3 k = ~293 k tris, drawn as **16 draw calls** with no
    per-chunk frustum cull.
  - **Water** — a single dense **131 k-tri** sheet.
- **Draw calls (31)** are already low thanks to instancing; the cost is triangles, not
  batches. Props and finds are already instanced (1 draw each).
- **Memory** ~8 MB of mesh+texture buffers; heap ~15 MB. Not a concern.

## After Task 4 — frustum culling (per-chunk terrain + per-instance props)

Terrain chunks now carry an AABB and are skipped when fully outside the view frustum
(`@section RENDER/frustum-cull`, `aabbOutside` in `drawTerrainChunks`). Instanced props
(all foliage + trees/rocks) are compacted per frame into a reused scratch buffer holding
only the copies whose bounding sphere intersects the frustum, then drawn in one call
(`drawProps`). Both reuse 6 frustum planes extracted once per frame from the view-projection
(`computeFrustum`), with **no per-frame allocation** (scratch arrays are module-level).

Triangles submitted are now **view-dependent** — the whole island is no longer drawn every
frame. Measured headless (seed `alpha`, software GL, so only tris/draws are trustworthy):

| Camera direction | Triangles | Draw calls | vs 1,246 k baseline |
|---|--:|--:|--:|
| Straight up (sky) | ~190 k | 27 | −85 % |
| Straight down | ~191 k | 28 | −85 % |
| Horizon, facing inland | ~311 k | 33 | −75 % |
| Horizon, facing the offshore kelp bay | ~692 k | 43 | −44 % |

The offshore view is the worst case (the dense kelp/seamoss beds fill the frustum); even
there it's a 44 % cut, and looking any other direction roughly halves it again. Draw-call
count varies only because dynamic finds in view differ by vantage — prop culling can only
remove draws, never add them. No visible pop: the per-instance sphere uses a loose mesh
extent plus a 1.5 m margin to cover wind sway, so on-screen foliage always submits.

_Measure FPS on real hardware (GTX 1650 / phone) with the F3 overlay — the SwiftShader
frame-times above are not representative._
