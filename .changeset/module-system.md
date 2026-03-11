---
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: First-class module system for reusable config packages

**Module System (`@lowdefy/build`)**

- Modules are packages of Lowdefy config (pages, connections, API endpoints, menus, components) hosted in GitHub repos or local directories
- Apps declare module entries in `lowdefy.yaml` with a user-defined `id`, `source` string, and `vars` object
- GitHub modules are fetched as tarballs with local caching; local modules use `file:` paths
- Three-phase build pipeline: Phase 1 (`buildModuleDefs`) validates vars, plugins, and secrets; Phase 2 (`registerModules`) resolves refs and registers pages/connections/api/menus; Phase 3 (`buildModules`) scopes IDs and validates secrets in resolved content
- Auto-scoped IDs: page, connection, API endpoint, and menu item IDs are prefixed with the module entry ID (e.g., `team-users/users-list`)
- `_module.var`, `_module.pageId`, `_module.connectionId`, `_module.endpointId`, and `_module.id` operators for accessing vars and scoped IDs within module config
- Connection remapping lets apps redirect module connections to existing app connections
- Exposed components and menus via `_ref: { module, component }` and `_ref: { module, menu }` syntax
- Module plugin declarations validated against app's installed plugins with semver compatibility checks
- Module secret allowlisting — modules declare accessible secrets; undeclared `_secret` references are build errors
- Picomatch glob patterns in auth page rules (e.g., `team-users/*`) for wildcard module page matching
- `module.lowdefy.yaml` manifest with var schemas, plugin declarations, secret allowlists, and config entry points

**Slashed Page IDs (`@lowdefy/server`, `@lowdefy/server-dev`)**

- Routes converted to catch-all patterns (`[[...pageId]]`, `[...path]`) to support module page IDs containing `/`
- Dev server module build watcher triggers rebuilds when module source files change
