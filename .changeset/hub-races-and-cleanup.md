---
'@lowdefy/build': patch
---

fix(build): `lowdefy dev` page builds check only their own page, and a `basePath` with a trailing slash works

- `lowdefy dev` rebuilt each page with the action references of every page built before it in the session, so it re-checked (and re-reported) links and calls on those earlier pages, and kept adding a failing page's references on every request. Each page build now checks only its own references.
- A `config.basePath` with a trailing slash (`/app/`) is read as `/app`. With the slash, `lowdefy dev` served the page HTML in place of its client scripts.
