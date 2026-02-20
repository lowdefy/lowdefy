# @lowdefy/blocks-antd

Primary UI component library for Lowdefy, built on [Ant Design](https://ant.design/components/overview). Contains 62 blocks covering most UI needs.

## Overview

This is the default block package included with Lowdefy. It provides:

- Form inputs (text, number, date, selectors)
- Layout components (Card, Collapse, Tabs)
- Display components (Title, Paragraph, Alert)
- Navigation (Menu, Breadcrumb, Pagination)
- Feedback (Message, Modal, Progress)

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

### Special Blocks

| Block     | Purpose          |
| --------- | ---------------- |
| `Divider` | Visual separator |
| `Comment` | Comment display  |

## Common Properties

Most blocks support:

```yaml
properties:
  # Styling
  style: { ... } # CSS styles

  # Content (varies by block)
  title: string
  content: string

  # State
  disabled: boolean
  loading: boolean
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
