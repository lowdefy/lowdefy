# Module System Architecture

How Lowdefy modules are processed during the build.

## Overview

Modules are reusable configuration packages that bundle pages, connections, API endpoints, components, and menus. The build resolves modules in dedicated phases before the standard build pipeline runs.

Modules support **cross-module dependencies** — one module can embed components, reference pages, call APIs, and use connections from another module. Dependencies use injection: the module declares abstract slots, the app wires them to concrete entries.

## Module Lifecycle

```
fetch → local resolve → validate wiring → full resolve → scope IDs → merge into app
```

1. **Fetch** (Phase 0) — Download GitHub tarballs or resolve local `file:` paths
2. **Local resolve** (Phase 1a) — Read `module.lowdefy.yaml`, resolve local `_ref` and `_module.var`, extract exports and dependencies
3. **Validate wiring** (Phase 1b) — Auto-wire dependencies by name match, validate all mappings
4. **Full resolve** (Phase 1c) — Resolve cross-module `_ref: { module }` and `_module.*Id` operators with dependencies set
5. **Resolve refs** (Phase 2) — Handle `_ref: { module, component/menu }` during the app's `buildRefs` pass
6. **Scope IDs** (Phase 3) — Resolve `_module.*` ID operators, prefix pages/connections/APIs/menus with entry ID
7. **Merge** (Phase 3) — Append module pages, connections, APIs to the app's `components`

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
    dependencies:
      layout: app-layout # Optional: override auto-wired dependency
```

- `id` — Controls the namespace prefix for scoped IDs
- `source` — GitHub (`github:owner/repo/path@ref`) or local (`file:./path`)
- `vars` — Passed to the module, accessible via `_module.var`
- `connections` — Maps module connection names to app connection IDs
- `dependencies` — Maps abstract dependency names to concrete entry IDs (overrides auto-wiring)

## Module Manifest Schema

`module.lowdefy.yaml` declares the module's interface:

- `name: string` — Human-readable name
- `description: string` — Description
- `vars: object` — Variable declarations (type, required, default, description)
- `dependencies: object[]` — Cross-module dependency declarations (`{ id, description }`)
- `exports: object` — What the module exposes (`{ pages, components, menus, connections, api }`)
- `connections: object[]` — Connection definitions
- `pages: object[]` — Page definitions
- `api: object[]` — API endpoint definitions
- `components: object[]` — Named reusable config fragments
- `menus: object[]` — Menu definitions
- `plugins: object[]` — Required plugin dependencies with semver ranges
- `secrets: object[]` — Secret allowlist declarations

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

## Secret Allowlist Validation

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

## Cross-Module Dependencies

### Dependency Declaration and Wiring

A module declares abstract dependency slots in `module.lowdefy.yaml`:

```yaml
# contacts/module.lowdefy.yaml
dependencies:
  - id: companies
    description: Company selector and detail links
  - id: layout
    description: Page layout components
```

The app wires slots to concrete entries. Auto-wiring matches dependency names to entry IDs — if a module declares dependency `contacts` and an entry with `id: contacts` exists, the build wires them automatically. Explicit `dependencies` on the entry override auto-wiring:

```yaml
# lowdefy.yaml
modules:
  - id: contacts
    source: "github:org/crm/contacts@v1"
  - id: companies
    source: "github:org/crm/companies@v1"
    # "contacts" auto-wires (name matches entry ID)
    dependencies:
      layout: app-layout  # Explicit — no entry called "layout"
```

### Dependency Resolution (`resolveModuleDependencies`)

After all manifests are locally resolved, `resolveModuleDependencies` runs:

1. **Auto-wire**: For each declared dependency without explicit mapping, find a module entry with matching `id`
2. **Validate**: Four checks —
   - Every declared dependency has a mapping (explicit or auto-wired)
   - No unknown keys in the entry's `dependencies` map
   - All target entry IDs exist in `context.modules`
   - No self-referencing dependencies

### Cross-Module References

Modules reference dependencies through two mechanisms:

**ID operators** (object form) — for linking to pages, APIs, connections:

```yaml
# String form: same-module reference
_module.pageId: company-detail        # → "companies/company-detail"

# Object form: cross-module reference
_module.pageId:
  id: contact-detail
  module: contacts                     # Abstract dependency name
  # → "contacts/contact-detail" (resolved concrete entry's scoped page ID)
```

| Operator | String Form (same module) | Object Form (cross module) |
|----------|--------------------------|---------------------------|
| `_module.pageId` | `"pageId"` → `"{entryId}/pageId"` | `{ id, module }` → `"{targetEntryId}/pageId"` |
| `_module.connectionId` | `"connId"` → scoped or remapped | `{ id, module }` → scoped via target entry |
| `_module.endpointId` | `"apiId"` → `"{entryId}/apiId"` | `{ id, module }` → `"{targetEntryId}/apiId"` |
| `_module.id` | `true` → `"{entryId}"` | `{ module }` → `"{targetEntryId}"` |

**`_ref: { module }` refs** — for embedding components and menus:

```yaml
# Embed a component from another module
- _ref:
    module: contacts       # Abstract dependency name
    component: contact-selector
    vars:
      field_id: primary_contact

# Include menu links from another module
links:
  _build.array.concat:
    - _ref:
        module: contacts
        menu: default
```

Cross-module `_ref` is restricted to `component` and `menu` types. The build rejects `_ref: { module, page }`, `_ref: { module, connection }`, and `_ref: { module, api }` with an error pointing to the corresponding ID operator.

### Export Declarations

Modules declare exports so the build can validate cross-module references before content resolution:

```yaml
exports:
  pages:
    - id: contact-list
    - id: contact-detail
  components:
    - id: contact-selector
      description: Dropdown selector for picking contacts
  menus:
    - id: default
  api:
    - id: save-contact
```

The build reads `exports` during the local resolve step. Cross-module ID operators (`_module.pageId: { id, module }`) validate against the target's declared exports.

### Embedded Component Context

When module A embeds a component from module B, the component's `_module.var` and `_module.*Id` operators resolve against **B's context** — not A's. The walker switches `moduleVars`, `moduleDependencies`, and `packageRoot` to B's values when entering cross-module ref content.

This is essential: a contacts component's `_module.var: collection` means the contacts collection. Its `_module.pageId: contact-detail` resolves to the contacts entry's page. Per-ref `_var` still works for customizing the component at the point of inclusion.

### Phase 1: Two-Pass Resolve for Mutual Dependencies

Modules can depend on each other (contacts ↔ companies). The build handles this with a local-resolve → validate → full-resolve sequence:

**Step 1 — Local resolve:** For each module entry, run the walker with `shouldStop` preserving pages, API, connections, and menu link content. Local `_ref`s, `_module.var`, and `_build.*` operators resolve — producing concrete `components` and `menus` arrays with string IDs. Component bodies stay preserved. Extract `dependencies` and `exports` declarations.

```
resolveLocalManifest("contacts") → concrete arrays, preserved content, exports extracted
resolveLocalManifest("companies") → concrete arrays, preserved content, exports extracted
```

**Step 2 — Validate wiring:** `resolveModuleDependencies` auto-wires by name match, validates all mappings.

**Step 3 — Full resolve:** Run the walker once per manifest with `moduleDependencies` set. The walker resolves all preserved content — pages, API, connections, menu links, and cross-module `_ref: { module }` refs. `_build.*` operators wrapping cross-module refs evaluate correctly because everything resolves in one pass.

This works because step 1 produces concrete arrays for every module without cross-module content. `components` and `menus` arrays are always locally constructable — cross-module `_ref: { module, component }` appears inside `component:` fields and page content, never at the array level. Step 3's walker looks up components and menus by ID in these concrete arrays. Processing order in step 3 doesn't matter.

### Cycle Detection for Cross-Module Refs

The walker's file-based cycle detection checks `refDef.path` against the `refChain` Set. Module refs (`_ref: { module, component }`) have no `path` — so cross-module cycle detection uses synthetic keys.

After loading module ref content, the walker constructs a key `module:<entryId>/<type>:<name>` (e.g., `module:contacts/component:contact-selector`) and checks it against `refChain`. If found, the ref chain has looped — the walker throws a `ConfigError` with the full chain trace.

The cycle key uses the **resolved concrete entry ID**, not the abstract dependency name. This ensures multi-instance detection works correctly — `internal-contacts/component:contact-selector` and `external-contacts/component:contact-selector` are distinct keys even though both come from the same module source.

### Supported Use Cases

- **Shared layout module**: Every module depends on a layout module for page wrappers
- **Mutual entity references**: Contacts ↔ companies embed each other's selectors and link to each other's pages
- **Cross-cutting services**: An events module provides audit logging APIs called by all modules
- **Diamond dependencies**: Multiple modules depend on the same module, all wired to the same entry
- **Multi-instance**: Two instances of the same module wired to different dependencies
- **Multiple layout variants**: Different layout modules expose the same component interface; the app chooses which

## Key Files

| File                                                        | Purpose                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/build/src/build/fetchModules.js`                  | Fetch module sources (GitHub tarballs, local paths)                             |
| `packages/build/src/build/buildModuleDefs.js`               | Three-phase module processing: local resolve → validate → full resolve          |
| `packages/build/src/build/resolveModuleDependencies.js`     | Auto-wire and validate cross-module dependency mappings                         |
| `packages/build/src/build/buildModules.js`                  | Scope IDs, resolve ID operators (string + object form), merge into components   |
| `packages/build/src/build/resolveModuleOperators.js`        | Resolve `_module.*` ID operators via reviver (string + object form)             |
| `packages/build/src/build/buildRefs/getModuleRefContent.js` | Resolve `_ref: { module, component/menu }`, deep copy content                  |
| `packages/build/src/build/buildRefs/walker.js`              | Module context switching, `resolveModuleVar`, cycle detection for module refs   |
