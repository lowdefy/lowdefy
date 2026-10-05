---
'@lowdefy/e2e-utils': patch
---

fix(e2e-utils): `goto`, the ready check and the state, request, validation and `setUrlQuery` helpers find the page instance on screen through `window.lowdefy.pathMemory`, as the client keeps it. They called a lookup the client no longer exposes and failed with `lookupPath is not a function`. The app root reads as the home page.
