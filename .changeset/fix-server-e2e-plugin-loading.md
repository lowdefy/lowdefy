---
'@lowdefy/server-e2e': patch
'lowdefy': patch
---

fix: Resync `@lowdefy/server-e2e` with `@lowdefy/server`.

**`@lowdefy/server-e2e`**

- `next.config.js` now declares `turbopack: {}` and drops the legacy `webpack` polyfill block, so Next 16 (Turbopack-by-default) no longer errors with `This build is using Turbopack, with a webpack config and no turbopack config`. The `transpilePackages` list is now built from the same `build/blockPackages.json` artifact used by `@lowdefy/server`.
- Plugin `types` modules are now correctly unwrapped from their ESM default export, so apps using custom plugins (blocks, actions, operators, connections, requests, etc.) no longer fail with `Action/Block/... type "Foo" was used but is not defined`.
- Plugin `blockMetas` are now collected on the e2e server, matching the behaviour of `@lowdefy/server` and `@lowdefy/server-dev`.
- `lowdefy build --server e2e` no longer crashes when the project has no `lowdefy.yaml` or `lowdefy.yml` (returns an empty plugin set instead of `YAML.parse(undefined)`).
- Page and API routes now use catch-all segments (`pages/[[...pageId]].js`, `pages/api/endpoints/[...endpointId].js`, `pages/api/request/[...path].js`), so apps with nested page paths (e.g. `pages: [{ id: 'foo/bar' }]`) render correctly under `--server e2e` instead of returning 404.
- `_app.js` and `_document.js` now mirror `@lowdefy/server`'s dark-mode handling — `useDarkMode` from `@lowdefy/client`, a `ThemeTokenResolver` that exposes the resolved antd token on `lowdefy.theme._resolvedAntdToken`, and a pre-hydration background-colour script that prevents the light/dark flash on page navigation.
- `pages/api/client-error.js` now enforces the same-origin host check and strips `~e.received` from incoming payloads, matching `@lowdefy/server`.
- `lowdefy/build.mjs` now uses `instanceof BuildError` for the formatted-error shortcut (matches `@lowdefy/server`) and drops the obsolete `mixin` logger config.
- Runtime dependency set now includes `@lowdefy/blocks-antd-x`, and `tailwindcss` / `@tailwindcss/postcss` are declared in `dependencies` (not just `devDependencies`). The unused `process` browser polyfill has been removed.

**`lowdefy` CLI**

- `lowdefy build --server <name>` now re-fetches the server package when the version matches but the name differs. Both `lowdefy build` and `lowdefy build --server e2e` write to the same `.lowdefy/server/` directory, so the previous version-only cache check meant flipping between them (in either order) would silently reuse whichever server package was fetched first.
