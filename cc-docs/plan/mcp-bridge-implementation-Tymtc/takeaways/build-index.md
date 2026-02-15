# Build Pipeline (index.js) — Key Takeaways for MCP Bridge

**File:** `packages/build/src/index.js`

## What It Does

Orchestrates the entire Lowdefy build. Takes YAML configs, transforms them, and writes JSON build artifacts.

## The Build Order

```javascript
// Phase 1: Read and transform
buildRefs         // Resolve _ref operators, merge YAML files
testSchema        // Validate against lowdefySchema.js
buildApp          // Process app-level config
validateConfig    // Additional validation
addDefaultPages   // Add auth pages if missing
buildAuth         // Process auth config → page/endpoint auth metadata
buildConnections  // Process connection definitions
buildApi          // Process API endpoint definitions
buildPages        // Process pages → blocks → events → requests
buildMenu         // Build navigation menus
buildJs           // Compile custom _js operators
addKeys           // Add ~k tracking keys
buildTypes        // Collect all plugin types used
buildImports      // Generate plugin import statements

// Phase 2: Write artifacts
cleanBuildDirectory
writeApp, writeAuth, writeConnections, writeApi
writeRequests, writePages, writeConfig, writeGlobal
writeMaps, writeMenus, writeTypes, writePluginImports
writeJs, updateServerPackageJson, copyPublicFolder
```

## Where MCP Build Step Goes

The MCP tool generation step (`buildMcp`) should be added AFTER `buildPages` and `buildAuth` (it needs page structure and auth metadata) but BEFORE the write phase:

```javascript
buildPages({ components, context });
buildMenu({ components, context });
buildMcp({ components, context });     // ← NEW: generate MCP tool definitions
buildJs({ components, context });
// ...
await writeMcpConfig({ components, context });  // ← NEW: write mcp/tools.json etc.
```

## Key Pattern

Every build function follows the same signature:
```javascript
function buildX({ components, context }) {
  // Mutate components
  return components;
}
```

And every write function:
```javascript
async function writeX({ components, context }) {
  await context.writeBuildArtifact('path/to/file.json', data);
}
```

The MCP build step should follow these patterns exactly.

## Build Artifacts Output

Written to `.lowdefy/build/`:
```
.lowdefy/build/
├── app.json
├── auth.json
├── config.json
├── global.json
├── maps.json           # Block type → meta mappings
├── menus.json
├── types.json
├── connections/
│   └── {connectionId}.json
├── pages/
│   ├── {pageId}.json
│   └── {pageId}/
│       └── requests/
│           └── {requestId}.json
├── plugins/            # Generated import files
│   ├── connections.js
│   ├── operators/
│   └── ...
└── mcp/                # ← NEW
    ├── tools.json
    └── resources.json
```

## Important

Build code lives in `packages/build/`. The plan incorrectly puts MCP build-time code in `packages/servers/server-mcp/src/build/`. It should be in `packages/build/src/build/buildMcp/` following the existing pattern (`buildAuth/`, `buildApi/`, `buildPages/`).
