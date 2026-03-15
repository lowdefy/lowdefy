---
'@lowdefy/block-utils': major
'@lowdefy/build': major
'@lowdefy/client': major
'@lowdefy/engine': major
'@lowdefy/block-dev': major
'@lowdefy/blocks-antd': major
'@lowdefy/blocks-basic': major
'@lowdefy/blocks-loaders': major
'@lowdefy/blocks-echarts': major
'@lowdefy/blocks-markdown': major
'@lowdefy/blocks-aggrid': major
'@lowdefy/blocks-google-maps': major
'@lowdefy/blocks-qr': major
'@lowdefy/plugin-aws': major
---

Replace the Less/Emotion styling system with unified `style` and `class` properties using `--` prefixed CSS slot keys.

### Breaking Changes

- **Less removed**: `.less` files are no longer supported. All styling uses CSS, CSS Modules, or Tailwind utilities.
- **`makeCssClass` removed**: Blocks no longer call `methods.makeCssClass()`. They receive `classNames` and `styles` objects as props, keyed by CSS slot names (`element`, `icon`, `header`, `body`, etc.).
- **`mediaToCssObject` removed** from `@lowdefy/block-utils`.
- **`style` replaces `styles`**: The `style` (singular) property handles all styling. Using `styles` (plural) throws a `ConfigError`.
- **`class` property added**: New `class` property for CSS classes (Tailwind utilities, custom classes). Supports string, array, or object with `--` slot keys.
- **`properties.style` moved**: Block-specific `properties.style` maps to `style: { --element }` at build time.
- **Inline style props removed**: `headerStyle`, `bodyStyle`, `maskStyle`, `contentWrapperStyle`, `contentStyle`, `labelStyle`, `valueStyle`, `tabBarStyle`, `overlayStyle` are replaced by CSS slot keys (e.g., `style: { --header }`, `style: { --body }`).

### CSS Slot Keys

`--` prefixed keys target specific parts of a block:

| Key                                   | Target                                                  |
| ------------------------------------- | ------------------------------------------------------- |
| `--block`                             | Layout wrapper (grid column)                            |
| `--element`                           | Component root element                                  |
| `--header`, `--body`, `--cover`, etc. | Antd semantic sub-elements (declared in `meta.cssKeys`) |

Flat shorthand (no `--` keys) maps to `--block`:

```yaml
# These are equivalent:
style: { marginTop: 20 }
style:
  --block: { marginTop: 20 }
```
