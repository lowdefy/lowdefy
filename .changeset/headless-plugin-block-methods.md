---
'@lowdefy/journey-headless': patch
'lowdefy': patch
---

fix(journey-headless): A method on a block the headless runner does not stand in for leaves the journey to the browser

A headless page loads no block component, so a block from the app's own plugin registered none of its methods, and a `CallMethod` on it failed the journey with "Failed to call method". The journey now stops there and is listed as browser-only, naming the block, its type and the method. When the page's open reaches one, from `onMount`, the journey is listed browser-only `on open`, and so is a browser-only action there (`SetFocus`, `Logout`), which failed the open before. A method a stand-in block (Modal, Drawer, Table, AgGrid and the rest) does not have still fails.
