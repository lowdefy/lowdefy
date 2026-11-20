---
'@lowdefy/journey-headless': patch
'lowdefy': patch
---

fix(journey-headless): A method on a block the headless runner does not stand in for leaves the journey to the browser

A headless page loads no block component, so a block from the app's own plugin registered none of its methods, and a `CallMethod` on it failed the journey with "Failed to call method". The journey now stops there and is listed as browser-only, naming the block, its type and the method. A `CallMethod` in the page's `onMount` lists it browser-only `on open`. A method a stand-in block (Modal, Drawer, Table, AgGrid and the rest) does not have still fails.
