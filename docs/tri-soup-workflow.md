# Tri Soup → Beachcomber workflow

**Tri Soup** (`tools/tri-soup.html`) is the creature tool that turns a low-poly model into an animated
creature: open it in a browser, load a model, try animations, export. The full reference for its configs
and animations is `docs/tri-soup-reference.md` (original: `docs/tri-soup-reference.docx`).

The tool page itself uses three.js, fflate and meshoptimizer from a CDN, so it needs a network connection.
That's fine because it's a dev tool; **the game (`index.html`) still loads nothing external.**

## What to export for the game

The game can't load `.glb` files. From an export, bring over:

1. **The inline mesh `.js`**: `function <name>Mesh() { const P=[…], C=[…], I=[…], J=[…] … return { pos, col }; }`.
   Paste it verbatim into `index.html`.
2. **The `<id>.creature.js` config**: paste the object and change `model: '<id>.glb'` to `model: <name>Mesh`
   (the function, not a string).

Then register and load it on the shared runtime (`CREATURE_RT.register(cfg); CREATURE_RT.load(id)`), spawn
instances with `CREATURE_RT.spawn(id, { animation, phase, speed })`, and drive their placement from game code
(`c.x / c.y / c.z / c.yaw / c.scale / c.tilt / c.tiltDir / c.bank / c.tint / c.visible`). Use one of the existing
creature sections as a template (search `@section CREATURES/`).

## Differences from Tri Soup's own (three.js) runtime

The game's runtime (`@section CREATURES/runtime`) is a raw-WebGL2 port that uses the same animation GLSL.

| Tri Soup | In this game |
|---|---|
| `shader` states (swim, undulate, pulse, sway, crawl, slither) | Supported as-is. |
| `bird` states | Supported. The `.glb` carries the per-vertex wing/leg/head weights (`_TSBIRD`), so a config here needs a game-side `mask` rule per model (see the seagull and manta configs). |
| `crawl` leg data (`_TSLEG`) | Derived on load from the mesh's separate parts (`tsDeriveCrawlRig`). |
| `skeletal` / `clip` states | **Not ported** (they need three.js bones), and they throw on load. Use shader or bird states. |
| `method: 'static'` (no states) | Supported: `animations: {}`, `defaultAnimation: null`. Used for the big shells. |
| `object` (a THREE.Group) | Set the instance fields above instead. |
| `groundSpeed` | Same meaning (model units/s); multiply by `c.scale`. `c.matchGroundSpeed(v)` sets the playback rate so feet don't slide. |

Game-side extras on a config:
- `origin: [x, y, z]`: the model point placed at the instance position (default: bottom centre). Swimmers use
  their body centre.
- `mask`: bird weights (above).

Game-side extras on a bird instance:
- `headLook`: extra head yaw in radians (gulls keeping an eye on you).

## Two-part creatures

When Tri Soup can't animate something as one piece (a hermit crab in its shell), split it: animate the body as
one creature and carry the other part as a second (often `static`) model, positioned from game code each frame.
See `@section CREATURES/shells-hermits`.
