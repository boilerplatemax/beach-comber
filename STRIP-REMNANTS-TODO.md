# TODO — inert remnants

Most of the feature-strip remnants were removed in the refactor pass. What's left is tiny and
inert (hidden or never executed). Clean up opportunistically.

## Done (refactor)
- ✅ Unused creature mesh builders (31 functions) — removed.
- ✅ Dead creature/goat/chest/bucket sound defs (18) — removed.
- ✅ `VOICE_CFG.kappa` config entry — removed.
- ✅ Dead-panel DOM + dedicated CSS (`#bucketlook`, `#bucketpanel`, `#tradepanel`,
  `#eventline`, `#eventchev`) — removed.
- ✅ `TOOL_FOR_KIND` leftover keys (goblin/goat/creature/nest/chest/openchest) — removed.
- ✅ Stale section banners (spear / horseshoe / goats) — retitled.

## Remaining (minor)
- A few **shared CSS selectors** still list now-absent ids (`#bucketlookbox`, `#tradepanel`,
  `#eventline`) alongside kept elements (e.g. the parchment-panel and button groups). Harmless;
  trim the dead tokens when touching that CSS.
- One defensive `e.target.closest("… #bucketlook …")` check (`@section UI` click handler) — the
  element is gone so it never matches; harmless.
- The sound-category classifier regex still names removed creature sounds — harmless, cosmetic.

## Gameplay follow-ups (decide, not just delete)
- **Storage boxes** are kept but currently **unobtainable** (the `chestbox` item only came from a
  looted buried chest). Either give it another source or remove the storage feature.
- **Orphaned items/collections**: chest-loot finds `jewelry` / `porcelain` / `compass` no longer
  spawn, so the "Treasure Hunter" collection set can't complete. Drop or re-home.
- The **turtle-shell** find was dropped with the turtles (its mesh lived in the kappa block).
  Re-add with a new mesh if you want the collectible back.
