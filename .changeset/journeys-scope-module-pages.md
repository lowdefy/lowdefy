---
'lowdefy': patch
---

fix(cli): `lowdefy journeys scope` lists the pages an app gets from modules

Scope read a build artifact only when its id held no `/`. A module's pages, endpoints, connections and websockets are scoped as `<entryId>/<id>`, so scope skipped every module page and reported module endpoints and connections as uncompared. Scope now lists module pages with their access and roles, in head-only and `--base` runs, and reports a module page as changed when its blocks, its requests, or a module endpoint or connection it uses change.
