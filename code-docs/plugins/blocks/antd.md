# @lowdefy/blocks-antd

Primary UI component library for Lowdefy, built on [Ant Design v5](https://ant.design/components/overview) with CSS-in-JS (CSS variables mode). Contains 71 blocks covering most UI needs.

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

Ant Design runs in CSS variables mode (`cssVar: { key: 'lowdefy' }`, `hashed: false`) configured in the server's `_app.js`. The `<Html>` element has `className="lowdefy"` in `_document.js` so the CSS variables are set on `:root`, allowing Tailwind and custom CSS to reference `--ant-*` tokens. No Less or CSS-in-JS hashing at runtime.

### `withTheme` HOC

Every block is wrapped with the `withTheme(antdComponentName, BlockComponent)` higher-order component (defined in `src/blocks/withTheme.js`). It intercepts `properties.theme` and, when present, wraps the block in a scoped `<ConfigProvider>` that applies per-block Ant Design token overrides:

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

The first argument (`antdComponentName`) must match the Ant Design component name so the theme tokens target the correct component.

### `cssKeys` in Block Meta

Each block declares `cssKeys` in its `meta`, listing which style targets the block supports:

```javascript
BadgeBlock.meta = {
  category: 'display',
  icons: [...],
  styles: [...],
  cssKeys: ['element', 'indicator'],
};
```

These keys define valid targets for the `class` (object form) and `styles` config properties. Common keys:

| Key         | Purpose                                           |
| ----------- | ------------------------------------------------- |
| `element`   | The primary antd component element                |
| `popup`     | Popup/dropdown overlays (selectors, date pickers) |
| `indicator` | Status indicators (Badge)                         |
| `header`    | Header sections (Card, Collapse)                  |

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

| Block               | Type         | Purpose                         |
| ------------------- | ------------ | ------------------------------- |
| `TextInput`         | String       | Single line text                |
| `TextArea`          | String       | Multi-line text                 |
| `PasswordInput`     | String       | Password with visibility toggle |
| `NumberInput`       | Number       | Numeric input with controls     |
| `Selector`          | Single       | Dropdown selection              |
| `MultipleSelector`  | Array        | Multi-select dropdown           |
| `RadioSelector`     | Single       | Radio button group              |
| `CheckboxSelector`  | Array        | Checkbox group                  |
| `ButtonSelector`    | Single/Array | Button-style selection          |
| `TreeSelector`      | Single/Array | Hierarchical selection          |
| `DateSelector`      | Date         | Date picker                     |
| `DateTimeSelector`  | Date         | Date and time picker            |
| `DateRangeSelector` | Array        | Date range picker               |
| `MonthSelector`     | Date         | Month picker                    |
| `WeekSelector`      | Date         | Week picker                     |
| `Switch`            | Boolean      | Toggle switch                   |
| `CheckboxSwitch`    | Boolean      | Checkbox input                  |
| `Slider`            | Number       | Slider input                    |
| `RatingSlider`      | Number       | Star rating                     |
| `AutoComplete`      | String       | Autocomplete text               |
| `PhoneNumberInput`  | String       | Phone number with country code  |

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
