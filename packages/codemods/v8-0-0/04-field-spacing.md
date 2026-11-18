# Migration: Stacked Fields Carry Their Own Spacing

## Context

**In Lowdefy 8 an input with its label above it keeps space below itself**, so a form needs no
`layout.gap` between its fields. This applies to every `@lowdefy/blocks-antd` input block (any block
with a `label` property: TextInput, Selector, DateSelector, Switch and the rest) and to the Label
block.

| Field                                             | Lowdefy 7                             | Lowdefy 8                 |
| ------------------------------------------------- | ------------------------------------- | ------------------------- |
| Label above the input, default and large size     | 0 below the field, 8px label to input | 16px below the field, 8px |
| Label above the input, `size: small`              | 0 below the field, 0 label to input   | 4px below the field, 2px  |
| `label.inline: true`                              | 0 below the field                     | 0 below the field (same)  |
| No label (`label.disabled: true`, or `title: ''`) | 0 below the field                     | 0 below the field (same)  |

A container sets the spacing for all the fields inside it with the CSS variables
`--lf-field-gap` (default 16px) and `--lf-field-gap-small` (default 4px) in its `style`.

An app that is not migrated **still builds and works**. Containers that spaced their fields with
`layout.gap` now get the gap plus the field's own space, so their forms look loose: 32px between
fields for `gap: 16`.

## What to Do

Skip `node_modules/`, `.lowdefy/`, `.git/` and build output folders in every step.

### 1. Find containers that space fields with a gap

```
grep -rnE '^\s*(gap|gutter|contentGap|contentGutter):' \
  --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' \
  --exclude-dir=node_modules --exclude-dir=.lowdefy .
```

`gutter`, `contentGap` and `contentGutter` are deprecated names for `gap`, under `layout` or
`slots.content`. For each hit, look at the blocks directly inside that container. It is a **form
container** when its blocks are stacked input blocks with their label above the input (no
`label.inline`, no `label.disabled`), with at most one row of buttons after the last field. A
`Box` of fields placed side by side (`layout.span` below 24, or `layout.flex`) counts too.

Leave every other container alone: page layouts, card grids, button rows, and filter bars whose
inputs are inline or have no label.

### 2. Take the vertical gap off each form container

`gap` is either one value for both directions, `[horizontal, vertical]`, or either of those as a
breakpoint object (`{ xs: 8, md: 16 }`).

- **Fields one per row:** remove `gap`. If it was a `[horizontal, vertical]` array, remove it too.
- **Fields side by side:** keep the horizontal gap and set the vertical gap to 0: `gap: 16`
  becomes `gap: [16, 0]`, and `gap: [24, 16]` becomes `gap: [24, 0]`.
- **A vertical gap under 12 or over 24:** the app chose tighter or looser spacing than the new
  16px. Keep it by setting the variable on the container instead, with the old vertical gap:
  `style: { --lf-field-gap: 8px }`. Use `--lf-field-gap-small` when the fields are `size: small`.

```yaml
# Before
- id: contact_form
  type: Box
  layout:
    gap: 16
  blocks:
    - id: name
      type: TextInput
    - id: email
      type: TextInput
# After
- id: contact_form
  type: Box
  blocks:
    - id: name
      type: TextInput
    - id: email
      type: TextInput
```

A form container whose gap comes from a `_ref` var or an operator: rewrite the value where it is
set if every use is a form container, otherwise leave it and report it.

### 3. Check the build and report

Run `lowdefy build`. Nothing in this migration changes what builds.

Report each container you changed with its old and new gap, and each one you left that might be a
form container: mixed blocks (a heading or divider between fields), gaps from vars or operators,
and fields whose label is set at runtime. Tell the developer to look at a few forms in the app,
since the spacing is a visual change the build cannot check.
