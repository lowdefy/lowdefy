---
'@lowdefy/journey-headless': minor
---

fix(journey-headless): Headless holds content back behind a loading skeleton

- A loading block with an object `skeleton` mounts none of its content headless, as the web client renders the skeleton in its place. Loading is the block's own `loading`, a parent's loading passed down (a `Table`'s slots keep their own), or the block's own `onMount` still running. Once loading ends the content mounts and fires `onMount` in mount order, so a panel that reads the record the page's `onMountAsync` loads sees it.
- The headless runner checks mounts again after every block update: a block that hides or shows its skeleton unmounts its content, which fires `onMount` again when it renders again, and an open `Modal` or `Drawer` that hides shows closed again, and a hidden block that shows mounts its content, as in a browser.
- `expect: { visible }`, `expect: { hidden }` and the wait before a click or fill count content behind a skeleton as not shown.
- A block's declared `headlessMethods` are registered before the content around it fires `onMount`, so a panel's `onMount` can run a chain that mounts with it.
