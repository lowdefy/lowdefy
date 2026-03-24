# Migration: Nested CSS Selectors in `style:` Blocks

## Context

Lowdefy v4 used Emotion CSS-in-JS under the hood, which allowed nested CSS selectors like `&:hover`, `&:active`, `& > *`, and `& > div` inside `style:` blocks. In v5, `style:` values are applied as plain inline CSS — nested selectors are no longer supported and the build rejects them:

```
[ConfigError] Block "my_block": Style property "&:hover" has a nested object value.
CSS properties must be simple values (strings, numbers) or operators.
```

The fix: convert nested CSS selectors to Tailwind utility classes or move them to `public/styles.css`.

## Scope

`app` — scan YAML/YML files for nested selectors in `style:` and `styles:` blocks.

## What to Do

### 1. Find all nested CSS selectors

Grep for patterns like `'&:hover'`, `'&:active'`, `'&:focus'`, `'& > *'`, `'& > div'`, or any `'&` inside `style:` or `styles:` blocks.

### 2. Pseudo-selectors (`&:hover`, `&:active`, `&:focus`) → Tailwind classes

Replace pseudo-selector styles with Tailwind arbitrary value classes. Keep flat CSS properties in `style:`.

### 3. Child selectors (`& > *`, `& > div`) → Tailwind arbitrary child selectors or wrapper Box

Two options:

- **Tailwind `[&>*]:` prefix** — for simple child styles (padding, color, margin)
- **Wrapper Box block** — for complex child styles, wrap the content in a Box block and apply styles directly

### 4. Sibling/descendant selectors → `public/styles.css`

For complex selectors that can't be expressed as Tailwind classes, move them to `public/styles.css` and reference via `class:`.

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `'&:` or `'& ` inside style blocks

## Examples

### Before — `&:hover` on a box

```yaml
- id: my_box
  type: Box
  style:
    padding: '12px 16px'
    borderBottom: '1px solid #f0f0f0'
    cursor: pointer
    transition: background 0.15s ease
    '&:hover':
      background: '#f7f9fc'
```

### After — Tailwind hover class

```yaml
- id: my_box
  type: Box
  class: 'cursor-pointer transition-[background] duration-150 ease-in-out hover:bg-[#f7f9fc]'
  style:
    padding: '12px 16px'
    borderBottom: '1px solid #f0f0f0'
```

### Before — `&:active` on a card

```yaml
- id: my_card
  type: Card
  style:
    marginBottom: 32
    boxShadow: '0 0 10px #A4B6CC'
    borderRadius: 12
    border: '3px solid #001528'
    '&:active':
      boxShadow: '0 0 10px #8391A3'
```

### After — Tailwind active class

```yaml
- id: my_card
  type: Card
  class: 'active:shadow-[0_0_10px_#8391A3]'
  style:
    marginBottom: 32
    boxShadow: '0 0 10px #A4B6CC'
    borderRadius: 12
    border: '3px solid #001528'
```

### Before — `& > *` child selector

```yaml
- id: my_upload
  type: S3UploadDragger
  style:
    /element:
      '& > *':
        padding: 3px !important
        color: '#8C8C8C'
```

### After — Tailwind child selector

```yaml
- id: my_upload
  type: S3UploadDragger
  class:
    element: '[&>*]:!p-[3px] [&>*]:text-[#8C8C8C]'
```

### Before — `& > div` targeting a wrapper div (e.g., Affix)

```yaml
- id: actions
  type: Affix
  style:
    position: fixed
    bottom: 0
    width: 100%
    /element:
      '& > div':
        background: '#fff'
        borderTop: '3px solid #001528'
        padding: 10
  properties:
    offsetBottom: 0
  blocks:
    - id: submit_btn
      type: Button
```

### After — Wrapper Box block

```yaml
- id: actions
  type: Affix
  style:
    position: fixed
    bottom: 0
    width: 100%
  properties:
    offsetBottom: 0
  blocks:
    - id: actions_wrapper
      type: Box
      style:
        background: '#fff'
        borderTop: '3px solid #001528'
        padding: 10
      blocks:
        - id: submit_btn
          type: Button
```

### Alternative — `public/styles.css` for complex selectors

For selectors that can't be expressed as Tailwind classes:

```css
/* public/styles.css */
.search-result {
  cursor: pointer;
  transition: background 0.15s ease;
}
.search-result:hover {
  background: #f7f9fc;
}
.search-result:active {
  background: #e8ecf1;
}
```

```yaml
- id: my_result
  type: Box
  class: search-result
  style:
    padding: '12px 16px'
    borderBottom: '1px solid #f0f0f0'
```

## Edge Cases

- **Multiple pseudo-selectors on one block**: combine into a single `class:` string (e.g., `'hover:bg-[#f7f9fc] active:bg-[#e8ecf1]'`)
- **`!important` in nested values**: use Tailwind's `!` prefix (e.g., `[&>*]:!p-[3px]`)
- **Nested selectors inside `/element` or `/label` style slots**: convert the slot-specific selector to `class:` with the matching slot key
- **Selectors targeting antd internal elements** (e.g., `& .ant-card-body`): move to `public/styles.css` — Tailwind arbitrary selectors can work but are harder to read for complex antd class targeting
- **`transition` property**: if moving `cursor` and `transition` to class, use Tailwind equivalents (`cursor-pointer`, `transition-[background]`, `duration-150`, `ease-in-out`) or keep `transition` in `style:` — both work
- **Wrapper Box approach**: when wrapping Affix/Layout children in a Box, ensure the child blocks are re-indented correctly under the new Box's `blocks:`

## Verification

1. No nested object values should remain in `style:` blocks:

   ```
   grep -rn "'&:" --include='*.yaml' --include='*.yml' --include='*.njk' .
   grep -rn "'& " --include='*.yaml' --include='*.yml' --include='*.njk' .
   ```

2. Build the app — no `Style property "..." has a nested object value` errors should appear
