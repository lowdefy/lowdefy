# @lowdefy/build

The Lowdefy configuration compiler. Transforms YAML/JSON config files into optimized build artifacts for the runtime.

## Purpose

This package is responsible for:
- Parsing YAML/JSON configuration files
- Resolving `_ref` imports to compose config from multiple files
- Validating config against the Lowdefy schema
- Evaluating build-time operators
- Generating optimized build artifacts for production

## Why Build-Time Compilation?

Lowdefy apps are fast because expensive operations happen once at build time:

| Build Time | Runtime |
|------------|---------|
| YAML parsing | Load JSON artifacts |
| Schema validation | Already validated |
| Ref resolution | Already resolved |
| Menu generation | Serve pre-built menus |
| Type checking | Types already resolved |

## Build Pipeline

The build function orchestrates 31 steps in sequence:

```javascript
async function build(options) {
  const context = createContext(options);

  // 1. Parse and compose configuration
  const components = await buildRefs({ context });      // Resolve _ref imports

  // 2. Validate and transform
  testSchema({ components, context });                   // Validate against schema
  buildApp({ components, context });                     // Process app config
  validateConfig({ components, context });               // Business rule validation
  addDefaultPages({ components, context });              // Add 404, etc.

  // 3. Build specific domains
  buildAuth({ components, context });                    // Auth providers/adapters
  buildConnections({ components, context });             // Connection configs
  buildApi({ components, context });                     // API endpoints
  buildPages({ components, context });                   // Page definitions
  buildMenu({ components, context });                    // Navigation menus
  buildJs({ components, context });                      // Custom JS functions

  // 4. Finalize
  addKeys({ components, context });                      // Add unique keys
  buildTypes({ components, context });                   // Resolve block/operator types
  buildImports({ components, context });                 // Track plugin imports

  // 5. Write output files
  await cleanBuildDirectory({ context });
  await writeApp({ components, context });
  await writeAuth({ components, context });
  await writeConnections({ components, context });
  await writeApi({ components, context });
  await writeRequests({ components, context });
  await writePages({ components, context });
  await writeConfig({ components, context });
  await writeGlobal({ components, context });
  await writeMaps({ components, context });
  await writeMenus({ components, context });
  await writeTypes({ components, context });
  await writePluginImports({ components, context });
  await writeJs({ components, context });
  await updateServerPackageJson({ components, context });
  await copyPublicFolder({ components, context });
}
```

## Key Modules

### Core Build Steps

| Module | Purpose |
|--------|---------|
| `buildRefs/` | Resolve `_ref` operators to compose config from multiple files |
| `buildPages/` | Process page definitions, blocks, and areas |
| `buildAuth/` | Process authentication providers and adapters |
| `buildConnections.js` | Validate and process connection definitions |
| `buildApi/` | Process API endpoint definitions |
| `buildMenu.js` | Generate navigation menus from page structure |
| `buildJs/` | Compile custom JavaScript functions |
| `buildTypes.js` | Resolve and validate block/operator types |
| `buildImports/` | Track which plugins need to be imported |
| `shallowBuild.js` | Dev-only: skeleton build with `_shallow` markers |
| `buildPageJit.js` | Dev-only: resolve page content on demand |
| `createPageRegistry.js` | Dev-only: extract page metadata for JIT |
| `createFileDependencyMap.js` | Dev-only: map files → pages for invalidation |

### Reference Resolution (`buildRefs/`)

The `_ref` operator enables modular configuration:

```yaml
# lowdefy.yaml
pages:
  _ref: pages/   # Load all YAML files from pages/ directory

# pages/home.yaml
id: home
type: PageHeaderMenu
blocks:
  _ref: ../components/header.yaml  # Relative path reference
```

**Ref types:**
- Directory refs: `_ref: pages/` - loads all `.yaml`/`.json` files
- File refs: `_ref: header.yaml` - loads single file
- JSON5 refs: `_ref: config.json5` - supports JSON5 format
- Nunjucks refs: `_ref: template.njk` - template with variables

### Schema Validation (`testSchema.js`)

Validates config against the Lowdefy JSON schema:
- Block types match their schemas
- Required fields are present
- Property types are correct
- Enum values are valid

### Page Building (`buildPages/`)

Processes page definitions:
- Validates block hierarchy
- Resolves area definitions
- Processes skeleton configurations
- Handles page-level properties

### Menu Building (`buildMenu.js`)

Generates navigation from:
- Explicit menu definitions
- Auto-generated from page structure
- Role-based menu filtering

## Output Structure

Build artifacts go to `.lowdefy/build/`:

```
.lowdefy/build/
├── app.json           # App-level configuration
├── auth.json          # Auth providers/callbacks
├── config.json        # Runtime configuration
├── global.json        # Global state defaults
├── menus.json         # Navigation menus
├── types.json         # Type definitions map
├── keyMap.json        # Config key → source location mapping (for error tracing)
├── refMap.json        # Ref ID → source file mapping (for error tracing)
├── api/               # API endpoint configs (one per endpoint)
├── connections/       # Connection configs (one per connection)
├── pages/             # Page configs (one per page)
├── requests/          # Request configs (one per request)
├── plugins/           # Plugin import manifests
└── js/                # Compiled JavaScript functions
```

### Error Tracing Artifacts

`keyMap.json` and `refMap.json` enable config-aware error tracing:

```javascript
// keyMap.json - maps internal keys to config locations
{
  "abc123": {
    "key": "pages.0.blocks.0.type",
    "~r": "ref1",    // Reference to refMap entry
    "~l": 15         // Line number in source file
  }
}

// refMap.json - maps ref IDs to source files
{
  "ref1": { "path": "pages/home.yaml" }
}
```

Used by `resolveConfigLocation()` to produce human-readable errors:
```
[Config Error] Block type "Buton" not found.
  pages/home.yaml:15 at pages.0.blocks.0.type
  /Users/dev/myapp/pages/home.yaml:15   ← clickable VSCode link
```

See [architecture/error-tracing.md](../architecture/error-tracing.md) for details.

## Design Decisions

### Why JSON Output?

Build output is JSON (not YAML) because:
- Faster to parse at runtime
- No YAML parser needed in production bundle
- Consistent serialization format

### Why Separate Files?

Each page/request/connection is a separate file:
- Load only what's needed per request
- Better caching granularity
- Smaller memory footprint

### Why Build-Time Operator Evaluation?

Some operators run at build time:
- `_ref` - must compose config before runtime
- `_var` - build-time variables
- `_build` - environment-specific config

This keeps runtime fast and allows static analysis.

### Plugin Type Resolution

Block and operator types are resolved at build time:
- Validates types exist in configured plugins
- Generates import map for code splitting
- Catches typos early (build fails, not runtime)

## Integration Points

- **lowdefy CLI**: Calls this package for `lowdefy build`
- **@lowdefy/api**: Consumes build output files
- **@lowdefy/client**: Loads page configs from build output
- **Plugin packages**: Provide type definitions for validation

## Configuration Files Supported

| Extension | Format |
|-----------|--------|
| `.yaml`, `.yml` | YAML (recommended) |
| `.json` | JSON |
| `.json5` | JSON5 (comments allowed) |
| `.njk` | Nunjucks template |

## Build Utilities

Located in `packages/build/src/utils/`:

| Utility | Purpose |
|---------|---------|
| `traverseConfig.js` | Depth-first config traversal for validation |
| `findSimilarString.js` | "Did you mean?" suggestions using Levenshtein distance |
| `createCheckDuplicateId.js` | Factory for duplicate ID detection |
| `createCounter.js` | Factory for counting type usage |

**Error handling pattern:**
```javascript
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

// Fatal error — collected via collectExceptions, build continues
collectExceptions(context, new ConfigError({
  message: `Block type "${type}" not found.`,
  configKey: block['~k'],
  checkSlug: 'types',
}));

// Warning — suppression, dedup, location resolution via handleWarning
context.handleWarning(new ConfigWarning({
  message: `Deprecated feature used.`,
  configKey: obj['~k'],
  checkSlug: 'state-refs',
  prodError: true,
}));
```

**context.handleError** and **context.handleWarning** are explicit functions wired in `createContext.js` — not logger methods. `context.logger` is plain pino with zero monkey-patching.

Errors and warnings can be suppressed using `~ignoreBuildChecks` in config. See [architecture/error-tracing.md](../architecture/error-tracing.md) for details.

## Entry Points

### Production Build

```javascript
import build from '@lowdefy/build';
import { createPluginTypesMap } from '@lowdefy/build';

// Run full build (resolves all refs, all pages)
await build({
  configDirectory: './app',
  outputDirectory: './.lowdefy/build',
  // ... other options
});

// Create types map for validation
const typesMap = createPluginTypesMap(plugins);
```

### Dev Build (JIT)

```javascript
import { shallowBuild, buildPageJit, createContext } from '@lowdefy/build/dev';

// Phase 1: Skeleton build (resolves everything except page content)
const { components, pageRegistry, fileDependencyMap, context } = await shallowBuild({
  customTypesMap,
  directories,
  logger,
  refResolver,
  stage: 'dev',
});

// Phase 2: Build a single page on demand
const buildContext = createContext({ directories, logger, stage: 'dev' });
Object.assign(buildContext.refMap, refMap);    // Restore from skeleton
Object.assign(buildContext.keyMap, keyMap);
buildContext.jsMap = jsMap;

await buildPageJit({
  pageId: 'tasks',
  pageRegistry,          // From shallowBuild or deserialized from pageRegistry.json
  context: buildContext,
});
```

## Dev Build Modules

| Module | File | Purpose |
|--------|------|---------|
| `shallowBuild` | `build/shallowBuild.js` | Skeleton build with `_shallow` markers at page content |
| `buildPageJit` | `build/buildPageJit.js` | Resolve `_shallow` markers, run page build steps, write artifacts |
| `createPageRegistry` | `build/createPageRegistry.js` | Extract page metadata + raw content from shallow-built components |
| `createFileDependencyMap` | `build/createFileDependencyMap.js` | Map config files → page IDs for targeted invalidation |
| `writePageRegistry` | `build/writePageRegistry.js` | Serialize page registry to JSON |
| `writePageJit` | `build/writePageJit.js` | Write page/request JSONs + updated maps + JS files |
| `pathMatcher` | `utils/pathMatcher.js` | Match dot-notation paths against `SHALLOW_STOP_PATHS` |
| `getRefPositions` | `buildRefs/getRefPositions.js` | Find ref positions in content tree |

### Shallow Build Stop Paths

The `_ref` resolution stops at these paths, leaving `_shallow` markers:

```javascript
const SHALLOW_STOP_PATHS = [
  'pages.*.blocks',
  'pages.*.areas',
  'pages.*.events',
  'pages.*.requests',
  'pages.*.layout',
];
```

### Page Registry Structure

```javascript
// createPageRegistry extracts from shallow-built components:
registry.set(pageId, {
  pageId: page.id,
  auth: page.auth,
  type: page.type,
  refId: page['~r'] ?? null,    // For file dependency tracking
  rawContent: serializer.copy({  // Deep copy of unresolved content
    blocks: page.blocks,         // Contains _shallow markers
    areas: page.areas,
    events: page.events,
    requests: page.requests,
    layout: page.layout,
  }),
});
```

### File Dependency Map

Maps config file paths to the page IDs that depend on them:

```javascript
// createFileDependencyMap builds:
// Map<filePath, Set<pageId>>
//
// Sources of dependencies:
// 1. Page's own source file: pageEntry.refId → refMap[refId].path
// 2. Child _ref paths: collected from _shallow markers in rawContent
```
