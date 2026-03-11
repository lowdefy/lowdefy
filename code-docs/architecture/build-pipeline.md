# Build Pipeline Architecture

How Lowdefy transforms YAML configuration into a running Next.js application.

## Overview

The build pipeline is a multi-stage process that:
1. Loads and resolves all `_ref` operators recursively
2. Validates configuration against schemas
3. Processes pages, blocks, connections, and auth
4. Extracts and hashes JavaScript code
5. Generates type manifests and import files
6. Outputs JSON artifacts for the Next.js server

## Entry Points

### CLI Build Command

**File:** `packages/cli/src/commands/build/build.js`

```
1. getServer() - Fetch @lowdefy/server package
2. resetServerPackageJson() - Reset to clean state
3. addCustomPluginsAsDeps() - Register custom plugins
4. installServer() - Run npm install
5. runLowdefyBuild() - Execute core build (pnpm run build:lowdefy)
6. installServer() - Second install for updated deps
7. runNextBuild() - Build Next.js app
```

### Dev Command

**File:** `packages/cli/src/commands/dev/dev.js`

Uses `@lowdefy/server-dev` instead of `@lowdefy/server`, outputs to `directories.dev`.

## Directory Structure

**File:** `packages/cli/src/utils/getDirectories.js`

```
.lowdefy/
├── server/
│   └── build/                    # Production build output
│       ├── config.json
│       ├── app.json
│       ├── auth.json
│       ├── global.json
│       ├── menus.json
│       ├── keyMap.json
│       ├── refMap.json
│       ├── types.json
│       ├── pages/{pageId}/
│       │   ├── {pageId}.json
│       │   └── requests/{requestId}.json
│       ├── connections/{connectionId}.json
│       ├── api/{endpointId}.json
│       └── plugins/
│           ├── actionSchemas.json     # Action param schemas (for runtime validation)
│           ├── blockSchemas.json      # Block property schemas (for runtime validation)
│           ├── operatorSchemas.json   # Operator param schemas (for runtime validation)
│           └── operators/
│               ├── clientJsMap.js
│               └── serverJsMap.js
└── dev/                          # Development output
```

## Core Build Pipeline

**File:** `packages/build/src/index.js`

### Phase 1: Initialization & Ref Resolution

```javascript
createContext()     // Initialize build context
buildRefs()         // Load and resolve all _ref operators
testSchema()        // Validate against schema
```

### Phase 2: Configuration Building

```javascript
buildApp()          // Process app.html, app.git_sha
validateConfig()    // Validate basePath and config
addDefaultPages()   // Generate 404 if missing
buildAuth()         // Process authentication
buildConnections()  // Process data connections
buildApi()          // Process API endpoints
```

### Phase 3: Page & Menu Building

```javascript
buildPages()        // Process pages, blocks, requests
buildMenu()         // Build navigation structure
```

### Phase 4: Code & Type Processing

```javascript
buildJs()           // Extract and hash JS functions
addKeys()           // Add path tracking metadata
buildTypes()        // Create types manifest
buildImports()      // Generate import statements
```

### Phase 5: File Writing

```javascript
cleanBuildDirectory()
writeApp(), writeAuth(), writeConfig()
writeConnections(), writePages(), writeRequests()
writeApi(), writeGlobal(), writeMenus()
writeMaps(), writeTypes(), writePluginImports()
// writePluginImports includes:
//   - Import files (blocks.js, actions.js, operators/*.js, etc.)
//   - Schema maps (blockSchemas.json, actionSchemas.json, operatorSchemas.json)
```

## The buildRefs System

**File:** `packages/build/src/build/buildRefs/buildRefs.js`

The `_ref` operator system resolves all configuration file references in a single async tree walk.

### How It Works: Single-Pass Walker

**File:** `packages/build/src/build/buildRefs/walker.js`

The walker replaces the old multi-pass `recursiveBuild` pipeline (which used 5+ `serializer.copy` JSON round-trips per ref) with a single `resolve()` function that handles `_ref`, `_var`, and `_build.*` operators in one traversal.

**Traversal order:**
- **Top-down:** `_ref` and `_var` are detected _before_ descending into children
- **Bottom-up:** `_build.*` operators evaluate _after_ all children have resolved

**Core `resolve(node, ctx)` flow:**

1. Primitives pass through unchanged
2. `_ref` objects → `resolveRef()` (or create `~shallow` marker if `ctx.shouldStop` matches)
3. `_var` objects → `resolveVar()`, then re-walk result for nested operators
4. Arrays/objects → walk children in-place, then check for `_build.*` operator evaluation

**`resolveRef()` steps:**

1. Create ref definition and register in `refMap`
2. Store unresolved vars (before mutation) for JIT rebuild
3. Resolve dynamic path/vars/key via recursive `resolve()` in parent context
4. Update `refMap` with resolved path
5. Circular reference detection via `ctx.refChain`
6. Load content via `getRefContent()`
7. Create child context with `forRef()` (new vars, refChain copy)
8. Walk content recursively
9. Run transformer (optional)
10. Extract key (`_ref.key`)
11. Tag all result nodes with `~r` provenance via `tagRefDeep()`
12. Propagate `~ignoreBuildChecks` marker

**`WalkContext`** carries immutable context through the walk:
- `child(segment)` — appends to JSON path for stop-path matching
- `forRef()` — creates child context for entering a new file (new vars, fresh refChain Set copy)
- Path tracks through ref boundaries, enabling `shouldStop` to match `pages.*.blocks` paths

**`evaluateStaticOperators`** runs once at the end (not per-file) using `evaluateOperators` from `@lowdefy/operators`.

### _ref Object Structure

```yaml
_ref:
  path: "blocks/header.yaml"    # File path
  vars:                         # Template variables
    title: "My Title"
  key: "blocks[0]"              # Extract specific key
  resolver: "./customResolver"  # Custom resolver function
  transformer: "./transform"    # Custom transformer
```

### File Parsing

**File:** `packages/build/src/build/buildRefs/parseRefContent.js`

| Extension | Parser |
|-----------|--------|
| `.yaml`, `.yml` | yaml library |
| `.json` | JSON5 (supports comments) |
| `.njk` | Nunjucks → detect final extension |

## Component Building

### Connections

**File:** `packages/build/src/build/buildConnections.js`

- Rename `id` to `connectionId`
- Set `id` to `connection:{connectionId}`
- Count operator types in properties

### Pages

**File:** `packages/build/src/build/buildPages/buildPages.js`

For each page:
- Validate pageId
- Process nested blocks via `buildBlock()`
- Collect requests from blocks

### buildBlock

**File:** `packages/build/src/build/buildPages/buildBlock/buildBlock.js`

```javascript
validateBlock()       // Check structure
setBlockId()          // Assign unique ID
buildEvents()         // Process on* handlers
buildRequests()       // Extract requests
moveSubBlocksToArea() // Reorganize layout
countBlockTypes()     // Track usage
buildSubBlocks()      // Recurse into children
```

### Menus

**File:** `packages/build/src/build/buildMenu.js`

- Generate default menu from pages if none specified
- Validate referenced pages exist
- Set menu item auth from page auth

## JavaScript Extraction

**File:** `packages/build/src/build/buildJs/buildJs.js`

1. Scan component tree for `_js` operators
2. Hash each function body (SHA1 for deduplication)
3. Store in `context.jsMap.client` or `context.jsMap.server`
4. Replace `_js` value with hash in config
5. Generate import files:
   - `plugins/operators/clientJsMap.js`
   - `plugins/operators/serverJsMap.js`

### Generated Code Template

```javascript
export default {
  'hash1': ({ actions, event, input, ... }) => { /* function body */ },
  'hash2': ({ item, payload, secrets, ... }) => { /* function body */ },
};
```

## Key Mapping & Tracking

**File:** `packages/build/src/build/addKeys.js`

After all components are built:
1. Traverse entire tree recursively
2. Create `keyMap` entries with dot-notation paths
3. Attach `~k` property pointing to keyMap entry
4. Remove `~r` property (no longer needed)

Arrays use the `~arr` serializer wrapper to preserve `~k`, `~r`, and `~l` through JSON round-trips. Servers deserialize build artifacts with `serializer.deserialize()` to restore these markers at runtime.

**Purpose:** Enable runtime error messages with exact YAML locations.

## Types Manifest

**File:** `packages/build/src/build/buildTypes.js`

Builds manifest of used component types:
- Count all types via `context.typeCounters`
- Add mandatory types (Message, validators)
- Add default blocks (loaders, basic)

Output: `types.json` - used by server for validation and plugin loading.

## Context Object

**File:** `packages/build/src/createContext.js`

```javascript
context = {
  directories: { config, build, server, dev },
  jsMap: { client: {}, server: {} },
  keyMap: {},
  refMap: {},
  logger,               // Wrapped with ConfigWarning/ConfigError formatting
  readConfigFile,
  writeBuildArtifact,
  refResolver,
  seenSourceLines,       // Set for deduplicating warnings by source:line
  stage: 'prod' | 'dev',
  typeCounters: {
    actions, auth, blocks, connections,
    requests, operators: { client, server }
  },
  typesMap
}
```

`createContext` wraps `logger.warn` and `logger.error` to handle `ConfigWarning`/`ConfigError` formatting with deduplication. It detects Pino loggers (via `logger.child`) vs console loggers and formats output accordingly:
- **Pino**: `logger.warn({ source }, message)` (structured JSON)
- **Console**: `logger.warn('message\n    at source')` (plain text)

## Build Flow Diagram

```
CLI: build command
     ↓
getServer() → resetServerPackageJson() → addCustomPluginsAsDeps()
     ↓
installServer() → runLowdefyBuild()
     ↓
[packages/build/src/index.js] build()
     ↓
createContext() → buildRefs()
  ├─ Start with lowdefy.yaml
  ├─ Recursively scan for _ref
  ├─ Load/parse files
  ├─ Process _var templates
  ├─ Apply transformers
  └─ Evaluate _build.* operators
     ↓
testSchema() → buildApp() → buildAuth() → buildConnections()
     ↓
buildApi() → buildPages() → buildMenu()
     ↓
buildJs() → addKeys() → buildTypes() → buildImports()
     ↓
cleanBuildDirectory() → Write all artifacts
     ↓
.lowdefy/server/build/ populated
     ↓
installServer() → runNextBuild()
     ↓
Complete Next.js app in .lowdefy/server/
```

## Data Transformation Stages

**Stage 1: Raw YAML**
```yaml
pages:
  - id: home
    blocks:
      - _ref: blocks/header.yaml
```

**Stage 2: After buildRefs**
```javascript
{
  pages: [{
    id: 'home',
    blocks: [{ type: 'Header', properties: {...} }],
    '~r': refId1,  // Track original file
  }]
}
```

**Stage 3: After buildPages**
```javascript
{
  pages: [{
    pageId: 'home',
    id: 'page:home',
    blocks: [{
      blockId: 'block0',
      id: 'page:home:block:block0',
      type: 'Header'
    }],
    requests: [...]
  }]
}
```

**Stage 4: Final Output**
```json
{
  "pageId": "home",
  "id": "page:home",
  "blocks": [...],
  "~k": "keyId123"
}
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/commands/build/build.js` | CLI orchestration |
| `packages/build/src/index.js` | Main pipeline (30+ steps) |
| `packages/build/src/build/buildRefs/buildRefs.js` | _ref resolution entry point |
| `packages/build/src/build/buildRefs/walker.js` | Single-pass async tree walker (`resolve`, `resolveRef`, `resolveVar`, `WalkContext`) |
| `packages/operators/src/evaluateOperators.js` | In-place operator evaluator (replaces `BuildParser`) |
| `packages/build/src/build/buildRefs/evaluateStaticOperators.js` | Post-walk static operator pass |
| `packages/build/src/createContext.js` | Context initialization |
| `packages/build/src/build/buildPages/buildPages.js` | Page processing |
| `packages/build/src/build/buildMenu.js` | Menu building |
| `packages/build/src/build/buildJs/buildJs.js` | JS extraction |
| `packages/build/src/build/addKeys.js` | Path tracking |
| `packages/build/src/build/buildTypes.js` | Type manifest |
| `packages/build/src/build/writePluginImports/writeBlockSchemaMap.js` | Block schema collection |
| `packages/build/src/build/writePluginImports/writeActionSchemaMap.js` | Action schema collection |
| `packages/build/src/build/writePluginImports/writeOperatorSchemaMap.js` | Operator schema collection |

## Dev Mode: Shallow Build + JIT Page Build

In development, the build uses a two-phase strategy for faster rebuilds.

### Phase 1: Shallow Build (`shallowBuild`)

**File:** `packages/build/src/build/jit/shallowBuild.js`

Runs the full build pipeline but stops `_ref` resolution at page content boundaries. The walker's `shouldStop` callback uses semantic path matching:

**File:** `packages/build/src/build/jit/isPageContentPath.js`

```javascript
const PAGE_CONTENT_KEYS = ['blocks', 'areas', 'events', 'requests', 'layout'];

function isPageContentPath(jsonPath) {
  if (!jsonPath.startsWith('pages.')) return false;
  const segments = jsonPath.split('.');
  for (let i = 1; i < segments.length; i++) {
    if (PAGE_CONTENT_KEYS.includes(segments[i])) return true;
  }
  return false;
}
```

When the walker encounters a `_ref` at a matching path, it creates a `~shallow` marker instead of resolving:

```javascript
{ '~shallow': true, _ref: { path: 'components/header.yaml' }, _refId: 'ref123' }
```

The walker also deletes page content keys (`blocks`, `areas`, `events`, `requests`, `layout`) from page objects during traversal, preventing unnecessary `_build.*` evaluation on content that will be resolved later by JIT.

The shallow build then:
1. Runs skeleton build steps (buildApp, buildAuth, buildConnections, buildApi, buildMenu)
2. Creates a **page registry** with raw (unresolved) page content
3. Creates a **file dependency map** for targeted invalidation
4. Adds all types from installed packages (since page-level types aren't counted)
5. Writes skeleton artifacts + `pageRegistry.json` + `jsMap.json`

**Output:** `{ components, pageRegistry, fileDependencyMap, context }`

### Phase 2: JIT Page Build (`buildPageJit`)

**File:** `packages/build/src/build/jit/buildPageJit.js`

When a page is requested, uses the walker to resolve page content:

```
1. Look up page in pageRegistry
2. Resolve unresolved vars (if any) via walker's resolve() with fresh WalkContext
3. Load page file content via getRefContent/makeRefDefinition
4. Walk content with resolve() (shouldStop: null — JIT resolves everything)
5. evaluateStaticOperators()
6. tagRefDeep() on result
7. addKeys() — add ~k tracking metadata
8. buildPage() — validate blocks, process events, extract requests
9. validatePageTypes() — check block/action/operator types exist
10. validateLinkReferences(), validateStateReferences(), etc.
11. jsMapParser() — extract _js functions (client + server)
12. writePageJit() — write page JSON, request JSONs, updated keyMap/refMap/jsMap
```

### Supporting Modules

| Module | File | Purpose |
|--------|------|---------|
| `createPageRegistry` | `jit/createPageRegistry.js` | Extracts page metadata + raw content from shallow-built components |
| `createFileDependencyMap` | `jit/createFileDependencyMap.js` | Maps config files → page IDs for targeted invalidation |
| `writePageRegistry` | `jit/writePageRegistry.js` | Serializes page registry to `pageRegistry.json` |
| `writePageJit` | `jit/writePageJit.js` | Writes page/request JSONs + updated maps + JS files |
| `isPageContentPath` | `jit/isPageContentPath.js` | Semantic segment matching for stop paths |
| `pageContentKeys` | `jit/pageContentKeys.js` | List of page content keys (`blocks`, `areas`, etc.) |

### Dev Entry Point

**File:** `packages/build/src/indexDev.js`

```javascript
export { default as shallowBuild } from './build/shallowBuild.js';
export { default as buildPageJit } from './build/buildPageJit.js';
export { default as createPageRegistry } from './build/createPageRegistry.js';
export { default as createFileDependencyMap } from './build/createFileDependencyMap.js';
export { default as createContext } from './createContext.js';
```

Imported by the dev server as `@lowdefy/build/dev`.

### Build Output (Dev Mode)

In dev mode, the build directory contains additional JIT artifacts:

```
.lowdefy/dev/build/
├── pageRegistry.json      # Page metadata + raw content for JIT
├── jsMap.json             # JS hash maps (restored by JIT build context)
├── invalidatePages.json   # Page IDs to invalidate (cross-process)
├── pages/{pageId}/        # Written by JIT build on first request
│   ├── {pageId}.json
│   └── requests/{requestId}.json
└── ... (standard skeleton artifacts)
```

## Customization Points

1. **Custom Ref Resolvers**: `--refResolver` or `LOWDEFY_BUILD_REF_RESOLVER`
2. **Custom Transformers**: Define in `_ref` object
3. **Custom Plugins**: Via dependencies in package.json
4. **Build Operators**: `_build.*` operators during buildRefs
