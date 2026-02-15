# Ant Design v6 Upgrade Plan

> Upgrading Lowdefy from antd 4.24.14 → antd 6.x (latest), with architectural
> improvements to styling, slots, class mapping, theming, and multi-component-library
> support (Tailwind, shadcn, etc.)

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Antd v6 Upgrade — Breaking Changes](#2-antd-v6-upgrade--breaking-changes)
3. [Block Property Updates](#3-block-property-updates)
4. [New Blocks to Add](#4-new-blocks-to-add)
5. [Styling Overhaul — Remove makeCssClass, Add `class` Property](#5-styling-overhaul--remove-makecssclass-add-class-property)
6. [Rename `areas` → `slots`](#6-rename-areas--slots)
7. [Layout — Minimal Ant 6 Adjustments](#7-layout--minimal-ant-6-adjustments)
8. [Style Variables — Adopt Antd v6 Design Token System](#8-style-variables--adopt-antd-v6-design-token-system)
9. [Tailwind & Multi-Component-Library Support](#9-tailwind--multi-component-library-support)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Current State Summary

| Concern | Current (v4) | Target (v6) |
|---------|-------------|-------------|
| Antd version | 4.24.14 | 6.3.0+ (latest) |
| @ant-design/icons | 4.8.0 | 6.1.0+ |
| Styling engine | Less + @emotion/css (`makeCssClass`) | Antd v6 CSS-in-JS (CSS Variables mode, tree-shaken, `@layer antd`) |
| Style imports | Per-component `.less` files built at build-time | None — antd v6 injects per-component CSS on first render automatically |
| Theme vars | Less variables (`@primary-color`) overridden in `public/styles.less` | ConfigProvider `theme.token` system |
| Date library | Moment.js (2.29.4) | Day.js (antd v6 default) |
| Block nesting key | `areas` | `slots` (with backwards-compat swap at build time) |
| Class mapping | None (only inline `style` objects via `properties.style`) | New `class` property with sub-slot mapping |
| CSS framework | None | Tailwind CSS support (opt-in) |
| React | 18.2.0 | 18.2.0+ (v6 requires React 18+, supports 19) |
| Next.js | 13.5.4 | Keep 13.x for now (separate upgrade) |

### Current Styling Pipeline

```
YAML config → build collects .less imports → writeStyleImports generates styles.less
→ next-with-less compiles Less at build time → @emotion/css generates runtime classes
→ blocks call methods.makeCssClass([...styleObjects]) → CSS class string
```

**Key files:**
- `block-utils/makeCssClass.js` — wraps `@emotion/css` + `mediaToCssObject`
- `block-utils/mediaToCssObject.js` — converts responsive breakpoint keys to `@media` queries
- `build/writePluginImports/writeStyleImports.js` — generates `plugins/styles.less`
- `layout/BlockLayout.js` + `layout/Area.js` — use antd `Row`/`Col` + `makeCssClass`
- Server `next.config.js` — uses `next-with-less` plugin
- Every block has `.meta.styles: ['blocks/X/style.less']` referencing antd Less component imports

---

## 2. Antd v6 Upgrade — Breaking Changes

We're jumping v4 → v6, so we absorb both v4→v5 and v5→v6 breaking changes.

### 2.1 Styling System (Biggest Change)

**How antd v6 styles work:**

Antd v6 uses `@ant-design/cssinjs` v2.x in **CSS Variables mode** (the default and only mode).
When a component renders for the first time, its CSS is injected once via a `<style>` tag. Dynamic
values (colors, spacing, radii) use `var(--ant-*)` CSS custom properties. Theme changes just swap
CSS variable values — no re-serialization, no performance overhead.

**Why we use the default mode (NOT `zeroRuntime`):**

| Concern | Default Mode | zeroRuntime |
|---------|-------------|-------------|
| Bundle size | Tree-shaken — only CSS for components you render | ~500KB+ full bundle for ALL components |
| Theme algorithms | Full support (dark, compact, custom) | Broken — seed→map derivation needs JS |
| Component token overrides | Full support with color derivation | Partial — simple CSS vars only |
| Tailwind `@layer` | Automatic via `<StyleProvider layer>` | Manual — fragile CSS import ordering |
| SSR | `@ant-design/nextjs-registry` handles it | Simpler (no extraction) |
| Style isolation | Hash-based (safe with multiple versions) | No hashing |

The v6 CSS-in-JS engine is fundamentally different from v5. It injects once per component type,
uses CSS variables for everything dynamic, and the runtime cost is negligible. `zeroRuntime`
trades real functionality (algorithms, tree-shaking, automatic `@layer`) for marginal simplicity.

| What | Impact |
|------|--------|
| Less completely removed from antd | All `@import 'antd/lib/*/style/index.less'` files become dead |
| `babel-plugin-import` not needed | CSS-in-JS handles on-demand style loading |
| `next-with-less` not needed for antd | Drop entirely (no more Less in the pipeline) |
| CSS Variables mode is DEFAULT in v6 | Tokens map to `--ant-*` custom properties automatically |
| `StyleProvider layer` | Wraps all antd styles in `@layer antd` for clean Tailwind coexistence |
| Per-component tree-shaking | Only components you use get CSS injected |

**Action:** Remove all `.less` files in blocks, remove `less`/`less-loader`/`next-with-less` from
servers, remove `buildStyleImports`/`writeStyleImports` from build. Wrap app root in
`StyleProvider layer` + `ConfigProvider` with theme config.

**Note on SSR:** Lowdefy renders client-side only (`_app.js` uses `dynamic(..., { ssr: false })`).
No SSR style extraction is needed — no `@ant-design/nextjs-registry`, no `extractStyle()`. Antd's
CSS-in-JS injects styles client-side after hydration, which is exactly what Lowdefy already does.

```jsx
// _app.js — wrap inside the existing App component
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';

<StyleProvider layer>
  <ConfigProvider theme={lowdefy.theme}>
    {children}
  </ConfigProvider>
</StyleProvider>
```

### 2.1.1 CSS `@layer` Strategy — Antd + Tailwind Coexistence

`StyleProvider layer` wraps antd's runtime-injected styles in `@layer antd`. But **this alone is
not enough for Tailwind.** CSS `@layer` priority depends on declaration order — last declared wins.
If `@layer antd` is first encountered at runtime (after Tailwind's layers already exist), it gets
appended **after** Tailwind's layers, giving it **higher** priority than utilities. This is
backwards — Tailwind utilities must beat antd.

**The fix:** Pre-declare the layer order in the global CSS entry point.

```css
/* globals.css — loaded before any component renders */
@layer theme, base, antd, components, utilities;
```

This locks the cascade priority regardless of when antd injects its styles:

| Layer | Source | Priority |
|-------|--------|----------|
| `theme` | Tailwind v4 design tokens | Lowest |
| `base` | Tailwind v4 preflight/reset | Low |
| `antd` | Antd runtime-injected styles (via StyleProvider) | Medium |
| `components` | User/Tailwind component classes | High |
| `utilities` | Tailwind utility classes | Highest |

**When Tailwind is enabled**, the global CSS file looks like:

```css
/* globals.css */
@layer theme, base, antd, components, utilities;

/* Tailwind v4 granular imports — must use granular, not @import "tailwindcss" */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css" layer(utilities);
```

**When Tailwind is NOT enabled**, we still declare the layer for antd:

```css
/* globals.css */
@layer antd;
```

This is minimal — just ensures antd styles go into a named layer. No practical effect without
Tailwind, but establishes the pattern for when Tailwind is added later.

**The build step generates `globals.css`** based on whether Tailwind is enabled in config. This
replaces the current `writeStyleImports` that generates `styles.less`.

**Why granular Tailwind imports:** Using `@import "tailwindcss"` (the simple form) internally
declares its own `@layer` order, which conflicts with our explicit declaration. The granular
imports (`tailwindcss/theme.css`, `tailwindcss/preflight.css`, `tailwindcss/utilities.css`) let
us control exactly which Tailwind layer each file lands in.

### 2.2 Prop Renames (v4 → v5 → v6)

These v4 deprecated props were **removed in v6** (not just deprecated):

| Component(s) | Old Prop | New Prop |
|--------------|----------|----------|
| Modal, Drawer, Dropdown, Tooltip, Popover, Popconfirm | `visible` | `open` |
| AutoComplete, Cascader, Select, TreeSelect, DatePicker, TimePicker, Mentions | `dropdownClassName` | `popupClassName` |
| Card | `headStyle`, `bodyStyle` | Use `classNames`/`styles` semantic API |
| Dropdown | `overlay` | `menu` |
| Tag | `visible` | Removed entirely |
| Slider | `tooltipVisible`, `tooltipPlacement` | `tooltip` object prop |
| Notification | `close` | `destroy` |
| `message.warn` | | `message.warning` |

New v6 deprecations (still functional, removed in v7):

| Component | Old Prop | New Prop |
|-----------|----------|----------|
| Tabs | `tabPosition` | `tabPlacement` (values: `start`/`end` not `left`/`right`) |
| Collapse | `expandIconPosition` | `expandIconPlacement` |
| Carousel | `dotPosition` | `dotPlacement` |
| Space | `direction` | `orientation` |
| Space | `split` | `separator` |
| Notification | `message` | `title` |
| Various | `bordered` | `variant="borderless"` |
| Dropdown.Button | | Removed — use `Space.Compact + Dropdown + Button` |

### 2.3 Removed Components

| Component | Status | Replacement |
|-----------|--------|-------------|
| `Comment` | Removed in v5 | `@ant-design/compatible` |
| `PageHeader` | Removed in v5 | `@ant-design/pro-components` |
| `BackTop` | Deprecated v5, removed from docs v6 | `FloatButton.BackTop` |
| `Dropdown.Button` | Removed in v6 | `Space.Compact + Dropdown + Button` |
| `List` | Deprecated in v6 | Still works, will be replaced later |

### 2.4 Date Library

Moment.js → Day.js. Blocks using `moment` dependency must switch to `dayjs`. Affects:
- `DateSelector`, `DateRangeSelector`, `DateTimeSelector`, `MonthSelector`, `WeekSelector`

### 2.5 Icons

`@ant-design/icons` must upgrade from 4.x to 6.x. v6 icons are not backwards-compatible.

### 2.6 React Version

Antd v6 requires React 18+. Lowdefy is already on 18.2.0 — no change needed.

---

## 3. Block Property Updates

### 3.1 All Blocks — Universal Changes

Every block needs:
1. Remove `.meta.styles` (no more `.less` imports)
2. Remove `makeCssClass` usage for antd internal styles (keep for user `style` prop — see Section 5)
3. Update any `visible` → `open` prop usage
4. Update any deprecated antd props

### 3.2 Per-Block Changes

#### Display Blocks
| Block | Changes |
|-------|---------|
| **Button** | `type` prop values unchanged. Remove custom `color` emotion styles — use antd v6 `color` and `variant` props instead. Remove `tinycolor2` dependency. |
| **Tag** | Remove `visible` prop entirely. |
| **Statistic** | No breaking changes. |
| **Progress** | `gapPosition` → `gapPlacement` |
| **Badge** | No breaking changes. |
| **Breadcrumb** | Migrate to `items` prop (children API deprecated). |
| **Divider** | `type` → `orientation` in v6, plus `vertical` sugar prop. |
| **Alert** | No breaking changes. |
| **Result** | No breaking changes. |
| **Avatar** | No breaking changes. |
| **Title/Paragraph/Label** | No breaking changes (Typography). |

#### Container Blocks
| Block | Changes |
|-------|---------|
| **Card** | `headStyle`/`bodyStyle` → use `classNames={{ head: ..., body: ... }}` and `styles={{ head: ..., body: ... }}` semantic API. |
| **Modal** | `visible` → `open`. `bodyStyle` → `styles.body`. |
| **Drawer** | `visible` → `open`. `style`/`className` now target panel (use `rootClassName`/`rootStyle` for wrapper). |
| **Tabs** | `tabPosition` → `tabPlacement`. Already uses `items` API (good). |
| **Collapse** | `expandIconPosition` → `expandIconPlacement`. |
| **Carousel** | `dotPosition` → `dotPlacement`. |
| **Popover** | `visible` → `open`. |
| **Tooltip** | `visible` → `open`. |
| **Comment** | Remove or move to `@ant-design/compatible`. **Recommend: deprecate and remove.** |
| **Layout/Header/Footer/Sider/Content** | No breaking changes. |

#### Input Blocks
| Block | Changes |
|-------|---------|
| **DateSelector, DateRangeSelector, DateTimeSelector, MonthSelector, WeekSelector** | `moment` → `dayjs`. Import changes throughout. `dropdownClassName` → `popupClassName`. |
| **Selector, MultipleSelector, TreeSelector** | `dropdownClassName` → `popupClassName`. |
| **AutoComplete** | `dropdownClassName` → `popupClassName`. |
| **Slider** | `tooltipVisible`/`tooltipPlacement` → `tooltip` object. |
| **TextInput, PasswordInput, NumberInput, TextArea** | `bordered` → `variant`. |
| **All inputs** | `bordered` → `variant="borderless"` where applicable. |

#### Menu/Navigation Blocks
| Block | Changes |
|-------|---------|
| **PageHeaderMenu** | Uses `PageHeader` which is removed. Must redesign using antd Layout + custom header or `@ant-design/pro-components`. |
| **PageSiderMenu** | Same — uses `PageHeader`. |
| **MobileMenu** | Uses Drawer — `visible` → `open`. |
| **Menu** | Check for deprecated `children` API → use `items` prop. |

#### Loader Blocks
| Block | Changes |
|-------|---------|
| **Skeleton** et al. | No breaking changes. |
| **Spinner** | Uses `Spin` — no breaking changes. Remove `.less` import. |

#### Other
| Block | Changes |
|-------|---------|
| **ColorSelector** | Independent of antd — minimal changes. Antd v6 has native `ColorPicker` — consider migration. |
| **Notification, Message** | `close` → `destroy`. `warn` → `warning`. Use hooks API via `App` component. |
| **ConfirmModal** | `visible` → `open`. |

---

## 4. New Blocks to Add

### High Priority (antd v6 native)

| Block | Antd Component | Why |
|-------|---------------|-----|
| **FloatButton** | `FloatButton` | Replaces BackTop, adds floating action buttons. Common UI pattern. |
| **Tour** | `Tour` | Step-by-step feature guides. High value for app onboarding. |
| **QRCode** | `QRCode` | Generate QR codes. Common business need. |
| **Watermark** | `Watermark` | Content watermarks. Enterprise feature. |
| **ColorPicker** | `ColorPicker` | Replace third-party ColorSelector with native antd. |
| **Flex** | `Flex` | Flexbox layout component. Simpler than Row/Col for many cases. |
| **Splitter** | `Splitter` | Resizable split panes. Powerful layout tool. |
| **Segmented** | `Segmented` | Segmented control (iOS-style toggle). Common UI pattern. |
| **Masonry** | `Masonry` (v6) | Masonry grid layout. Great for galleries/dashboards. |

### Medium Priority

| Block | Antd Component | Why |
|-------|---------------|-----|
| **Timeline** | `Timeline` | Already exists in antd but not in Lowdefy. Useful for activity feeds. |
| **Transfer** | `Transfer` | Dual list selection. Common admin pattern. |
| **Descriptions** | `Descriptions` | Key-value display. Common for detail views. |
| **Image** | `Image` | Preview-enabled image with zoom. Better than basic `Img`. |
| **Space** | `Space` | Simple spacing between elements. Cleaner than CSS margins. |
| **Empty** | `Empty` | Standardized empty state display. |
| **InputNumber (spinner mode)** | `InputNumber mode="spinner"` (v6) | New spinner variant for number input. |

### Low Priority / Future

| Block | Why |
|-------|-----|
| **Tree** | Hierarchical data display. |
| **Calendar** | Full calendar view. |
| **Mentions** | @mention input. |

---

## 5. Styling Overhaul — Remove makeCssClass, Add `class` Property

### 5.1 Problem with Current Approach

Currently blocks use `methods.makeCssClass([...styleObjects])` to generate emotion CSS classes. This:
- Couples blocks to @emotion runtime
- Prevents use of utility CSS frameworks (Tailwind)
- Mixes concerns — blocks should render, not generate CSS
- Makes it impossible to target block sub-elements with class names from config

### 5.2 New Architecture

#### Keep `style` for inline CSS-in-JS objects (but simplify)

The `style` key continues to work as today — an object of CSS properties that gets applied to the block's root element. But instead of running through emotion to generate a class, it's applied as a React `style` prop or through antd's `styles` semantic API.

```yaml
# Unchanged for users — style still works
- id: my_card
  type: Card
  style:
    marginTop: 20
    border: '1px solid red'
```

**Implementation:** `style` continues to flow through the engine parser (so operators work), but at the layout level it's applied directly as a `style` prop on the wrapper div, not via `makeCssClass`.

#### New `class` property — maps class names to block root and sub-slots

The new `class` property lets users apply CSS class names (Tailwind utilities, custom classes, etc.) to the block and its sub-elements.

```yaml
# Simple: class as string applies to root
- id: my_card
  type: Card
  class: 'shadow-lg rounded-xl'

# Object form: map classes to sub-slots (semantic parts of the block)
- id: my_card
  type: Card
  class:
    root: 'shadow-lg rounded-xl'
    header: 'bg-blue-500 text-white'
    body: 'p-6'
    actions: 'border-t'
    cover: 'rounded-t-xl overflow-hidden'
```

**How sub-slot class mapping works:**

Each block defines its semantic class slots in its meta, matching antd v6's `classNames` prop:

```javascript
// Card.js
CardBlock.meta = {
  category: 'container',
  classSlots: ['root', 'header', 'body', 'cover', 'actions', 'extra'],
};
```

The block receives `classNames` (processed from user's `class` config):

```javascript
const CardBlock = ({ blockId, content, properties, classNames, styles }) => (
  <Card
    id={blockId}
    className={classNames.root}
    classNames={{
      header: classNames.header,
      body: classNames.body,
      cover: classNames.cover,
      actions: classNames.actions,
      extra: classNames.extra,
    }}
    styles={{
      header: styles.header,
      body: styles.body,
    }}
    // ... other props
  >
    {content.content && content.content()}
  </Card>
);
```

This aligns perfectly with antd v6's native `classNames` and `styles` semantic API that every component now supports.

#### New `styles` property — maps style objects to sub-slots

Similar to `class`, but for inline style objects targeting sub-elements:

```yaml
- id: my_card
  type: Card
  style:
    marginTop: 20        # Applied to block wrapper (layout level)
  styles:
    header:
      backgroundColor: '#f0f0f0'
    body:
      padding: 24
```

This replaces the current pattern where blocks had custom `properties.headerStyle`, `properties.bodyStyle`, etc. — now it's standardized.

### 5.3 Comparison: Current vs New

```yaml
# CURRENT (v4)
- id: my_card
  type: Card
  style:                           # Applied via makeCssClass on wrapper
    marginTop: 20
  properties:
    headerStyle:                   # Block-specific prop → makeCssClass(..., true)
      backgroundColor: '#f0f0f0'
    bodyStyle:                     # Block-specific prop → makeCssClass(..., true)
      padding: 24
    style:                         # ALSO a thing — merged into className via emotion
      border: '1px solid red'

# NEW (v6) — class as string (applies to component root)
- id: my_card
  type: Card
  style:                           # Layout wrapper style (React style prop)
    marginTop: 20
  class: 'shadow-lg'              # Component root className
  styles:                          # Semantic sub-slot styles
    header:
      backgroundColor: '#f0f0f0'
    body:
      padding: 24

# NEW (v6) — class as object (sub-slot mapping)
- id: my_card
  type: Card
  style:                           # Layout wrapper style (React style prop)
    marginTop: 20
  class:                           # Semantic sub-slot classes
    root: 'shadow-lg'
    header: 'bg-blue-50'
    body: 'p-6'
  styles:                          # Semantic sub-slot styles
    header:
      backgroundColor: '#f0f0f0'
```

**Note:** `class` is a union type — either a string OR an object, never both on the same block.
When string, the engine normalizes it to `{ root: value }`. When object, passed through directly.

### 5.4 What Happens to `makeCssClass`?

**Remove it.** The new flow is:

1. `style` (object) → applied as `style` prop on BlockLayout wrapper div
2. `class` (string/object) → applied as `className` on wrapper and `classNames` on antd component
3. `styles` (object with sub-slot keys) → applied via antd component's `styles` semantic prop
4. `mediaToCssObject` → **keep** for responsive style support but convert output to CSS-in-JS tokens or CSS variables instead of emotion classes

### 5.5 Responsive Styles Consideration

Current `mediaToCssObject` handles responsive breakpoints like:
```yaml
style:
  sm:
    fontSize: 12
  lg:
    fontSize: 16
```

In the new system, responsive `style` objects can still work — they'd be converted to `@media` queries via a thin runtime wrapper or, better, via Tailwind responsive prefixes:

```yaml
# New preferred approach with Tailwind
class: 'text-sm lg:text-base'

# Still supported via style for non-Tailwind users
style:
  sm:
    fontSize: 12
  lg:
    fontSize: 16
```

For non-Tailwind users, we keep a minimal responsive style helper (not emotion — just generates a `<style>` tag or uses CSS custom properties).

### 5.6 Migration Path

- `properties.style` → move to top-level `style` (deprecation warning, build-time transform)
- `properties.headerStyle` / `properties.bodyStyle` etc. → move to `styles.header` / `styles.body`
- `makeCssClass` usage in blocks → replace with `classNames` + `styles` props from antd v6
- Remove `@emotion/css` dependency from `block-utils`

---

## 6. Rename `areas` → `slots`

### 6.1 Why

"Areas" is an unusual term. "Slots" is the industry standard (Vue, Web Components, Svelte, antd v6 docs all use "slots"). It better communicates the concept — named insertion points where child blocks render.

### 6.2 User-Facing Change

```yaml
# OLD
- id: my_card
  type: Card
  areas:
    content:
      blocks:
        - type: Button
    title:
      blocks:
        - type: Title

# NEW
- id: my_card
  type: Card
  slots:
    content:
      blocks:
        - type: Button
    title:
      blocks:
        - type: Title

# SHORTHAND (unchanged — blocks key moves to slots.content.blocks at build time)
- id: my_card
  type: Card
  blocks:
    - type: Button
```

### 6.3 Backwards Compatibility — Build-Time Swap

In the build step, add a transform early in `buildBlock`:

```javascript
// In buildBlock.js, before moveSubBlocksToArea (rename to moveSubBlocksToSlot)
function moveAreasToSlots(block) {
  if (!type.isNone(block.areas)) {
    if (!type.isNone(block.slots)) {
      throw new ConfigError({
        message: 'Block cannot have both "areas" and "slots". Use "slots".',
        configKey: block['~k'],
      });
    }
    block.slots = block.areas;
    delete block.areas;
    // Log deprecation warning
  }
}
```

### 6.4 Internal Rename Scope

| Location | Change |
|----------|--------|
| `blockSchema.js` | Add `slots` property alongside `areas` (areas deprecated) |
| `moveSubBlocksToArea.js` | Rename to `moveSubBlocksToSlot.js`, target `slots.content.blocks` |
| `buildBlock.js` | Add `moveAreasToSlots` step before `moveSubBlocksToSlot` |
| `engine/Block.js` | `this.areas` → `this.slots`, `areasLayout` → `slotsLayout` |
| `engine/Areas.js` | Rename to `Slots.js` |
| `client/Container.js` | `areas` → `slots` in variable names |
| `layout/Area.js` | Rename to `Slot.js` (component name `Area` → `Slot`) |
| All block components | `content` prop stays the same (blocks don't know about slots vs areas) |

**Note:** The `content` prop passed to block components does NOT change. Blocks still receive `content.title()`, `content.body()`, etc. The rename is purely at the config/engine level.

### 6.5 Slot Configuration

Slots can also have their own `style`, `class`, and layout config:

```yaml
- id: my_card
  type: Card
  slots:
    content:
      style:
        padding: 20
      class: 'bg-gray-50'
      blocks:
        - type: Button
```

---

## 7. Layout — Minimal Ant 6 Adjustments

The layout system (`@lowdefy/layout`) uses antd `Row` and `Col` for grid-based positioning. These components are stable across v4→v6 with no breaking changes.

### 7.1 Changes Required

1. **Remove `style.less`** (`@import 'antd/lib/grid/style/index.less'`) — antd v6 injects grid styles automatically when Row/Col render.

2. **Update `BlockLayout.js`** and **`Area.js`** (`Slot.js`):
   - Remove `makeCssClass` usage — apply `style` and `className` directly
   - `blockStyle` → applied as React `style` prop
   - `blockClass` → applied as `className` prop

3. **Keep `Row`/`Col` from antd** — they work in v6, and the `deriveLayout` / `layoutParamsToArea` logic is solid.

4. **Responsive breakpoints** — keep the current breakpoint system but consider making it configurable to match Tailwind's breakpoints when Tailwind is enabled.

### 7.2 Updated Layout Components

```javascript
// BlockLayout.js (simplified)
const BlockLayout = ({ id, style, className, children, layout = {} }) => {
  if (layout.disabled) {
    return (
      <div id={id} style={style} className={className}>
        {children}
      </div>
    );
  }
  return (
    <Col
      {...deriveLayout(layout)}
      style={{ alignSelf: alignSelf(layout.align), ...style }}
      id={id}
      className={className}
    >
      {children}
    </Col>
  );
};
```

### 7.3 Flex Layout Option

Antd v6 adds a `Flex` component. Consider adding a `layout.type: 'flex'` option as an alternative to the grid system:

```yaml
- id: container
  type: Box
  layout:
    type: flex          # NEW — uses Flex instead of Row/Col
    direction: row
    gap: 16
    justify: space-between
```

This is additive and can come in a later phase.

---

## 8. Style Variables — Adopt Antd v6 Design Token System

### 8.1 Current System

Users customize styling via `public/styles.less`:
```less
@primary-color: #1890ff;
@border-radius-base: 4px;
@font-size-base: 14px;
```

This gets compiled at build time via Less and affects all antd components.

### 8.2 New System — ConfigProvider Theme Tokens

Antd v6's default CSS-in-JS mode with CSS Variables gives us the full token system. `ConfigProvider`
accepts a `theme` prop with seed tokens, algorithms, and component-level overrides. Antd
derives ~50 map tokens per seed token automatically (hover states, backgrounds, borders, etc.)
and exposes everything as `--ant-*` CSS custom properties.

#### YAML Theme Config → ConfigProvider (Primary)

Add a `theme` key to the Lowdefy config that maps directly to ConfigProvider:

```yaml
# lowdefy.yaml
lowdefy: 4.x.x
theme:
  token:
    colorPrimary: '#00b96b'
    borderRadius: 8
    fontSize: 14
    fontFamily: 'Inter, sans-serif'
    colorBgContainer: '#ffffff'
    colorBgLayout: '#f5f5f5'
  algorithm: dark          # 'default' | 'dark' | 'compact' | ['dark', 'compact']
  components:
    Button:
      colorPrimary: '#1677ff'
      borderRadius: 4
    Card:
      borderRadiusLG: 12
    Input:
      colorBorder: '#d9d9d9'
```

At runtime, this config is passed directly to ConfigProvider:

```jsx
import { theme } from 'antd';

const algorithmMap = {
  default: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
  compact: theme.compactAlgorithm,
};

<ConfigProvider theme={{
  ...lowdefy.theme,
  algorithm: resolveAlgorithm(lowdefy.theme.algorithm),
}}>
  {children}
</ConfigProvider>
```

**What this gives us:**
- Set `colorPrimary: '#00b96b'` and antd automatically derives the full color palette (hover,
  active, background, border — ~10 shades) via the algorithm
- `algorithm: dark` generates a complete dark theme from your seed tokens
- `algorithm: ['dark', 'compact']` combines algorithms
- Component-level overrides let you customize individual components
- All tokens become `--ant-*` CSS custom properties automatically

**Dark mode works out of the box:**
```yaml
theme:
  token:
    colorPrimary: '#6366f1'
  algorithm: dark   # Full dark theme derived from seed tokens
```

No CSS file generation needed. No manual `--ant-*` variable mapping. ConfigProvider does it all.

#### CSS Escape Hatch

Users who want raw CSS overrides can still provide `public/styles.css`:

```css
/* Override specific antd CSS variables directly */
:root {
  --ant-color-primary: #00b96b;
}

/* Custom app styles */
.my-custom-class {
  /* ... */
}
```

#### Tailwind Theme Bridge (When Tailwind Enabled)

When Tailwind is enabled, the Tailwind config can reference antd CSS variables so both systems
share the same design tokens:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--ant-color-primary)',
        success: 'var(--ant-color-success)',
        warning: 'var(--ant-color-warning)',
        error: 'var(--ant-color-error)',
      },
      borderRadius: {
        DEFAULT: 'var(--ant-border-radius)',
      },
    },
  },
};
```

This means `class: 'bg-primary text-white'` in YAML uses the same primary color as antd
components. Optional — users can also just use Tailwind's own color system.

### 8.3 Exposing Tokens to Config (Operators)

Add operators that let YAML configs reference theme tokens:

```yaml
properties:
  color:
    _theme: colorPrimary         # Resolves to current theme token value
  background:
    _theme:
      token: colorBgContainer
      opacity: 0.5               # Optional transforms
```

### 8.4 Remove Less Dependencies

| Package | Remove |
|---------|--------|
| `@lowdefy/server` | `less`, `less-loader`, `next-with-less` from devDependencies |
| `@lowdefy/server-dev` | `less`, `less-loader`, `next-with-less` from devDependencies |
| Server `next.config.js` | Remove `withLess()` wrapper |
| Build pipeline | Remove `buildStyleImports`, `writeStyleImports` |
| Block packages | Remove all `style.less` files and `.meta.styles` |
| `block-utils` | Remove `makeCssClass.js`, `mediaToCssObject.js`, `@emotion/css` dep |

### 8.5 User Custom Styles Migration

Current `public/styles.less` → Replace with:
1. `theme` key in `lowdefy.yaml` for token overrides (primary path)
2. `public/styles.css` for custom CSS (escape hatch)
3. `public/tailwind.css` for Tailwind imports (when Tailwind is enabled)

Build-time: If `public/styles.less` is detected, log a deprecation warning with migration instructions.

---

## 9. Tailwind & Multi-Component-Library Support

### 9.1 Vision

Lowdefy should support swapping component libraries via config:

```yaml
# lowdefy.yaml
lowdefy: 4.x.x
componentLibrary: antd        # 'antd' (default) | 'shadcn' | 'radix' | 'custom'
css:
  tailwind: true              # Enable Tailwind CSS
  config: ./tailwind.config.js
```

### 9.2 Architecture for Multi-Library Support

#### Plugin Package Abstraction

Component libraries are already plugins (`@lowdefy/blocks-antd`). The multi-library support means:

1. **Block packages are interchangeable** — `@lowdefy/blocks-antd`, `@lowdefy/blocks-shadcn`, etc.
2. **Block interface contract** — all block packages must export blocks with the same `meta.category` and render the same `content`/`slots` contract.
3. **Property schemas differ** — different libraries have different props. This is expected and fine.
4. **Shared blocks** — `@lowdefy/blocks-basic` (Box, Span, Html, etc.) are library-agnostic.

```
@lowdefy/blocks-antd       →  Button, Card, Modal, Tabs, Input, ...
@lowdefy/blocks-shadcn      →  Button, Card, Dialog, Tabs, Input, ...
@lowdefy/blocks-radix       →  Button, Card, Dialog, Tabs, Input, ...
```

Each library package maps its component names. Users can mix libraries:

```yaml
# Using antd for most things, shadcn for a specific component
- id: header
  type: Card               # From default library (antd)
- id: dialog
  type: ShadcnDialog       # Explicitly from shadcn package
```

#### Package Resolution at Build Time

The build system already resolves block types to packages via `typesMap`. This doesn't change — just more packages to choose from.

```yaml
# lowdefy.yaml — future
plugins:
  - name: '@lowdefy/blocks-shadcn'
    version: 5.0.0
```

### 9.3 Tailwind Integration

#### How It Works

1. **Install:** Tailwind is a dev dependency of the server packages when enabled.
2. **Config:** Standard `tailwind.config.js` at the app root.
3. **Build:** PostCSS processes Tailwind directives during Next.js build.
4. **Usage:** Users reference Tailwind classes in the `class` property.

```yaml
- id: my_card
  type: Card
  class:
    root: 'shadow-lg rounded-xl bg-white dark:bg-gray-800'
    header: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4'
    body: 'p-6 space-y-4'
```

#### Implementation in Servers

```javascript
// next.config.js (when tailwind enabled)
const nextConfig = {
  // ... existing config
  // No withLess needed anymore
  // PostCSS (Tailwind) handled automatically by Next.js
};
```

```javascript
// postcss.config.js (generated at build time when tailwind enabled)
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```javascript
// tailwind.config.js (user provides or we generate defaults)
module.exports = {
  content: [
    './build/**/*.json',      // Lowdefy build artifacts contain class strings
    './pages/**/*.{js,jsx}',
    './node_modules/@lowdefy/blocks-*/dist/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Key insight:** Tailwind's content scanner needs to find class strings. Since Lowdefy stores class names in JSON build artifacts, we need to make sure `tailwind.config.js` scans those paths.

#### Tailwind + Antd Coexistence

See **Section 2.1.1** for the complete `@layer` strategy. In summary:

1. `StyleProvider layer` wraps antd styles in `@layer antd`
2. A global CSS file pre-declares layer order: `@layer theme, base, antd, components, utilities`
3. Tailwind v4 uses granular imports placed into the correct layers
4. Result: preflight → antd → utilities (Tailwind utilities always win)

This is the cleanest possible coexistence: antd provides component structure, Tailwind utilities
override specific visual properties, and the CSS cascade handles priority deterministically.

### 9.4 Shadcn/Radix Future Path

Shadcn is built on Radix UI + Tailwind. Adding shadcn support means:

1. Create `@lowdefy/blocks-shadcn` package
2. Each block wraps a shadcn component
3. Tailwind is required (already supported)
4. Block properties match shadcn's API
5. Slots map to shadcn's composition pattern

This is a future phase — the architectural changes in this upgrade (slots, class property, Tailwind support) lay the groundwork.

### 9.5 Configuration Summary

```yaml
# lowdefy.yaml — full future example
lowdefy: 5.0.0

theme:
  token:
    colorPrimary: '#6366f1'    # Indigo
    borderRadius: 8
  algorithm: default

css:
  tailwind: true
  config: ./tailwind.config.js

plugins:
  - name: '@lowdefy/blocks-antd'
    version: 5.0.0
  - name: '@lowdefy/blocks-shadcn'
    version: 1.0.0
```

---

## 10. Implementation Phases

### Phase 1: Foundation (No User-Visible Changes)

**Goal:** Antd v6 compiles and runs with minimal block changes.

1. Upgrade `antd` from 4.24.14 → 6.3.0+ across all packages
2. Upgrade `@ant-design/icons` from 4.8.0 → 6.1.0+
3. Replace `moment` with `dayjs` in date blocks
4. Remove all `.less` files from block packages
5. Remove `less`, `less-loader`, `next-with-less` from server packages
6. Replace `buildStyleImports` / `writeStyleImports` with `globals.css` generation (see Section 2.1.1)
7. Replace `import '../build/plugins/styles.less'` in `_app.js` with `import './globals.css'`
8. Wrap app root in `StyleProvider layer` + `ConfigProvider`
9. Remove `.meta.styles` from all block metas
10. Update `next.config.js` to remove `withLess()` wrapper
11. Fix all compilation errors

### Phase 2: Block Property Migration

**Goal:** All blocks render correctly with antd v6.

1. Apply antd codemod for `visible` → `open`, etc.
2. Update each block's props (see Section 3)
3. Migrate Card `headStyle`/`bodyStyle` → semantic `classNames`/`styles`
4. Migrate Drawer/Modal prop changes
5. Migrate date blocks to dayjs
6. Handle PageHeaderMenu/PageSiderMenu (PageHeader removal)
7. Remove `Comment` block (or wrap with `@ant-design/compatible`)
8. Update icon usage for v6 compatibility
9. Manual testing of each block

### Phase 3: Styling Architecture

**Goal:** New `class`, `styles`, and updated `style` system.

1. Remove `makeCssClass` from `block-utils`
2. Remove `@emotion/css` dependency
3. Update `BlockLayout` to use direct `style`/`className` props
4. Add `class` property to block schema
5. Add `styles` property to block schema (sub-slot style mapping)
6. Process `class` in engine (parse operators, resolve to `classNames` object)
7. Process `styles` in engine (parse operators, resolve to `styles` object)
8. Pass `classNames` and `styles` as props to block components
9. Update all block components to use new `classNames`/`styles` props
10. Deprecate `properties.style` → top-level `style`
11. Deprecate block-specific style props (`headerStyle`, `bodyStyle`, etc.) → `styles`
12. Keep `mediaToCssObject` for responsive `style` support (refactored without emotion)

### Phase 4: Slots Rename

**Goal:** `areas` → `slots` with backwards compatibility.

1. Add `moveAreasToSlots` build step
2. Update `blockSchema.js` to accept both `areas` and `slots`
3. Rename `moveSubBlocksToArea` → `moveSubBlocksToSlot`
4. Rename internal variables throughout engine and client
5. Rename `Area.js` → `Slot.js`, `Areas.js` → `Slots.js`
6. Add deprecation warning when `areas` is used
7. Update all docs and examples

### Phase 5: Theme Token System

**Goal:** Replace Less variables with ConfigProvider theme tokens.

1. Add `theme` key to lowdefy config schema
2. Pass theme config to `ConfigProvider` at app root
3. Add `_theme` operator for referencing tokens in YAML
4. Support `public/styles.css` as replacement for `public/styles.less`
5. Deprecation warning for `public/styles.less`
6. Document token-based theming

### Phase 6: Tailwind Support

**Goal:** Opt-in Tailwind CSS support.

1. Add `css.tailwind` config option
2. Generate PostCSS config when Tailwind enabled
3. Generate default `tailwind.config.js` with correct content paths
4. Ensure Tailwind classes in `class` property work end-to-end
5. Document Tailwind integration
6. Test antd + Tailwind coexistence

### Phase 7: New Blocks

**Goal:** Add high-value antd v6 blocks.

1. FloatButton
2. Tour
3. QRCode
4. Watermark
5. ColorPicker (replace ColorSelector)
6. Flex
7. Splitter
8. Segmented
9. Masonry

### Future: Multi-Library Support

- Create `@lowdefy/blocks-shadcn` package
- Define block interface contract for cross-library compatibility
- Implement library switching config

---

## Appendix A: Dependencies to Add/Remove/Update

### Update
| Package | From | To |
|---------|------|----|
| `antd` | 4.24.14 | 6.3.0+ |
| `@ant-design/icons` | 4.8.0 | 6.1.0+ |
| `dayjs` | (add new) | latest |

### Remove
| Package | Reason |
|---------|--------|
| `moment` | Replaced by dayjs |
| `less` | Antd v6 doesn't use Less |
| `less-loader` | No longer needed |
| `next-with-less` | No longer needed |
| `@emotion/css` | Replaced by direct style/class props |
| `@emotion/jest` | No longer needed for snapshot testing |
| `tinycolor2` | Button color logic replaced by antd v6 native `color`/`variant` |
| `babel-plugin-import` | Not needed with antd v6 tree-shaking |

### Add
| Package | Reason |
|---------|--------|
| `dayjs` | Antd v6 date library |
| `tailwindcss` | When Tailwind enabled (v4) |
| `@tailwindcss/postcss` | Tailwind v4 PostCSS plugin (replaces `tailwindcss` + `autoprefixer` combo) |

**Note:** `@ant-design/cssinjs` v2.x comes as a transitive dependency of antd v6. We import
`StyleProvider` from it for `@layer` support but don't need to install it directly.

**Not needed:** `@ant-design/nextjs-registry` — Lowdefy renders client-side only (`ssr: false`),
so no SSR style extraction is required.

## Appendix B: Files to Delete

All `.less` files in block packages:
- `packages/plugins/blocks/blocks-antd/src/style.less`
- `packages/plugins/blocks/blocks-antd/src/blocks/*/style.less` (all ~30 files)
- `packages/plugins/blocks/blocks-loaders/src/style.less`
- `packages/plugins/blocks/blocks-loaders/src/blocks/Spinner/style.less`
- `packages/plugins/blocks/blocks-color-selectors/src/style.less`
- `packages/layout/src/style.less`
- `packages/client/src/style.less`

Build pipeline files:
- `packages/build/src/build/buildImports/buildStyleImports.js`
- `packages/build/src/build/writePluginImports/writeStyleImports.js`

Block-utils files:
- `packages/utils/block-utils/src/makeCssClass.js`
- `packages/utils/block-utils/src/mediaToCssObject.js` (or refactor)

## Appendix C: Block Class Slots Reference

Mapping of antd v6 `classNames` prop support per component:

| Block | Available Class Slots |
|-------|----------------------|
| Button | `root`, `icon` |
| Card | `root`, `header`, `body`, `cover`, `actions`, `extra` |
| Modal | `root`, `header`, `body`, `footer`, `mask`, `wrapper`, `content` |
| Drawer | `root`, `header`, `body`, `footer`, `mask`, `wrapper`, `content` |
| Tabs | `root`, `tabBar`, `tabPane`, `inkBar` |
| Collapse | `root`, `header`, `content` |
| Alert | `root`, `icon`, `message`, `description`, `action`, `closeIcon` |
| Badge | `root`, `indicator` |
| Input | `root`, `input`, `prefix`, `suffix`, `count`, `textarea` |
| Select | `root`, `popup`, `selector` |
| Table | `root`, `header`, `body`, `footer`, `row`, `cell` |
| Form | `root` |
| Form.Item | `root`, `label`, `input` |
| Menu | `root`, `item`, `submenu` |
| DatePicker | `root`, `popup`, `input` |
| Tooltip | `root`, `inner` |
| Popover | `root`, `inner`, `title`, `content` |

Each block's `meta.classSlots` array defines which sub-slots accept class names, enabling IDE autocompletion and validation.
