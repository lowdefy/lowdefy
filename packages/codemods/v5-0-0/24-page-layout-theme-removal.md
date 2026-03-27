# Migration: Remove Page Layout Theme Properties

## Context

The `header.theme`, `sider.theme`, and `menu.theme` string properties (`'light'` / `'dark'`) on PageSiderMenu and PageHeaderMenu have been removed. Dark mode now works automatically via CSS variables from the root ConfigProvider — the header, sider, and menu all adapt when dark mode is toggled.

Additionally, nested style properties (`header.style`, `header.contentStyle`, `sider.style`, `footer.style`, `content.style`, `logo.style`) on these page blocks have been replaced by the unified `style: { /cssKey }` system.

## What to Do

### Step 1: Remove theme properties from page layout blocks

Find all `PageSiderMenu` and `PageHeaderMenu` blocks and remove `theme` from their `header`, `sider`, and `menu` property objects.

**Properties to remove:**

| Block          | Property to Remove        |
| -------------- | ------------------------- |
| PageSiderMenu  | `properties.header.theme` |
| PageSiderMenu  | `properties.sider.theme`  |
| PageSiderMenu  | `properties.menu.theme`   |
| PageHeaderMenu | `properties.header.theme` |
| PageHeaderMenu | `properties.menu.theme`   |

If `header` becomes empty after removing `theme`, remove the entire `header:` key.

Also remove any `_if: { _media: darkMode }` conditional patterns used to switch theme — these are no longer needed.

### Step 2: Migrate nested style properties to cssKey style slots

Move style properties from inside `properties:` to the block-level `style:` with `.`-prefixed cssKey names.

**Mapping table:**

| Old Property Location            | New Location                |
| -------------------------------- | --------------------------- |
| `properties.header.style`        | `style: { .header }`        |
| `properties.header.contentStyle` | `style: { .headerContent }` |
| `properties.sider.style`         | `style: { .sider }`         |
| `properties.footer.style`        | `style: { .footer }`        |
| `properties.content.style`       | `style: { .content }`       |
| `properties.logo.style`          | `style: { .logo }`          |

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `type: PageSiderMenu|type: PageHeaderMenu`

Then within matched files, look for:

- `header:\s+theme:` (theme properties)
- `header:\s+style:` or `header:\s+contentStyle:` (nested styles)
- `sider:\s+theme:` or `sider:\s+style:` (sider theme/style)
- `menu:\s+theme:` (menu theme)
- `footer:\s+style:` (footer style)
- `content:\s+style:` (content style)
- `logo:\s+style:` (logo style)

## Examples

### Before — PageSiderMenu with theme and conditional dark mode

```yaml
- id: my_page
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    header:
      theme:
        _if:
          test:
            _media: darkMode
          then: dark
          else: light
    sider:
      theme: dark
      width: 256px
    menu:
      theme: dark
      links:
        - id: dashboard
          type: MenuLink
          properties:
            title: Dashboard
```

### After

```yaml
- id: my_page
  type: PageSiderMenu
  properties:
    darkModeToggle: true
    sider:
      width: 256px
    menu:
      links:
        - id: dashboard
          type: MenuLink
          properties:
            title: Dashboard
```

### Before — PageSiderMenu with nested style properties

```yaml
- id: my_page
  type: PageSiderMenu
  properties:
    header:
      theme: dark
      contentStyle:
        gap: 12px
    footer:
      style:
        background: var(--ant-color-bg-base)
        padding: 16px 0 0 0
    content:
      style:
        maxWidth: 960px
```

### After

```yaml
- id: my_page
  type: PageSiderMenu
  properties: {}
  style:
    .headerContent:
      gap: 12px
    .footer:
      background: var(--ant-color-bg-base)
      padding: 16px 0 0 0
    .content:
      maxWidth: 960px
```

### Before — PageHeaderMenu with theme

```yaml
- id: my_page
  type: PageHeaderMenu
  properties:
    header:
      theme: dark
    menu:
      theme: dark
      links: []
```

### After

```yaml
- id: my_page
  type: PageHeaderMenu
  properties:
    menu:
      links: []
```

## Edge Cases

- If `header:` or `sider:` has other properties besides `theme` and `style`, only remove `theme` and `style` — keep the remaining properties
- If `header:` only contained `theme:`, remove the entire `header:` key
- Operator expressions inside theme values (like `_if: { _media: darkMode }`) should be removed entirely — the conditional is no longer needed
- The `menu.theme` inside `properties.menu` should be removed, but other menu properties (`links`, `forceSubMenuRender`, etc.) should be kept
- Hardcoded color values like `background: '#FFFFFF'` in style properties should be replaced with `var(--ant-color-bg-container)` for dark mode compatibility
- If the block already has a top-level `style:` block, merge the new `.slot` entries into it

## Verification

```
grep -rn 'header:' --include='*.yaml' --include='*.yml' . | grep -E 'theme:|contentStyle:|^\s+style:'
grep -rn 'sider:' --include='*.yaml' --include='*.yml' . | grep -E 'theme:|^\s+style:'
grep -rn 'menu:' --include='*.yaml' --include='*.yml' . | grep 'theme:'
```

Within PageSiderMenu/PageHeaderMenu blocks, no `theme:` properties should remain under `header:`, `sider:`, or `menu:`. No nested `style:` or `contentStyle:` properties should remain under these sub-objects.
