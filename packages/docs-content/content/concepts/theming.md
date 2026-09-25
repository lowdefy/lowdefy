# Theming

Lowdefy uses the [Ant Design](https://ant.design/) design token system for theming. This allows you to customize colors, typography, spacing, and more at the app level, component type level, or individual block level.

## App-level theme

Configure your app's theme in `lowdefy.yaml` under `theme.antd`:

```yaml
lowdefy: 6.0.0
theme:
  antd:
    token:
      colorPrimary: '#6366f1'
      colorSuccess: '#22c55e'
      colorWarning: '#f59e0b'
      colorError: '#ef4444'
      fontSize: 14
      borderRadius: 8
```

### Seed tokens

Seed tokens are the base values from which all other tokens are derived. The most commonly used seed tokens are:

| Token | Type | Description |
|---|---|---|
| `colorPrimary` | string | Primary brand color |
| `colorSuccess` | string | Success state color |
| `colorWarning` | string | Warning state color |
| `colorError` | string | Error state color |
| `colorInfo` | string | Info state color |
| `colorBgBase` | string | Base background color |
| `colorTextBase` | string | Base text color |
| `fontSize` | number | Base font size (px) |
| `borderRadius` | number | Base border radius (px) |
| `wireframe` | boolean | Enable wireframe style |
| `fontFamily` | string | Font family |

From these seed tokens, antd derives hundreds of map tokens (e.g. `colorPrimaryHover`, `colorBgContainer`, `fontSizeLG`) automatically.

## Algorithms

Algorithms transform seed tokens into map tokens. Antd provides three built-in algorithms:

```yaml
# Dark mode
theme:
  antd:
    algorithm: dark

# Compact mode
theme:
  antd:
    algorithm: compact

# Combine multiple algorithms
theme:
  antd:
    algorithm:
      - dark
      - compact
```

| Algorithm | Description |
|---|---|
| `default` | Default light theme |
| `dark` | Dark color scheme |
| `compact` | Reduced spacing and smaller sizes |

## Per-component-type overrides

Override design tokens for all instances of a component type:

```yaml
theme:
  antd:
    token:
      colorPrimary: '#6366f1'
    components:
      Button:
        fontWeight: 700
        paddingInline: 24
      Card:
        headerBg: '#f5f5f5'
        bodyPadding: '24px'
      Input:
        activeBorderColor: '#6366f1'
```

Each antd component has its own set of component tokens. See the individual block documentation pages for commonly used tokens, or the [antd component token reference](https://ant.design/components/overview/) for the full list.

## Per-block overrides

Override design tokens for a single block instance using `properties.theme`:

```yaml
- id: special_button
  type: Button
  properties:
    title: Special Button
    theme:
      fontWeight: 700
      paddingInline: 24
      primaryColor: '#6366f1'
```

Under the hood, `properties.theme` wraps the block in a scoped [ConfigProvider](/ConfigProvider) with the specified component tokens.

### Per-item variants in `Menu`

antd's `Menu` owns the token scope for all its items, so you can't override tokens per item. Instead, set `properties.danger: true` on a `MenuLink` to switch that single item onto the `dangerItem*` token set, and theme the whole danger state at the block level:

```yaml
- id: actions_menu
  type: Menu
  properties:
    mode: vertical
    theme:
      dangerItemColor: '#cf1322'
      dangerItemHoverColor: '#ff4d4f'
      dangerItemSelectedBg: '#fff1f0'
    links:
      - id: edit
        type: MenuLink
        properties:
          title: Edit
          icon: edit
      - id: delete
        type: MenuLink
        properties:
          title: Delete
          icon: delete
          danger: true
```

For per-item visual tweaks beyond `danger`, use `class` (Tailwind / arbitrary CSS) or `style` on the menu item — both support dot-prefixed slot keys (`.element`, `.icon`, `.label`, `.popup`). See [Custom styling](/custom-styling).

## ConfigProvider block

For scoped theming of a group of blocks, use the [ConfigProvider](/ConfigProvider) container block:

```yaml
- id: dark_section
  type: ConfigProvider
  properties:
    algorithm: dark
    token:
      colorPrimary: '#a855f7'
  blocks:
    - id: themed_card
      type: Card
      properties:
        title: Dark Themed Card
    - id: themed_button
      type: Button
      properties:
        title: Click Me
```

ConfigProvider creates a theme scope — all child blocks inherit the specified theme tokens and algorithm.

## The `_theme` operator

Access seed tokens in expressions using the `_theme` operator:

```yaml
# String form — get a single token
color:
  _theme: colorPrimary

# Object form — with default value
background:
  _theme:
    key: colorBgContainer
    default: '#ffffff'

# Get all tokens
allTokens:
  _theme:
    all: true
```

The `_theme` operator resolves seed tokens from `theme.antd.token`. For derived tokens (like hover/active variants), use CSS variables instead: `var(--ant-color-primary-hover)`.

See the [`_theme` operator reference](/_theme) for full documentation.

## CSS variables

All antd design tokens are available as CSS variables with the `--ant-` prefix. This is useful in `public/styles.css` or when using CSS-based customizations:

```css
.my-custom-class {
  color: var(--ant-color-primary);
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
}
```

Token names are converted from camelCase to kebab-case for the CSS variable name (e.g. `colorPrimary` → `--ant-color-primary`).

## Dark mode

Lowdefy supports three dark mode behaviors, configured via `theme.darkMode`:

```yaml
theme:
  darkMode: system  # 'system' (default), 'light', or 'dark'
```

| Value | Behavior |
|---|---|
| `system` | Follows the OS dark mode preference and updates live when it changes. Users can override with `SetDarkMode`. This is the default. |
| `light` | Forces light mode. `SetDarkMode` preferences are stored but have no visual effect. |
| `dark` | Forces dark mode. `SetDarkMode` preferences are stored but have no visual effect. |

You can also scope dark mode to a section using [ConfigProvider](/ConfigProvider):

```yaml
- id: dark_section
  type: ConfigProvider
  properties:
    algorithm: dark
  blocks:
    # All blocks here will use dark theme
```

### Easy dark mode toggle

Add a built-in dark mode toggle to your page layout with a single property:

```yaml
- id: my_page
  type: PageHeaderMenu  # or PageSiderMenu
  properties:
    darkModeToggle: true
```

This renders a moon/sun icon in the header that cycles through light, dark, and system preferences. The preference is persisted to `localStorage`.

For custom toggle implementations, see the programmatic approach below.

### Programmatic dark mode toggle

Use the `SetDarkMode` action with `_media: darkMode` to let users control dark mode at runtime:

```yaml
- id: dark_mode_toggle
  type: Button
  properties:
    hideTitle: true
    icon:
      _if:
        test:
          _media: darkMode
        then: theme-light
        else: theme-dark
  events:
    onClick:
      - id: toggle
        type: SetDarkMode
```

Without params, `SetDarkMode` cycles through `light`, `dark`, and `system`. You can also set a specific preference:

```yaml
- id: set_system
  type: SetDarkMode
  params:
    darkMode: system
```

The user's preference is persisted to `localStorage` and survives page refreshes. Use `_media: darkModePreference` to read the current preference (`'system'`, `'light'`, or `'dark'`), and `_media: darkMode` for the effective boolean state.

`SetDarkMode` automatically merges the `dark` algorithm with any existing algorithm configured in `theme.antd.algorithm`. For example, if your app uses `algorithm: compact`, toggling dark mode produces `[compact, dark]`.

See the [`SetDarkMode` action reference](/SetDarkMode) and [`_media` operator reference](/_media) for full documentation.

### Tip: Use CSS variables for dark-mode-safe colors

When styling blocks with custom colors (e.g. `cellStyle` in AgGrid, or `style` on any block), avoid hardcoded hex values — they won't adapt to dark mode. Use antd CSS variables instead:

```yaml
# Bad — hardcoded colors look washed out in dark mode
cellStyle:
  backgroundColor: '#e6f7ff'

# Good — antd palette tokens adapt automatically
cellStyle:
  backgroundColor: var(--ant-blue-1)
```

Useful palette variables: `var(--ant-blue-1)`, `var(--ant-green-1)`, `var(--ant-orange-1)`, `var(--ant-red-1)`, etc. For semantic colors, use `var(--ant-color-primary-bg)`, `var(--ant-color-success-bg)`, `var(--ant-color-warning-bg)`, `var(--ant-color-error-bg)`.

### Customizing base colors per mode

Antd's default dark algorithm uses pure black (`#000`) for `colorBgLayout`, and the default light algorithm uses a stark off-white. If you want softer, more modern base surfaces, use `lightToken` and `darkToken` on `theme.antd`. These are merged on top of `theme.antd.token` only when the matching mode is active, so you get full per-mode control without juggling two separate theme files:

```yaml
theme:
  antd:
    token:                     # Shared — applied in both modes
      colorPrimary: '#6366f1'
      borderRadius: 8
    lightToken:                # Merged when light mode is active
      colorBgLayout: '#fafafa'
      colorBgContainer: '#ffffff'
    darkToken:                 # Merged when dark mode is active
      colorBgLayout: '#0f1117'
      colorBgContainer: '#18181b'
      colorBgElevated: '#1f2937'
  darkMode: system
```

Tokens to customize for a softer base surface:

| Token | Where it shows up |
|---|---|
| `colorBgLayout` | Page background behind the layout — also applied to the `<html>` element to prevent navigation flash |
| `colorBgContainer` | Card, Table, Input, Modal body fill |
| `colorBgElevated` | Popover, Dropdown, Tooltip-host surfaces |
| `colorText` | Primary text color |
| `colorTextSecondary` | Secondary / muted text |

The pre-hydration script reads `darkToken.colorBgLayout` and `lightToken.colorBgLayout` directly, so the `<html>` background matches your configured color on first paint — there is no flash of `#000` or `#fff` before hydration. If you don't set a `lightToken.colorBgLayout`, light mode keeps the browser default white (today's behavior).

### Per-mode component overrides

`colorBg*` seed tokens don't reach every component — Layout's header/sider and Menu have their own component tokens (`Layout.headerBg`, `Layout.siderBg`, `Menu.darkItemBg`, etc.). Use `darkComponents` and `lightComponents` alongside `darkToken`/`lightToken` to soften these surfaces in the active mode only:

```yaml
theme:
  antd:
    darkToken:
      colorBgLayout: '#0f172a'
      colorBgContainer: '#111a2e'
    darkComponents:
      Layout:
        bodyBg: '#0f172a'
        headerBg: '#0b1120'
        siderBg: '#0b1120'
        triggerBg: '#111a2e'
        triggerColor: '#e2e8f0'
      Menu:
        darkItemBg: '#0b1120'
        darkSubMenuItemBg: '#0b1120'
        darkPopupBg: '#111a2e'
        darkItemSelectedBg: '#1e293b'
        darkItemHoverBg: '#111a2e'
```

`darkComponents` / `lightComponents` are merged per-component (deep at the component name level) on top of the shared `components`, so you only need to specify the per-mode deltas.

See antd's [design token reference](https://ant.design/docs/react/customize-theme#theme) for the full list of tokens you can override.

## Tailwind theme bridge (`theme.tailwind`)

Lowdefy automatically bridges antd design tokens to Tailwind CSS theme variables. This means Tailwind utility classes like `text-primary` or `bg-bg-container` resolve to the current antd theme — including when you switch to dark mode.

### Default bridged tokens

The following Tailwind tokens are mapped to antd CSS variables by default:

| Tailwind class prefix | Maps to antd token |
|---|---|
| `text-primary`, `bg-primary`, `border-primary` | `colorPrimary` |
| `*-primary-hover` | `colorPrimaryHover` |
| `*-primary-active` | `colorPrimaryActive` |
| `*-primary-bg` | `colorPrimaryBg` |
| `*-success` | `colorSuccess` |
| `*-warning` | `colorWarning` |
| `*-error` | `colorError` |
| `*-info` | `colorInfo` |
| `*-text-primary` | `colorText` |
| `*-text-secondary` | `colorTextSecondary` |
| `*-bg-container` | `colorBgContainer` |
| `*-bg-layout` | `colorBgLayout` |
| `*-border` | `colorBorder` |
| `rounded`, `rounded-sm`, `rounded-lg` | `borderRadius` variants |
| `text-sm`, `text-lg` (font-size) | `fontSize` variants |
| `font-sans` | `fontFamily` |

This means you can write:

```yaml
- id: themed_box
  type: Box
  class: "bg-bg-container text-text-primary border border-border rounded-lg p-4"
```

And the colors will automatically match your antd theme, including dark mode.

### Adding custom Tailwind tokens

Use `theme.tailwind` in `lowdefy.yaml` to add custom tokens or override bridge defaults:

```yaml
theme:
  antd:
    token:
      colorPrimary: '#7c3aed'
  tailwind:
    color:
      accent: '#7c3aed'
      surface: '#f8fafc'
      on-surface: '#1e293b'
    spacing:
      section: '3rem'
```

You can then use these in `class`:

```yaml
- id: my_section
  type: Box
  class: "bg-surface text-on-surface p-section"
```

Custom tokens are deep-merged with the default bridge, so all antd-bridged tokens remain available.

### Overriding bridge defaults

To change how a bridge token resolves, set the same key in `theme.tailwind`:

```yaml
theme:
  tailwind:
    color:
      primary: '#ff4d4f'  # Now a static color, no longer follows antd token
```

## Icons (`theme.icons`)

Lowdefy draws icons with [Lucide](https://lucide.dev). An icon name is a semantic name (`edit`), a Lucide name in PascalCase (`Pencil`), or a qualified name (`lucide:Pencil`). The [Icon](/Icon) block describes the three forms and the per-icon settings.

Use semantic names anywhere an icon name is accepted, and in HTML with `data-icon`:

```yaml
- id: edit_button
  type: Button
  properties:
    title: Edit
    icon: edit
- id: note
  type: Html
  properties:
    html: '<i data-icon="info"></i> Saved <span data-tooltip="Saved 2 minutes ago">just now</span>'
```

`theme.icons` sets the icon defaults for the whole app:

```yaml
theme:
  icons:
    set: lucide
    size: 1em
    strokeWidth: 1.75
    nonScalingStroke: true
    aliases:
      invoice: Receipt
      edit: tabler:Pencil
    include:
      - Flag
```

| Key | Default | Description |
| --- | --- | --- |
| `set` | `lucide` | The default icon set. PascalCase names resolve in this set first, then in Lucide. Set it to an installed [icon set](/plugins-icon-sets). |
| `size` | `1em` | Default width and height. `1em` follows the font size, so icons fit text, buttons and menus. |
| `strokeWidth` | `2` | Default line width, in units of the icon's 24px grid. |
| `nonScalingStroke` | `false` | Keep the line width constant in screen pixels at any size. |
| `aliases` | | Add semantic names, or point a built-in one at another icon. |
| `include` | | Icon names to bundle that only appear at runtime. |

An icon's own `size`, `strokeWidth` and `nonScalingStroke` win over these defaults: `icon: { name: edit, strokeWidth: 1 }`.

### Semantic names

Each built-in semantic name draws a Lucide icon:

| Name | Lucide icon | Name | Lucide icon |
| --- | --- | --- | --- |
| `add` | Plus | `info` | Info |
| `add-circle` | CirclePlus | `italic` | Italic |
| `arrow-down` | ArrowDown | `link` | Link |
| `arrow-left` | ArrowLeft | `list` | List |
| `arrow-right` | ArrowRight | `loading` | LoaderCircle |
| `arrow-up` | ArrowUp | `location` | MapPin |
| `attach` | Paperclip | `lock` | Lock |
| `bell` | Bell | `login` | LogIn |
| `bold` | Bold | `logout` | LogOut |
| `bot` | Bot | `mail` | Mail |
| `calendar` | Calendar | `menu` | Menu |
| `camera` | Camera | `message` | MessageSquare |
| `chart` | ChartColumn | `minus` | Minus |
| `check` | Check | `more` | Ellipsis |
| `chevron-down` | ChevronDown | `more-vertical` | EllipsisVertical |
| `chevron-left` | ChevronLeft | `phone` | Phone |
| `chevron-right` | ChevronRight | `print` | Printer |
| `chevron-up` | ChevronUp | `rating-high` | FaceSlightlySmiling |
| `chevrons-left` | ChevronsLeft | `rating-low` | FaceSlightlyFrowning |
| `chevrons-right` | ChevronsRight | `refresh` | RefreshCw |
| `clear` | CircleX | `remove` | CircleMinus |
| `clock` | Clock | `save` | Save |
| `close` | X | `search` | Search |
| `copy` | Copy | `send` | Send |
| `delete` | Trash | `settings` | Settings |
| `document` | FileText | `share` | Share2 |
| `download` | Download | `sidebar-collapse` | PanelLeftClose |
| `drag` | GripVertical | `sidebar-expand` | PanelLeftOpen |
| `edit` | Pencil | `sort` | ArrowUpDown |
| `error` | CircleX | `star` | Star |
| `external-link` | ExternalLink | `strikethrough` | Strikethrough |
| `file` | File | `success` | CircleCheck |
| `filter` | Funnel | `tag` | Tag |
| `folder` | Folder | `theme-dark` | Moon |
| `globe` | Globe | `theme-light` | Sun |
| `grid` | LayoutGrid | `theme-system` | Monitor |
| `heart` | Heart | `unchanged` | CirclePause |
| `help` | CircleQuestionMark | `unlock` | LockOpen |
| `hide` | EyeOff | `upload` | Upload |
| `highlight` | Highlighter | `user` | User |
| `history` | RotateCcwClock | `users` | Users |
| `home` | House | `view` | Eye |
| `icon-missing` | CircleAlert | `warning` | TriangleAlert |
| `image` | Image |  |  |

Ant Design icon names also work and map to the same icons: `check-circle` (CircleCheck), `clock-circle` (Clock), `close-circle` (CircleX), `down` (ChevronDown), `ellipsis` (Ellipsis), `environment` (MapPin), `file-text` (FileText), `info-circle` (Info), `left` (ChevronLeft), `plus` (Plus), `printer` (Printer), `reload` (RefreshCw), `right` (ChevronRight), `setting` (Settings), `up` (ChevronUp).

### Blocks and Ant Design components follow semantic names

Blocks choose their own icons by semantic name: the date pickers use `calendar`, input validation uses `error`, `success`, `warning` and `loading`, selectors use `chevron-down`, `clear` and `check`, and the dark mode toggle uses `theme-light`, `theme-dark` and `theme-system`. Ant Design's own icons go through the same names: the close X on modals, drawers, tags and alerts (`close`), alert and message status icons (`success`, `info`, `warning`, `error`), collapse and menu arrows, pagination arrows, and the button spinner (`loading`).

So an alias restyles your icons and the built-in ones together. This makes every close button a circled X:

```yaml
theme:
  icons:
    aliases:
      close: CircleX
```

A few Ant Design visuals are not icons and stay as Ant Design draws them: Spin, Progress, QRCode, the Empty and Result illustrations, the date picker panel arrows, and the Switch and Timeline loading states.

### Aliases

Alias names are lowercase kebab-case. An alias target is a set name (`Receipt`) or a qualified name (`tabler:Pencil`), never another semantic name. A semantic name resolves through, from lowest to highest precedence:

1. the built-in map above,
2. the `semantic` maps of the default set's plugins, in `plugins` order,
3. `theme.icons.aliases`.

### Icon sets

`theme.icons.set` selects an installed [icon set](/plugins-icon-sets). PascalCase names then resolve in that set first and fall back to Lucide, and the set's own semantic map re-skins the block and Ant Design icons it covers. Semantic names the set leaves out keep their Lucide icons. A qualified name such as `lucide:Pencil` always resolves in its own set.

### Bundling

The build bundles only the icons your config names. An icon name that only exists at runtime — read from state or a request — is not in the config, so list it under `theme.icons.include` to bundle it. A name kept in config data, such as `icon: warning` on a status enum that a template turns into `data-icon="{{ status.icon }}"`, is already in the config and gets bundled.

An unknown icon name at an icon property fails the build, with a suggestion. Old react-icons names such as `AiOutlineUser` fail too; [V6 to V7](/v6-to-v7) shows how to migrate them.

### Icons in HTML

In any HTML string, `<i data-icon="edit"></i>` renders an icon. [HTML attributes](/html-attributes) describes it with the other attributes HTML understands: tooltips, popovers, links and status tags.

## TLDR
  - Configure app theme via `theme.antd` in `lowdefy.yaml`.
  - Seed tokens (`colorPrimary`, `fontSize`, etc.) drive all derived tokens automatically.
  - Use `algorithm: compact` for compact mode. Use `theme.darkMode` for dark mode control.
  - Dark mode defaults to `system` (follows OS preference). Set to `light` or `dark` to lock.
  - Override tokens per component type via `theme.antd.components`.
  - Override tokens per block via `properties.theme`.
  - Use [ConfigProvider](/ConfigProvider) block for scoped theming of block groups.
  - Access tokens in expressions with the `_theme` operator.
  - Icons are Lucide. Use semantic names (`icon: edit`) or Lucide names (`Pencil`), and `data-icon` in HTML; set app-wide `size` and `strokeWidth`, and add names, with `theme.icons`. See [HTML attributes](/html-attributes) for everything HTML understands.
  - Access derived tokens in CSS via `var(--ant-color-primary-hover)`.
  - Tailwind utility classes (`text-primary`, `bg-bg-container`, etc.) automatically reflect the antd theme.
  - Add custom Tailwind tokens via `theme.tailwind` in `lowdefy.yaml`.
