# Plugin System Architecture

How Lowdefy's plugin architecture works.

## Overview

The plugin system enables:

- **Extensibility**: Add custom blocks, connections, operators, actions
- **Tree-shaking**: Only include used types in final build
- **Type Safety**: Schema validation for all plugin properties
- **Namespacing**: Type prefixes prevent naming conflicts

## Plugin Types

| Type        | Purpose                  | Registry Location                   |
| ----------- | ------------------------ | ----------------------------------- |
| Blocks      | UI components            | `lowdefy._internal.blockComponents` |
| Connections | Data sources             | `lowdefy._internal.connections`     |
| Operators   | Expression evaluators    | `lowdefy._internal.operators`       |
| Actions     | Event handlers           | `lowdefy._internal.actions`         |
| Auth        | Authentication providers | `context.authOptions`               |

## Plugin Declaration

### In lowdefy.yaml

**Schema:** `packages/build/src/lowdefySchema.js`

```yaml
plugins:
  - name: '@lowdefy/blocks-antd'
    version: '4.0.0'
  - name: '@my-org/custom-blocks'
    version: '1.0.0'
    typePrefix: 'custom' # Optional namespace
```

### Plugin Object Schema

| Property     | Type   | Required | Description        |
| ------------ | ------ | -------- | ------------------ |
| `name`       | string | Yes      | Package name       |
| `version`    | string | Yes      | Version constraint |
| `typePrefix` | string | No       | Namespace prefix   |

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
  actions: { SetState: 5, Request: 12 },
  blocks: { Button: 8, TextInput: 15 },
  connections: { MongoDBCollection: 2 },
  requests: { MongoDBFind: 5, MongoDBInsertOne: 3 },
  operators: {
    client: { _state: 45, _if: 12 },
    server: { _secret: 3, _payload: 8 },
  },
  auth: {
    providers: { GoogleProvider: 1 },
    adapters: {},
    callbacks: {},
    events: {},
  },
};
```

## Plugin Package Structure

### Block Plugin

```
@lowdefy/blocks-basic/
├── package.json
├── src/
│   ├── blocks.js          # Named exports for all blocks
│   ├── schemas.js         # Named exports for all block schemas
│   ├── types.js           # Type declarations
│   └── blocks/
│       ├── Anchor/
│       │   ├── Anchor.js
│       │   └── schema.js  # JSON schema for Anchor properties
│       ├── Box/
│       │   ├── Box.js
│       │   └── schema.js
│       └── Icon/
│           ├── Icon.js
│           └── schema.js
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
  schema: {
    /* JSON Schema for connection properties */
  },
  requests: {
    MongoDBFind,
    MongoDBFindOne,
    MongoDBInsertOne,
    MongoDBUpdateOne,
    // ...
  },
};
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
│   ├── schemas.js         # Named exports for all action schemas
│   ├── types.js
│   └── actions/
│       ├── CallAPI/
│       │   ├── CallAPI.js
│       │   └── schema.js  # JSON schema for CallAPI params
│       ├── Request/
│       │   ├── Request.js
│       │   └── schema.js
│       └── SetState/
│           ├── SetState.js
│           └── schema.js
```

**actions.js:**

```javascript
export { default as CallAPI } from './actions/CallAPI/CallAPI.js';
export { default as Request } from './actions/Request/Request.js';
export { default as SetState } from './actions/SetState/SetState.js';
```

## Import Generation

### Generated Files

**File:** `packages/build/src/build/writePluginImports/`

| Output File                    | Generator                   | Purpose                |
| ------------------------------ | --------------------------- | ---------------------- |
| `plugins/blocks.js`            | `writeBlockImports.js`      | Block components       |
| `plugins/connections.js`       | `writeConnectionImports.js` | Connection handlers    |
| `plugins/actions.js`           | `writeActionImports.js`     | Action handlers        |
| `plugins/operators/client.js`  | `writeOperatorImports.js`   | Client operators       |
| `plugins/operators/server.js`  | `writeOperatorImports.js`   | Server operators       |
| `plugins/auth/*.js`            | `writeAuthImports.js`       | Auth components        |
| `plugins/styles.less`          | `writeStyleImports.js`      | Block styles           |
| `plugins/icons.js`             | `writeIconImports.js`       | Icon components        |
| `plugins/blockSchemas.json`    | `writeBlockSchemaMap.js`    | Block property schemas |
| `plugins/actionSchemas.json`   | `writeActionSchemaMap.js`   | Action param schemas   |
| `plugins/operatorSchemas.json` | `writeOperatorSchemaMap.js` | Operator param schemas |

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
    throw new ConfigurationError(`Connection type "${connectionConfig.type}" not found.`);
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

| Original Type | With Prefix | Usage in Config  |
| ------------- | ----------- | ---------------- |
| `Button`      | `myButton`  | `type: myButton` |
| `Table`       | `myTable`   | `type: myTable`  |

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

### Connection/Request Schemas (Server-Side, Proactive)

Connections and requests include inline JSON schemas validated at request time via `validateSchemas` in `@lowdefy/api`:

```javascript
// Connection schema — inline on the connection export
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

// Request schema — attached to the resolver function
MongoDBFind.schema = {
  type: 'object',
  properties: {
    query: { type: 'object' },
    options: { type: 'object' },
  },
};
```

### Block/Action/Operator Schemas (Runtime, Reactive)

Blocks, actions, and operators export schemas via a separate `schema.js` file. These are collected at build time and used for **reactive** validation — when an error occurs, the `received` data is validated against the schema to produce a more helpful diagnostic message.

**Schema definition pattern:**

```javascript
// Block schema (e.g., blocks/Button/schema.js)
export default {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      type: { type: 'string', enum: ['default', 'primary', 'dashed', 'link'] },
    },
  },
};

// Action schema (e.g., actions/SetState/schema.js)
export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Key-value pairs to set in state.',
  },
};

// Operator schema (e.g., operators/shared/get.schema.js)
export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['from'],
    properties: {
      from: { description: 'Object or array to get value from.' },
      key: { type: 'string' },
      default: { description: 'Default value if key does not exist.' },
    },
    additionalProperties: false,
  },
};
```

**Build-time collection:** `writePluginImports` generates schema map JSON files:

| Plugin Type | Build Artifact                 | Schema Key   |
| ----------- | ------------------------------ | ------------ |
| Blocks      | `plugins/blockSchemas.json`    | `properties` |
| Actions     | `plugins/actionSchemas.json`   | `params`     |
| Operators   | `plugins/operatorSchemas.json` | `params`     |

**Runtime validation flow:** When a `BlockError`, `ActionError`, or `OperatorError` reaches the server via `/api/client-error`, `logClientError` reads the schema map, validates the `received` data, and produces a `ConfigError` with a human-readable message if validation fails. See [api.md](../packages/api.md#client-error-logging--plugin-schema-validation).

**Package export convention:** Schemas are exported via a `/schemas` entry point:

```json
{
  "exports": {
    "./schemas": "./dist/schemas.js"
  }
}
```

**Custom plugin schemas:** Custom plugins can provide schemas via `typesMap.schemas` in the build context, which takes priority over package-exported schemas.

## Key Files

| File                                               | Purpose                  |
| -------------------------------------------------- | ------------------------ |
| `packages/build/src/lowdefySchema.js`              | Plugin schema validation |
| `packages/build/src/utils/createPluginTypesMap.js` | Type mapping             |
| `packages/build/src/defaultTypesMap.js`            | Built-in plugins         |
| `packages/build/src/build/buildTypes.js`           | Type counting            |
| `packages/build/src/build/buildImports/`           | Import routing           |
| `packages/build/src/build/writePluginImports/`     | Import generation        |
| `packages/client/src/initLowdefyContext.js`        | Runtime initialization   |
| `packages/client/src/block/CategorySwitch.js`      | Block resolution         |

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
      apiKey: { type: 'string' },
    },
  },
  requests: {
    MyAPIGet: async ({ connection, request }) => {
      const response = await fetch(request.url, {
        headers: { 'X-API-Key': connection.apiKey },
      });
      return response.json();
    },
  },
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
