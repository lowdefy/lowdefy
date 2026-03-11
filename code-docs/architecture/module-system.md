# Module System Architecture

How Lowdefy modules are processed during the build.

## Overview

Modules are reusable configuration packages that bundle pages, connections, API endpoints, components, and menus. The build resolves modules in dedicated phases before the standard build pipeline runs.

## Module Lifecycle

```
fetch → parse manifest → resolve refs + _module.var → scope IDs → merge into app
```

1. **Fetch** (Phase 0) — Download GitHub tarballs or resolve local `file:` paths
2. **Parse manifest** (Phase 1) — Read `module.lowdefy.yaml`, resolve `_ref` and `_module.var` operators
3. **Resolve refs** (Phase 2) — Handle `_ref: { module, component/menu }` during the app's `buildRefs` pass
4. **Scope IDs** (Phase 3) — Resolve `_module.*` ID operators, prefix pages/connections/APIs/menus with entry ID
5. **Merge** (Phase 3) — Append module pages, connections, APIs to the app's `components`

## Module Entry Configuration

Each entry in `lowdefy.yaml`:

```yaml
modules:
  - id: team-users # User-defined namespace (no slashes)
    source: 'github:org/user-admin@v1.0.0'
    vars:
      collection: team_users
    connections:
      users-db: my-app-mongodb # Optional: remap module connections
```

- `id` — Controls the namespace prefix for scoped IDs
- `source` — GitHub (`github:owner/repo/path@ref`) or local (`file:./path`)
- `vars` — Passed to the module, accessible via `_module.var`
- `connections` — Maps module connection names to app connection IDs

## Module Manifest Schema

`module.lowdefy.yaml` declares the module's interface:

- `name: string` — Human-readable name
- `description: string` — Description
- `vars: object` — Variable declarations (type, required, default, description)
- `connections: object[]` — Connection definitions
- `pages: object[]` — Page definitions
- `api: object[]` — API endpoint definitions
- `components: object[]` — Named reusable config fragments
- `menus: object[]` — Menu definitions
- `plugins: object[]` — Required plugin dependencies with semver ranges
- `secrets: object[]` — Secret whitelist declarations

## Var Resolution Flow

`_module.var` resolves during the walker pass (Phase 1), alongside `_var`. The `WalkContext` carries `moduleVars` that propagates through both `child()` and `forRef()` — staying constant across all `_ref` nesting depths within the module.

```javascript
// In resolve(), after the _var branch:
if (type.isObject(node) && !type.isUndefined(node['_module.var'])) {
  const moduleVarResult = resolveModuleVar(node, ctx);
  return resolve(moduleVarResult, ctx);
}
```

`resolveModuleVar` mirrors `resolveVar` but reads from `ctx.moduleVars`:

- String form: `{ "_module.var": "key" }` — dot-notation lookup in `moduleVars`
- Object form: `{ "_module.var": { key, default } }` — with fallback value

Outside module context (`moduleVars` is `undefined`), `_module.var` passes through unchanged.

## ID Scoping Algorithm

Phase 3 (`buildModules`) scopes IDs by prefixing with `{entryId}/`:

| ID type         | Scoped? | Pattern                    |
| --------------- | ------- | -------------------------- |
| Page ID         | Yes     | `{entryId}/{pageId}`       |
| Connection ID   | Yes     | `{entryId}/{connectionId}` |
| API endpoint ID | Yes     | `{entryId}/{endpointId}`   |
| Menu item ID    | Yes     | `{entryId}/{menuItemId}`   |
| Block ID        | No      | Unchanged                  |
| Request ID      | No      | Inherited from parent page |

The `_module.*` ID operators resolve to scoped IDs:

- `_module.pageId: users-list` → `team-users/users-list`
- `_module.connectionId: users-db` → `team-users/users-db` (or remapped ID)
- `_module.endpointId: invite-user` → `team-users/invite-user`
- `_module.id: true` → `team-users`

ID operators are resolved by `resolveModuleOperators` using a `serializer.copy` reviver pass.

## Connection Remapping

When the module entry specifies `connections: { users-db: my-app-mongodb }`:

1. **Definition-level**: The module's `users-db` connection definition is skipped — not merged into app connections
2. **Reference-level**: `_module.connectionId: users-db` resolves to `my-app-mongodb` instead of `team-users/users-db`

This is handled entirely by the `_module.connectionId` operator — no separate rewriting step.

## Secret Whitelist Validation

Modules declare accessible secrets in `module.lowdefy.yaml`. During Phase 1, the build validates:

1. Every `_secret` reference in module config matches a declared secret name
2. Undeclared `_secret` references are build errors

When a connection is remapped, secret references in that connection's definition are skipped (the definition isn't used).

## Plugin Dependency Validation

During Phase 1 (`buildModuleDefs`):

1. Every declared plugin must exist in the app's `plugins` array
2. The app's installed version must satisfy the module's declared semver range

Failures produce errors with remediation instructions.

## Component and Menu Export System

Components and menus are declared in `module.lowdefy.yaml` and resolved during Phase 1. During Phase 2, `_ref: { module, component }` calls `getModuleRefContent` which looks up the export in the already-resolved manifest.

Menu refs (`_ref: { module, menu }`) return the menu's `links` array, suitable for splicing into app menus via `_build.array.concat`.

## Key Files

| File                                                        | Purpose                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/build/src/build/fetchModules.js`                  | Fetch module sources (GitHub tarballs, local paths)                |
| `packages/build/src/build/buildModuleDefs.js`               | Parse manifests, resolve `_module.var`, validate plugins/secrets   |
| `packages/build/src/build/buildModules.js`                  | Scope IDs, resolve ID operators, merge into app components         |
| `packages/build/src/build/resolveModuleOperators.js`        | Resolve `_module.*` ID operators via reviver                       |
| `packages/build/src/build/buildRefs/getModuleRefContent.js` | Resolve `_ref: { module, component/menu }`                         |
| `packages/build/src/build/buildRefs/walker.js`              | Extended with `resolveModuleVar` and `moduleVars` on `WalkContext` |
