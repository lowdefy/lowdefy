# @lowdefy/blocks-antd

Primary UI component library for Lowdefy, built on [Ant Design v6](https://ant.design/components/overview) (antd 6.6.5, pinned exactly across packages) with CSS-in-JS (CSS variables mode). Contains 84 blocks covering most UI needs.

## Overview

This is the default block package included with Lowdefy. It provides:

- Form inputs (text, number, date, selectors)
- Layout components (Card, Collapse, Tabs, Flex, Splitter)
- Display components (Title, Paragraph, Alert, QRCode, Watermark)
- Navigation (Menu, Breadcrumb, Pagination, FloatButton, Tour)
- Feedback (Message, Modal, Progress)
- Theming (ConfigProvider, ColorPicker, Segmented)

## Styling Architecture

### CSS Variables Mode

Ant Design runs in CSS variables mode (`cssVar: { key: 'lowdefy' }`, `hashed: false`) configured in the server's `client/App.jsx`. The `<html>` element has `class="lowdefy"` in the server HTML template (`src/html/template.js`) so the CSS variables are set on `:root`, allowing Tailwind and custom CSS to reference `--ant-*` tokens. No Less or CSS-in-JS hashing at runtime.

### `withTheme` HOC

Most blocks are wrapped with the `withTheme(antdComponentName, BlockComponent)` higher-order component (defined in `src/blocks/withTheme.js`). It intercepts an object `properties.theme` and wraps the block in a scoped `<ConfigProvider>` that applies per-block Ant Design token overrides. `antdComponentName` may be an array when a block renders several antd components styled from the same tokens (TreeSelector and TreeMultipleSelector pass `['TreeSelect', 'Select']`, because antd draws the TreeSelect input with Select styles):

```javascript
// withTheme strips `theme` from properties and scopes a ConfigProvider
function withTheme(antdComponentName, BlockComponent) {
  const Wrapped = (props) => {
    const { theme, ...restProperties } = props.properties;
    const rendered = <BlockComponent {...props} properties={restProperties} />;
    if (!theme) return rendered;
    return (
      <ConfigProvider theme={{ components: { [antdComponentName]: theme } }}>
        {rendered}
      </ConfigProvider>
    );
  };
  // ...
}

// Usage in a block file:
export default withTheme('Badge', BadgeBlock);
```

The first argument (`antdComponentName`) must match the Ant Design component name so the theme tokens target the correct component. A name antd doesn't have (for example `'ColorSelector'` instead of `'ColorPicker'`) silently does nothing.

Where a component-level `ConfigProvider` can't reach the rendered DOM, blocks theme differently:

| Case                                                                                                                    | Blocks                                                   | How `theme` is applied                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Page layouts render many antd components                                                                                | PageHeaderMenu, PageSiderMenu, PageSidebarLayout         | `withPageTheme` (`src/blocks/withPageTheme.js`) applies `theme` as global design tokens scoped to the page                 |
| Lowdefy markup that reuses antd class names without rendering the antd component, so antd never emits its CSS variables | Label (Form.Item classes), ControlledList (List classes) | The block sets the component CSS variables itself (`Label/getLabelThemeStyle.js`)                                          |
| antd scopes Layout component variables to `.ant-layout` elements                                                        | Header, Footer, Content                                  | Not themable per block; set the tokens on the parent `Layout`                                                              |
| Notices and confirm dialogs render in the App-level holder, outside the block                                           | Message, Notification                                    | Per-block `theme` has no effect; use the app's antd theme. ConfirmModal passes `theme` in antd's per-dialog config instead |

### `cssKeys` in Block Meta

Each block declares `cssKeys` in its `meta.js`, mapping each style target the block supports to a description:

```javascript
export default {
  category: 'display',
  icons: [],
  cssKeys: {
    element: 'The Badge element.',
    indicator: 'The Badge count or dot.',
  },
  // ...
};
```

Most keys other than `element` map to an antd 6 semantic DOM part and are wired to both the class and the style side of the component: `classNames={{ indicator: classNames.indicator }} styles={{ indicator: styles.indicator }}`. antd 6 renamed several semantic parts; the Lowdefy key keeps its name and is mapped (Tabs `tabBar` → `header`, `tabPane` → `content`, `inkBar` → `indicator`; Tooltip/Popover `inner` → `container`; Modal `content` → `container`; Collapse `content` → `body`; Alert `message` → `title`).

These keys define valid targets for the `class` (object form) and `styles` config properties. Common keys:

| Key                       | Purpose                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `element`                 | The primary antd component element                                              |
| `popup`                   | Popup/dropdown overlays, wired to `classNames.popup.root` / `styles.popup.root` |
| `options`                 | Each option of a choice selector (Radio, Checkbox, Button, Segmented)           |
| `<slot>Icon`              | An icon slot rendered through `components.Icon` (`prefixIcon`, `closeIcon`)     |
| `indicator`               | Status indicators (Badge)                                                       |
| `header`, `title`, `body` | Sections of containers (Card, Collapse, Modal, Drawer)                          |

### `classNames` and `styles` Prop Flow

The engine evaluates `class` and `styles` from the block config and exposes them as `block.eval.class` and `block.eval.styles`. The client rendering layer (`Container.js`, `InputContainer.js`, etc.) then passes these to the block component as `classNames` and `styles` props:

```javascript
// In client/src/block/Container.js
<Component
  classNames={classNames} // resolved from block.eval.class
  styles={block.eval.styles} // e.g., { block: {...}, element: {...} }
  // ...
/>
```

The `styles` object maps cssKey names to inline style objects. The `classNames` object maps cssKey names to CSS class strings. Blocks use these to apply targeted styling to specific sub-elements.

## Block Categories

### Container Blocks

Layout and grouping components:

| Block      | Purpose                        |
| ---------- | ------------------------------ |
| `Card`     | Bordered container with header |
| `Collapse` | Accordion panels               |
| `Tabs`     | Tabbed content                 |
| `Modal`    | Dialog overlay                 |
| `Drawer`   | Slide-out panel                |
| `Popover`  | Floating content               |
| `Tooltip`  | Hover tooltip                  |

### Page Layout Blocks

Full page structure:

| Block            | Purpose                   |
| ---------------- | ------------------------- |
| `PageHeaderMenu` | Page with top navigation  |
| `PageSiderMenu`  | Page with side navigation |
| `Layout`         | Flexible layout container |
| `Header`         | Page header area          |
| `Content`        | Main content area         |
| `Footer`         | Page footer area          |
| `Sider`          | Sidebar area              |

### Input Blocks

Form input components:

| Block                  | Type         | Purpose                         |
| ---------------------- | ------------ | ------------------------------- |
| `TextInput`            | String       | Single line text                |
| `TextArea`             | String       | Multi-line text                 |
| `PasswordInput`        | String       | Password with visibility toggle |
| `NumberInput`          | Number       | Numeric input with controls     |
| `Selector`             | Single       | Dropdown selection              |
| `MultipleSelector`     | Array        | Multi-select dropdown           |
| `RadioSelector`        | Single       | Radio button group              |
| `CheckboxSelector`     | Array        | Checkbox group                  |
| `ButtonSelector`       | Single/Array | Button-style selection          |
| `TreeInput`            | Array        | Inline hierarchical tree        |
| `TreeSelector`         | Single       | Tree dropdown (single)          |
| `TreeMultipleSelector` | Array        | Tree dropdown (multiple)        |
| `DateSelector`         | Date         | Date picker                     |
| `DateTimeSelector`     | Date         | Date and time picker            |
| `DateRangeSelector`    | Array        | Date range picker               |
| `MonthSelector`        | Date         | Month picker                    |
| `WeekSelector`         | Date         | Week picker                     |
| `Switch`               | Boolean      | Toggle switch                   |
| `CheckboxSwitch`       | Boolean      | Checkbox input                  |
| `Slider`               | Number       | Slider input                    |
| `RatingSlider`         | Number       | Star rating                     |
| `AutoComplete`         | String       | Autocomplete text               |
| `PhoneNumberInput`     | String       | Phone number with country code  |

### Display Blocks

Content presentation:

| Block            | Purpose                    |
| ---------------- | -------------------------- |
| `Button`         | Clickable button           |
| `Title`          | Heading text (h1-h5)       |
| `TitleInput`     | Editable heading text      |
| `Paragraph`      | Body text                  |
| `ParagraphInput` | Editable body text         |
| `Label`          | Form field labels          |
| `Statistic`      | Numeric display with label |
| `Descriptions`   | Key-value list             |
| `Tag`            | Colored tag/badge          |
| `Badge`          | Status indicator           |
| `Avatar`         | User avatar                |
| `Progress`       | Progress bar               |
| `Result`         | Operation result page      |
| `Alert`          | Alert message box          |
| `TableLight`     | Light table on antd Table  |

`TableLight` renders antd's `<Table>` with the shared column core in `src/table/` (column normalisation, cell renderers, conditions, sort keys, aggregates, exports), which `@lowdefy/blocks-table` imports as `@lowdefy/blocks-antd/table/*.js`. Its properties are a strict subset of `Table`'s (`blocks/TableLight/tableOnlyKeys.js` names the Table-only keys in its schema errors). See [table.md](./table.md).

### List Blocks

Data display:

| Block            | Purpose                  |
| ---------------- | ------------------------ |
| `ControlledList` | Repeating block template |
| `TimelineList`   | Timeline display         |
| `Carousel`       | Image/content carousel   |
| `Pagination`     | Page navigation          |

### Navigation Blocks

App navigation:

| Block        | Purpose               |
| ------------ | --------------------- |
| `Menu`       | Navigation menu       |
| `MobileMenu` | Mobile hamburger menu |
| `Breadcrumb` | Breadcrumb trail      |
| `Affix`      | Sticky positioning    |

### Feedback Blocks

User feedback:

| Block          | Purpose             |
| -------------- | ------------------- |
| `Message`      | Toast notification  |
| `Notification` | Rich notification   |
| `ConfirmModal` | Confirmation dialog |

### New in Ant Design v5/v6

| Block            | Purpose                              |
| ---------------- | ------------------------------------ |
| `FloatButton`    | Floating action button               |
| `Tour`           | Step-by-step guided tour             |
| `QRCode`         | QR code generator                    |
| `ColorPicker`    | Color selection input                |
| `Segmented`      | Segmented control (iOS-style toggle) |
| `Flex`           | Flexbox layout shorthand             |
| `Splitter`       | Resizable split panes                |
| `Masonry`        | Masonry/waterfall grid layout        |
| `Watermark`      | Background watermark overlay         |
| `ConfigProvider` | Theme/locale provider block          |

### Special Blocks

| Block     | Purpose          |
| --------- | ---------------- |
| `Divider` | Visual separator |

> **Note:** The `Comment` block has been removed (the upstream Ant Design Comment component was removed in v5).

## Common Properties

Most blocks support:

```yaml
properties:
  # Per-block Ant Design token overrides (consumed by withTheme HOC)
  theme:
    colorPrimary: '#1677ff'

  # Content (varies by block)
  title: string
  content: string

  # State
  disabled: boolean
  loading: boolean

# Styling via class and styles (processed by normalizeClassAndStyles at build time)
class:
  block: 'p-4 rounded' # Tailwind classes on the layout wrapper
  element: 'text-primary' # Classes on the antd element
styles:
  block: { padding: 16 } # Inline style on the layout wrapper
  element: { color: 'red' } # Inline style on the antd element
```

## Input Block Properties

All input blocks share:

```yaml
properties:
  label:
    title: Field Label
    colon: true
    extra: Helper text
    span: 8 # Label width
  placeholder: Enter value
  disabled: false
  size: default # small, default, large
```

## Selector Options

Selector blocks accept options:

```yaml
properties:
  options:
    - label: Option A
      value: a
    - label: Option B
      value: b
      disabled: true
```

Or from requests:

```yaml
properties:
  options:
    _request: getOptions
```

## Page Layout Example

```yaml
id: dashboard
type: PageSiderMenu
properties:
  title: Dashboard
  logo:
    src: /logo.png
areas:
  content:
    blocks:
      - id: stats
        type: Card
        properties:
          title: Statistics
```

## Wrapping antd 6: conventions and pitfalls

The antd 6.6.5 audit (every block compared against its antd component's API) settled these rules.

**Properties**

- A new property uses the antd prop name when the concept maps 1:1 (`iconPlacement`, `maxCount`, `placement`), with the same enum and wording as sibling blocks.
- Existing Lowdefy names never change. When antd renames a prop or value, the block translates it with a small constant map: `dotPosition` → `dotPlacement`, `left`/`right` → `start`/`end`, `showToday` → `showNow`, `destroyOnClose` → `destroyOnHidden`, `maskClosable` → `mask.closable` (`getMask.js`).
- Sizes: Lowdefy size enums are unchanged, but antd 6 deprecates `middle` for `medium` and warns on `size="default"`, so blocks pass `medium` for `default`/`middle`. New size properties use antd's `small`/`medium`/`large`.
- ReactNode props become an html string (`renderHtml`), a content slot, or an icon property (the shared `icon` schema, rendered through `components.Icon`, with a matching cssKey). Callbacks become events with a serializable payload; open-state events carry `{ open }`.
- Render and function props (`render`, `formatter`, `popupRender`, `filterOption` as a function) are left out.

**antd behaviours that bite**

- antd's deprecation checks test key presence (`'x' in props`), so `x={undefined}` still warns. Spread conditional props instead.
- An `undefined` prop also overrides ConfigProvider context: Select builds `{ virtual: contextVirtual, ...props }`, so `virtual={undefined}` switched virtual scrolling back on.
- `disabled` goes the other way: antd resolves it as `disabled ?? contextDisabled`, so an explicit `false` beats ConfigProvider `componentDisabled`. Blocks pass `getDisabled({ loading, properties })`, which is `true` while loading and otherwise `properties.disabled` unchanged: unset lets `componentDisabled` apply, `false` re-enables the block. Never write `properties.disabled || loading` (that yields `false`). Custom markup (TagSelector pills) and antd components that ignore the context (Segmented, Dropdown) use `useDisabled`, which falls back to `ConfigProvider.useConfig().componentDisabled`. Typography (ParagraphInput, TitleInput) and Pagination ignore `componentDisabled`, as in antd.
- `e2e/tests/no-antd-deprecations.e2e.spec.js` runs against a production build, where antd strips its warnings. It is a backstop; find deprecated usage by reading the component source for `warning.deprecated`.
- Use the `items`/`options` APIs, never child components: `Collapse.Panel`, `Descriptions.Item`, `Timeline.Item`, `Select.Option` and the top-level Select search props (`filterOption`, `onSearch`, now inside `showSearch`) are deprecated.
- antd's `List` is deprecated in 6.6 (use `Listy`, which has no header, footer or bordered mode). ControlledList renders its own markup with the `ant-list-*` class names.
- antd `Dropdown` renders no element of its own, and rc-dropdown overwrites `popupClassName`/`popupStyle`. Style the popup through `classNames.root`/`styles.root`, and put the block's id, class and style on the trigger.
- Typography can only measure and cut string children, so an ellipsis with `expandable`, `suffix` or `copyable` gets plain text (`getTypographyContent.js`); content with markup still goes through `renderHtml`.
- When antd falls back to its own icon (FloatButton, BackTop, Sider trigger, Menu overflow, Splitter arrows), blocks pass an app `Icon` instead so the icon set applies. antd sometimes drops its own styling once a custom icon is passed (the Splitter collapse button loses its background), so `Splitter/style.css` restores it. Every icon name hardcoded in block code must be listed in `meta.icons`, or the build doesn't bundle it.

**Shared schemas and helpers**

| File                                                            | Used by                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `schemas/inputProperties.js`                                    | Text inputs and selectors (`variant` includes `underlined`, `size`, `allowClear`, ...)           |
| `schemas/pickerProperties.js`, `schemas/pickerTheme.js`         | The five date selectors (one property and token set)                                             |
| `schemas/selectProperties.js`                                   | Selector, MultipleSelector, TreeSelector, TreeMultipleSelector, AutoComplete dropdown properties |
| `schemas/treeTheme.js`, `schemas/treeSelectTheme.js`            | TreeInput and the tree selectors                                                                 |
| `schemas/mask.js`, `schemas/focusable.js`, `blocks/getMask.js`  | Modal, ConfirmModal, Drawer                                                                      |
| `blocks/getEllipsisConfig.js`, `blocks/getTypographyContent.js` | Title, Paragraph                                                                                 |
| `getSelectOptions.js`, `filterSelectorOption.js`                | Select-based blocks                                                                              |
| `getDisabled.js`, `useDisabled.js`                              | Every block with a `disabled` property (ConfigProvider `componentDisabled`)                      |

## Design Decisions

### Why Wrap Ant Design?

Lowdefy wraps Ant Design to:

- Provide consistent state binding
- Add operator support in properties
- Standardize event handling
- Enable schema validation

### Why So Many Selector Types?

Different selectors for different UX:

- `Selector`: Standard dropdown
- `RadioSelector`: When options visible at once
- `ButtonSelector`: When options are actions
- `CheckboxSelector`: Multi-select visible

### Input Value Binding

Input blocks automatically:

- Read from `state[blockId]`
- Write to `state[blockId]` on change
- Support `value` property override

## E2E Testing Helpers

blocks-antd exports e2e helpers for Playwright testing via `@lowdefy/e2e-utils`.

### Blocks with E2E Helpers

| Block            | Actions (`do.*`)      | Assertions (`expect.*`)                         |
| ---------------- | --------------------- | ----------------------------------------------- |
| `Alert`          | -                     | visible, hidden, type, message                  |
| `Button`         | click                 | visible, disabled, enabled, loading, text, type |
| `Card`           | -                     | visible, hidden, title                          |
| `Descriptions`   | -                     | visible, hidden, item                           |
| `NumberInput`    | fill, clear           | visible, value, disabled                        |
| `PageHeaderMenu` | -                     | visible, title                                  |
| `Paragraph`      | -                     | visible, text                                   |
| `Result`         | -                     | visible, hidden, status, title                  |
| `Selector`       | select, clear, search | visible, value, disabled, enabled               |
| `Statistic`      | -                     | visible, value, title                           |
| `TextArea`       | fill, clear           | visible, value, disabled                        |
| `TextInput`      | fill, clear           | visible, value, disabled                        |

### Helper Export Pattern

Each block's `e2e.js` file uses `createBlockHelper`:

```javascript
// src/blocks/TextInput/e2e.js
import { createBlockHelper } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#${blockId}_input`);

export default createBlockHelper({
  locator,
  do: {
    fill: (page, blockId, val) => locator(page, blockId).fill(val),
    clear: (page, blockId) => locator(page, blockId).clear(),
  },
  expect: {
    value: (page, blockId, val) => expect(locator(page, blockId)).toHaveValue(val),
  },
});
```

Common assertions (`visible`, `hidden`, `disabled`, `enabled`, `validationError`) are auto-provided by the factory.

### Package Exports

```json
{
  "exports": {
    "./e2e/TextInput": "./dist/blocks/TextInput/e2e.js",
    "./e2e/Button": "./dist/blocks/Button/e2e.js"
  }
}
```

### Locator Patterns

Different blocks use different DOM locators:

| Block                      | Locator Pattern              |
| -------------------------- | ---------------------------- |
| `TextInput`, `NumberInput` | `#${blockId}_input`          |
| `Button`                   | `#bl-${blockId} .ant-btn`    |
| `Alert`                    | `#bl-${blockId} .ant-alert`  |
| `Selector`                 | `#bl-${blockId} .ant-select` |

Note: Ant Design components don't always forward the `id` prop, hence the `#bl-${blockId}` wrapper pattern.

## See Also

- [e2e-utils.md](../../utils/e2e-utils.md) - E2E testing utilities
- [basic.md](./basic.md) - Basic blocks (List has e2e helper)
