---
'@lowdefy/engine': patch
---

fix(engine): `SetState` on a parent clears hidden inputs below it

Setting a parent object with `SetState`, for example `SetState: { contact: {} }` or `contact: null` to reset a form, now clears every input under it, including inputs hidden at that moment. Before, a hidden input kept its last value and wrote it back to `state` when it showed again. A `SetState` that writes an unrelated key still leaves hidden inputs' values alone, so toggling visibility with `SetState` keeps them as before.
