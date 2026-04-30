---
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: First-class module system for reusable config packages

Modules are reusable bundles of Lowdefy config — pages, connections, API endpoints, menus, and exposed components — hosted in GitHub repositories or local directories. Apps install modules in `lowdefy.yaml` and configure them through `vars`, replacing the copy-paste-between-projects pattern with a declarative dependency.

**Module entries (`@lowdefy/build`)**

- Apps declare entries in the `modules` array of `lowdefy.yaml` with `id`, `source`, and optional `vars`, `connections`, and `dependencies`.
- The entry `id` namespaces the module's content and forms the URL prefix for its pages (e.g. `/team-users/users-list`).
- Multi-instance: the same module source can be installed multiple times under different entry IDs, each with its own vars and namespace.
- GitHub sources (`github:owner/repo[/path]@ref`) are fetched as tarballs and locally cached. Private repos use `GITHUB_TOKEN`, the `gh` CLI, or git credential helpers.
- Local sources (`file:./relative/path`) resolve relative to the project root.

**Module manifest (`module.lowdefy.yaml`)**

- Declares the module's interface: `name`, `description`, `vars`, `connections`, `pages`, `api`, `components`, `menus`, `dependencies`, `exports`, `plugins`, and `secrets`.
- `vars` declarations validate consumer values with `type`, `required`, `default`, and `description`. Consumer values override manifest defaults; omitted values fall back to the declared default.
- `exports` declares the module's public interface — the IDs other modules and apps may reference. The build validates cross-module references against exports.
- `plugins` declarations are validated against the app's installed plugins with semver compatibility checks.
- `secrets` is an allowlist of secrets the module may access; undeclared `_secret` references fail the build. Remapped connections skip the module's secret references for that connection.

**Module operators**

- `_module.var` — read manifest-validated vars, including consumer overrides and declared defaults.
- `_module.pageId`, `_module.connectionId`, `_module.endpointId` — produce scoped IDs from a module-author's unscoped ID.
- `_module.id` — the entry ID of the current module.

**Auto-scoped IDs**

Page, connection, API endpoint, and menu item IDs are auto-prefixed with the entry ID. Block and request IDs inherit page scope and are not rewritten.

**Consuming module resources**

- Pages and APIs are auto-included and auto-scoped — they appear in the app under the entry-ID prefix.
- Components are reusable config fragments included with `_ref: { module, component, vars }`. They can export any config — UI blocks, enum maps, config templates, schema fragments — and accept vars at the call site.
- Menus are included with `_ref: { module, menu }`, typically wrapped in a `MenuGroup`.

**Connection remapping**

Apps can redirect a module connection to an existing app connection via the entry's `connections` map. The module's connection definition and its declared secrets are skipped — the app connection handles them.

**Cross-module dependencies**

Modules can reference each other's pages, components, menus, connections, and APIs via abstract dependencies declared in `module.lowdefy.yaml`.

- Auto-wiring: when a module entry's `id` matches a declared dependency name, the build wires it automatically.
- Explicit wiring: the entry's `dependencies` map overrides auto-wiring and supports multi-instance topologies where each instance points at a different partner.
- The build validates every wiring, detects dependency cycles, and reports unmapped or undeclared dependencies with remediation hints.

**Auth page rules**

Picomatch glob patterns in auth page rules (e.g. `team-users/*`) for wildcard module page matching.

**Slashed page IDs (`@lowdefy/server`, `@lowdefy/server-dev`)**

Server routes support module page IDs containing `/` (e.g. `/team-users/users-list`).
