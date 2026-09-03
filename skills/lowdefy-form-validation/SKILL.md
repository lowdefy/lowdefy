---
name: lowdefy-form-validation
description: Use when a form must refuse bad input — required fields, validate rules, the Validate action, per-step validation, and what counts as empty.
kind: reference
lowdefyVersion: 5.5.1
---

# Form validation

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `actions/validate`, `actions/resetvalidation`, `actions/reset`, `operators/_type`, `operators/_regex`, `operators/_not`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `TextInput` (`@lowdefy/blocks-antd`), `Selector` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_type` (`@lowdefy/operators-js`), `_regex` (`@lowdefy/operators-js`), `_not` (`@lowdefy/operators-js`), `_and` (`@lowdefy/operators-js`).

### Actions

`lowdefy_get_schema` with kind `actions`: `Validate` (`@lowdefy/actions-core`), `ResetValidation` (`@lowdefy/actions-core`), `Reset` (`@lowdefy/actions-core`).
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
