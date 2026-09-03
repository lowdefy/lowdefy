---
'@lowdefy/build': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/server': patch
---

Fix v8 validation false positives found migrating a real app:

- `importPluginModule` resolves plugin modules from the server's node_modules first, so schema validation always sees the plugin versions the app actually installed (the bare import could land on a stale copy through pnpm's hidden hoist directory when several versions coexist).
- `meta.methods` accepts the rich `{ description, params }` form alongside plain description strings, mirroring `meta.events`.
- The breadcrumb `list` schema uses `anyOf` instead of `oneOf` — an empty list matched both branches and failed "exactly one".
- Button: `iconPosition` (`start`/`end`) is passed through to antd and declared in the meta; `middle` joins the size enum.
- The published server package.json pins `@lowdefy/docs` to a concrete version — `workspace:*` escaped the release tooling's version bump and broke `pnpm install` in consuming apps.
