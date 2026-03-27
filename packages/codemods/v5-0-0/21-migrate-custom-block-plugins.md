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

### 5. Replace `blockDefaultProps` with `withBlockDefaults` (REQUIRED)

> **This step is mandatory.** The old `blockDefaultProps` pattern does not initialize block props correctly in v5. The `withBlockDefaults()` HOC is required.

Replace `blockDefaultProps` with `withBlockDefaults` in **every** block component. If your block also imports `renderHtml` or other named exports, keep those — only replace `blockDefaultProps`:

```javascript
// OLD
import { blockDefaultProps } from '@lowdefy/block-utils';
// or: import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
BlockName.defaultProps = blockDefaultProps;
export default BlockName;

// NEW
import { withBlockDefaults } from '@lowdefy/block-utils';
// or: import { withBlockDefaults, renderHtml } from '@lowdefy/block-utils';
export default withBlockDefaults(BlockName);
```

**Grep to find all files that need this change:**

```bash
grep -rn "blockDefaultProps" --include='*.js' plugins/*/src/
```

Every match needs migration. Delete the `.defaultProps = blockDefaultProps;` line and wrap the export with `withBlockDefaults()`.

### 5b. Replace ALL `methods.makeCssClass` calls (REQUIRED)

> **This step is mandatory.** `methods.makeCssClass` is fully removed in v5 — it was an Emotion-based utility that no longer exists. Any call to it will throw: `BlockError: o.makeCssClass is not a function`. **Every** usage must be replaced, not just root wrappers.

**Grep to find all files that need this change:**

```bash
grep -rn "methods.makeCssClass" --include='*.js' plugins/*/src/
```

Replace each call with an inline `style` prop:

**Pattern 1 — single style object:**

```javascript
// OLD
<div className={methods.makeCssClass(styles.myStyle)}>
// NEW
<div style={styles.myStyle}>
```

**Pattern 2 — merged style objects:**

```javascript
// OLD
<div className={methods.makeCssClass([styles.base, properties.style])}>
// NEW
<div style={{ ...styles.base, ...properties.style }}>
```

**Pattern 3 — conditional styles:**

```javascript
// OLD
<div className={methods.makeCssClass([styles.base, isActive && styles.active])}>
// NEW
<div style={{ ...styles.base, ...(isActive && styles.active) }}>
```

**Pattern 4 — template literal with CSS class + makeCssClass:**

```javascript
// OLD
className={`my-theme ${methods.makeCssClass({ width: '100%', ...properties.style })}`}
// NEW
className="my-theme"
style={{ width: '100%', ...styles?.element }}
```

Key changes:

- Replace `className={methods.makeCssClass(...)}` with `style={...}` using inline React style objects
- For root wrapper elements: replace `...properties.style` with `...styles?.element` — user-configured styles now come via the `styles` prop instead of `properties.style`
- If a sub-component only received `methods` for `makeCssClass`, remove `methods` from its props entirely
- If `methods` is no longer used in the component after migration, remove it from the destructured props

### 5c. Apply antd v6 prop renames in plugin JS source (REQUIRED)

> Codemod 05 handles antd prop renames in YAML configs, but **plugins that import antd components directly** also need the same renames in their JS source code. Skipping this causes silent failures or deprecation warnings.

**Key renames:**

| Old prop            | New prop         | Components                                  |
| ------------------- | ---------------- | ------------------------------------------- |
| `visible`           | `open`           | Modal, Drawer, Popover, Popconfirm, Tooltip |
| `onVisibleChange`   | `onOpenChange`   | Tooltip, Popover, Popconfirm                |
| `dropdownClassName` | `popupClassName` | Select, TreeSelect, Cascader                |

**Grep to find files that need this change:**

```bash
grep -rn 'visible=' --include='*.js' plugins/*/src/
grep -rn 'onVisibleChange' --include='*.js' plugins/*/src/
grep -rn 'dropdownClassName' --include='*.js' plugins/*/src/
```

For `visible=`, only rename on antd components (Modal, Drawer, etc.) — not on custom div/span elements where `visible` might be a different prop.

### 5d. Remove `@emotion/*` dependencies (REQUIRED)

> Emotion is fully removed in Lowdefy v5. Any `@emotion/*` packages in plugin `package.json` dependencies must be removed. Any source code that imports from `@emotion/react` or `@emotion/css` (e.g., `css`, `keyframes`, `Global`) must be rewritten using plain CSS, CSS modules, or inline styles.

**Grep to find files that need this change:**

```bash
grep -rn "@emotion" --include='*.js' plugins/*/src/
grep -rn "@emotion" plugins/*/package.json
```

Remove the dependency from `package.json` and replace any Emotion usage:

- `css` template literals → inline `style` objects or CSS module classes
- `keyframes` → `@keyframes` rules in a CSS module file or an injected `<style>` tag
- `Global` → move to a CSS file imported as a module

### 5e. Rename `style.css` → `style.module.css`

Next.js 16 with Turbopack rejects global CSS imports from component files (`import './style.css'`). CSS must be imported as CSS Modules.

For each block that imports a `.css` file:

1. Rename the file: `style.css` → `style.module.css`
2. Update the import: `import './style.css'` → `import './style.module.css'`
3. If the CSS has global selectors (class names, element selectors), wrap them in `:global { ... }` to preserve global scoping:

```css
/* style.module.css */
:global {
  .my-block-class {
    padding: 16px;
  }
  .my-block-class .child {
    color: red;
  }
}
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

### 7. Update dependency versions

Update all `@lowdefy/*` dependencies to match the target Lowdefy version you're upgrading to. Also update `antd` if your plugin imports from it directly.

```json
{
  "dependencies": {
    "@lowdefy/block-utils": "5.0.0",
    "@lowdefy/helpers": "5.0.0",
    "@lowdefy/blocks-antd": "5.0.0",
    "antd": "6.3.1"
  }
}
```

**Key version changes:**

- All `@lowdefy/*` packages → match your target Lowdefy version
- `antd` → `6.3.1` (v5 uses antd v6, not v4). Only needed if your plugin imports from `antd` directly. If you only import from `@lowdefy/blocks-antd`, antd is a transitive dep and doesn't need to be listed.
- `react` / `react-dom` → keep at `18.2.0`

**Check which plugins import antd directly:**

```bash
grep -rn "from 'antd'" plugins/*/src/ --include='*.js'
```

Only those plugins need `antd` in their direct dependencies.

## Files to Check

Glob in plugin directories: `**/src/types.js`, `**/src/blocks.js`, `**/src/blocks/**/*.js`

Grep patterns:

- `import.*from.*blocks.js` in `types.js` files — the crash trigger
- `blockDefaultProps` — old default props pattern
- `\.meta\s*=\s*\{` — meta assigned on component
- `\.defaultProps\s*=\s*blockDefaultProps` — old pattern
- `methods\.makeCssClass` — removed in v5, replace with inline `style` + `styles?.element`

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

### After — block component (v4 block-utils)

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

export default MyGrid;
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
- **`withBlockDefaults` is required in v5**: `blockDefaultProps` no longer initializes block props correctly.
- **`methods.makeCssClass` is fully removed in v5**: it was Emotion-based and no longer exists. If you see `makeCssClass is not a function` at runtime, step 5b was missed. Every call must be replaced with inline `style` props.
- **`extractBlockTypes` availability**: only available in `@lowdefy/block-utils` v5+. If on v4.x, use the manual pattern: `import * as metas from './metas.js'; const blocks = Object.keys(metas); const icons = {}; for (const name of blocks) { icons[name] = metas[name].icons ?? []; } export default { blocks, icons };`
- **antd prop renames in JS source**: codemod 05 only handles YAML files. Plugin JS code that uses antd components directly (Modal, Drawer, Tooltip, etc.) must apply the same renames (`visible` → `open`, etc.). These are silent failures — antd v6 may still accept the old prop as a compatibility shim but it will be removed in future versions.
- **`@emotion/*` removal**: Emotion is fully gone in v5. Remove from `package.json` dependencies and rewrite any `css`/`keyframes`/`Global` usage. Common replacement: `keyframes` → `@keyframes` in a CSS module or injected `<style>` tag.
- **Global CSS imports (`import './style.css'`)**: Next.js 16 with Turbopack rejects global CSS from component files. Rename to `.module.css` and wrap selectors in `:global { ... }` to preserve global scoping. Third-party CSS (e.g., `@ag-grid-community/styles/ag-grid.css`) is handled by Next.js `transpilePackages` and doesn't need renaming.
- **Third-party CSS imports** in block components (e.g., `@ag-grid-community/styles/ag-grid.css`): these are fine — the key fix is ensuring `types.js` never reaches them via its import chain
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

5. No `methods.makeCssClass` should remain:

   ```
   grep -rn "methods.makeCssClass" --include='*.js' */src/blocks/
   ```

6. No deprecated antd `visible` prop on Modal/Drawer components:

   ```
   grep -rn "visible=" --include='*.js' */src/blocks/
   ```

7. No `@emotion` imports or dependencies:

   ```
   grep -rn "@emotion" --include='*.js' */src/
   grep -rn "@emotion" */package.json
   ```

8. Build each plugin and start the dev server — blocks should load without errors
