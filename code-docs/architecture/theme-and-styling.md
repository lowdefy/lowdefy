# Theme and Styling Architecture

How Lowdefy integrates Ant Design theming, Tailwind CSS utilities, and custom styling into a unified system.

## Overview

Lowdefy's styling architecture has three layers:

1. **Ant Design theme** — design tokens (colors, radii, fonts) applied via `ConfigProvider`
2. **Tailwind CSS** — utility classes usable in YAML config via the `class` property
3. **Custom CSS** — user-authored `public/styles.css` injected into the build

These are unified through a CSS layer system and an automatic bridge that maps antd design tokens to Tailwind theme variables.

```
lowdefy.yaml
├── theme:
│   ├── antd:        → ConfigProvider tokens (runtime)
│   ├── darkMode:    → 'system' | 'light' | 'dark' (default: 'system')
│   └── tailwind:    → @theme inline vars (build-time)
│
├── blocks:
│   ├── class:       → Tailwind utility classes (slot-targeted with . prefix)
│   └── style:       → inline CSS (slot-targeted with . prefix)
│
└── public/
    └── styles.css   → custom CSS (optional)
```

## CSS Layer Architecture

**File:** `packages/build/src/build/writePluginImports/writeGlobalsCss.js`

The generated `globals.css` declares a strict layer order:

```css
@layer theme, base, antd, components, utilities;
```

| Layer        | Contents                                   | Priority |
| ------------ | ------------------------------------------ | -------- |
| `theme`      | Tailwind theme variables (`@theme inline`) | Lowest   |
| `base`       | Tailwind Preflight (normalize/reset)       | ↓        |
| `antd`       | Ant Design component styles                | ↓        |
| `components` | Lowdefy grid CSS, user `styles.css`        | ↓        |
| `utilities`  | Tailwind utility classes                   | Highest  |

This order ensures:

- Tailwind utilities always win over antd component styles
- Antd styles override Tailwind's base reset
- User custom CSS in `components` layer sits between antd and utilities
- The Lowdefy grid system (`grid.css`) lives in `components`

## Ant Design Theme (`theme.antd`)

### Configuration

The `theme.antd` key in `lowdefy.yaml` maps directly to the antd v6 `ConfigProvider` `theme` prop:

```yaml
# lowdefy.yaml
theme:
  antd:
    token:
      colorPrimary: '#1677ff'
      borderRadius: 8
      fontFamily: 'Inter, sans-serif'
      fontSize: 14
      colorBgContainer: '#ffffff'
      colorBgLayout: '#f5f5f5'
    algorithm: default # or 'dark', 'compact', or ['dark', 'compact']
    components:
      Button:
        colorPrimary: '#ff4d4f'
      Card:
        borderRadiusLG: 12
```

### ConfigProvider Setup

**Files:** `packages/servers/server/client/App.jsx`, `packages/servers/server-dev/client/App.jsx`

The client entry wraps all content in antd's `StyleProvider` and `XProvider` (which extends `ConfigProvider`, adding `@ant-design/x` support):

```javascript
<StyleProvider layer>
  <XProvider
    theme={{
      ...antdConfig, // theme.antd minus the per-mode token/components keys
      token, // resolved by useDarkMode (shared token + light/dark token)
      components, // resolved by useDarkMode
      cssVar: { key: 'lowdefy' },
      hashed: false,
      algorithm, // resolved by useDarkMode
    }}
  >
    {/* app content */}
  </XProvider>
</StyleProvider>
```

Key settings:

- **`cssVar: { key: 'lowdefy' }`** — antd scopes CSS variables to the `.lowdefy` class selector (on `<html>`). The CSS variable **prefix** remains `--ant-` (the default). The `key` controls the class selector for scoping, NOT the variable prefix. So `colorPrimary` becomes `--ant-color-primary` on `.lowdefy`.
- **`hashed: false`** — disables CSS-in-JS hash scoping, making antd styles globally predictable
- **`StyleProvider layer`** — places antd styles in the `antd` CSS layer

### Dark Mode

**File:** `packages/client/src/useDarkMode.js`

Dark mode is managed by the `useDarkMode` hook with a three-tier resolution:

1. **Config lock** — `theme.darkMode` in `lowdefy.yaml` (`'system'` | `'light'` | `'dark'`, defaults to `'system'`). When set to `'light'` or `'dark'`, overrides all user preferences.
2. **User preference** — stored in `localStorage` (`lowdefy_darkMode`) as `'system'`, `'light'`, or `'dark'`. Set by the `SetDarkMode` action.
3. **System preference** — `matchMedia('(prefers-color-scheme: dark)')` with a live `change` event listener that updates in real time when the OS theme changes.

```javascript
const { algorithm, token, components } = useDarkMode({
  antd: lowdefyRef.current.theme?.antd,
  configDarkMode: lowdefyRef.current.theme?.darkMode,
});
// algorithm: resolved antd algorithm functions array, e.g. [defaultAlgorithm, darkAlgorithm]
// token: shared `antd.token` merged with `antd.lightToken` or `antd.darkToken` for the active mode
// components: shared `antd.components` merged with `antd.lightComponents` or `antd.darkComponents`
```

The hook strips `'dark'` from the base algorithm array (it manages dark mode separately) and merges `darkAlgorithm` back when the resolved state is dark. Per-mode `lightToken` / `darkToken` are merged over the shared `token` and per-mode `lightComponents` / `darkComponents` are merged over shared `components`, so users can soften base surfaces (e.g., `colorBgLayout`, `Layout.siderBg`) without maintaining two theme files.

`window.__lowdefy_setDarkMode` is exposed for the `SetDarkMode` action. It accepts a string preference (`'system'`, `'light'`, `'dark'`), writes it to `localStorage`, and triggers a React state update.

When dark mode toggles, `ConfigProvider` re-renders with the new algorithm. Antd's CSS-in-JS regenerates all `--ant-*` CSS variables on `.lowdefy` with dark values. The Tailwind bridge variables (e.g., `--color-bg-layout: var(--ant-color-bg-layout)`) automatically resolve to the new values — no CSS recompilation needed.

#### Dark Mode Flash Prevention

**Files:** `packages/servers/server/src/html/template.js`, `packages/servers/server-dev/src/html/renderDevPage.js`

The server returns an HTML shell with no SSR — React renders entirely client-side, so Ant Design's `ConfigProvider` and its CSS variables aren't available until hydration. On first paint, the browser defaults to a white background, causing a visible flash for dark mode users.

This is solved with two coordinating pieces:

1. **Synchronous inline script in the HTML shell** — Runs before first paint. Reads `configColorMode`, `darkBg` (from `themeConfig.antd.darkToken.colorBgLayout`, default `'#000'`) and `lightBg` (from `themeConfig.antd.lightToken.colorBgLayout`, default `''`) — interpolated server-side via `safeScriptJson` from the `theme.json` build artifact. Mirrors the `useDarkMode` resolution: config → `localStorage('lowdefy_darkMode')` → `prefers-color-scheme: dark`. Applies the resolved bg color to `document.documentElement.style.backgroundColor`. An empty string means no inline style (browser default white).

2. **`useEffect` in `useDarkMode`** — Once React hydrates, actively manages the `<html>` inline background on every `isDark` change: sets the resolved `colorBgLayout` from `antd.darkToken` / `antd.lightToken` (falling back to `'#000'` in dark and unset in light). This handles dark/light toggling and ensures the background stays correct across client-side navigations.

The production server reads `theme.json` once at startup via `lib/build/theme.js` (an `fs.readFileSync` + `serializer.deserialize` loader). The dev server's `renderDevPage.js` reads `build/theme.json` per request, so a config rebuild updates the pre-hydration values without a server restart.

**IMPORTANT:** The inline script's dark mode logic must stay in sync with `useDarkMode.js`. If the resolution priority changes (e.g., new preference tiers), update both.

#### CRITICAL: Single antd Instance Requirement

**Antd's CSS-in-JS (`@ant-design/cssinjs`) uses React context and a shared cache. If multiple copies of antd are loaded, `ConfigProvider`, `StyleProvider`, and `useDarkMode` operate on different contexts — CSS variables are generated by one instance but consumed by another, breaking dark mode and theme propagation.**

Both `server` and `server-dev` have `antd` and `@ant-design/cssinjs` as direct dependencies. This is correct — the published packages need them for pnpm strict mode resolution.

**The singleton risk only exists in the local monorepo dev setup** (`scripts/dev.mjs`), where `rewriteDeps.mjs` rewrites `@lowdefy/*` deps to `link:` paths. Without overrides, pnpm would install a separate npm copy of antd for the dev server while linked `@lowdefy/client` uses the monorepo's copy — two instances.

**Fix:** `rewriteDeps.mjs` has a `SINGLETON_PACKAGES` list (`antd`, `@ant-design/cssinjs`) that adds `pnpm.overrides` entries pointing to the monorepo's `node_modules/` copies. This forces a single instance across the dev server and all linked packages.

**If you add a new package that uses React context across components** (like a UI library), add it to `SINGLETON_PACKAGES` in `scripts/lib/rewriteDeps.mjs`.

#### CRITICAL: Only Component-Generated CSS Variables Exist

Antd v6 with `cssVar` mode only generates CSS variables for tokens that are **actually referenced by rendered antd components**. Seed tokens like `colorBgBase` are used internally by the algorithm to derive other tokens but are NOT exposed as `--ant-color-bg-base` CSS variables.

**Do not use `var(--ant-color-bg-base)` in YAML config or inline styles.** It does not exist at runtime. Use derived tokens that antd components actually reference:

| Token                | CSS Variable                 | Use For          | Available? |
| -------------------- | ---------------------------- | ---------------- | ---------- |
| `colorBgLayout`      | `--ant-color-bg-layout`      | Page backgrounds | Yes        |
| `colorBgContainer`   | `--ant-color-bg-container`   | Card/panel fills | Yes        |
| `colorText`          | `--ant-color-text`           | Primary text     | Yes        |
| `colorTextSecondary` | `--ant-color-text-secondary` | Secondary text   | Yes        |
| `colorBgBase`        | `--ant-color-bg-base`        | —                | **No**     |
| `colorTextBase`      | `--ant-color-text-base`      | —                | **No**     |

If you need a token value in YAML config, use the `_theme` operator instead of `var(--ant-*)` — it reads from the resolved token map directly.

### Algorithm

The `algorithm` property controls antd's visual mode:

```yaml
theme:
  antd:
    algorithm: dark       # Single algorithm
    # or
    algorithm:            # Multiple algorithms combined
      - dark
      - compact
```

Available algorithms: `default`, `dark`, `compact`.

### Token Categories

Antd v6 tokens fall into three levels:

| Level                | Example                         | Scope                   |
| -------------------- | ------------------------------- | ----------------------- |
| **Seed tokens**      | `colorPrimary`, `borderRadius`  | Generate derived tokens |
| **Map tokens**       | `colorPrimaryHover`, `fontSize` | Derived from seeds      |
| **Component tokens** | `Button.colorPrimary`           | Per-component override  |

```yaml
theme:
  antd:
    token:
      # Seed tokens — antd derives hover/active/bg variants automatically
      colorPrimary: '#7c3aed'
      colorSuccess: '#52c41a'
      colorWarning: '#faad14'
      colorError: '#ff4d4f'
      borderRadius: 6
      fontSize: 14

    components:
      # Component-level overrides
      Button:
        colorPrimary: '#1890ff'
        borderRadius: 4
      Input:
        colorBorder: '#d9d9d9'
```

### `_theme` Operator

**File:** `packages/plugins/operators/operators-js/src/operators/client/theme.js`

Access antd token values at runtime in YAML config:

```yaml
blocks:
  - id: heading
    type: Title
    properties:
      content: Welcome
      style:
        color:
          _theme: colorPrimary # resolves to the antd token value

  - id: card
    type: Card
    properties:
      style:
        borderColor:
          _theme: colorBorder
        borderRadius:
          _theme: borderRadius
```

The `_theme` operator reads from `theme.antd.token`. It supports the standard `getFromObject` parameter formats:

```yaml
# Direct key access
_theme: colorPrimary

# Nested access (for component tokens)
_theme:
  key: colorPrimaryHover
  default: '#1677ff'
```

`_theme.dynamic = true` — values update when the theme changes at runtime.

## Tailwind CSS Integration

### How Tailwind Classes Reach the Build

Lowdefy scans YAML config at build time to extract all string content that may contain Tailwind class names, writing per-page HTML files that Tailwind scans:

```
YAML config  →  collectPageContent()  →  lowdefy-build/tailwind/{pageId}.html  →  Tailwind JIT
```

**File:** `packages/build/src/build/collectPageContent.js`

The collector walks every block in the page tree, recursing into `blocks`, `areas`, and `slots`. It extracts all string values from `class` and `properties` (including nested objects and operator branches like `_if.then`/`_if.else`):

```javascript
function collectPageContent(pages) {
  const strings = [];
  walkBlockProperties(pages, strings);
  return strings.join('\n');
}
```

The collected strings are written as per-page HTML files to `lowdefy-build/tailwind/`:

```html
<!-- Generated by Lowdefy build -->
My Page Title Name Enter your name bg-blue-500 text-white ...
```

The `globals.css` declares this directory as a Tailwind source:

```css
@source "../lowdefy-build/tailwind/*.html";
```

Tailwind v4 scans `@source` paths for class candidates during JIT compilation.

### Block Source Scanning

In addition to YAML-derived classes, block plugin JavaScript is also scanned for Tailwind class candidates.

**File:** `packages/build/src/build/writePluginImports/collectBlockSourceContent.js`

At build time, `collectBlockSourceContent()` resolves each block package's real path on disk (following pnpm/yarn symlinks), reads all JS files from the `dist/` directory, and writes the raw content to `lowdefy-build/tailwind/_blocks.html`. This file is picked up by Tailwind via the same `@source "../lowdefy-build/tailwind/*.html"` glob.

This replaces the old `@source "../node_modules/@lowdefy/blocks-*/dist/**/*.js"` approach, which couldn't follow pnpm symlinks to the `.pnpm` store.

**Note:** The `require.resolve` must resolve from the **server directory** (where block packages are installed), not from `@lowdefy/build`'s own location. In pnpm strict isolation, `@lowdefy/build` can't see block packages because they aren't its declared dependencies. The function receives `serverDirectory` and creates a `requireFromServer` for this reason.

### Using Tailwind Classes in YAML

The `class` property accepts three formats:

```yaml
# String — applied to layout wrapper (block slot)
class: 'p-4 bg-bg-container rounded-lg shadow-md'

# Array — joined into a single string
class:
  - p-4
  - bg-bg-container
  - rounded-lg

# Object — targeted to named sub-elements using . prefix
class:
  .block: 'p-4 rounded-lg'        # layout wrapper
  .element: 'text-primary'         # block component root
  .label: 'font-bold text-sm'     # label (input blocks)
```

The `.` prefix identifies slot targets and is stripped during build normalization. Keys without the `.` prefix also work for backward compatibility.

### Build-Time Normalization

**File:** `packages/build/src/build/buildPages/buildBlock/normalizeClassAndStyles.js`

During the build, `normalizeClassAndStyles` normalizes both `class` and `style`:

**Class normalization:**

- String/array → `{ block: value }`
- Object with `.` prefixed keys → strips prefix (`.element` → `element`)

**Style normalization:**

- `properties.style` → merged into `style['.element']` (deprecation migration)
- Plain CSS keys (no `.` prefix) → moved to `block` slot
- `.` prefixed keys → stripped to plain keys (`.element` → `element`)
- Responsive breakpoint keys (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) → throws `ConfigError`
- Nested objects in style values (except operators) → throws `ConfigError`

This ensures the runtime always receives a consistent `{ block, element, label, ... }` shape for both `class` and `style`.

## Antd-to-Tailwind Theme Bridge

### How It Works

The bridge maps antd CSS custom properties to Tailwind theme variables, so Tailwind utility classes like `text-primary` or `bg-bg-container` resolve to the current antd theme:

```
antd ConfigProvider
  ↓ emits CSS vars
--ant-color-primary: #1677ff
  ↓ bridge in @theme inline
--color-primary: var(--ant-color-primary)
  ↓ Tailwind resolves
text-primary → color: var(--color-primary)
```

### Default Bridge Mappings

**File:** `packages/build/src/build/writePluginImports/writeGlobalsCss.js` — `BRIDGE_DEFAULTS`

| Tailwind Token           | CSS Variable             | Antd Source                       |
| ------------------------ | ------------------------ | --------------------------------- |
| `--color-primary`        | `--color-primary`        | `var(--ant-color-primary)`        |
| `--color-primary-hover`  | `--color-primary-hover`  | `var(--ant-color-primary-hover)`  |
| `--color-primary-active` | `--color-primary-active` | `var(--ant-color-primary-active)` |
| `--color-primary-bg`     | `--color-primary-bg`     | `var(--ant-color-primary-bg)`     |
| `--color-success`        | `--color-success`        | `var(--ant-color-success)`        |
| `--color-warning`        | `--color-warning`        | `var(--ant-color-warning)`        |
| `--color-error`          | `--color-error`          | `var(--ant-color-error)`          |
| `--color-info`           | `--color-info`           | `var(--ant-color-info)`           |
| `--color-text-primary`   | `--color-text-primary`   | `var(--ant-color-text)`           |
| `--color-text-secondary` | `--color-text-secondary` | `var(--ant-color-text-secondary)` |
| `--color-bg-container`   | `--color-bg-container`   | `var(--ant-color-bg-container)`   |
| `--color-bg-layout`      | `--color-bg-layout`      | `var(--ant-color-bg-layout)`      |
| `--color-border`         | `--color-border`         | `var(--ant-color-border)`         |
| `--radius`               | `--radius`               | `var(--ant-border-radius)`        |
| `--radius-sm`            | `--radius-sm`            | `var(--ant-border-radius-sm)`     |
| `--radius-lg`            | `--radius-lg`            | `var(--ant-border-radius-lg)`     |
| `--font-size`            | `--font-size`            | `var(--ant-font-size)`            |
| `--font-size-sm`         | `--font-size-sm`         | `var(--ant-font-size-sm)`         |
| `--font-size-lg`         | `--font-size-lg`         | `var(--ant-font-size-lg)`         |
| `--font-family-sans`     | `--font-family-sans`     | `var(--ant-font-family)`          |

### Usage in YAML

Because the bridge maps antd tokens to Tailwind names, utility classes automatically reflect the theme:

```yaml
blocks:
  - id: card
    type: Box
    class: 'bg-bg-container text-text-primary border border-border rounded-lg p-4'
    blocks:
      - id: title
        type: Title
        class:
          .element: 'text-primary'
        properties:
          content: Themed Card
      - id: description
        type: Paragraph
        class:
          .element: 'text-text-secondary text-sm'
        properties:
          content: This card uses antd theme colors via Tailwind utilities.
```

If the antd theme changes (e.g., switching to dark mode), all Tailwind classes automatically update because they reference CSS variables.

## Custom Tailwind Tokens (`theme.tailwind`)

### Extending the Bridge

The `theme.tailwind` key lets you add custom tokens or override bridge defaults:

```yaml
# lowdefy.yaml
theme:
  tailwind:
    color:
      accent: '#7c3aed'
      surface: '#f8fafc'
      'on-surface': '#1e293b'
    spacing:
      section: '3rem'
    shadow:
      card: '0 2px 8px rgba(0, 0, 0, 0.08)'
```

This deep-merges with `BRIDGE_DEFAULTS` via `mergeObjects`:

```javascript
const merged = mergeObjects([{}, BRIDGE_DEFAULTS, tailwindConfig ?? {}]);
```

The merged result generates the `@theme inline` block in `globals.css`:

```css
@theme inline {
  --color-primary: var(--ant-color-primary);
  --color-accent: #7c3aed;
  --color-surface: #f8fafc;
  --color-on-surface: #1e293b;
  --spacing-section: 3rem;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
  /* ... rest of bridge defaults ... */
}
```

You can then use these in YAML:

```yaml
class: 'bg-surface text-on-surface p-section shadow-card'
```

### Overriding Bridge Defaults

To change a bridge mapping, set the same key in `theme.tailwind`:

```yaml
theme:
  tailwind:
    color:
      primary: '#ff4d4f' # Override: no longer follows antd token
```

## Style Property

The `style` property applies inline CSS to a block, with optional slot targeting using `.` prefix keys.

### Simple Style (Block Slot)

Plain CSS properties (without `.` prefix) land in the `block` slot, which every block applies to
its own root element through `blockRootProps`. The layout wrapper (`.lf-col`) never carries them -
it only exists when the block is laid out, and it carries layout alone:

```yaml
blocks:
  - id: sidebar
    type: Box
    style:
      backgroundColor: '#f0f2f5'
      borderRight: '1px solid #d9d9d9'
```

### Slot-Targeted Styles

Use `.` prefixed keys to target specific named parts of a block:

```yaml
blocks:
  - id: my_input
    type: TextInput
    style:
      padding: 16 # plain CSS → block slot → block root element
      .element: # → block component root element
        border: '2px solid blue'
      .label: # → label element (input blocks)
        fontWeight: bold
        color: '#333'
```

Common slot targets:

- `.block` — the layout wrapper div (explicit; also receives plain CSS)
- `.element` — the block component root element
- `.label` — the label element (input blocks)

### `properties.style` Deprecation

Previously, `properties.style` was used for component styling. During build, it is automatically migrated to `style['.element']`:

```javascript
// properties.style → merged into style .element slot
block.style['.element'] = { ...block.properties.style, ...existing };
delete block.properties.style;
```

### Responsive Breakpoints in Style

Responsive breakpoint keys (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) in `style` are no longer supported. The build throws a `ConfigError`:

```yaml
# This will cause a build error:
style:
  xs:
    padding: 8
  md:
    padding: 16

# Use Tailwind classes instead:
class: 'p-2 md:p-4'
```

## Custom CSS (`public/styles.css`)

Users can add a `public/styles.css` file for custom CSS. The build detects it and imports it into the `components` layer (the path is computed relative to the build directory):

```css
@import '../../../public/styles.css' layer(components);
```

This gives custom CSS higher priority than antd styles but lower than Tailwind utilities. If the user needs to override utilities, they can use `!important` or write rules with higher specificity.

The legacy `public/styles.less` is not supported. The build throws a `ConfigError` if it exists:

> `public/styles.less is deprecated. Migrate to: (1) "theme" key in lowdefy.yaml for token overrides (recommended), (2) public/styles.css for custom CSS.`

## Generated `globals.css` Structure

The complete generated file:

```css
/* Generated by Lowdefy build */

/* Layer order — locks cascade priority before Tailwind declares its own layers */
@layer theme, base, antd, components, utilities;

@import 'tailwindcss';
@import '@lowdefy/layout/grid.css';

/* Imported CSS file — when this changes, PostCSS re-runs and Tailwind re-scans @source */
@import './tailwind-candidates.css';

/* User custom styles (only if public/styles.css exists) */
@import '../../../public/styles.css' layer(components);

/* Content sources for Tailwind JIT — block JS content collected at build time */
@source "../lowdefy-build/tailwind/*.html";

/* Themed scrollbars — colors use antd CSS custom properties so they
   auto-swap with dark/light mode */
@layer base {
  /* ... scrollbar-width/scrollbar-color + ::-webkit-scrollbar rules ... */
}

/* Antd-to-Tailwind theme bridge — extends default Tailwind theme with antd design tokens */
@theme inline {
  --color-primary: var(--ant-color-primary);
  --color-primary-hover: var(--ant-color-primary-hover);
  /* ... all bridge + custom tokens ... */
}
```

All `@import` statements come before `@source` and every other statement — the CSS spec only allows `@charset` and an empty `@layer` statement before `@import`, and Vite's CSS pipeline enforces this (it warns and may drop late imports). This is why the layer order declaration is an empty statement at the top and why the user styles import sits above `@source`.

`writeGlobalsCss` also writes two sibling artifacts:

- `layer-order.css` — just the `@layer theme, base, antd, components, utilities;` statement (see "Layer Order: Two-File Pattern" below)
- `tailwind-candidates.css` — an (initially empty) file imported by `globals.css`; the dev server rewrites it to trigger Tailwind recompilation (see "Dev Mode: CSS Hot Reload" below)

The `lowdefy-build/tailwind/` directory contains:

- `{pageId}.html` — per-page content strings (from YAML config)
- `_blocks.html` — block plugin JS content (from `collectBlockSourceContent`)

### Layer Order: Two-File Pattern + Runtime Defense

**Files:** `packages/servers/server/client/main.jsx`, `packages/servers/server/src/html/template.js` (dev: `packages/servers/server-dev/client/main.jsx`, `packages/servers/server-dev/src/html/renderDevPage.js`)

With cascade layers, whichever `@layer` statement the browser sees **first** defines the layer priority. Antd's CSS-in-JS uses `prependQueue` to inject `<style>` tags at the **top** of `<head>` at runtime — if one of those wins the race, `@layer antd` becomes the first-declared (lowest priority) layer and the cascade breaks.

Two coordinating pieces lock the order:

1. **`build/layer-order.css` imported first** — `client/main.jsx` imports it before `App.jsx` and before `globals.css`, so the order declaration is at the front of the Vite CSS output and the cascade priority is locked before antd's `StyleProvider` injects `@layer antd {}`.
2. **Runtime defense in the HTML shell** — `template.js` (prod) and `renderDevPage.js` (dev) embed a synchronous inline `<script>` that prepends a `<style id="__lf-layer-order">` element with the order declaration, and a `MutationObserver` keeps it as the first `<head>` child even when antd's CSS-in-JS prepends its own `<style>` tags. The observer fires before paint, so the browser never sees the wrong cascade order.

The same HTML shell also contains the dark mode flash prevention script (see "Dark Mode Flash Prevention" above).

In production, Vite bundles all imported CSS (layer-order, globals, block package CSS) into a single content-hashed CSS asset linked from the HTML template. In dev, CSS is served and hot-replaced through Vite's module graph.

## Dev Mode: CSS Hot Reload

There is no standalone CSS compile step in dev. `globals.css` is in Vite's dev module graph (imported by `client/main.jsx`), so Vite's CSS pipeline runs PostCSS + Tailwind (`@tailwindcss/postcss`, read automatically from `postcss.config.cjs`) whenever `globals.css` or anything it imports changes, and hot-replaces the result in the browser.

Because Tailwind's `@source` HTML files are *not* in Vite's module graph, writing them alone doesn't trigger recompilation. The trigger is `build/tailwind-candidates.css` — an otherwise-empty file that `globals.css` imports. Rewriting it (with a timestamp comment) invalidates the CSS module, which re-runs Tailwind, which re-scans the `@source` files.

### Skeleton Build Path (initial build + full config changes)

1. **Skeleton build** (`shallowBuild`) collects strings from all pages via `collectPageContent()` before stripping page content, stores them in `context.tailwindContentMap`
2. **`writeGlobalsCss`** writes per-page HTML files to `lowdefy-build/tailwind/{pageId}.html`, plus `globals.css`, `layer-order.css`, and `tailwind-candidates.css` — Vite picks the changes up through the module graph

### JIT Build Path (on-demand page load)

1. **Page request** triggers `buildPageIfNeeded` in `lib/server/jitPageBuilder.js`
2. **`writePageJit`** writes the page JSON artifacts AND collects strings via `collectPageContent([page])`, writing them to `lowdefy-build/tailwind/{pageId}.html`
3. **`jitPageBuilder` touches `build/tailwind-candidates.css`** so Vite re-runs Tailwind for classes the JIT build discovered; the updated CSS hot-replaces via HMR

### File Change Path (editing page YAML in dev)

1. **`lowdefyBuildWatcher`** detects the change
2. For page-only changes: `updatePageTailwindCss` (`manager/utils/updatePageTailwindCss.mjs`) parses the changed YAML, extracts all strings, writes them to the page's tailwind HTML file, then touches `tailwind-candidates.css`
3. For skeleton changes (lowdefy.yaml, files in `skeletonSourceFiles.json`): runs a full `lowdefyBuild`, which rewrites `globals.css` and the per-page HTML files via `writeGlobalsCss`

## Complete Example

```yaml
# lowdefy.yaml
lowdefy: 4.0.0
name: Themed App

theme:
  antd:
    token:
      colorPrimary: '#7c3aed'
      borderRadius: 8
      fontSize: 14
    algorithm: default
    components:
      Button:
        borderRadius: 20
  tailwind:
    color:
      accent: '#7c3aed'
      surface: '#f8fafc'

pages:
  - id: home
    type: PageHeaderMenu
    properties:
      title: My App
    areas:
      content:
        blocks:
          - id: hero
            type: Box
            class: 'bg-surface p-8 rounded-lg text-center'
            blocks:
              - id: heading
                type: Title
                class:
                  .element: 'text-primary'
                properties:
                  content: Welcome
                  level: 1

              - id: subtitle
                type: Paragraph
                class:
                  .element: 'text-text-secondary text-lg'
                properties:
                  content: Built with antd + Tailwind

          - id: cards_row
            type: Box
            layout:
              gap: 16
            blocks:
              - id: card_1
                type: Card
                layout:
                  span: 8
                  xs: { span: 24 }
                class: 'shadow-md hover:shadow-lg transition-shadow'
                properties:
                  title: Feature One

              - id: card_2
                type: Card
                layout:
                  span: 8
                  xs: { span: 24 }
                class: 'shadow-md hover:shadow-lg transition-shadow'
                properties:
                  title: Feature Two

              - id: card_3
                type: Card
                layout:
                  span: 8
                  xs: { span: 24 }
                class: 'shadow-md hover:shadow-lg transition-shadow'
                properties:
                  title: Feature Three

          - id: themed_button
            type: Button
            style:
              .element:
                backgroundColor:
                  _theme: colorPrimary
            properties:
              title: Get Started
              type: primary
```

## Key Files

| File                                                                        | Purpose                                                                                            |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `packages/build/src/build/writePluginImports/writeGlobalsCss.js`            | Generates `globals.css` with layer order, bridge, and sources; writes per-page tailwind HTML files |
| `packages/build/src/build/writePluginImports/collectBlockSourceContent.js`  | Collects block plugin JS content for Tailwind scanning (follows symlinks)                          |
| `packages/build/src/build/collectPageContent.js`                            | Extracts all string content from page blocks for Tailwind scanning                                 |
| `packages/build/src/build/jit/writePageJit.js`                              | JIT: writes page artifacts + per-page tailwind HTML file                                           |
| `packages/build/src/build/buildPages/buildBlock/normalizeClassAndStyles.js` | Normalizes `class`/`style` at build time (dot-prefix stripping, slot partitioning)                 |
| `packages/plugins/operators/operators-js/src/operators/client/theme.js`     | `_theme` operator implementation                                                                   |
| `packages/servers/server/src/html/template.js`                              | Production HTML shell — layer order + dark mode flash prevention (inline scripts)                  |
| `packages/servers/server-dev/src/html/renderDevPage.js`                     | Dev HTML shell — same inline scripts, reads `theme.json` per request                               |
| `packages/servers/server/lib/build/theme.js`                                | Reads + deserializes `theme.json` at startup (used by `renderPage` for the pre-hydration scripts)  |
| `packages/servers/server/client/main.jsx`                                   | Client entry — imports `layer-order.css` first, then `globals.css` (dev: `server-dev/client/main.jsx`) |
| `packages/servers/server/client/App.jsx`                                    | StyleProvider + XProvider setup (dev: `server-dev/client/App.jsx`)                                 |
| `packages/servers/server/postcss.config.cjs`                                | `@tailwindcss/postcss` — read automatically by Vite's CSS pipeline                                 |
| `packages/servers/server-dev/lib/server/jitPageBuilder.js`                  | JIT page build — touches `tailwind-candidates.css` to trigger CSS recompilation                    |
| `packages/servers/server-dev/manager/utils/updatePageTailwindCss.mjs`       | Hot-reload: parses changed YAML, updates tailwind HTML files, touches `tailwind-candidates.css`    |
| `packages/client/src/useDarkMode.js`                                        | Dark mode hook (localStorage + system preference + SetDarkMode action)                             |
| `packages/layout/src/grid.css`                                              | Lowdefy grid CSS (in `components` layer)                                                           |
| `packages/build/src/lowdefySchema.js`                                       | Schema definitions for `theme`, `class`, `style`                                                   |

## Design Decisions

### Why CSS Layers?

Without layers, antd's CSS-in-JS styles and Tailwind utilities compete unpredictably. The explicit `@layer` declaration locks the cascade: antd always wins over Preflight, Tailwind utilities always win over antd. No `!important` wars.

### Why Bridge via CSS Variables?

The bridge uses `var(--ant-*)` references rather than static values. When antd's ConfigProvider updates tokens (e.g., dark mode toggle), all Tailwind utilities that reference those tokens update automatically — no rebuild needed.

### Why `hashed: false` + `cssVar`?

- `hashed: false` removes random class name hashing, making antd styles debuggable and predictable
- `cssVar: { key: 'lowdefy' }` enables antd's CSS variable mode, which emits `--ant-*` custom properties that the Tailwind bridge can reference

### Why Collect Content Strings at Build Time?

Tailwind v4 uses JIT compilation — it only generates CSS for classes it finds in source files. Since Lowdefy config is YAML (not JS/HTML), Tailwind can't scan it natively. The build extracts all string content from block properties and class values, writes them to per-page HTML files in `lowdefy-build/tailwind/`, which Tailwind scans via `@source`. Per-page files (rather than a single file) allow targeted updates when individual pages change.

### Why Not Responsive `style`?

Responsive breakpoint keys in inline `style` were removed because:

- Inline styles can't use media queries
- The old system required JavaScript to switch styles at breakpoints
- Tailwind responsive prefixes (`md:p-4`, `lg:text-lg`) are more ergonomic and pure CSS

## Debugging Guide: CSS Issues in External Repos

When CSS/theming/dark mode works in the Lowdefy monorepo dev server but fails in an external repo's production build, check these areas in order:

### 1. Block JS Tailwind Scanning (`collectBlockSourceContent`)

**File:** `packages/build/src/build/writePluginImports/collectBlockSourceContent.js`

The build collects Tailwind class candidates from block plugin JS files and writes them to `_blocks.html`. If this fails silently (`require.resolve` can't find block packages), Tailwind utility classes used in block React code won't be in the CSS output.

**Check:** Does `.lowdefy/server/lowdefy-build/tailwind/_blocks.html` exist and have content? If empty or missing, the `createRequire` resolution context is wrong — it must resolve from the server directory, not from inside `@lowdefy/build`.

**Dev vs Prod:** In the monorepo, `@lowdefy/build` runs from source where all workspace packages are accessible. In production, it runs from `node_modules/` where pnpm strict isolation may prevent cross-package resolution.

### 2. Antd Singleton

Multiple antd instances break ConfigProvider's CSS variable generation — dark mode and theming silently fail (some components respond, others don't).

**Check:** In `.lowdefy/server/node_modules/`, verify all antd symlinks resolve to the same physical path:

```bash
# Should all show the same real path
node -e "console.log(require('fs').realpathSync('node_modules/antd'))"
ls -la node_modules/.pnpm/@lowdefy+client*/node_modules/antd
ls -la node_modules/.pnpm/@lowdefy+blocks-antd*/node_modules/antd
```

**Dev vs Prod:** The monorepo dev server uses `SINGLETON_PACKAGES` in `scripts/lib/rewriteDeps.mjs` to force `pnpm.overrides` for antd. Production CLI builds do NOT apply this — they rely on exact version pinning (all packages pin `antd@6.3.1`) for natural deduplication.

**Risk:** Custom plugins with different antd version specs can introduce duplicates. The production build has no `pnpm.overrides` safety net.

**Workspace edge case:** If the external repo's `pnpm-workspace.yaml` includes `.lowdefy/*` as a workspace member (e.g., `app/.lowdefy/*`), pnpm resolves the server's dependencies from the workspace root's `.pnpm` store instead of a local one. This is usually fine but can cause version conflicts with other workspace packages.

### 3. CSS Layer Order

**File:** `packages/servers/server/src/html/template.js`

antd's CSS-in-JS prepends `<style>` tags to `<head>` at runtime — if one of them declares `@layer antd` before the browser has seen the order declaration, antd becomes the lowest-priority layer and Tailwind utilities/antd styles get unpredictable priority. The HTML shell's inline script prepends a `<style id="__lf-layer-order">` element with the order declaration and a `MutationObserver` keeps it as the first `<head>` child.

**Check:** View page source, confirm the layer-order inline `<script>` appears before the CSS `<link>` tags. In DevTools, confirm `<style id="__lf-layer-order">` is the first child of `<head>`.

### 4. Missing or Stale CSS Asset (Production)

Vite bundles all imported CSS — including block packages' plain CSS and CSS modules, which resolve natively under Vite (no `transpilePackages`-style allowlist) — into a single content-hashed asset listed in `dist/client/.vite/manifest.json`. The server reads the manifest **once at startup** (`src/html/getAssets.js`), so an in-place deploy that rebuilds without restarting the server serves stale (or 404ing) asset URLs.

**Check:** Does `dist/client/.vite/manifest.json` have a `client/main.jsx` entry with a `css` array? Does the `<link rel="stylesheet">` in the page source point to a file that exists in `dist/client/assets/`? If not, rebuild the client and restart the server.

### 5. Dark Mode Toggle Chain

The `SetDarkMode` action calls `window.__lowdefy_setDarkMode(preference)` with a string (`'system'`, `'light'`, `'dark'`), which is exposed by the `useDarkMode` hook in `@lowdefy/client`. This writes to `localStorage` and triggers a React state update → ConfigProvider re-renders with the resolved algorithm → `--ant-*` CSS variables update globally.

The hook also listens for OS theme changes via `matchMedia('(prefers-color-scheme: dark)')` `change` event, so switching the OS dark mode setting updates the app live when the preference is `'system'`.

**Check:**

- Is `SetDarkMode` in the build's types manifest? (It should be mandatory — see `buildTypes.js`)
- In browser console: does `window.__lowdefy_setDarkMode` exist? (Should accept a string, not boolean)
- What is the config-level `theme.darkMode`? If `'light'` or `'dark'`, user toggle is overridden.
- After toggling: do `--ant-*` CSS variables on `.lowdefy` change? (Inspect `<html class="lowdefy">` computed styles)
- Does `<html>` have an inline `background-color: #000` in light mode? If so, the `useDarkMode` effect didn't run — the app may not be hydrating correctly.

### 6. AgGrid-Specific Dark Mode

**File:** `packages/plugins/blocks/blocks-aggrid/src/theme/themeLowdefy.js`

AgGrid dark mode is driven by **AG Grid's Theming API**, not by CSS. `themeLowdefy.js` builds each block's theme object with `withParams`, where every colour is a `var(--ant-*)` reference (`antdParams`). AG Grid emits those references as `--ag-*` custom properties on the grid root, so when antd regenerates its variables on a dark-mode change the grid follows with no JS.

`ag-grid-antd.module.css` (`.antdTheme`) carries **no** `--ag-*` mappings any more — its colour block was deleted in the v33 move, because the Theming API honours `--ag-*` inherited from an ancestor and the module would have silently overridden every theme parameter it duplicated. The module now holds only structural helpers (flex cell layout, `.lf-ellipsis-N`, the paragraph-input fix, the empty-overlay colour, per-legacy-theme avatar sizing). See `code-docs/plugins/blocks/aggrid.md`.

**Check:** In DevTools, inspect the grid root (`.ag-root-wrapper`) and confirm `--ag-background-color` etc. resolve to the current `--ant-*` values. If the `--ag-*` properties are absent, the block is not receiving a `theme` object; if they are present but resolve to nothing, the `--ant-*` variables are not being generated (see items 2 and 5). Grepping the built CSS for `--ag-*` mappings is **not** a valid check — there are none.

Browser chrome inside the grid (scrollbars, native controls) follows `color-scheme`, which `browserColorScheme: 'inherit'` defers to the document. `@lowdefy/client`'s dark-mode effect and each server's pre-hydration inline script set `document.documentElement.style.colorScheme` from the resolved mode. If grid scrollbars render light in a dark app, check that property on `<html>` rather than anything in the grid.
