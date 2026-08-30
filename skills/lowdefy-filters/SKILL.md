---
name: lowdefy-filters
description: Use when adding filter controls to a list or table — filter state, building a query from it, clearing filters, and keeping filters in the url.
---

# Filters

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### _state

`/lowdefy-docs/content/operators/_state`

If used in a block, the `_state` operator gets a value from the [`state`](/page-and-app-state) object. The `state` is a data object specific to the page it is in. The value of `input` blocks are available in `state`, with their `blockId` as key.

#### _mql

`/lowdefy-docs/content/operators/_mql`

The `_mql` operator uses the [`mingo`](https://www.npmjs.com/package/mingo) package to evaluate MongoDB query language statements as an operator.

#### Selector

`/lowdefy-docs/content/input-blocks/selector`

Dropdown selector with search, clear, and custom icons.

#### DateRangeSelector

`/lowdefy-docs/content/input-blocks/daterangeselector`

Date range picker for selecting start and end dates.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Selector

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `any`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `allowClear` | boolean |  | `true` | Allow the user to clear the selected value, sets the value to null. |
| `autoFocus` | boolean |  | `false` | Autofocus to the block on page load. |
| `bordered` | boolean |  | `true` | Whether or not the selector has a border style. Deprecated, use variant instead. |
| `clearIcon` | string \\| object |  | `"AiOutlineCloseCircle"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input. |
| `label` | object |  |  | Label properties. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `data` | array |  |  | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string |  |  | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string |  |  | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string |  |  | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `options` | array \\| array \\| array \\| array |  | `[]` |  |
| `placeholder` | string |  | `"Select item"` | Placeholder text inside the block before user selects input. |
| `loadingPlaceholder` | string |  | `"Loading"` | Placeholder text to show in options while the block is loading. |
| `notFoundContent` | string |  | `"not Found"` | Placeholder text to show when list of options are empty. |
| `showArrow` | boolean |  | `true` | Show the suffix icon at the drop-down position of the selector. |
| `showSearch` | boolean |  | `true` | Make the selector options searchable. |
| `size` | `"small"`, `"default"`, `"large"` |  | `"default"` | Size of the block. |
| `suffixIcon` | string \\| object |  | `"AiOutlineDown"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at the drop-down position of the selector. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | `"solid"`, `"outlined"`, `"filled"`, `"borderless"` |  |  | Input variant. `solid` fills the whole input with the selected option color; `outlined` colors its border/text. `filled`/`borderless` are the antd input styles. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onBlur`: Trigger action event occurs when selector loses focus.
- `onChange`: Trigger action when selection is changed. Event payload: `value`.
- `onFocus`: Trigger action when selector gets focus.
- `onClear`: Trigger action when selector is cleared.
- `onSearch`: Trigger actions when input is changed. Event payload: `value`.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: basic_selector
  type: Selector
  properties:
    title: Favorite Fruit
    options:
      - label: Apple
        value: apple
      - label: Banana
        value: banana
      - label: Cherry
        value: cherry
      - label: Dragonfruit
        value: dragonfruit
      - label: Elderberry
        value: elderberry
```

#### TextInput

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `string`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `allowClear` | boolean |  | `false` | Allow the user to clear their input. |
| `type` | `"text"`, `"number"`, `"password"`, `"tel"`, `"email"`, `"url"` |  | `"text"` | The type of input, (see MDN). |
| `autoFocus` | boolean |  | `false` | Autofocus to the block on page load. |
| `bordered` | boolean |  | `true` | Whether or not the text input has a border style. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `maxLength` | integer |  |  | The max number of input characters. |
| `placeholder` | string |  |  | Placeholder text inside the block before user types input. |
| `prefix` | string |  |  | Prefix text for the block, priority over $prefix_con. |
| `prefixIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to prefix the text input. |
| `label` | object |  |  | Label properties. |
| `replaceInput` | object |  |  | Regex used to sanitize input. |
| `size` | `"small"`, `"middle"`, `"large"` |  | `"middle"` | Size of the block. |
| `showCount` | boolean |  | `false` | Show text character count |
| `suffix` | string |  |  | Suffix text for the block, priority over suffixIcon. |
| `suffixIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to suffix the text input. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | `"outlined"`, `"filled"`, `"borderless"` |  |  | Input visual variant. When set, takes precedence over bordered. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onBlur`: Trigger action event occurs when text input loses focus.
- `onChange`: Trigger action when text input is changed. Event payload: `value`.
- `onFocus`: Trigger action when text input gets focus.
- `onPressEnter`: Trigger action when enter is pressed while text input is focused.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: basic_default
  type: TextInput
  properties:
    title: Default TextInput
    placeholder: Enter text here
```

#### DateRangeSelector

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `array`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `allowClear` | boolean |  | `true` | Allow the user to clear their input. |
| `autoFocus` | boolean |  | `false` | Autofocus to the block on page load. |
| `bordered` | boolean |  | `true` | Deprecated - use variant: 'borderless'. Whether or not the input has a border style. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `variant` | `"outlined"`, `"filled"`, `"borderless"` |  | `"outlined"` | Variant style of the input. Use 'borderless' instead of bordered: false. |
| `disabledDates` | object |  |  | Disable specific dates so that they can not be chosen. |
| `format` | string |  |  | Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats. Defaults to the active locale's date format, or "YYYY-MM-DD" when no locale is configured. |
| `label` | object |  |  | Label properties. |
| `placeholder` | array |  |  | Placeholder text inside the block before user types input. When unset, antd uses the localized default from ConfigProvider locale. |
| `presets` | array |  |  | Shortcuts listed next to the calendar to quickly select a date range. Presets are re-evaluated every time the block config is evaluated, so operator based values like "_date: now" stay current. A preset is offered on the same terms as the calendar cells: a range that starts or ends on a date disabledDates disables is narrowed to the dates it may select, so a "Last 7 days" shortcut still selects the allowed part of the last 7 days. A shortcut with nothing it may select is listed as disabled. |
| `separator` | string |  | `"~"` | Separator symbol shown between start and end date inputs. |
| `size` | `"small"`, `"default"`, `"large"` |  | `"default"` | Size of the block. |
| `suffixIcon` | string \\| object |  | `"AiOutlineCalendar"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on right-hand side of the date picker. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onChange`: Trigger actions when selection is changed. Event payload: `value`.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: drs_size_small
  type: DateRangeSelector
  properties:
    title: Small
    size: small
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _state

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in state.

**Form 2** — integer: Index to access in state.

**Form 3** — `true`: Return all state.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all state. |

#### _if_none

Provided by `@lowdefy/operators-js`.

Accepts array: Array of [value, default]. Returns default if value is null or undefined.

#### _mql

Provided by `@lowdefy/operators-mql`.

Accepts any: MQL method params. Accepts array positional args or object with named args depending on method (aggregate, expr, test).

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBFind

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: read.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query` | object | yes |  | A MongoDB query object |
| `options` | object |  |  | Optional settings. |
<!-- generated:reference:end -->

## Recipe

Must cover: a `filters` object in state, `payload` built from `_state: filters`, dropping empty filters from the query, `_regex` search fields, date ranges to `$gte`/`$lte`, a clear button with `SetState`, and syncing filters to `urlQuery`.
