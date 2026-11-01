# TODO — inert remnants to remove later

The `stripped-features` branch removed kappas/villages, buckets, magic
mushrooms + trips, all moving creatures/animals, the spear, and treasure
chests. The game has **none** of these in-world and runs clean. A handful of
**inert** remnants were left behind on purpose (never spawn, run, or render)
to keep the removal low-risk. Clean them up in a follow-up pass:

## Dead code
- **Unused creature mesh builders** in `§ LIFE` — the model functions for the
  removed animals (lobster, fish/flounder/rockfish/lingcod/minnow/eel/puffer/
  flyingfish/sunfish/ghostfish/ratfish, anemone, urchin, hermit, seal, jelly,
  turtle, sea duck, sea snail, snail, slug, nudibranch, salamander, gunnel,
  chiton, goblin, goat, hopper, …). Keep the ones still used by FINDS items
  (`crabMesh`→molt, `starMesh`→driedstar, `horseshoeMesh`→hcmolt,
  `beetleMesh`/`pillbugMesh`/`centipedeMesh`/`slugMesh`→bait items,
  `huskMesh`, `crabMeatMesh`).
- **Dead creature/ambient sound defs** (`§ SOUND`): `skitter`, `squirt`,
  `seal_bark`, `goat_bleat`, `goat_bell`, `goat_thump`, `owl`, `bat`,
  `raccoon`, `hcrab_scrape` — no longer triggered (creature sound removed).
- **`VOICE_CFG.kappa`** config entry (and any kappa voice-bank loading) — the
  NPC voice system has no speakers left.
- **`TOOL_FOR_KIND`** leftover keys: `goblin`, `goat`, `creature`, `nest`,
  `chest`, `openchest` (no such target kinds exist any more).
- **Stale comments**: the `§ 14C` spear note, and the TABLE OF CONTENTS entries
  for removed sections (`§ LIFE`, `§ BUCKET`, `§ 11.6 MINI 3D`, `§ KAPPA
  VILLAGE`, `§ 17.5 GOBLIN TRADERS`, `§ 41 HORSESHOE`, `§ B5 FINDABLE EVENTS`,
  `§ 12C BURIED TREASURE`, `§ GOATS & SALT`, SHROOMS).

## Inert DOM / CSS (hidden, never shown)
- HTML elements: `#bucketlook`, `#bucketlookbox`, `#bucketlookcanvas`,
  `#bucketlookcount`, `#bucketpanel`, `#tradepanel`, `#pryoverlay`, `#prycv`,
  `#eventline`, `#eventchev` — and their `<style>` rules.

## Gameplay follow-ups (decide, not just delete)
- **Storage boxes** are kept but now **unobtainable** — the `chestbox` item
  only ever came from looting+carrying a buried chest (removed) or the
  (inert) cottage sea chest. Either give it another source or remove the
  storage feature too.
- **Orphaned items/collections**: chest-loot finds `jewelry` / `porcelain` /
  `compass` no longer spawn, so the "Treasure Hunter" collection set and the
  `RARE_WASH` / collection entries that reference them can't complete. Decide
  whether to drop them or re-home them.
- The **turtle-shell** find was dropped with the turtles (its mesh lived in
  the kappa block); re-add with a new mesh if you want the collectible back.
