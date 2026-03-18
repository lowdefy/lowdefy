# Migration: `meta.styles` → Direct CSS Imports (Custom Block Plugins)

## Context

The `meta.styles` pipeline is removed in Lowdefy v4.8. Custom block plugins that used `meta.styles = ['style.less']` to register stylesheets must switch to direct `import './style.css'` statements in the block component file.

This migration targets local plugin source code (JS/TS), not YAML configs.

## Scope

`plugins` — scan JS/TS files in local plugin directories.

## What to Do

For each custom block plugin:

### 1. Remove `meta.styles` from block component files

Find lines like:

```javascript
BlockName.meta = {
  category: 'display',
  styles: ['style.less'],
};
```

Remove the `styles` entry:

```javascript
BlockName.meta = {
  category: 'display',
};
```

### 2. Remove styles aggregation from `types.js`

Find patterns like:

```javascript
const styles = {};
styles.BlockName = Block.meta.styles;
export { styles };
```

Remove the `styles` variable, the loop/assignments, and the `styles` export.

### 3. Handle `.less` files

For each `.less` file referenced by `meta.styles`:

**Dead imports (remove):** If the `.less` file only imports antd's Less (`@import '~antd/dist/antd.less'` or similar) with no other CSS, delete it.

**Convertible (rename to .css):** If the `.less` file contains plain CSS without Less-specific syntax:

1. Remove any antd `@import` lines
2. Wrap the remaining CSS in `@layer components { }`
3. Save as `.css` (same name, different extension)
4. Delete the old `.less` file

**Complex Less (manual):** If the file uses Less variables (`@var`), functions (`darken()`, `lighten()`), mixins, or nested `&` selectors — convert to plain CSS manually first.

### 4. Add direct CSS import

In the block component file, add:

```javascript
import './style.css';
```

## Files to Check

Glob in plugin directories: `**/*.{js,jsx,ts,tsx}`
Grep: `meta.styles` or `styles:.*\.less`

Also check: `**/types.js` for styles aggregation.

## Examples

### Before — block component

```javascript
import React from 'react';
import './MyBlock.less';

const MyBlock = ({ properties }) => {
  return <div>{properties.title}</div>;
};

MyBlock.meta = {
  category: 'display',
  styles: ['MyBlock.less'],
};

export default MyBlock;
```

### After

```javascript
import React from 'react';
import './MyBlock.css';

const MyBlock = ({ properties }) => {
  return <div>{properties.title}</div>;
};

MyBlock.meta = {
  category: 'display',
};

export default MyBlock;
```

### Before — MyBlock.less

```less
@import '~antd/dist/antd.less';

.my-block {
  padding: 16px;
  border: 1px solid #d9d9d9;
}
```

### After — MyBlock.css

```css
@layer components {
  .my-block {
    padding: 16px;
    border: 1px solid #d9d9d9;
  }
}
```

## Edge Cases

- Some plugins may have `.less` files that import from multiple antd sub-paths — remove all antd imports
- Check for Less syntax before auto-converting: `@` variables (not `@import` or `@layer`), `darken()`, `lighten()`, `fade()`, `.mixin()`, `& .child` nesting
- The `import './style.css'` line may already exist if the plugin was partially migrated
- `meta.styles` may be an empty array — just remove it

## Verification

1. No `.less` files should be imported by block components
2. No `meta.styles` assignments should remain
3. No `styles` exports in `types.js`
4. The plugin should build without Less-related errors
