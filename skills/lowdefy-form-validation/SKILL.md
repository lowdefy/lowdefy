---
name: lowdefy-form-validation
description: Use when a form must refuse bad input — required fields, validate rules, the Validate action, per-step validation, and what counts as empty.
---

# Form validation

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Validate

`/lowdefy-docs/content/actions/validate`

The `Validate` action is used to validate a users input, usually before information is inserted into a database using a request. It is used in conjunction with the `required` and `validate` fields on input blocks. If the validation fails, the `Validate` action will fail, and this will stop the execution of actions that are defined after it.

#### ResetValidation

`/lowdefy-docs/content/actions/resetvalidation`

The `ResetValidation` action is used to reset validation flags on input fields.

#### Reset

`/lowdefy-docs/content/actions/reset`

The `Reset` actions resets a page to the state it was in just after the `onInit` event was executed. This clears the user's inputs.

#### _type

`/lowdefy-docs/content/operators/_type`

The `_type` operator performs a type test on an object, and returns true if the object is of the specified type.

#### _regex

`/lowdefy-docs/content/operators/_regex`

The `_regex` operator performs a regex test on a string, and returns `true` if there is a match.

#### _not

`/lowdefy-docs/content/operators/_not`

The `_not` operator returns the logical negation of the input. If the value is not a boolean, it will be converted to a boolean using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

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

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _type

Provided by `@lowdefy/operators-js`.

**Form 1** — `"string"`, `"array"`, `"date"`, `"object"`, `"boolean"`, `"number"`, `"integer"`, `"null"`, `"undefined"`, `"none"`, `"empty"`, `"primitive"`: Type name to test against state value at current location. The "empty" test is true for null, undefined, '' and [], and false for 0, false and {}.

**Form 2** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `"string"`, `"array"`, `"date"`, `"object"`, `"boolean"`, `"number"`, `"integer"`, `"null"`, `"undefined"`, `"none"`, `"empty"`, `"primitive"` | yes |  | Type name to test. |
| `on` | any |  |  | Value to test the type of. |
| `key` | string |  |  | State key to test the type of. |

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

#### _not

Provided by `@lowdefy/operators-js`.

Accepts boolean: Boolean value to negate.

#### _and

Provided by `@lowdefy/operators-js`.

Accepts array: Array of values. Returns true if all values are truthy.

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

#### Validate

Provided by `@lowdefy/actions-core`.

**Form 1** — string: Shorthand for a single blockId to validate.

**Form 2** — array: An array of blockIds to validate.

#### ResetValidation

Provided by `@lowdefy/actions-core`.

**Form 1** — string: Shorthand for a single blockId.

**Form 2** — array: An array of blockIds to reset validation for.

#### Reset

Provided by `@lowdefy/actions-core`.

_No schema._
<!-- generated:reference:end -->

## Recipe

Validation in Lowdefy is declared on the input block (`required`, `validate`) and *triggered* by
the `Validate` action. Nothing is checked until `Validate` runs; after the first run, feedback
stays live on every keystroke until `Reset` or `ResetValidation`.

**Superseded by:** `lowdefy_get_schema` for the block's properties; `lowdefy_eval_operator` to
test a `pass` expression against the page's real state before you commit to it. The rules below
are the parts no schema carries.

### 1. `required` — and what "empty" means

```yaml
- id: customer.email
  type: TextInput
  required: true                 # default message: "This field is required"
- id: customer.name
  type: TextInput
  required: Please enter the customer's name.   # a string is the message
```

In v8 a field fails `required` when its value is **empty**: `null`, `undefined`, `''` or `[]`.
`0`, `false` and `{}` are values and pass. The test `required` applies is exactly
`pass: { _not: { _type: empty } }`.

This is the semantics trap. Before v8 only `null`/`undefined` failed, so a `TextInput` the user
cleared (`''`), a `Selector` reset with `allowClear` (`''`) or an untouched `MultipleSelector`
(`[]`) all passed `required` silently and the form saved blanks. If you are porting v7 config,
do not add `_type: empty` checks by hand to work around the old behaviour — delete them,
`required` now does it.

The flip side: a field that *legitimately* accepts an empty string or an empty array must **not**
be `required`. Use an explicit `validate` test instead:

```yaml
- id: notes
  type: TextInput
  validate:
    - message: Notes must be text.
      pass:
        _type:
          type: string
          key: notes
```

`required` accepts operators, so a conditionally required field is `required: { _eq: [...] }`,
not a second copy of the block behind `visible`. Remember that `visible: false` deletes the
block's value from state — a hidden required field is neither validated nor saved.

### 2. `validate` rules

`validate` is an ordered list; the first failing test is the message the user sees. Each test is
`{ pass, message, status? }`, and every rule is evaluated where the block sits, so `_state` reads
the current form:

```yaml
- id: customer.email
  type: TextInput
  required: true
  validate:
    - message: Enter a valid email address.
      pass:
        _regex:
          pattern: ^[^@\s]+@[^@\s]+\.[^@\s]+$
          key: customer.email
    - message: Company emails only.
      status: warning
      pass:
        _not:
          _regex:
            pattern: '@(gmail|yahoo|hotmail)\.'
            key: customer.email
```

Rules:

- `_regex` and `_type` take `key` (a state path) or `on` (any value). Prefer `key: <this block's
  id>` so the rule stays correct when the block is copied — never `_state: <some other id>`
  unless the rule is genuinely cross-field.
- Order tests from cheap to expensive and from shape to meaning: type, then format, then
  cross-field.
- `status: warning` shows amber feedback and does **not** fail `Validate`. Use it for advice
  (`Company emails only`), never for anything the request would reject.
- Cross-field rules go on the field that is wrong, not on the button:
  `pass: { _gte: [{ _state: end_date }, { _state: start_date }] }` lives on `end_date` with
  the message `End date must be after start date.`
- Do not duplicate `required` inside `validate` (`_not: { _type: empty }`) — that is what
  `required` is.
- A `pass` whose operator fails at runtime (bad regex, wrong argument shape) counts as a failed
  test and shows the rule's message, so a broken rule looks like a strict one. An unknown
  operator name in a rule is a **build error** in v8. Check `lowdefy_build_status` after writing
  rules and evaluate each `pass` with `lowdefy_eval_operator`.

### 3. The `Validate` action

`Validate` throws when any matched block has an error-status failure, which stops the action
chain — so it goes **before** the save request, and the request never runs on bad input:

```yaml
- id: save
  type: Button
  properties:
    title: Save
  events:
    onClick:
      - id: validate
        type: Validate
      - id: save_customer
        type: Request
        params: save_customer
      - id: done
        type: Link
        params:
          pageId: customers
```

- No params validates every block on the page; a block id, an array of ids, or
  `{ regex: '^customer\.' }` validates a subset.
- The first `Validate` call turns feedback on for the matched blocks. Until then a `required`
  field shows only its asterisk — users are not shouted at on page load.
- `Reset` clears the form back to post-`onInit` state *and* the validation flags;
  `ResetValidation` clears only the flags. Call `ResetValidation` when switching the record being
  edited, `Reset` for a "cancel" button.
- A failing `Validate` does not display a message by itself — the fields do. Do not add a
  `DisplayMessage` in a `catch` for it; add `messages.error` to the *request* for server errors.

### 4. Per-step validation

A multi-step form validates only the current step's fields, using ids that share a prefix:

```yaml
- id: next_step_1
  type: Button
  events:
    onClick:
      - id: validate_step_1
        type: Validate
        params:
          regex: '^step1\.'
      - id: go
        type: SetState
        params:
          step: 2
```

Keep every step's blocks mounted and switch with `visible` on the step containers, and remember
the trap from step 1: `visible: false` deletes state. Fields on hidden steps lose their values
and are skipped by validation. If you need to hide a completed step, copy its values with
`SetState` under a different key before hiding it, or collapse the step visually (a container
with a small `height`/`Collapse` block) instead of removing it.

### 5. Server-side is not optional

`required` and `validate` are client feedback; a request can be called with any payload. Enforce
the same invariants where the write happens: inside the request (`MongoDBUpdateOne` with a filter
that includes the expected status, `$setOnInsert` for fields that must not change), or route the
write through an `Api` endpoint — its `payloadSchema` is enforced on every caller in v8 and a
non-conforming payload is refused with a `UserError` (see `lowdefy-api-routines`).

### 6. Verify

1. `lowdefy_build_status` — no unknown operators or block properties.
2. `lowdefy_eval_operator` with each `pass` expression against a checkpoint of the page state
   (`lowdefy_checkpoint`, then `lowdefy_load_state`) for the empty, wrong and right cases.
3. `lowdefy_screenshot_page` after clicking Save with an empty form: every required field shows
   its message; the request did not run (`lowdefy_inspect_state` shows no response).
4. `lowdefy check` before committing.

### Checklist

- `required` on every field the record needs; a string message where the default is unclear.
- No `required` on fields that may be `''` or `[]`; an explicit `validate` test instead.
- `validate` rules use `key: <own id>`, ordered type → format → cross-field; warnings are
  `status: warning`.
- `Validate` precedes the save `Request` in the same chain; `Reset`/`ResetValidation` on cancel
  or record switch.
- Steps validate by `regex` prefix; no validated field is ever `visible: false`.
- The write path enforces the same invariants server-side.
