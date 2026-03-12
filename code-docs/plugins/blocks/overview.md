# Blocks Plugin Overview

Blocks are the visual building blocks of Lowdefy applications. Each block is a React component that renders UI elements.

## What Are Blocks?

Blocks are:

- React components wrapped for Lowdefy
- Configurable via YAML properties
- Connected to page state
- Event-driven (onClick, onChange, etc.)

## Block Categories

| Category       | Purpose             | Examples                         |
| -------------- | ------------------- | -------------------------------- |
| **Container**  | Layout and grouping | Box, Card, Collapse, Tabs        |
| **Input**      | User data entry     | TextInput, NumberInput, Selector |
| **Display**    | Show data           | Title, Paragraph, Table, List    |
| **Feedback**   | User feedback       | Alert, Message, Progress         |
| **Navigation** | App navigation      | Menu, Breadcrumb, Anchor         |

## Available Block Packages

| Package                                         | Description                 | Block Count |
| ----------------------------------------------- | --------------------------- | ----------- |
| [@lowdefy/blocks-antd](./antd.md)               | Primary UI kit (Ant Design) | 62          |
| [@lowdefy/blocks-basic](./basic.md)             | HTML primitives             | 8           |
| [@lowdefy/blocks-aggrid](./aggrid.md)           | AG Grid data tables         | 1           |
| [@lowdefy/blocks-echarts](./echarts.md)         | ECharts visualizations      | 1           |
| [@lowdefy/blocks-markdown](./markdown.md)       | Markdown rendering          | 2           |
| [@lowdefy/blocks-google-maps](./google-maps.md) | Google Maps                 | 1           |
| [@lowdefy/blocks-algolia](./algolia.md)         | Algolia search              | 1           |
| [@lowdefy/blocks-loaders](./loaders.md)         | Loading spinners            | 1           |
| [@lowdefy/blocks-qr](./qr.md)                   | QR code generation          | 1           |

## Block Package Structure

Each block package has:

- `src/blocks/{BlockName}/{BlockName}.js` — React component
- `src/blocks/{BlockName}/meta.js` — Block metadata (category, icons, valueType, cssKeys, events, properties schema)
- `src/blocks.js` — Named exports of all block components
- `src/metas.js` — Named exports of all block `meta.js` files
- `src/types.js` — Type declarations derived from metas via `extractBlockTypes`

### Block Metadata (`meta.js`)

Each block has a `meta.js` file that is the single source of truth for all metadata:

```javascript
// src/blocks/Anchor/meta.js
export default {
  category: 'display',
  icons: ['AiOutlineLoading3Quarters'],
  valueType: null,
  cssKeys: {
    element: 'The anchor element.',
  },
  events: {
    onClick: 'Called when Anchor is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', description: 'Text to display in the anchor.' },
      disabled: { type: 'boolean', default: false, description: 'Disable the anchor if true.' },
      // ...
    },
  },
};
```

| Field        | Type         | Description                                                             |
| ------------ | ------------ | ----------------------------------------------------------------------- |
| `category`   | string       | Block category (`container`, `input`, `display`, `list`, `context`)     |
| `icons`      | string[]     | React-Icon names used by the block                                      |
| `valueType`  | string\|null | Value type for input blocks (e.g., `'string'`, `'number'`)              |
| `cssKeys`    | object       | Map of CSS key names to descriptions (e.g., `{ element: '...' }`)       |
| `events`     | object       | Map of event names to descriptions (e.g., `{ onClick: '...' }`)         |
| `properties` | object       | JSON Schema for the block's properties                                  |
| `slots`      | string[]     | Named slot names for containers (e.g., `['content', 'title', 'extra']`) |

### Metas Barrel (`metas.js`)

Named exports of all block metadata for the package:

```javascript
// src/metas.js
export { default as Anchor } from './blocks/Anchor/meta.js';
export { default as Box } from './blocks/Box/meta.js';
export { default as Icon } from './blocks/Icon/meta.js';
// ...
```

### Types (`types.js`)

Each block package has a `types.js` that derives type information from the metas barrel using `extractBlockTypes` from `@lowdefy/block-utils`:

```javascript
// src/types.js
import { extractBlockTypes } from '@lowdefy/block-utils';
import * as metas from './metas.js';

export default extractBlockTypes(metas);
```

This produces a types object with `{ blocks, icons, blockMetas }` — see [@lowdefy/block-utils](../../utils/block-utils.md#extractblocktypesmetas) for details. The build pipeline reads `types.js` to resolve plugin types without loading full block component trees (which would pull in CSS, browser APIs, and heavy libraries).

### Package Exports

Block packages expose three entry points:

```json
{
  "exports": {
    "./blocks": "./dist/blocks.js",
    "./metas": "./dist/metas.js",
    "./types": "./dist/types.js"
  }
}
```

## Block Configuration

Blocks are configured in YAML:

```yaml
blocks:
  - id: submitButton
    type: Button
    properties:
      title: Submit
      type: primary
      icon: AiOutlineSend
    events:
      onClick:
        - id: submitForm
          type: Request
          params:
            requestId: saveData
```

## Block Properties

Each block has:

- **id** - Unique identifier
- **type** - Block type name
- **properties** - Configuration (title, style, etc.)
- **events** - Event handlers (onClick, onChange)
- **slots** - Child block containers (use `blocks:` shorthand for the default `content` slot)
- **layout** - Grid positioning
- **visible** - Conditional visibility
- **loading** - Loading skeleton

## Block Lifecycle

```
1. Build time
   └── Block config validated against schema

2. Page load
   └── Block component loaded (code split)
   └── Block registered in Slots

3. Render
   └── Properties evaluated (operators resolved)
   └── Component rendered
   └── Events attached

4. Interaction
   └── User triggers event
   └── Actions executed
   └── State updates
   └── Re-render with new properties
```

## Runtime Schema Validation

Each block's `meta.js` file includes a `properties` JSON Schema. At build time, `writeBlockSchemaMap` imports the `metas` barrel from each package, calls `buildBlockSchema(meta)` to generate a full block schema (including `class`, `style`, `events`, and container `blocks`/`areas`), and writes `plugins/blockSchemas.json`. It also writes `plugins/blockMetas.json` with runtime metadata (category, valueType, initValue).

When a `BlockError` occurs at runtime, the server validates the `received` properties against the block's schema and produces a diagnostic `ConfigError` with a human-readable message:

```
[ConfigError] Block "Button" property "title" must be type "string".
```

This is **reactive** validation — it only runs when an error is caught, not on every render. See [plugin-system.md](../../architecture/plugin-system.md#blockactionoperator-schemas-runtime-reactive) for schema format details.

## Design Decisions

### Why Ant Design as Default?

- Comprehensive component library (60+ components)
- Professional enterprise-ready design
- Active maintenance and community
- Consistent design language
- Good accessibility support

### Why Separate Block Packages?

- Code splitting: only load what's used
- Optional dependencies: AG Grid, ECharts are large
- Plugin flexibility: easy to add new libraries
- Version independence: update separately

### Block Meta Categories

Blocks declare their category for:

- Build validation (inputs need value handling)
- Documentation organization
- IDE tooling support

Categories: `container`, `input`, `display`, `list`, `context`

### Why `meta.js` Instead of Separate Files?

Previously, block metadata was split between a `.meta` static property on the component and a separate `schema.js` file. The `meta.js` file consolidates everything into a single source of truth that:

- Can be imported without loading React or heavy component dependencies
- Enables the metas barrel (`metas.js`) for lightweight type extraction
- Contains both validation schemas and runtime metadata in one place
