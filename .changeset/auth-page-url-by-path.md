---
'@lowdefy/build': patch
---

fix: An auth page URL maps to the page served at that path. A URL that names a page by its id while the page is served at a path of its own fails the build with the path to use.
