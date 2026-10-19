---
'@lowdefy/engine': patch
---

fix(engine): `Validate` and `ResetValidation` on a container reach the inputs inside it

A container's block id now matches the container and every block under it in the block tree, so `Validate` with `params: contact_card` validates the inputs in `contact_card` and stops the chain when one is invalid. Before, it matched only the container, validated nothing and succeeded. Matching follows the blocks on the page, not id prefixes, so `contact.name` inside `contact_card` is matched. An explicit block id that matches no block on the page now logs a warning in the browser console; the action still succeeds. `regex`, `$` list-row ids and calls without params match the same blocks as before. A failed `Validate` now lists its invalid blocks (`invalidBlocks`, sent to analytics) in page order, each container's blocks before the next sibling's.
