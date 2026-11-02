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

_Re-run after Task 4 and update the "after" numbers here._
