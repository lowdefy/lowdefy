# Plugin System Architecture

How Lowdefy's plugin architecture works.

## Overview

The plugin system enables:
- **Extensibility**: Add custom blocks, connections, operators, actions
- **Tree-shaking**: Only include used types in final build
- **Type Safety**: Schema validation for all plugin properties
- **Namespacing**: Type prefixes prevent naming conflicts

## Plugin Types

| Type | Purpose | Registry Location |
|------|---------|-------------------|
| Blocks | UI components | `lowdefy._internal.blockComponents` |
| Connections | Data sources | `lowdefy._internal.connections` |
| Operators | Expression evaluators | `lowdefy._internal.operators` |
| Actions | Event handlers | `lowdefy._internal.actions` |
| Auth | Authentication providers | `context.authOptions` |

## Plugin Declaration

### In lowdefy.yaml

**Schema:** `packages/build/src/lowdefySchema.js`

```yaml
plugins:
  - name: '@lowdefy/blocks-antd'
    version: '4.0.0'
  - name: '@my-org/custom-blocks'
    version: '1.0.0'
    typePrefix: 'custom'    # Optional namespace
```

### Plugin Object Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Package name |
| `version` | string | Yes | Version constraint |
| `typePrefix` | string | No | Namespace prefix |

## Plugin Resolution During Build

### Build Pipeline

```
build()
    ↓
buildRefs()           # Load config with plugin declarations
    ↓
buildTypes()          # Count which types are used
    ↓
buildImports()        # Generate import statements
    ↓
writePluginImports()  # Write import files
```

### Type Map Building

**File:** `packages/build/src/utils/createPluginTypesMap.js`

Creates mapping from type names to package info:

```javascript
{
  'Button': {
    package: '@lowdefy/blocks-antd',
    originalTypeName: 'Button',
    version: '4.0.0'
  },
  'customTable': {
    package: '@my-org/custom-blocks',
    originalTypeName: 'Table',
    version: '1.0.0'
  }
}
```

### Default Types Map

**File:** `packages/build/src/defaultTypesMap.js`

Pre-built map of all built-in Lowdefy plugins:

```javascript
{
  // Actions
  '@lowdefy/actions-core': { ... },
  '@lowdefy/actions-pdf-make': { ... },

  // Blocks
  '@lowdefy/blocks-basic': { ... },
  '@lowdefy/blocks-antd': { ... },
  '@lowdefy/blocks-echarts': { ... },

  // Connections
  '@lowdefy/connection-mongodb': { ... },
  '@lowdefy/connection-axios-http': { ... },

  // Operators
  '@lowdefy/operators-js': { ... },
  '@lowdefy/operators-nunjucks': { ... },

  // Auth
  '@lowdefy/plugin-next-auth': { ... },
  '@lowdefy/plugin-auth0': { ... }
}
```

### Type Counting

**File:** `packages/build/src/build/buildTypes.js`

Tracks which types are actually used:

```javascript
context.typeCounters = {
  actions: { 'SetState': 5, 'Request': 12 },
  blocks: { 'Button': 8, 'TextInput': 15 },
  connections: { 'MongoDBCollection': 2 },
  requests: { 'MongoDBFind': 5, 'MongoDBInsertOne': 3 },
  operators: {
    client: { '_state': 45, '_if': 12 },
    server: { '_secret': 3, '_payload': 8 }
  },
  auth: {
    providers: { 'GoogleProvider': 1 },
    adapters: {},
    callbacks: {},
    events: {}
  }
}
```

## Plugin Package Structure

### Block Plugin

```
@lowdefy/blocks-basic/
├── package.json
├── src/
│   ├── blocks.js          # Named exports for all blocks
│   ├── types.js           # Type declarations
│   └── blocks/
│       ├── Anchor/
│       │   └── Anchor.js
│       ├── Box/
│       │   └── Box.js
│       └── Icon/
│           └── Icon.js
└── dist/
```

**blocks.js:**
```javascript
export { default as Anchor } from './blocks/Anchor/Anchor.js';
export { default as Box } from './blocks/Box/Box.js';
export { default as Icon } from './blocks/Icon/Icon.js';
```

**types.js:**
```javascript
export default {
  blocks: ['Anchor', 'Box', 'Icon', ...]
};
```

### Connection Plugin

```
@lowdefy/connection-mongodb/
├── src/
│   ├── connections.js     # Named exports
│   ├── types.js           # Type declarations
│   └── connections/
│       └── MongoDBCollection/
│           ├── MongoDBCollection.js
│           ├── MongoDBFind/
│           │   └── MongoDBFind.js
│           └── MongoDBInsertOne/
│               └── MongoDBInsertOne.js
```

**connections.js:**
```javascript
export { default as MongoDBCollection } from './connections/MongoDBCollection/MongoDBCollection.js';
```

**Connection Structure:**
```javascript
export default {
  schema: { /* JSON Schema for connection properties */ },
  requests: {
    MongoDBFind,
    MongoDBFindOne,
    MongoDBInsertOne,
    MongoDBUpdateOne,
    // ...
  }
}
```

### Operator Plugin

```
@lowdefy/operators-js/
├── src/
│   ├── types.js
│   └── operators/
│       ├── build/         # Build-time operators
│       ├── client/        # Browser operators
│       ├── server/        # Backend operators
│       └── shared/        # Both client & server
```

**types.js:**
```javascript
export default {
  operators: {
    client: Object.keys(client),
    server: Object.keys(server),
  },
};
```

### Action Plugin

```
@lowdefy/actions-core/
├── src/
│   ├── actions.js
│   ├── types.js
│   └── actions/
│       ├── CallAPI.js
│       ├── Request.js
│       └── SetState.js
```

**actions.js:**
```javascript
export { default as CallAPI } from './actions/CallAPI.js';
export { default as Request } from './actions/Request.js';
export { default as SetState } from './actions/SetState.js';
```

## Import Generation

### Generated Files

**File:** `packages/build/src/build/writePluginImports/`

| Output File | Generator | Purpose |
|-------------|-----------|---------|
| `plugins/blocks.js` | `writeBlockImports.js` | Block components |
| `plugins/connections.js` | `writeConnectionImports.js` | Connection handlers |
| `plugins/actions.js` | `writeActionImports.js` | Action handlers |
| `plugins/operators/client.js` | `writeOperatorImports.js` | Client operators |
| `plugins/operators/server.js` | `writeOperatorImports.js` | Server operators |
| `plugins/auth/*.js` | `writeAuthImports.js` | Auth components |
| `plugins/styles.less` | `writeStyleImports.js` | Block styles |
| `plugins/icons.js` | `writeIconImports.js` | Icon components |

### Import Template

**File:** `packages/build/src/build/writePluginImports/generateImportFile.js`

```javascript
const template = `
{%- for import in imports -%}
import { {{ import.originalTypeName }} as {{ import.typeName }} } from '{{ import.package }}/{{ importPath }}';
{% endfor -%}

export default {
  {% for import in imports -%}
  {{ import.typeName }},
  {% endfor -%}
};
`;
```

### Dev vs Prod Imports

**Dev:** (`buildImportsDev.js`)
- Includes all types from installed packages (not just types counted in config)
- Dev server pre-installs a broad set of default packages so bundle size is not a concern
- Page content is built JIT (just-in-time) during development, so page-level types (actions, blocks, operators) aren't counted during the skeleton build
- The skeleton build reads the server's `package.json` to determine which packages are installed, then includes all types from those packages
- If a new plugin type is detected that isn't installed, a full rebuild is triggered to install the new plugin package

**Prod:** (`buildImportsProd.js`)
- Builds all pages to count exact type usage across the entire app
- Only includes types that are actually used — effective tree-shaking
- Produces minimal bundles with only the required plugin code

## Runtime Plugin Loading

### Client Initialization

**File:** `packages/client/src/initLowdefyContext.js`

```javascript
function initLowdefyContext({ auth, Components, config, lowdefy, router, stage, types, window }) {
  lowdefy._internal = {
    actions: types.actions,
    blockComponents: types.blocks,
    operators: types.operators,
    // ...
  };
}
```

### Block Resolution

**File:** `packages/client/src/block/CategorySwitch.js`

```javascript
const Component = lowdefy._internal.blockComponents[block.type];

if (!Component) {
  throw new Error(`Block type "${block.type}" not found`);
}

return <Component {...props} />;
```

### Connection Resolution

**File:** `packages/api/src/routes/request/getConnection.js`

```javascript
function getConnection({ connections }, { connectionConfig }) {
  const connection = connections[connectionConfig.type];

  if (!connection) {
    throw new ConfigurationError(
      `Connection type "${connectionConfig.type}" not found.`
    );
  }

  return connection;
}
```

### Operator Resolution

During parsing, operators are resolved from the registry:

```javascript
// In parser
const operator = this.operators[operatorName];
if (operator) {
  return operator({ params, location, context, ... });
}
```

## Type Prefix Namespacing

### Purpose

Prevents naming conflicts when using custom plugins:

```yaml
plugins:
  - name: '@my-org/blocks'
    typePrefix: 'my'
```

### Effect

| Original Type | With Prefix | Usage in Config |
|---------------|-------------|-----------------|
| `Button` | `myButton` | `type: myButton` |
| `Table` | `myTable` | `type: myTable` |

## Plugin Registration Flow

```
1. lowdefy.yaml declares plugins
         ↓
2. Build loads plugin packages
         ↓
3. createPluginTypesMap() creates type → package mapping
         ↓
4. buildTypes() counts used types
         ↓
5. buildImports() generates import statements
         ↓
6. writePluginImports() writes import files
         ↓
7. Next.js bundles imports
         ↓
8. Runtime: types passed to initLowdefyContext()
         ↓
9. Runtime: types available in lowdefy._internal
```

## Schema Validation

Each plugin type includes JSON Schema for validation:

### Connection Schema

```javascript
export default {
  schema: {
    type: 'object',
    properties: {
      databaseUri: { type: 'string' },
      collection: { type: 'string' },
      read: { type: 'boolean', default: true },
      write: { type: 'boolean', default: false }
    },
    required: ['databaseUri', 'collection']
  },
  requests: { ... }
}
```

### Request Schema

```javascript
MongoDBFind.schema = {
  type: 'object',
  properties: {
    query: { type: 'object' },
    options: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        skip: { type: 'number' },
        sort: { type: 'object' }
      }
    }
  }
};
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/build/src/lowdefySchema.js` | Plugin schema validation |
| `packages/build/src/utils/createPluginTypesMap.js` | Type mapping |
| `packages/build/src/defaultTypesMap.js` | Built-in plugins |
| `packages/build/src/build/buildTypes.js` | Type counting |
| `packages/build/src/build/buildImports/` | Import routing |
| `packages/build/src/build/writePluginImports/` | Import generation |
| `packages/client/src/initLowdefyContext.js` | Runtime initialization |
| `packages/client/src/block/CategorySwitch.js` | Block resolution |

## Creating Custom Plugins

### Block Plugin

```javascript
// my-plugin/src/blocks.js
export { default as MyButton } from './blocks/MyButton.js';

// my-plugin/src/types.js
export default {
  blocks: ['MyButton']
};

// my-plugin/src/blocks/MyButton.js
const MyButton = ({ blockId, properties, methods }) => {
  return (
    <button onClick={() => methods.triggerEvent({ name: 'onClick' })}>
      {properties.label}
    </button>
  );
};
export default MyButton;
```

### Connection Plugin

```javascript
// my-plugin/src/connections.js
export { default as MyAPI } from './connections/MyAPI.js';

// my-plugin/src/connections/MyAPI.js
export default {
  schema: {
    type: 'object',
    properties: {
      apiKey: { type: 'string' }
    }
  },
  requests: {
    MyAPIGet: async ({ connection, request }) => {
      const response = await fetch(request.url, {
        headers: { 'X-API-Key': connection.apiKey }
      });
      return response.json();
    }
  }
};
```

### Operator Plugin

```javascript
// my-plugin/src/operators/client/myOperator.js
function _myOperator({ params, location }) {
  return params.toUpperCase();
}
export default _myOperator;
```

## Architectural Patterns

1. **Package-Based**: Each plugin is an npm package
2. **Named Exports**: Plugins export types by name
3. **Type Declarations**: `types.js` declares available types
4. **Schema Validation**: JSON Schema for all properties
5. **Tree-Shaking**: Only used types bundled
6. **Namespace Support**: Type prefixes prevent conflicts
7. **Registry Pattern**: Types registered at startup
8. **Lazy Resolution**: Types resolved at usage time
