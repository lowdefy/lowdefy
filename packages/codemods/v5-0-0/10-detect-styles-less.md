# Migration: `public/styles.less` → Theme YAML + CSS

## Context

Lowdefy v4 supported `public/styles.less` for custom styling with Less variables that mapped to antd's Less-based theming. Antd v6 uses CSS-in-JS with design tokens. Less is no longer processed by the build.

## What to Do

1. Check if `public/styles.less` exists
2. If it does, parse its content and split into two buckets:
   - **Less variables** → map to antd design tokens in `lowdefy.yaml` theme config
   - **Plain CSS / complex Less** → convert to `public/styles.css`

### Known Less Variable → Token Mapping

| Less Variable           | Antd Token           |
| ----------------------- | -------------------- |
| `@primary-color`        | `colorPrimary`       |
| `@link-color`           | `colorLink`          |
| `@success-color`        | `colorSuccess`       |
| `@warning-color`        | `colorWarning`       |
| `@error-color`          | `colorError`         |
| `@font-size-base`       | `fontSize`           |
| `@heading-color`        | `colorTextHeading`   |
| `@text-color`           | `colorText`          |
| `@text-color-secondary` | `colorTextSecondary` |
| `@disabled-color`       | `colorTextDisabled`  |
| `@border-radius-base`   | `borderRadius`       |
| `@border-color-base`    | `colorBorder`        |
| `@box-shadow-base`      | `boxShadow`          |
| `@body-background`      | `colorBgContainer`   |

For each variable found, generate the equivalent `theme.antd.token` YAML:

```yaml
# Add to lowdefy.yaml
theme:
  antd:
    token:
      colorPrimary: '#1890ff'
      fontSize: 14
      borderRadius: 4
```

### Complex Less (manual conversion needed)

Flag these for manual conversion:

- Less mixins (`.mixin()`)
- Less functions (`darken()`, `lighten()`, `fade()`)
- Nested selectors with `&`
- `@import` statements (other than antd imports)
- Any Less-specific syntax

Convert remaining plain CSS to `public/styles.css`.

## Files to Check

Check: `public/styles.less`

## Examples

### Before — styles.less

```less
@primary-color: #1890ff;
@border-radius-base: 6px;
@font-size-base: 14px;

.custom-header {
  padding: 16px;
  background: @primary-color;
}
```

### After — lowdefy.yaml addition

```yaml
theme:
  antd:
    token:
      colorPrimary: '#1890ff'
      borderRadius: 6
      fontSize: 14
```

### After — public/styles.css (for non-variable CSS)

```css
.custom-header {
  padding: 16px;
  background: var(--ant-color-primary);
}
```

## Edge Cases

- If `styles.less` contains only variables and no custom CSS, only the `lowdefy.yaml` theme config is needed — no `styles.css`
- Less expressions like `darken(@primary-color, 10%)` have no direct token equivalent — flag these for manual conversion to CSS custom properties or hardcoded values
- Some apps may import antd Less files (`@import '~antd/dist/antd.less'`) — these lines can be removed entirely (antd v6 doesn't use Less)
- If `lowdefy.yaml` already has a `theme:` section, merge the tokens into it

## Verification

After migration, `public/styles.less` should be renamed or deleted. The app should build without Less processing errors.
