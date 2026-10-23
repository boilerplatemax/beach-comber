# Phase — Oddities, anomalies & secrets under stones

The childhood thrill of flipping a stone and finding something alive underneath,
extended across the whole shore: heavy boulders to lever, oyster beds to shuck for
pearls, rare one-in-thousands finds, cracking geodes, colour-morph and giant
variants on everything that moves, and horseshoe crabs spawning on spring nights.

All work is in the single file **`index.html`**. Mobile controls and debug mode were
kept working throughout (verified: desktop + `?debug=1` panel, and a landscape mobile
build with its 14 on-screen buttons both boot clean with every system present).

Worked through in order, each section parse-checked, functionally tested, determinism-
checked (same seed → same island), and committed on its own.

---

## Section 1 — Flipping stones & heavy boulders

### Flippable stones (§21 / §35 / §37)
Flatter, slightly sunken stones with a damp rim scatter across beaches, the intertidal
and the forest floor. Click/tap to roll one over with a thunk and a puff of crumbs;
underneath is **critters (48%)**, an **item (20%)** or **nothing (32%)**. Click again to
put it back (counts in the journal "Stones put back"); critters settle, and the stone
refills after a day or two. A flipped stone left alone rights itself after ~1.5 days.

Under-stone **critters** scatter for a few seconds (inspect them before they bolt for
cover), then hide and vanish. Aquatic ones are scoopable into the bucket; land ones are
inspect-only ("look, don't scoop"). Under-stone **items** are worms (bait) half the time,
otherwise a rare natural find from the §40 table.

### Heavy boulders (§36)
Too big to flip by hand. Look at one with the **shovel** and heave: a pry-style dial with
a wider sweet spot and more strikes (5), each one draining stamina — run out of puff and
the heave is abandoned. The boulder rolls aside with a damp patch bared and reveals
**rarer critters (42%)**, a **buried cache (40%:** 3–7 coins, often a sealed tin) or a
**fossil (18%)**. Rolls back on its own after a few days; refills after a couple more.
Heaved state persists per seed. Mobile: hold the Use button to heave.

---

## Section 2 — Oysters & pearls (§38)

Ten craggy **oyster beds** sit on the intertidal flats, bared only at low tide. Pick and
shuck one by hand: a pry-style **shucking** dial — work the knife into the hinge, land
clean strikes to open it for the meat, but force it past the **crack meter** (4 misses)
and the shell splinters (meat, no pearl).

A clean open has a **~1-in-25 (4%)** chance of a **pearl**, with its own moment: a double
chime, a burst of sparkle and a card. Pearls come in five colours plus baroque and giant
(table below), each tallied in a new **"Pearls" journal page** (locked silhouettes until
found). Beds hold 3–6 oysters and reseed after ~2.5 days. Mobile: tap-timed (not hold),
so it stays a game of timing.

---

## Section 3 — Anomalies in nature

### Creature variants (§39)
Every eligible spawn rolls for a rare variant: a **Giant** (~1.5%, 1.8–2.5× scale — a giant
fish always counts as a rod record) or a **colour morph** (~2%: blue like the famous blue
lobster, albino, or two-tone). Eligible: all fish, every stone critter, crab, sea star,
horseshoe crab, gull, hermit crab, urchin. Sightings are tallied per species and shown as
badges on the journal creature cards; inspecting, scooping or landing a variant records it.

### Rare natural finds & geodes (§40)
Heart-quickening finds, salted into the wash-up at long odds (**5%** of wash-up slots, 1.8×
after a storm) and into what hides under stones and boulders: a **left-handed (sinistral)
whelk**, **red sea glass**, an **old marble**, **fossil shark teeth** and a **megalodon
tooth**, and a **hag stone**. **End-of-day** swirled glass turns up only near dusk (the real
golden hour). **Geodes** (8/island) sit as dull nodules on cobble and rocky shores — crack
one with a **pickaxe** (2 hits) for a chime, a burst of sparkle and a nest of **quartz** or
(rarer, 30%) **amethyst** crystal. All new finds auto-register in the journal Finds page;
geode cracked-state persists per seed.

---

## Section 4 — Horseshoe crabs (§41)

A **living fossil** added as a species: it plows the sandy shallows day and night (a slow AI
that hugs the waterline and refloats at high tide) and is scoopable into the bucket. Journal
facts: older than the dinosaurs, kin to spiders, **never lift one by the tail**. Six keep the
shallows populated; **molted shells** ("Horseshoe Molt") wash up among the rare finds.

On **spring nights** (~40% chance, day/night cycle only) a knot of them comes ashore to spawn
and some flip onto their backs in the surge — **turn them back over by the shell** and they
crawl to the sea. The tally shows in the journal; unflipped ones refloat on the next tide.
Variant-eligible, persists per seed.

---

# Full list — critters, variants & finds with their odds

## New under-stone & nearshore critters
| Species | Habitat (under stones) | In bucket? | Notes |
|---|---|---|---|
| Gunnel | beach / intertidal | yes (aquatic) | eel-like, wriggles away instantly |
| Chiton | beach / intertidal | yes (aquatic) | armoured eight-plate oval |
| Pill bug | forest floor | no (inspect-only, land) | rolls into a ball when approached |
| Centipede | forest floor | no (land) | fast — gone in a blink |
| Ground beetle | forest floor | no (land) | shiny, trundles off |
| Slug | forest floor | no (land) | in no hurry at all |
| Spotted salamander | forest floor | no (land) | the prize under-stone find |
| **Horseshoe crab** | sandy shallows (day & night) | yes | living fossil; flip-to-rescue at night |

Under-stone critter pools — **beach:** crab, hopper, gunnel, chiton, sea star, snail ·
**forest:** pill bug, centipede, beetle, slug, salamander, snail. Heaved boulders weight
toward the rarer gunnel / chiton / sea star and spawn them 1.25× larger.

## Creature variants (per eligible spawn)
| Variant | Odds | Effect |
|---|---|---|
| Giant | 1.5% (3% on a rod catch) | 1.8–2.5× scale; a giant fish is always a record |
| Blue | ~0.67% (⅓ of 2% morph) | blue instance tint |
| Albino | ~0.67% | near-white tint |
| Two-tone | ~0.67% | blended two-tone tint |

Eligible: all fish · all stone critters · crab · sea star · horseshoe · gull · hermit · urchin.

## Pearl variants (per pearl, pearls are ~1/25 clean shucks)
| Variant | Odds (of a pearl) |
|---|---|
| White | 40% |
| Cream | 26% |
| Pink | 18% |
| Golden | 10% |
| Black | 6% |
| Baroque (shape) | ~15.2% on top (16%, if not giant) |
| Giant (size) | 5% on top |

## New finds & their rarity
| Item | Where it turns up | Rarity |
|---|---|---|
| Left-handed Whelk | wash-up, under stones | ◆◆ rare |
| Red Sea Glass | wash-up, under stones | ◆◆ rare |
| End-of-day Glass | wash-up / under stones **near dusk only** | ◆◆ rare |
| Old Marble | wash-up, under stones | ◆◆ rare |
| Shark Tooth | wash-up, under stones | ◆◆ rare |
| Megalodon Tooth | wash-up (weight 1 — the find of a lifetime) | ◆◆ rare |
| Hag Stone | wash-up, under stones | ◆◆ rare |
| Quartz Crystal | cracking a geode (70%) | ◆◆ rare |
| Amethyst | cracking a geode (30%) | ◆◆ rare |
| Pearl | shucking an oyster (~4%) | treasure |
| Horseshoe Molt | wash-up among rare finds | ◆ uncommon |
| (reused) Ammonite "fossil" | boulders, under stones, wash-up | ◆◆ rare |

**Wash-up rare pool weights** (picked when the 5% rare roll hits): whelk 10, fossil 9,
hagstone 9, hcmolt 9, redglass 8, marble 8, nautilus 8, sharktooth 7, jewelry 3, megalodon 1.

**Under-stone / boulder item pool weights** (`stoneItemFind`): coin 14, marble 12, fossil 11,
hagstone 10, sharktooth 9, whelk 8, redglass 7, tin 6 (near dusk: 20% chance → end-of-day glass).

---

# Tunable values (all near the top of their § block in `index.html`)

### Flipping stones (§21)
- `FLIP_STONE_N = 110` — stones per island
- `FLIP_REFILL_MIN = 1`, `FLIP_REFILL_MAX = 2` — days to refill
- `FLIP_CRITTER_P = 0.48`, `FLIP_ITEM_P = 0.20` — (rest 0.32 = nothing)
- `FLIP_SCATTER_TIME = 4.5` — seconds critters scatter before hiding
- `FLIP_ANIM_SPEED = 3.2`, `FLIP_AUTORESET_DAYS = 1.5`

### Heavy boulders (§21D)
- `HEAVE_BOULDER_N = 14` — boulders per island
- `HEAVE_NEED = 5` — sweet-spot strikes to lever over
- `HEAVE_STRIKE_COST = 0.09` — stamina per strike
- `HEAVE_REFILL_MIN = 2`, `HEAVE_REFILL_MAX = 3`, `HEAVE_RESET_DAYS = 3`
- `HEAVE_CRITTER_P = 0.42`, `HEAVE_CACHE_P = 0.40` — (rest 0.18 = fossil)

### Oysters & pearls (§23)
- `OYSTER_BED_N = 10`, `OYSTER_PER_BED_MIN = 3`, `OYSTER_PER_BED_MAX = 6`
- `OYSTER_REFILL_DAYS = 2.5`, `OYSTER_EXPOSE = 0.12` (water depth below which a bed is workable)
- `SHUCK_NEED = 4`, `SHUCK_MISS_MAX = 4`
- `PEARL_P = 0.04` — chance of a pearl per clean shuck
- `PEARL_COLOR_W = [0.40, 0.26, 0.18, 0.10, 0.06]` — white/cream/pink/golden/black
- `PEARL_BAROQUE_P = 0.16`, `PEARL_GIANT_P = 0.05`

### Creature variants (§22)
- `VARIANT_GIANT_P = 0.015`, `VARIANT_MORPH_P = 0.02`
- `VARIANT_MORPHS = ["blue","albino","twotone"]`
- giant scale multiplier `1.8 + rng()*0.7`; rod-catch giant `1.9–2.5×` weight

### Rare finds & geodes (§40)
- `RARE_WASH_P = 0.05` — chance a wash-up slot upgrades to a rare natural find (×1.8 in a storm)
- `RARE_WASH` / `STONE_ITEM_POOL` — the weighted pools above
- `GEODE_N = 8`, `GEODE_HITS = 2`, `GEODE_AMETHYST_P = 0.3`
- `isDuskNow()` window — `0.49–0.60` (sunset) or `0.02–0.10` (dawn)

### Horseshoe crabs (§41)
- `HS_SEED_N = 6` — ambient crabs kept in the shallows
- `HS_NIGHT_P = 0.4` — chance per night of a spawning / stranding event
- `HS_NIGHT_BATCH = 8`, `HS_STRAND_FRAC = 0.6` — batch size / fraction that strand
- `HS_STRAND_TTL = 120` — seconds before an unseen stranded crab is washed back
- `isNightNow()` window — `t > 0.62 || t < 0.03`

---

## Persistence & determinism
Everything new saves per seed in `bc_<seed>`: heaved boulders, oyster-bed stock, pearl
sightings, cracked geodes, horseshoes-flipped tally, and per-species variant sightings.
All world generation uses the seeded `rng()` in fixed order, so the same seed always
produces the same island (verified across every section). Flip-stone and boulder loot,
pearls and geode crystals go to the inventory/ground, which already persists.
