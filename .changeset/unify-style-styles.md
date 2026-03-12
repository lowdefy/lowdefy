---
'@lowdefy/build': major
'@lowdefy/client': major
'@lowdefy/engine': major
---

Unify block styling into `style` and `class` properties with `--` prefixed CSS slot keys.

### Breaking Changes

- **`style` replaces `styles`**: The confusing `style` vs `styles` (plural) distinction is removed. A single `style` property handles all styling. Using `styles` (plural) throws a `ConfigError` with migration guidance.
- **`class` property added**: New `class` property for CSS classes (Tailwind utilities, custom classes). Supports string, array, or object with `--` slot keys.
- **`properties.style` moved**: Block-specific `properties.style` is moved to `style: { --element: {...} }` at build time. Block-specific style properties like `headerStyle`, `bodyStyle` are replaced by semantic slot keys.
- **`makeCssClass` removed**: Blocks no longer call `methods.makeCssClass()`. They receive `classNames` and `styles` objects directly as props.

### CSS Slot Keys

`--` prefixed keys target specific parts of a block. The `--` prefix is stripped at build time.

| Key                                   | Target                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `--block`                             | Layout wrapper (grid column)                                            |
| `--element`                           | Component root element                                                  |
| `--header`, `--body`, `--cover`, etc. | Antd semantic sub-elements (block-specific, declared in `meta.cssKeys`) |

Flat shorthand (no `--` keys) is backward compatible and maps to `--block`:

```yaml
# These are equivalent:
style: { marginTop: 20 }
style:
  --block: { marginTop: 20 }
```

### Data Flow

1. **Build** (`normalizeClassAndStyles`): Partitions `style`/`class` into slot keys, strips `--` prefixes, moves `properties.style` → `style.element`, validates keys against `meta.cssKeys`.
2. **Engine** (`Block.js`): Evaluates operators in both `style` and `class` objects (`styleEval`, `classEval`).
3. **Client** (`resolveClassNames`): Merges class arrays per slot via `cn()` (clsx + tailwind-merge). Passes `classNames` and `styles` objects to block components, which map them to antd's `classNames`/`styles` props.
