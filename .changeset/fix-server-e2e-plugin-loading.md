---
'@lowdefy/server-e2e': patch
'lowdefy': patch
---

fix: Make `lowdefy build --server e2e` work with custom plugins.

**`@lowdefy/server-e2e`**

- Plugin `types` modules are now correctly unwrapped from their ESM default export, so apps using custom plugins (blocks, actions, operators, connections, requests, etc.) no longer fail with `Action/Block/... type "Foo" was used but is not defined`.
- Plugin `blockMetas` are now collected on the e2e server, matching the behaviour of `@lowdefy/server` and `@lowdefy/server-dev`.

**`lowdefy` CLI**

- `lowdefy build --server <name>` now re-fetches the server package when the version matches but the name differs. Previously, an earlier `lowdefy dev` run could leave the default server cached in `.lowdefy/server/`, causing subsequent runs with a different `--server` value to silently use the wrong server.
