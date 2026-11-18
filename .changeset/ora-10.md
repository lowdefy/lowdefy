---
'@lowdefy/logger': patch
---

fix(deps): Update ora to 10.0.0

The CLI spinner now erases exactly the lines it drew, keeps output written while it spins (such as `console.log`) intact, and flickers less. Ora 10 needs Node 22; Lowdefy's CLI and servers already need Node 24.
