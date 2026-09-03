# Migration: Removed block methods (`methods.makeCssClass`) throw a located `BlockError`

## Context

From Lowdefy v8.0.0 the block plugin API is versioned (`PLUGIN_API_VERSION` in `@lowdefy/block-utils`, currently `1`) and a block that calls a method the API has removed fails with an error that names the removal and the replacement:

```
BlockError: Block "my-autocomplete" (type MyAutocomplete) called the removed block method "makeCssClass". Blocks receive resolved class names on the `classNames` prop and style objects on the `styles` prop, keyed by the block's `meta.cssKeys`. Replace `methods.makeCssClass(x)` with `classNames.<cssKey>` or an inline `style` object. See the codemod at @lowdefy/codemods v8-0-0/02-removed-block-methods.md. (plugin API v1)
```

Before v8 the same call failed with a bare `TypeError: methods.makeCssClass is not a function` inside the block's error boundary, which named neither the removal nor the fix.

`methods.makeCssClass` was an Emotion-based helper that produced a class name from a style object. It was removed in v5 when Emotion was dropped. Blocks now receive their styling through two props the framework resolves for them:

- `classNames` — an object keyed by the block's `meta.cssKeys` (plus `block`), each value a resolved class-name string built from the block's `class:` config.
- `styles` — an object keyed the same way, each value a React style object built from the block's `style:` config.

This prompt is deliberately standalone: it is the fix the runtime error points at, and it is runnable without doing the rest of the v5 plugin migration. The full v5 migration of a custom block plugin (meta.js, metas.js, `extractBlockTypes`, `withBlockDefaults`, antd v6 renames, Emotion removal) is `v5-0-0/21-migrate-custom-block-plugins.md`; this prompt is its step 5b, kept re-runnable on its own.

## Scope

`plugins` — JS/JSX source of local block plugins. Lowdefy YAML config is not touched.

## What to Do

### Step 1: Find every call

```bash
grep -rn "methods\.makeCssClass" --include='*.js' --include='*.jsx' plugins/*/src/
```

Also catch the destructured and aliased forms:

```bash
grep -rn "makeCssClass" --include='*.js' --include='*.jsx' plugins/*/src/
```

If the second grep finds `const { makeCssClass } = methods` or `const mkCss = methods.makeCssClass`, treat every use of that binding as a call site.

### Step 2: Decide the rewrite for each call site

Read the block's `meta.js` (or the `meta` object still attached to the component). For each element whose `className` was produced by `makeCssClass`:

**(a) The block declares a `cssKeys` entry for that element → use `classNames.<cssKey>`.**

Elements the config author can target must keep a `class:` hook. Add a `cssKey` if the element does not have one yet — a `cssKeys` entry is a one-line addition to `meta.js` and gives the config author `class: { .<cssKey>: ... }` and `style: { .<cssKey>: ... }`.

```javascript
// meta.js
cssKeys: {
  element: 'The outer wrapper.',
  option: 'Each option row.',
},
```

```javascript
// OLD
<div className={methods.makeCssClass([wrapperStyle, properties.style])}>
// NEW
<div className={classNames.element} style={{ ...wrapperStyle, ...styles?.element }}>
```

**(b) The style is purely internal (a hover colour, a fixed width) with no author-facing hook → inline `style` object.**

```javascript
// OLD
<div className={methods.makeCssClass({ width: '100%', padding: 8 })}>
// NEW
<div style={{ width: '100%', padding: 8 }}>
```

**(c) Nested selectors (`&:hover`, `& > *`) inside the style object → Tailwind utility classes.**

Inline `style` cannot express pseudo-selectors. Move them to Tailwind classes on the element; see `v5-0-0/22-migrate-nested-css-selectors.md`.

### Step 3: Apply the four rewrite patterns

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

**Pattern 4 — template literal with a CSS class + makeCssClass on the root element:**

```javascript
// OLD
className={`my-theme ${methods.makeCssClass({ width: '100%', ...properties.style })}`}
// NEW
className={cn('my-theme', classNames.element)}
style={{ width: '100%', ...styles?.element }}
```

`cn` is exported by `@lowdefy/block-utils` and merges class names (Tailwind-aware). On a root wrapper, `...properties.style` becomes `...styles?.element` — author styles arrive on the `styles` prop, not in `properties`.

### Step 4: Drop `methods` where it was only passed for this

A sub-component that received `methods` solely to call `makeCssClass` no longer needs it. Remove it from the sub-component's props and from the call site. If the block itself no longer reads `methods` after the rewrite, remove it from the destructured props too — `methods` is still passed by the framework, so nothing else changes.

### Step 5: Rebuild and re-render the block

```bash
npx lowdefy@8 dev
```

Open a page that renders the block. The `BlockError` above must not appear in the browser console or the dev server terminal. `GET /lowdefy-docs/build-status` on the dev server lists any remaining runtime error with its config location.

## Files to Check

- `plugins/*/src/blocks/*/*.js` — block components and their sub-components
- `plugins/*/src/blocks/*/meta.js` — add `cssKeys` entries for elements that need an author-facing class hook
- Any file the first grep names outside `blocks/` (shared helpers that wrap `makeCssClass`)

## Examples

### Before

```javascript
import React from 'react';
import { withBlockDefaults } from '@lowdefy/block-utils';

const Option = ({ methods, option, selected }) => (
  <div className={methods.makeCssClass([{ padding: 4 }, selected && { fontWeight: 600 }])}>
    {option.label}
  </div>
);

const MyAutocomplete = ({ blockId, methods, properties }) => (
  <div
    id={blockId}
    className={`my-autocomplete ${methods.makeCssClass({ width: '100%', ...properties.style })}`}
  >
    {(properties.options ?? []).map((option) => (
      <Option key={option.value} methods={methods} option={option} selected={option.selected} />
    ))}
  </div>
);

export default withBlockDefaults(MyAutocomplete);
```

### After

```javascript
import React from 'react';
import { cn, withBlockDefaults } from '@lowdefy/block-utils';

const Option = ({ className, option, selected, style }) => (
  <div className={className} style={{ padding: 4, ...(selected && { fontWeight: 600 }), ...style }}>
    {option.label}
  </div>
);

const MyAutocomplete = ({ blockId, classNames, properties, styles }) => (
  <div
    id={blockId}
    className={cn('my-autocomplete', classNames.element)}
    style={{ width: '100%', ...styles?.element }}
  >
    {(properties.options ?? []).map((option) => (
      <Option
        key={option.value}
        className={classNames.option}
        option={option}
        selected={option.selected}
        style={styles?.option}
      />
    ))}
  </div>
);

export default withBlockDefaults(MyAutocomplete);
```

```javascript
// meta.js — the two cssKeys the rewrite relies on
export default {
  category: 'input',
  valueType: 'string',
  icons: [],
  cssKeys: {
    element: 'The autocomplete wrapper.',
    option: 'Each option row.',
  },
  properties: { type: 'object', properties: {} },
};
```

## Edge Cases

- **`makeCssClass` called with a string**: it was used as a plain class-name passthrough. Replace with the string itself (`className="my-class"`), or `cn('my-class', classNames.<cssKey>)` on an element with a css key.
- **The block registered its own `makeCssClass`** via `methods.registerMethod('makeCssClass', fn)`: the proxy only throws for a key the bag does not carry, so this keeps working. Rename it anyway — the name is reserved for the removed member and will confuse the next reader.
- **`properties.style` on a non-root element**: `properties.style` was the v4 author-style channel. On the root element it is `styles?.element` now (or whichever css key the root declares); on inner elements use the css key the author should target, or drop it if none exists.
- **A shared helper wraps `makeCssClass`** (`const css = (s) => methods.makeCssClass(s)`): rewrite the helper to return a style object and change its call sites from `className={css(x)}` to `style={css(x)}`.
- **Pseudo-selectors or media queries in the style object**: inline `style` cannot express them — use Tailwind classes (`v5-0-0/22-migrate-nested-css-selectors.md`).

## Verification

1. No call sites remain:

   ```bash
   grep -rn "makeCssClass" --include='*.js' --include='*.jsx' plugins/*/src/
   ```

   The only acceptable hits are comments.

2. Every element that had an author-facing class now has a `cssKeys` entry in the block's `meta.js`, and `pnpm build` (or `npx lowdefy@8 build`) passes — the build validates the meta shape and reports a malformed `cssKeys` as a `ConfigError` naming the field.

3. Rendering a page with the block produces no `BlockError ... removed block method` in the browser console or `GET /lowdefy-docs/build-status`.

4. Run the plugin's own tests if it has them.
