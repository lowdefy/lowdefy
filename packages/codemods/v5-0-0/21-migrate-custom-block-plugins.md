# Migration: Custom Block Plugin Architecture (`types.js`, `meta.js`, `withBlockDefaults`)

## Context

In Lowdefy v5, the dev server loads each plugin's `types.js` via Node.js `require()` at startup (in `createCustomPluginTypesMap.mjs`). If your plugin's `types.js` imports from `blocks.js` — which imports React components that import CSS files — Node.js crashes:

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".css"
```

The fix is architectural: block metadata must be separated from block components into dedicated `meta.js` files, so `types.js` never touches React or CSS.

Additionally, `blockDefaultProps` (direct assignment) is replaced by the `withBlockDefaults()` HOC wrapper.

This migration targets local plugin source code (JS/JSX), not YAML configs.

## Scope

`plugins` — scan JS files in local block plugin directories.

## What to Do

For each custom block plugin package:

### 1. Create a `meta.js` file for each block

For each block that has `BlockName.meta = { ... }` on the component, extract the meta object into a new file at `blocks/BlockName/meta.js`.

The meta.js file must be a pure data export — no React, no CSS, no library imports:

```javascript
export default {
  category: 'display',
  icons: [],
};
```

If the block has `valueType`, include it:

```javascript
export default {
  category: 'input',
  valueType: 'array',
  icons: [],
};
```

### 2. Remove `.meta` assignment from block components

Delete the static `.meta` assignment from each block component file:

```javascript
// DELETE these lines:
BlockName.meta = {
  category: 'display',
  icons: [],
};
```

### 3. Create a `metas.js` barrel file

In the plugin's `src/` directory, create `metas.js` that re-exports all meta files. Mirror the structure of `blocks.js` but point to `meta.js` instead of component files:

```javascript
export { default as MyBlock } from './blocks/MyBlock/meta.js';
export { default as MyOtherBlock } from './blocks/MyOtherBlock/meta.js';
```

### 4. Rewrite `types.js` to use `extractBlockTypes`

Replace the old pattern that imports from `blocks.js`:

```javascript
// OLD — crashes in v5 (blocks.js imports React components with CSS)
import * as blocks from './blocks.js';
const icons = {};
Object.keys(blocks).forEach((block) => {
  icons[block] = blocks[block].meta.icons || [];
});
export default { blocks: Object.keys(blocks), icons };
```

With the new pattern:

```javascript
import { extractBlockTypes } from '@lowdefy/block-utils';
import * as metas from './metas.js';

export default extractBlockTypes(metas);
```

For **mixed plugins** that export blocks alongside actions, connections, or operators — keep the non-block exports but replace the block logic. See the mixed plugin example below.

### 5. Replace `blockDefaultProps` with `withBlockDefaults`

In each block component file:

- Change the import:

  ```javascript
  // OLD
  import { blockDefaultProps } from '@lowdefy/block-utils';
  // NEW
  import { withBlockDefaults } from '@lowdefy/block-utils';
  ```

- Remove the defaultProps assignment:

  ```javascript
  // DELETE this line:
  BlockName.defaultProps = blockDefaultProps;
  ```

- Wrap the export:
  ```javascript
  // OLD
  export default BlockName;
  // NEW
  export default withBlockDefaults(BlockName);
  ```

### 6. Update `package.json` exports

Add the `./metas` export:

```json
{
  "exports": {
    "./*": "./dist/*",
    "./blocks": "./dist/blocks.js",
    "./metas": "./dist/metas.js",
    "./types": "./dist/types.js"
  }
}
```

## Files to Check

Glob in plugin directories: `**/src/types.js`, `**/src/blocks.js`, `**/src/blocks/**/*.js`

Grep patterns:

- `import.*from.*blocks.js` in `types.js` files — the crash trigger
- `blockDefaultProps` — old default props pattern
- `\.meta\s*=\s*\{` — meta assigned on component
- `\.defaultProps\s*=\s*blockDefaultProps` — old pattern

## Examples

### Before — `types.js` (blocks-only plugin)

```javascript
import * as blocks from './blocks.js';

const icons = {};
Object.keys(blocks).forEach((block) => {
  icons[block] = blocks[block].meta.icons ?? [];
});
export default {
  blocks: Object.keys(blocks),
  icons,
};
```

### After — `types.js` (blocks-only plugin)

```javascript
import { extractBlockTypes } from '@lowdefy/block-utils';
import * as metas from './metas.js';

export default extractBlockTypes(metas);
```

### Before — `types.js` (mixed plugin with blocks + actions + connections)

```javascript
import * as actions from './actions.js';
import * as blocks from './blocks.js';
import * as connections from './connections.js';

const icons = {};
Object.keys(blocks).forEach((block) => {
  icons[block] = blocks[block].meta.icons || [];
});
export default {
  actions: Object.keys(actions),
  blocks: Object.keys(blocks),
  icons,
  connections: Object.keys(connections),
  requests: Object.keys(connections)
    .map((connection) => Object.keys(connections[connection].requests))
    .flat(),
};
```

### After — `types.js` (mixed plugin)

```javascript
import { extractBlockTypes } from '@lowdefy/block-utils';
import * as actions from './actions.js';
import * as connections from './connections.js';
import * as metas from './metas.js';

const blockTypes = extractBlockTypes(metas);
export default {
  ...blockTypes,
  actions: Object.keys(actions),
  connections: Object.keys(connections),
  requests: Object.keys(connections)
    .map((connection) => Object.keys(connections[connection].requests))
    .flat(),
};
```

### Before — block component

```javascript
import React from 'react';
import { blockDefaultProps } from '@lowdefy/block-utils';
import '@ag-grid-community/styles/ag-grid.css';

const MyGrid = ({ blockId, events, methods, properties }) => (
  <div id={blockId} className="ag-theme-alpine">
    {/* ... */}
  </div>
);

MyGrid.defaultProps = blockDefaultProps;
MyGrid.meta = {
  category: 'display',
  icons: [],
};

export default MyGrid;
```

### After — block component

```javascript
import React from 'react';
import { withBlockDefaults } from '@lowdefy/block-utils';
import '@ag-grid-community/styles/ag-grid.css';

const MyGrid = ({ blockId, events, methods, properties }) => (
  <div id={blockId} className="ag-theme-alpine">
    {/* ... */}
  </div>
);

export default withBlockDefaults(MyGrid);
```

### New file — `blocks/MyGrid/meta.js`

```javascript
export default {
  category: 'display',
  icons: [],
};
```

### New file — `metas.js`

```javascript
export { default as MyGrid } from './blocks/MyGrid/meta.js';
export { default as MyOtherBlock } from './blocks/MyOtherBlock/meta.js';
```

### Before — `package.json` exports

```json
{
  "exports": {
    "./*": "./dist/*",
    "./blocks": "./dist/blocks.js",
    "./types": "./dist/types.js"
  }
}
```

### After — `package.json` exports

```json
{
  "exports": {
    "./*": "./dist/*",
    "./blocks": "./dist/blocks.js",
    "./metas": "./dist/metas.js",
    "./types": "./dist/types.js"
  }
}
```

## Edge Cases

- **Mixed plugins** (blocks + actions + connections): only replace the block-related logic in `types.js`. Action and connection imports can stay as-is — they don't import React/CSS
- **Blocks with no `.meta` property**: create a minimal `meta.js` with `{ category: 'display', icons: [] }`
- **Input blocks with `valueType`**: include `valueType` in the meta.js (e.g., `{ category: 'input', valueType: 'array', icons: [] }`)
- **`renderHtml` or other block-utils imports**: keep them alongside `withBlockDefaults`: `import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils'`
- **Plugins that already have a static types.js** (hardcoded block name arrays without importing blocks.js): these won't crash but should be migrated to use `extractBlockTypes` for consistency and to get `blockMetas` support
- **Third-party CSS imports** in block components (e.g., `@ag-grid-community/styles/ag-grid.css`): these are fine in the component file — the key fix is ensuring `types.js` never reaches them via its import chain
- Don't forget to rebuild the plugin after making changes (`pnpm build`)

## Verification

1. No `types.js` should import from `blocks.js`:

   ```
   grep -rn "import.*from.*blocks.js" --include='*.js' */src/types.js
   ```

2. No `.defaultProps = blockDefaultProps` should remain:

   ```
   grep -rn "\.defaultProps = blockDefaultProps" --include='*.js' */src/
   ```

3. No `.meta = {` should remain on block components:

   ```
   grep -rn "\.meta = {" --include='*.js' */src/blocks/
   ```

4. Each block plugin's `package.json` should have a `"./metas"` export

5. Build each plugin and start the dev server — blocks should load without CSS import errors
