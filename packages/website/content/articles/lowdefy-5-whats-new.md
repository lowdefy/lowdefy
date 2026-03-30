---
title: "Lowdefy v5: What's New"
subtitle: 'Tailwind CSS, dark mode, keyboard shortcuts, Ant Design v6, 15 new blocks, and an AI-powered upgrade command'
authorId: 'gerrie'
publishedAt: '2026-03-29'
readTimeMinutes: 12
tags:
  - 'Release'
  - 'Ant Design'
  - 'Tailwind'
draft: false
---

Lowdefy v5 modernizes the stack. Tailwind CSS on every block. Dark mode out of the box. Keyboard shortcuts. A component library upgrade from Ant Design v4 to v6. Moment.js replaced with dayjs. The layout grid rewritten in pure CSS. Areas renamed to slots. 15 new blocks.

This is a major release with breaking changes. Every future release ships with an upgrade command that handles migration through a set of prompts that automates migration though AI.

## Tailwind on Every Block

Every block accepts a [`class`](https://docs.lowdefy.com/custom-styling) property. Tailwind CSS ships built in; no setup, no configuration file, no PostCSS config.

```yaml
- id: hero_card
  type: Card
  class: 'shadow-xl rounded-2xl hover:shadow-2xl transition-shadow'
  properties:
    title: Welcome
```

`class` takes a string, an array, or an object that targets specific parts of a block:

```yaml
- id: my_card
  type: Card
  class:
    .element: 'shadow-lg'
    .header: 'bg-gray-100 dark:bg-gray-800'
    .body: 'p-8'
```

Responsive prefixes work as expected:

```yaml
- id: my_box
  type: Box
  class: 'p-4 sm:p-8 lg:p-16'
```

Tailwind classes in property strings work too. The build scans HTML content in block properties and extracts classes automatically:

```yaml
- id: status_message
  type: Html
  properties:
    html: |
      <span class="text-sm font-semibold text-success">● Online</span> —
      <span class="text-text-secondary">All systems operational</span>
```

A safelist option covers dynamic class construction:

```yaml
# lowdefy.yaml
theme:
  tailwind:
    safelist:
      - 'text-success'
      - 'text-error'
      - 'text-warning'
```

During development, changing a Tailwind class compiles CSS standalone and refreshes styles on the next reload, no full Next.js rebuild.

Under the hood, v5 pre-declares a CSS layer order: `@layer theme, base, antd, components, utilities`, so Tailwind utilities always override Ant Design styles cleanly. No specificity battles.

## Dark Mode

Dark mode follows the user's OS preference by default. No config needed. If the system is dark, the app is dark. Every component, every design token switches automatically and updates live when the system preference changes.

[Page blocks](https://docs.lowdefy.com/PageHeaderMenu) ship with a built-in toggle. One property adds a sun/moon/system button to the header:

```yaml
- id: my_page
  type: PageHeaderMenu
  properties:
    darkModeToggle: true
```

The toggle cycles through light, dark, and system modes. The user's preference persists to localStorage.

Lock the mode for all users when the [design requires it](https://docs.lowdefy.com/theming):

```yaml
# lowdefy.yaml
theme:
  darkMode: light # 'system' (default), 'light', or 'dark'
```

The [`SetDarkMode`](https://docs.lowdefy.com/SetDarkMode) action controls dark mode programmatically:

```yaml
- id: theme_switch
  type: Switch
  events:
    onChange:
      - id: toggle_dark
        type: SetDarkMode
        params:
          darkMode: dark # or 'light', 'system' — omit params to cycle
```

The [`_media`](https://docs.lowdefy.com/_media) operator exposes both the effective state and the user's preference:

```yaml
- id: logo
  type: Img
  properties:
    src:
      _if:
        test:
          _media: darkMode # boolean — true when dark is active
        then: /logo-dark.png
        else: /logo-light.png
```

The build generates a theme bridge that maps antd's design tokens to Tailwind theme values. Colors like `text-primary`, `bg-bg-container`, and `border-border` track the active tokens. When dark mode activates, antd's token derivation changes every color, and the Tailwind utilities follow. No `dark:` prefix needed for token-aligned colors:

```yaml
# These classes adapt to the active mode automatically
class: 'bg-bg-container text-text-primary border border-border'
```

## Design Tokens

Set a few seed tokens, and the framework derives all related values:

```yaml
theme:
  antd:
    token:
      colorPrimary: '#6366f1'
      borderRadius: 8
      fontSize: 14
    algorithm: compact
    components:
      Button:
        fontWeight: 700
      Card:
        headerBg: '#f5f5f5'
```

The build writes the theme as a JSON artifact, the API serves it alongside the root config, and the runtime applies it through antd's `ConfigProvider` with CSS Variables mode. No Less, no build-time style compilation. Tokens resolve to CSS custom properties at runtime.

The [`_theme`](https://docs.lowdefy.com/_theme) operator reads any token value in expressions:

```yaml
properties:
  color:
    _theme: colorPrimary
```

Tokens are also available as CSS variables: `var(--ant-color-primary)`, `var(--ant-color-bg-container)`, and the full token set.

The [`ConfigProvider`](https://docs.lowdefy.com/ConfigProvider) block scopes a theme to its children; a different algorithm, primary color, or component overrides for a section of the app. Combine `dark` and `compact` algorithms for dense dark layouts.

## Keyboard Shortcuts

One line adds a keyboard shortcut to any [event](https://docs.lowdefy.com/events-and-actions):

```yaml
- id: search_button
  type: Button
  properties:
    title: Search
  events:
    onClick:
      shortcut: mod+K
      try:
        - id: open_search
          type: CallMethod
          params:
            blockId: search_modal
            method: toggleOpen
```

`mod+K` renders as Cmd+K on Mac, Ctrl+K on Windows. The framework handles platform detection and displays the correct symbols.

Shortcuts work on any block, any event. Blocks like [`Button`](https://docs.lowdefy.com/Button), [`Menu`](https://docs.lowdefy.com/Menu), and [`Tabs`](https://docs.lowdefy.com/Tabs) render a visual shortcut badge automatically. Key sequences are supported: `g i` means press g, then i within one second. See the dedicated [keyboard shortcut section](https://docs.lowdefy.com/keyboard-shortcuts) in the Lowdefy docs.

## Client-Side Search

The [`Search`](https://docs.lowdefy.com/Search) block provides command-palette style search that runs entirely client-side. A build transformer generates a static search index from your pages. Fuzzy matching, filtering, highlighted results.

## New Blocks

15 new blocks join the library:

- [**DropdownMenu**](https://docs.lowdefy.com/DropdownMenu): navigation dropdowns. A user avatar that opens a menu with Profile, Settings, Logout. Each item links to a page or triggers an action. Keyboard shortcuts on individual items.
- [**DropdownButton**](https://docs.lowdefy.com/DropdownButton): action dropdowns. A primary Save button with a dropdown for Save as Draft and Publish. Split-button mode puts the primary action on the button face, alternatives in the dropdown.
- [**Calendar**](https://docs.lowdefy.com/Calendar): inline calendar with date selection. Full-screen or card-size modes, year mode showing month grid, custom cell rendering, disabled dates.
- **[Splitter](https://docs.lowdefy.com/Splitter)**: resizable split panes.
- **[FloatButton](https://docs.lowdefy.com/FloatButton)**: floating action buttons.
- **[Tour](https://docs.lowdefy.com/Tour)**: step-by-step guided tours.
- **[QRCode](https://docs.lowdefy.com/QRCode)**: QR code generation.
- **[Watermark](https://docs.lowdefy.com/Watermark)**: background watermarks on content areas.
- **[SegmentedSelector](https://docs.lowdefy.com/SegmentedSelector)**: segmented control input.
- **[ColorSelector](https://docs.lowdefy.com/ColorSelector)**: color picker input using antd's native component, replaces the separate `@lowdefy/blocks-color-selectors` package.
- **[Steps](https://docs.lowdefy.com/Steps)**: step indicators and progress tracking.
- **[ConfigProvider](https://docs.lowdefy.com/ConfigProvider)**: scope theme tokens and algorithms to a section of the app.
- **[Masonry](https://docs.lowdefy.com/Masonry)**: masonry grid layout.
- **[MasonryList](https://docs.lowdefy.com/MasonryList)**: masonry grid layout as a List.

Avatar gains [group support](https://docs.lowdefy.com/Avatar), pass an `avatars` array with `maxCount` for data-driven avatar groups with `+N` overflow.

## Unified Style Property

The [`style`](https://docs.lowdefy.com/custom-styling) property replaces both the old `style` and `styles` (plural). Use `.`-prefixed keys to target specific parts of a block:

```yaml
- id: my_card
  type: Card
  style:
    .header:
      backgroundColor: '#f5f5f5'
    .body:
      padding: 16
```

Flat usage without `.` keys normalizes to `.block` for backward compatibility:

```yaml
style:
  marginTop: 20 # Equivalent to .block: { marginTop: 20 }
```

The `class` property uses the same `.`-prefixed keys:

```yaml
class:
  .header: 'bg-gray-100'
  .body: 'p-8'
```

## Slots

Block container regions are renamed from `areas` to `slots`:

```yaml
# v4
- id: my_card
  type: Card
  areas:
    extra:
      blocks:
        - id: my_tag
          type: Tag

# v5
- id: my_card
  type: Card
  slots:
    extra:
      blocks:
        - id: my_tag
          type: Tag
```

The `blocks:` shorthand still works as before, it auto-maps to `slots.content.blocks`. Only explicit `areas:` references need renaming. The build warns in development and errors in production if the old key is detected.

## Ant Design v6

The component library upgrades from Ant Design v4 to v6. This brings CSS-in-JS with CSS Variables mode, tree-shaken component styles, algorithm-driven theming (dark, compact, or both), and full token derivation. The old Less-based styling pipeline is removed entirely.

Block API changes where Ant Design renamed props:

- Modal, Drawer, Tooltip, Popover, Popconfirm: `visible` → `open`
- All form inputs (16 blocks): `bordered: false` → `variant: 'borderless'`
- Tabs: `tabPosition` → `tabPlacement`
- Carousel: `dotPosition` → `dotPlacement`
- Progress: `gapPosition` → `gapPlacement`
- Button: `type`/`danger` → `color`/`variant`
- Collapse: `expandIconPosition` → `expandIconPlacement`
- Divider: `type`/`orientation` renamed for clarity
- Menu, Breadcrumb: children patterns replaced with `items` array

The Comment block is removed, Ant Design v6 dropped it.

## Moment.js → Dayjs

The `_moment` operator is renamed to [`_dayjs`](https://docs.lowdefy.com/_dayjs). Moment.js (~300KB) is replaced with dayjs (~7KB), same API surface, fraction of the bundle size. All five date picker blocks use dayjs natively through Ant Design v6.

22 common locales ship pre-bundled. The `humanizeDuration` thresholds parameter is dropped (dayjs uses global defaults).

## Layout Grid

The layout grid no longer depends on Ant Design. It's reimplemented in pure CSS with CSS custom properties. A 24-column grid with responsive breakpoints aligned to Tailwind defaults:

| Breakpoint | Width       |
| ---------- | ----------- |
| xs         | 0 (default) |
| sm         | 640px       |
| md         | 768px       |
| lg         | 1024px      |
| xl         | 1280px      |
| 2xl        | 1536px      |

The `layout` property on blocks is unchanged. The `xxl` breakpoint is renamed to `2xl`. Layout properties drop the `content` prefix: `contentGutter` → `gap`, `contentAlign` → `align`, `contentJustify` → `justify`, `contentDirection` → `direction`, `contentWrap` → `wrap`, `contentOverflow` → `overflow`.

## Page Block Updates

Page blocks ([`PageHeaderMenu`](https://docs.lowdefy.com/PageHeaderMenu), [`PageSiderMenu`](https://docs.lowdefy.com/PageSiderMenu)) gain new built-in features:

- **Dark mode toggle**: `darkModeToggle: true` renders a sun/moon switcher in the header that cycles through light, dark, and system modes
- **Logo slot**: dedicated logo area with light/dark variants
- **Profile**: `profile.avatar` renders a user avatar in the header (image, initials, or icon). `profile.links` adds a dropdown menu with navigation items, dividers, and keyboard shortcuts, compatible with `_menu` operator output
- **Notifications**: `notifications.link` renders a bell icon that navigates to a page or URL. `notifications.count` shows a badge number, `notifications.dot` shows a dot indicator instead
- **Automatic theme inheritance**: page chrome follows the app's design tokens. Per-component `header.theme`, `sider.theme`, and `menu.theme` props are removed, dark mode is handled globally. Inline style props (`header.style`, `footer.style`, etc.) are replaced by CSS slot keys

## Upgrade CLI Command

Every future Lowdefy release ships with:

```bash
npx lowdefy upgrade
```

The command detects your current version, identifies changes, and generates codemod prompts. v5 ships with 25 codemods covering every breaking change. Feed them to Claude Code, paste into any AI tool, or follow as a manual guide. Multi-version jumps run intermediate codemods in order. Upgrading from v5 to v7 runs v5-to-v6 first, then v6-to-v7 for simplifying all future version upgrades.

For the v4 to v5 migration, see the [full migration guide](https://docs.lowdefy.com/v4-to-v5).

## Stack Modernization

- **Next.js 16**: with Turbopack as default bundler
- **React 19 ready**: all 101 block components migrated from `defaultProps` to runtime defaults
- **Build system**: single-pass tree walker for ref resolution, eliminates redundant JSON serialization
- **Bundle size**: ~293KB reduction from the moment.js removal alone, plus tree-shaken component CSS from Ant Design v6
- **Emotion removed**: the CSS-in-JS runtime (`@emotion/css`, `makeCssClass`) is replaced by Ant Design's built-in CSS variables and Tailwind

## Plugin Updates

- **ECharts v6**: upgraded to echarts v6.0.0 with reworked responsive chart sizing for flex containers
- **AG Grid**: follows the antd theme automatically via CSS variables, switching with dark mode. Explicit dark variant blocks (AgGridAlpineDark, AgGridBalhamDark, etc.) are removed
- **AWS SDK v3**: S3 presigned URL operations migrated from the deprecated aws-sdk v2 to modular @aws-sdk v3. No config changes required
- **`_menu` operator**: returns the `links` array directly instead of the full menu object, and supports dot-path access like `_menu: profile_menu.0.pageId`
- **Removed packages**: `@lowdefy/blocks-algolia` (replaced by the Search block), `@lowdefy/blocks-color-selectors` (ColorSelector moved to blocks-antd), `@lowdefy/operators-moment` (replaced by `_dayjs`)

## Developer Experience

- **ErrorBar**: the dev server shows build errors and warnings in a fixed bottom bar, visible without checking the terminal
- **Better build errors**: schema validation errors include the property name, style errors suggest dot-prefixed CSS slot keys, and YAML parse errors surface immediately instead of producing cryptic failures downstream
- **Portal ErrorBoundary**: portal-based blocks (Modal, Drawer, Message, Notification, Tour) are wrapped in error boundaries so a rendering error in a portal no longer crashes the entire app

## Documentation

Block docs are generated from schemas, what you read matches what the framework accepts. Every block page includes live examples showing properties, events, and CSS keys. The [docs](https://docs.lowdefy.com) themselves run on Lowdefy v5 with local-first search, dark mode, and the same styling available in your apps.

## What's Next

**Modules.** Composable, shareable pieces of Lowdefy config. Build a CRM module once, drop it into any app. The config-first equivalent of npm packages for business logic.

**Agents.** Define AI agents in config that use your app's APIs and auth. Include a chat interface in your Lowdefy apps that uses Lowdefy Agents to provide custom AI interfaces with minimal setup, executing the same business logic as the rest of your apps.

**Agent Mode.** Enable your apps to render as markup: text that's easy for LLMs to interpret with no javascript side effects or information hidden in a modal. Authenticate AI agents with Lowdefy user roles, and allow them to execute page events, modify forms, or answer questions from existing Lowdefy dashboards. The same config renders both a web app UI and an LLM-friendly interface.

## Upgrading from v4

See the full [v4 to v5 migration guide](https://docs.lowdefy.com/v4-to-v5).
