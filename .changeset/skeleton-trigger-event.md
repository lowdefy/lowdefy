---
'@lowdefy/client': patch
---

fix(client): Clicking a container or list block shown as a loading skeleton no longer throws

A container skeleton (for example `skeleton: { type: Card }`) and a list skeleton were rendered with no block methods, so a block that calls `methods.triggerEvent` on click, like `Card`, threw `TypeError: triggerEvent is not a function`. Every skeleton block now gets the same no-op methods.
