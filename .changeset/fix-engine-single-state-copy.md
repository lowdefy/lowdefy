---
'@lowdefy/engine': patch
---

fix(engine): Copy the page state once per SetState, SetGlobal and Reset.

Every state change resets the block tree, and that reset copied the whole page state again for every container and every list row. On pages with many containers and a large state, each SetState could take seconds. The state is now copied once per reset, so a SetState costs about the same however many containers the page has.
