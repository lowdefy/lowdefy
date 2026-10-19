---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
---

feat: Pages can declare a `path` URL pattern, and the build writes the route table

- A page may declare `path`, a URL pattern with `{name}` placeholder segments, such as `path: tickets/{space}/{ticket_id}`. The page id stays the page's identity. A module page's `path` is prefixed with its entry id, as its id is. A pattern that starts with a placeholder must be quoted in YAML, and the build says so when it is not.
- The build writes `routes.json`, every page's pattern (its id for a page without `path`) with its page id and auth. The JIT skeleton build writes it in dev, resolving `path` behind `_ref`, `_var`, `_build.*` and `_module.var`.
- The build refuses two patterns that match the same URLs (same segments, placeholders in the same positions, fixed segments equal ignoring case), placeholders on the home page or an auth page, and any `path` on the `404` page.
- The dev server rebuilds the config when a page file edit adds, changes or removes the page's `path`.
