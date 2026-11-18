---
'@lowdefy/server-dev': patch
---

fix(server-dev): Data-set rails check `open`, `fill` and `select` steps

On a data-set journey only a click was checked against the data-set rails. An `open`, `fill` or `select` acts on a block and fires its events too (a dropdown's `onOpenChange`, an input's `onChange`), so a request it ran could reach a connection a data set cannot redirect. Each now checks its block before it acts, an `open` before the dropdown opens, and fails on an auth action as a click does. The refusal names the step: `... so a data-set journey cannot fill it.`

A step whose element sits outside every block wrapper (the Search modal's portal input, a modal's portal text matched by `{ blockId, text }`) is checked against the block its target names, where a click there went unchecked before.
