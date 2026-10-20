# Beachcomber — Phase 2 build instructions (the "vibe engine")

You are extending an existing single-file WebGL2 game, `index.html`. Milestone 1
is already working: seeded PRNG, a 256×256 fbm value-noise island, flat shading
via `cross(dFdx,dFdy)`, banded vertex colors, and a free-fly camera. **Do not
regress any of that.** Your job in Phase 2 is the *look* — turn the clean tech
demo into something that feels like a half-remembered early-2000s exploration
game: peaceful but eerie, hazy, chunky, liminal. Cozy with an edge of dread.

## Hard constraints (unchanged — honor all of them)
- ONE self-contained `index.html`. Opens by double-click. No build step, no
  server, no external requests, no CDN.
- Raw WebGL2 + vanilla JS. **No Three.js or any library.**
- No image/model/audio files. Everything procedural.
- All randomness comes from the existing single seeded `mulberry32` stream
  (`rng`). Never call `Math.random()`. Phase 2 is almost all rendering, so it
  should consume little or no new randomness — if it does, draw from the shared
  stream and keep the draw order stable so existing seeds still reproduce.
- Keep the code clean and sectioned (match the existing `§ SECTION` comment
  style). No minifying.
- Target 60fps on a mid-range laptop.

## Where things live (current file structure — slot new code here)
`§ PRNG` · `§ NOISE` · `§ WORLD CONFIG` (has `GRID`, `WORLD`, `HALF`, `CELL`,
`AMP`, `SEA_LEVEL`, the baked `heightmap` Float32Array, and `heightAt(x,z)`) ·
`§ MATH` (M4: `perspective`, `lookAt`) · `§ GL` helpers (`compile`, `program`) ·
`§ TERRAIN` · `§ WATER` · `§ CAMERA` · `§ INPUT` · `§ UI` · `§ BUILD + LOOP`.

Keep the fly camera for now (walking is Phase 3). Keep the HUD and title overlay.

## Deliverables for Phase 2 (build in this order; verify each works)

### 1. Low-resolution framebuffer + nearest-neighbor upscale
- Render the whole 3D scene into an offscreen framebuffer object (FBO) whose
  width is ~**400px** (clamp 320–480), height derived from the canvas aspect.
  Recompute/reallocate on resize only when the low-res dimensions change.
- FBO needs a color texture (`RGBA8`, filter **NEAREST**) and a depth
  attachment (`DEPTH_COMPONENT24` renderbuffer).
- A final **post pass** draws a fullscreen triangle to the default framebuffer,
  sampling the low-res color texture with NEAREST so it upscales as chunky
  pixels. This chunky low-res image is the single most important ingredient of
  the vibe — get it right first.

### 2. Post-process: ordered (Bayer) dithering + palette quantization (TOGGLEABLE)
- In the post pass, quantize each color channel to a small number of levels
  (~8) using a **4×4 Bayer matrix**.
- Compute the Bayer index from the **low-res texel coordinate**
  (`floor(uv * lowResSize)`), NOT from `gl_FragCoord`, so the dithering is
  chunky and aligned to the low-res pixel grid — not a fine screen-res pattern.
- Add a toggle (uniform `uDither`): on = dithered quantization, off = plain
  quantization (or passthrough). Bind it to a key (e.g. `G`) and show it in the
  help text. Default ON.

### 3. Sky gradient (view-ray based, stable as you look around)
- Draw a fullscreen background first inside the FBO (depth test OFF, depth write
  OFF), then the scene on top.
- Reconstruct a per-fragment world-space view ray: pass the inverse of
  `proj*view` and the camera position; unproject NDC at the far plane. You will
  need to add `M4.multiply(a,b)` and `M4.invert(m)` (standard column-major 4×4).
- Make a pure GLSL function `skyColor(dir, sunDir, zenith, horizon, warm)` and
  **share the exact same function** (as a JS string prepended to the shaders) in
  the sky, terrain, and water fragment shaders, so fog blends seamlessly into
  the sky. Gradient: horizon color → zenith color by `dir.y`; add a tight warm
  sun disc glow + a broad soft glow along `sunDir`.

### 4. Distance fog that blends into the sky
- In terrain and water fragment shaders, compute `dist = length(worldPos - cam)`
  and a fog factor `1.0 - exp(-(dist*density)^2)`.
- Fog color = `skyColor()` evaluated for *that fragment's own view direction*,
  so distant land/sea dissolve exactly into the sky behind them.
- Tune `density` (~0.008) so the island edge (~110–220 units out) is almost
  fully fogged — this gives the vastness-through-haze feeling and hides the
  world boundary.

### 5. Ocean upgrade: animated grid, shoreline foam, shallow transparency
Replace the Milestone-1 flat 2-triangle water quad with:
- A **dense grid mesh** (e.g. half-extent ~320 units, ~200 segments, indexed)
  so vertices can displace. It must extend well past the island so no water edge
  shows through the fog.
- **Waves in the vertex shader**: sum 3–4 sine waves of differing direction,
  frequency, speed, amplitude (total amplitude ~0.9). Pass a `uTime` uniform.
- Upload the existing `heightmap` as a **float texture** (`R32F`; enable
  `OES_texture_float_linear` for linear filtering, else NEAREST; wrap
  `CLAMP_TO_EDGE`). Sample it in BOTH water shaders via
  `uv = (world.xz + HALF) / WORLD`.
- In the vertex shader, **damp wave amplitude in shallow water**
  (`smoothstep` on depth) so waves don't clip through the sand.
- In the fragment shader:
  - `discard` where terrain height is above sea level (don't draw water on land).
  - **Foam band** near the shoreline: strong where depth below sea level is
    small (~0–1.3 units), animated with a scrolling noise/sine so it looks like
    it laps. Foam is near-white and more opaque.
  - **Transparency over shallows**: alpha low (sand shows through) in shallow
    water, higher in deep water.
  - Flat-shade the water via `cross(dFdx,dFdy)` for faceted low-poly crests; add
    a subtle warm sun specular and a light fresnel sky reflection
    (`mix(waterColor, skyColor(reflectDir), fresnel*~0.5)`).

## Mood / palette targets (eerie-cozy, overcast, early-2000s)
- Desaturated, hazy. Suggested: zenith `~(0.47,0.58,0.66)` cool blue-grey,
  horizon `~(0.82,0.80,0.74)` pale warm haze, warm sun tint `~(1.0,0.93,0.80)`.
- Keep the sun fairly low for long, soft light. Heavy fog. The chunky low-res +
  dither + limited palette is what sells the "lost game" feeling.

## Day/night note
Do **not** build a full day/night cycle in Phase 2 (that is Phase 5). But make
the sun direction and the sky/fog colors **uniforms driven by a single
`timeOfDay` variable**, set to a fixed pleasant overcast value for now, so Phase
5 only has to animate that one value.

## Rendering pipeline summary (target order per frame)
1. Bind low-res FBO, set its viewport, clear color+depth.
2. Draw sky (fullscreen, depth off).
3. Draw terrain (depth on) — with fog.
4. Draw water (depth on, alpha blend) — waves, foam, transparency, fog.
5. Bind default framebuffer, full canvas viewport.
6. Post pass: sample low-res texture NEAREST → Bayer dither + quantize → screen.

## Acceptance criteria (the build is done when ALL are true)
- The same `?seed=` still produces the identical island as Milestone 1.
- The image is visibly low-res/chunky and upscaled with hard pixels.
- Pressing the dither key visibly toggles dithering on/off.
- The horizon fades smoothly into a sky gradient with no visible fog/sky seam;
  the island edge is lost in haze (no hard world boundary visible).
- The ocean has moving faceted waves, a foam band hugging the shoreline, and you
  can see sand through shallow water but not through deep water. No water is
  drawn on top of land.
- Still ~60fps; no WebGL console errors.

## Output format
Return the **complete working `index.html`** (not a diff) plus a short note of
what changed. Do not move on to Phase 3. If any acceptance criterion fails,
fix it before returning.
