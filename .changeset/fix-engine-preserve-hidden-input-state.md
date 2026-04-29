---
'@lowdefy/engine': patch
---

fix(engine): Preserve input values across `visible` toggles when set via `SetState`.

When an input was inside a hidden container and a `SetState` action set its value (e.g. on `onInit` before the container becomes visible), the value was silently reset to the input's `enforceType` default (typically `null`/`""`) on the next `SetState`. The next `SetState` triggered `RootSlots.reset()`, which found the field missing from `context.state` (because `Slots.updateState` correctly deletes invisible blocks' state fields) and overwrote `this.value` with the type default.

`Block.reset()` now skips the type-default fallback when the block was hidden in the previous eval cycle and already has a `this.value` in memory. The next `updateState` republishes the value to `context.state` if the block becomes visible, or leaves the field absent if it stays hidden.

This brings `SetState`-driven visibility toggles into parity with `setValue`-driven toggles, which already preserved the value via `Block.evaluate`.

**Behaviour change:** apps that relied on a hidden input being silently reset to its default by an unrelated `SetState` will now see the previously-set value preserved. To explicitly clear a value, use `SetState({ myInput: null })`. Invisible blocks continue to have no representation in `context.state`, the user-facing `Reset` action still produces `enforceType` defaults, and `List` sub-slot rebuilding on `SetState({ list: [...] })` is unchanged.
