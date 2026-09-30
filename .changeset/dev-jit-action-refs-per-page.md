---
'@lowdefy/build': patch
---

fix(build): `lowdefy dev` rebuilt pages with the action references of every page built before them in the session, and kept adding a failing page's references on every request. Each page build now checks only its own references.
