# Creatures — design notes

Ideas for bringing animals back to the island. Ordered from "just loop an anim"
up to "two species reacting to each other". Nothing here is code — it's a menu
to pick from.

---

## 1. Shared pieces (build once, every creature uses them)

Most creatures are the same few parts in different amounts. If these exist as
shared helpers, each new animal is mostly a data entry.

### 1.1 Animation vocabulary

I don't know your exact clip names, so here's the small set I'd plan around.
Map these to whatever you already have; anything marked *optional* can fall
back to the nearest core clip.

| Clip      | Use                                         | Fallback if missing        |
|-----------|---------------------------------------------|----------------------------|
| `idle`    | Standing / resting loop                     | —                          |
| `walk`    | Normal movement                             | `idle` + slide             |
| `run`     | Fleeing / chasing                           | `walk` at ~1.8× speed      |
| `eat`     | Head-down pecking, grazing, nibbling        | `idle`                     |
| `alert`   | Head up, frozen, looking (the "it noticed you" beat) | `idle` paused     |
| `pulse`   | Simple scale/squash loop (anemones, jellies) | procedural scale sine     |
| `fly` *(optional)*  | Gull / heron wings                | —                          |
| `swim` *(optional)* | Fish tail sway                    | `walk`                     |
| `sleep` *(optional)*| Night rest                        | `idle` slowed to 0.3×      |
| `attack` *(optional)*| Wolf lunge, gull snatch          | `run` one-shot             |

Two cheap tricks that go a long way:
- **Playback speed follows movement speed** (no foot sliding, and one `walk`
  clip covers dawdling to trotting).
- **Random start phase per instance** so a group never animates in lockstep.

### 1.2 The brain: a tiny state machine

Every moving creature is a handful of states with a timer, e.g.
`idle → wander → eat → idle`, plus an interrupt state (`flee`, `burrow`,
`hide`) that any state can jump to. Each state picks one anim from the table
above. Keep states to ~3–6 per creature; the "personality" comes from the
timings and thresholds, not from more states.

### 1.3 Senses

- **Distance to player** with two radii: *notice* (go `alert`) and *flee*.
- **Player noise**: running/digging/chopping widens the radii; standing still
  or walking slowly shrinks them. This makes sneaking up on things a skill
  without a stealth system.
- **Line of sight** (optional, only for deer/wolves) — a single terrain ray.
- **Other creatures**: a "nearest of type X within R" query (wolves look for
  deer, deer look for wolves, gulls look for dropped items).

### 1.4 Movement / steering

Small set of behaviours, mixed per creature: `wander`, `seek`, `flee`,
`arrive`, `separation` (don't stack on each other), `cohesion/align` (schools,
herds). Plus a **habitat check** each step — "is this point still sand /
water / deep enough / inside my biome?" — and turn away if not. That one check
keeps crabs on the beach and fish in the water without any pathfinding.

### 1.5 Spawning, LOD, and the island's rules

- **Spawn around the player, not across the whole island.** Keep a pool per
  species; spawn just outside view, despawn when far behind. Far creatures
  freeze (no brain, no anim); mid-range ones tick their brain at a low rate.
- **Biomes already list critters** (`COAST_BIOMES[...].crit`: crab, hopper,
  star, anemone, urchin). Reuse that as the spawn table.
- **Tide + time of day + weather** drive *where* and *how many*: crabs out at
  low tide, gulls fewer at night, everything hides in a storm. These are the
  cheapest ways to make the beach feel alive across a day.
- **Determinism:** live creatures shouldn't pull from the world-gen `rng()`
  stream. Give them their own stream (or seed per spawn from position + time)
  so adding/removing an animal never reshuffles anyone's island.
- **No per-frame allocation** in the update loop — reuse scratch vectors.

---

## 2. Tier 0 — ambient (anim only, no brain)

Placed once, never move. Just loops with a random phase. Great value for
almost no work.

| Creature        | Where                   | Anim                     | Extra touch |
|-----------------|-------------------------|--------------------------|-------------|
| **Anemone**     | Reef, tide pools        | `pulse`                  | Clamps shut (scale down + hold) when the player is very close or touches it; reopens after a few seconds. Closed when exposed at low tide, open when underwater. |
| **Sea urchin**  | Reef, shallow rock      | `idle` (slow spine sway) | Hurts a little (stamina hit) if stepped on barefoot in shallow water — a reason to look down. |
| **Sea star**    | Reef, wet rock          | `idle` (very slow arm curl) | Occasionally drifts a few cm over minutes — players who watch will notice. |
| **Barnacle fans** | Existing barnacle clusters | `pulse` (fast flick) | Only when submerged. |
| **Jellyfish**   | Shallows / washed up    | `pulse`                  | In water: bob + drift with current. Stranded on sand after a storm: no anim, a "don't touch" find. |

---

## 3. Tier 1 — simple behaviour (one creature, reacts to player/world)

### Crab
The signature beach animal; worth getting right.
- **States:** `idle` → `wander` (sideways!) → `eat` (claws to mouth) → back.
  Interrupts: `flee`, `burrow`.
- **Anims:** `idle`, `walk` (played while moving sideways), `eat`, `alert`
  (claws raised).
- **Behaviour:**
  - Notices player → `alert`, claws up. Closer → scuttles sideways **to the
    nearest burrow or the waterline**, not just "away".
  - `burrow`: sinks into the sand over ~0.5s and disappears; re-emerges later
    if the player leaves. Leaves a visible hole/bubbles = a dig spot.
  - High tide / rain / night → most crabs burrowed. Low tide at dusk → crab
    party.
- **Interaction:** catchable if you corner one or approach slowly; gives
  `crabmeat` (already an item).

### Hermit crab
- Like the crab but slow, and its **`hide` state** is retreating into the shell
  (stop + `idle` on the shell only). Pick one up and it's an empty-looking
  shell until it peeks out. Swaps shells with a nearby empty `coiledshell`
  occasionally — a cute rare moment.

### Sand hoppers
- Tiny swarm, no individual brains. They burst up and scatter when you **dig or
  step on kelp piles**, then settle. One particle-like system, `idle` + a hop
  arc. Pure feel.

### Seagull
- **States:** `idle` (stand on sand/rocks), `walk` (strutting), `eat` (peck),
  `fly` (circle overhead), `flee` (take off).
- **Anims:** `idle`, `walk`, `eat`, `fly`, optional `attack` (snatch).
- **Behaviour:**
  - On the ground in small groups; whole group takes off if one flees
    (contagious panic — just "if a neighbour flees, I flee").
  - Circles a couple of points in the sky, lands again away from the player.
  - **Thief mechanic:** if the player drops an item or leaves food out, a gull
    may land, grab it and fly off a short distance. Chase it and it drops it.
    Small, funny, very "beach".
  - In a storm they sit on the water facing the wind (the code already has a
    note for this).

### Fish (schools)
- **States:** just `swim` with boids (separation / alignment / cohesion) inside
  a "deep enough" volume.
- **Anims:** `swim` (playback speed = current speed).
- **Behaviour:**
  - The school **darts away** as one when the player wades in or a shadow
    passes, then slowly regroups.
  - Lone bigger fish cruise the edge of the school.
  - Ties into fishing: a visible school nearby = better bite odds there.
- Variants for free: small silver schools in shallows, a couple of bigger
  solitary fish in deeper tide pools.

### Optional extras in this tier
- **Heron** (marsh, mudflat): stands perfectly still in the shallows
  (`idle`), slow `walk`, sudden `attack` strike at a fish. Flies off if you
  get close. Works as a "patience" animal.
- **Seal** (rocky reef): hauls out on rocks at low tide (`sleep`), slides into
  the water (`swim`) if approached; pops its head up to watch you.

---

## 4. Tier 2 — interacting species (deer & wolves)

These need an inland habitat (grass / forest / meadow above the beach). The
idea is a small predator/prey loop the player can watch or disturb.

### Deer
- **Needs:** `hunger` (rises slowly; eating lowers it), `fear` (spikes on
  threat, decays over time).
- **States:**
  - `graze` — `eat` anim, head down; every few seconds lifts head (`alert`)
    to scan. *This rhythm is the key readability cue.*
  - `wander` — `walk` slowly to a new grazing spot; herd stays loosely together
    (cohesion + separation).
  - `alert` — froze, ears up, facing the threat. Lasts a moment; escalates or
    relaxes.
  - `flee` — `run` away from the threat; herd follows the first deer that
    bolts.
  - `rest` — `sleep`/`idle` at night in a sheltered spot.
- **Threats:** wolves (big fear), player (smaller fear, scaled by player
  noise). A deer that's fled recently stays jumpy (lower notice threshold)
  for a while.

### Wolves
- **Needs:** `hunger` (rises over the day), `energy` (drops while running,
  recovers while resting).
- **States:**
  - `rest` — pack lies together (`sleep`/`idle`) when fed or tired.
  - `patrol` — `walk` as a loose pack along a territory loop.
  - `stalk` — hungry + deer spotted: move slowly (`walk` at low speed, head
    low) toward the herd, trying to stay downwind / out of sight.
  - `chase` — within burst range: `run`. Chase is limited by `energy`; if it
    runs out, give up and go back to `patrol`. *This is what makes deer
    escapes possible and chases tense.*
  - `eat` — success: pack gathers at the spot and eats for a while, then
    `rest`. Off-screen kills are fine; just leave a carcass/bones prop.
- **Toward the player:** wary, not aggressive by default. They keep their
  distance, watch (`alert`), and retreat if you approach. Optionally become
  bolder at night or when very hungry — but a non-combat game probably wants
  wolves as atmosphere, not a threat.

### Why it works with very little code
- Each species only reads a couple of numbers from the other ("nearest
  wolf distance", "nearest deer distance").
- Energy limits on the chase guarantee the loop doesn't end with every deer
  dead; respawns trickle in from the island edge.
- The player can intervene: running between them scatters both; standing
  still near the herd lets you watch the whole thing play out.

### Other tier-2 pairings if you want more later
- **Gulls vs. crabs**: gulls pick off crabs caught away from their burrows at
  low tide — gives crabs a reason to flee from something other than you.
- **Heron vs. fish**: heron strikes reduce a nearby school, school avoids the
  heron's spot afterwards.
- **Fox vs. gulls/rabbits** inland as a smaller-scale version of wolves/deer.

---

## 5. Suggested build order

1. **Shared:** anim mapping, state machine helper, player-distance + noise
   senses, habitat check, spawn pool + LOD.
2. **Anemone, urchin, sea star** — proves the anim import + placement.
3. **Crab** — proves the brain, flee/burrow, tide/time rules.
4. **Gulls** — group panic + flying; then the item-thief gag.
5. **Fish schools** — boids + tie-in to fishing.
6. **Deer**, then **wolves** — once inland habitat exists.

## 6. Quick reference: anims per creature

| Creature     | Must have                       | Nice to have         |
|--------------|---------------------------------|----------------------|
| Anemone      | `pulse`                         | close/open           |
| Urchin       | `idle`                          | —                    |
| Sea star     | `idle`                          | —                    |
| Jellyfish    | `pulse`                         | —                    |
| Crab         | `idle`, `walk`, `alert`         | `eat`, burrow        |
| Hermit crab  | `idle`, `walk`                  | hide-in-shell        |
| Sand hoppers | `idle` (+ procedural hop)       | —                    |
| Seagull      | `idle`, `walk`, `fly`           | `eat`, `attack`      |
| Fish         | `swim`                          | —                    |
| Heron        | `idle`, `walk`, `fly`           | `attack`             |
| Seal         | `idle`, `swim`                  | `sleep`              |
| Deer         | `idle`, `walk`, `run`, `eat`, `alert` | `sleep`        |
| Wolf         | `idle`, `walk`, `run`           | `eat`, `sleep`, `attack` |

**Open question for you:** which clips does your system already ship with?
If you list them I'll remap the tables above to your exact names.
