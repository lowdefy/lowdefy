---
'@lowdefy/engine': patch
---

fix(engine): Restore a list's items when the list becomes visible again.

Hiding a list (or a container holding one) removed its array from state, and revealing it again rebuilt the list empty — the items were gone. The engine now keeps an in-memory copy of a list's state value while it is hidden and republishes it when the list becomes visible and the state field is absent. A `SetState` performed while hidden still takes precedence.
