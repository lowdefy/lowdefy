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
2. **Local resolve** (Phase 1a) — Read `module.lowdefy.yaml`, resolve local `_ref` in schema positions, preserve var `default` fields and `_module.var` for lazy resolution, extract exports and dependencies
3. **Validate wiring** (Phase 1b) — Auto-wire dependencies by name match, validate all mappings
4. **Full resolve** (Phase 1c) — Resolve cross-module `_ref: { module }` and `_module.*Id` operators with dependencies set
5. **Resolve refs** (Phase 2) — Handle `_ref: { module, component/menu }` during the app's `buildRefs` pass (walker resolves `_module.*Id` operators in the content)
6. **Scope IDs** (Phase 3) — Prefix pages/connections/APIs/menus with entry ID
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

`_module.var` resolves lazily during the full-resolve walker pass — only when the walker reads a var, and only after the consumer's value or the manifest default has been resolved. There is no eager merge of defaults; defaults are expressions that the walker evaluates on demand.

### Phase 1a — `resolveLocalManifest`

The walker walks the manifest with `shouldStop` preserving var `default` subtrees, `components[].component` bodies, all of `pages`, `api`, and `connections`, and `menus[].links`. Everything outside those subtrees resolves normally — `_ref` in `dependencies`, `exports`, `plugins`, `secrets`, `name`, `description`, `menus[].id`, `components[].id`, and the rest of the manifest schema all evaluate in this pass. Inside the preserved subtrees, `_ref`, `_module.var`, `_build.*`, and any operator combinations stay raw until the full-resolve pass evaluates them on read.

Phase 1a stores three things on `context.modules[entry.id]`:

- `consumerVars` — the raw vars object the consumer passed in `lowdefy.yaml`
- `varDefs` — the `vars` declarations from `module.lowdefy.yaml`, with `default` fields preserved as raw operator trees
- `resolvedVarCache` — empty cache keyed by var path, populated lazily during the full-resolve pass

Phase 1a then calls `validateRequiredVars` for any required var that has no default — a missing required var fails the build before the main walk runs.

During Phase 1a, the walker has `moduleRoot` set on the `WalkContext` (no full `moduleEntry` yet). `_module.var` is preserved untouched in this phase — the full-resolve pass resolves it.

### Phase 1c / Phase 2 — `resolveFullManifest`

The walker walks the manifest with `moduleEntry` set on the `WalkContext`. `shouldStop` preserves var `default` fields (defaults still don't resolve until read). `_module.var` triggers lazy resolution via `resolveModuleVar` → `resolveEffectiveVar` → `resolveVarDefault`:

```javascript
// In resolve(), after the _var branch:
if (type.isObject(node) && !type.isUndefined(node['_module.var'])) {
  return resolveModuleVar(node, ctx);
}
```

`resolveModuleVar` always delegates to `resolveEffectiveVar(key, moduleEntry, ctx)`. The consumer-vs-default decision lives entirely inside `resolveEffectiveVar`, which does:

1. **Cache hit** — return `moduleEntry.resolvedVarCache[key]`.
2. **Namespace var** (`varDef.properties` set) — call `resolveNamespaceVar`, which builds a fresh object containing only the **declared** properties; each property resolves through `resolveEffectiveVar` recursively (consumer value per-leaf, otherwise that property's declared default). The consumer's namespace value is never returned wholesale — keys the consumer passes that aren't declared in `properties` are silently dropped.
3. **Leaf var with consumer value** — return the consumer value as-is.
4. **Leaf var with declared default** — call `resolveVarDefault(varDef.default, moduleEntry, ctx)`.
5. **Otherwise** — return `null`.

The result is written to `moduleEntry.resolvedVarCache[key]` after step 2/3/4/5 completes (writes happen *after* resolution, not before — circular `_module.var` graphs between defaults stack-overflow, see Dynamic Defaults in the user docs).

For step 4, `resolveVarDefault` walks the raw default subtree in a fresh `WalkContext` rooted at `module.lowdefy.yaml`:

- `sourceRefId: null` — the caller's `cloneVarValue(value, ctx.sourceRefId)` uses the outer walk's `sourceRefId`, not the nested default walk's.
- `refId: moduleEntry.refDef.id` — default-resolution errors point at the module entry, not the calling page.
- `vars: {}` — no `_var` carryover from the outer walk.
- `refChain: new Set(moduleEntry.refDef.path ? [moduleEntry.refDef.path] : [])` — fresh chain, seeded with the module root to catch self-ref loops.
- `currentFile: moduleYamlPath` — `_ref` paths inside defaults resolve relative to the module root.

`getVarDef(varDefs, key)` navigates the `properties` tree by dot-path to find the declaration for a nested key.

After the full-resolve pass completes, `validateVarTypes` walks the populated `resolvedVarCache` and validates each resolved value against its declared `type`. Vars that no walk read are absent from the cache — their defaults never resolve and their declared `type` is never checked.

### `_module.var` Branch on `WalkContext`

The walker's `_module.var` branch examines two `WalkContext` fields:

- `moduleEntry` set → lazy resolve via `resolveModuleVar` (full-resolve pass, cross-module refs)
- `moduleEntry` null, `moduleRoot` set (Phase 1a local resolve) → preserve the node untouched; the full-resolve pass resolves it
- Both null (app-level config) → throw `ConfigError` — `_module.var` does not work at the app level

## ID Operator Resolution (Walker-Based)

The `_module.*Id` operators (`_module.pageId`, `_module.connectionId`, `_module.endpointId`, `_module.id`) resolve during the walker pass in `walker.js`, alongside `_module.var`. They are detected **after** child walking (bottom-up) — after `_module.var` but before `_build.*`.

```javascript
const MODULE_ID_OPERATOR_KEYS = [
  '_module.pageId',
  '_module.connectionId',
  '_module.endpointId',
  '_module.id',
];
```

Each operator supports both string form (same-module) and object form (cross-module):

- `_module.pageId: users-list` → `team-users/users-list`
- `_module.pageId: { id: contact-detail, module: contacts }` → `contacts/contact-detail`
- `_module.connectionId: users-db` → `team-users/users-db` (or remapped ID)
- `_module.connectionId: { id: contacts-db, module: contacts }` → scoped via target entry
- `_module.endpointId: invite-user` → `team-users/invite-user`
- `_module.id: true` → `team-users`
- `_module.id: { module: contacts }` → target entry's ID

The object form uses `resolveDepTarget()` (shared utility in `resolveDepTarget.js`) to resolve the abstract dependency name to a concrete module entry. Each operator validates that the referenced ID exists in the target module's `exports` declarations.

Outside module context (`moduleEntry` is `undefined`), the operators pass through unchanged.

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

By Phase 3, all `_module.*Id` operators have already been resolved to concrete string IDs by the walker. Phase 3 only does structural ID scoping (prefixing) and merging into the app's `components`.

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

All named non-page exports live in the `components` section of `module.lowdefy.yaml` — UI blocks, config templates, enum maps, schema fragments. The unified structure is `{ id, component }` (no `type: Component`). Menus are declared separately in the `menus` section.

- `key` extraction uses the existing walker mechanism (`_ref.key`)
- Per-ref `vars` customize the component at the point of inclusion
- Runtime operators in component content are preserved (not resolved at build time)
- Content is deep-cloned before processing to prevent mutation of the manifest entry

Menu refs (`_ref: { module, menu }`) return the menu's `links` array, suitable for splicing into app menus via `_build.array.concat`.

### Deferred Resolution

Components and menus are registered during Phase 1 local resolve, but their content stays preserved (the walker's `shouldStop` skips into `components[].component` and `menus[].links`). Content is walked at consumption time — either during Phase 1 full resolve (for cross-module refs inside module manifests) or during Phase 2 (for `_ref: { module, component/menu }` in app-level config). At consumption, `getModuleRefContent` looks up the export in the already-resolved manifest and walks it in the source module's context.

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
_module.pageId: view                  # → "companies/view"

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

When module A embeds a component from module B, the component's `_module.var` and `_module.*Id` operators resolve against **B's context** — not A's. The walker switches `moduleEntry`, `moduleDependencies`, and `packageRoot` to B's values when entering cross-module ref content. `_module.var` then reads B's `consumerVars`, `varDefs`, and `resolvedVarCache`.

This is essential: a contacts component's `_module.var: collection` means the contacts collection. Its `_module.pageId: contact-detail` resolves to the contacts entry's page. Per-ref `_var` still works for customizing the component at the point of inclusion.

### Phase 1: Two-Pass Resolve for Mutual Dependencies

Modules can depend on each other (contacts ↔ companies). The build handles this with a local-resolve → validate → full-resolve sequence:

**Step 1 — Local resolve:** For each module entry, run the walker with `shouldStop` preserving pages, API, connections, menu link content, and var `default` fields. Local `_ref` in schema positions and `_build.*` operators resolve — producing concrete `components` and `menus` arrays with string IDs. Component bodies, var defaults, and `_module.var` references stay preserved. Extract `dependencies` and `exports` declarations.

```
resolveLocalManifest("contacts") → concrete arrays, preserved content, exports extracted
resolveLocalManifest("companies") → concrete arrays, preserved content, exports extracted
```

**Step 2 — Validate wiring:** `resolveModuleDependencies` auto-wires by name match, validates all mappings.

**Step 3 — Full resolve:** Run the walker once per manifest with `moduleEntry` and `moduleDependencies` set. The walker resolves all preserved content — pages, API, connections, menu links, and cross-module `_ref: { module }` refs. `_module.var` triggers lazy default resolution against `moduleEntry.consumerVars` and `varDefs`, caching results on `moduleEntry.resolvedVarCache`. `_build.*` operators wrapping cross-module refs evaluate correctly because everything resolves in one pass.

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
| `packages/build/src/build/registerModules.js`               | `resolveLocalManifest` stores raw `consumerVars`/`varDefs`/empty `resolvedVarCache`; `resolveFullManifest` runs the full-resolve walker pass; calls `validateRequiredVars` early and `validateVarTypes` after the full-resolve pass |
| `packages/build/src/build/buildModules.js`                  | Scope IDs (prefix with entryId), merge module content into app components       |
| `packages/build/src/build/resolveModuleOperators.js`        | `scopeMenuItemIds` only — prefixes menu item IDs with entry ID                  |
| `packages/build/src/build/resolveDepTarget.js`              | Shared utility for resolving abstract dependency names to concrete entry IDs    |
| `packages/build/src/build/buildRefs/getModuleRefContent.js` | Resolve `_ref: { module, component/menu }`, deep copy content                  |
| `packages/build/src/build/buildRefs/walker.js`              | `_module.var` triggers lazy resolution via `moduleEntry`; `_module.*Id` resolution; module context switching; cycle detection. Adds `resolveEffectiveVar`, `resolveNamespaceVar`, `resolveVarDefault`, `getVarDef` helpers |
