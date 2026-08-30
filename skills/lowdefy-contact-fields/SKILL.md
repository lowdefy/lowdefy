---
name: lowdefy-contact-fields
description: Use when a form captures a person or organisation contact — names, email, phone, address — with consistent block choices, validation and stored shape.
---

# Contact fields

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### PhoneNumberInput

`/lowdefy-docs/content/input-blocks/phonenumberinput`

Phone number input with international country code selector.

#### TextInput

`/lowdefy-docs/content/input-blocks/textinput`

Single-line text input with sizes, prefix/suffix icons, character count, and clear button.

#### _regex

`/lowdefy-docs/content/operators/_regex`

The `_regex` operator performs a regex test on a string, and returns `true` if there is a match.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### PhoneNumberInput

Provided by `@lowdefy/blocks-antd`. Category: `input`, value type: `object`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `showFlags` | boolean |  | `true` | Show country flags in the country selector and input. |
| `allowClear` | boolean |  | `false` | Allow the user to clear their input. |
| `allowedRegions` | array |  |  | List of allowed ISO 3166-1 alpha-2 region codes. If allowedRegions is [] or null, the default list of all regions is used. |
| `autoFocus` | boolean |  | `false` | Autofocus to the block on page load. |
| `bordered` | boolean |  | `true` | Whether or not the text input has a border style. Deprecated, use variant instead. |
| `defaultRegion` | string |  |  | The dial code of the default region to be used. |
| `disabled` | boolean |  | `false` | Disable the block if true. |
| `maxLength` | integer |  |  | The max number of input characters. |
| `placeholder` | string |  |  | Placeholder text inside the block before user types input. |
| `prefix` | string |  |  | Prefix text for the block, priority over $prefix_con. |
| `prefixIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to prefix the text input. |
| `label` | object |  |  | Label properties. |
| `replaceInput` | object |  |  | Regex used to sanitize input. |
| `showArrow` | boolean |  | `true` | Show the suffix icon at the drop-down position of the selector. |
| `size` | `"small"`, `"middle"`, `"large"` |  | `"middle"` | Size of the block. |
| `suffix` | string |  |  | Suffix text for the block, priority over suffixIcon. |
| `suffixIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to suffix the text input. |
| `title` | string |  |  | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | `"outlined"`, `"filled"`, `"borderless"` |  |  | Input visual variant. When set, takes precedence over bordered. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onInputChange`: Trigger action when text input is changed.
- `onCodeChange`: Trigger action when the selector is changed.
- `onChange`: Trigger action when the number is changed. Event payload: `value`.
- `onBlur`: Trigger action event occurs when input loses focus.
- `onFocus`: Trigger action when input gets focus.
- `onPressEnter`: Trigger action when enter is pressed while text input is focused.
- `onTooltipClick`: Trigger actions when the tooltip icon is clicked.

##### Example

```yaml
- id: basic_default
  type: PhoneNumberInput
  properties:
    title: Default PhoneNumberInput
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

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _regex

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Regex pattern string to test against the current location value.

**Form 2** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `pattern` | string | yes |  | Regex pattern string. |
| `on` | string |  |  | String to test the pattern against. |
| `key` | string |  |  | State key path to get the string to test against. |
| `flags` | string |  |  | Regex flags (default "gm"). |
<!-- generated:reference:end -->

## Recipe

Must cover: the stored contact shape (`name`, `email`, `phone`, `address`), `PhoneNumberInput` for phone, email `validate` with `_regex`, lowercase/trim on save, and a shared `_ref` template for the field group.
