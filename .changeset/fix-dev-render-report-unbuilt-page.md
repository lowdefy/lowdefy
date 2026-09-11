---
'@lowdefy/server-dev': patch
---

fix(server-dev): `RenderReport` (and any other server-side reader of built page config) now works in `lowdefy dev` for a page the browser has not opened yet. The dev server built a page only when its page route was hit, so a headless render of an unvisited page found no page JSON and failed with "Report cannot be rendered for page". The dev API context now reads page artifacts through the same JIT build the page route runs; unknown and unauthorized pages still read as null.
