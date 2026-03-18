# Migration: Responsive Style Breakpoints → Tailwind Classes

## Context

Lowdefy v4 supported responsive breakpoint keys inside `style:` blocks (e.g., `sm:`, `md:`, `lg:`). This feature is removed in v4.8 — responsive styling now uses Tailwind utility classes via the new `class` property.

## What to Do

For each block that uses responsive breakpoint keys inside `style:`, convert the responsive styles to equivalent Tailwind utility classes on the `class` property.

### Common Tailwind Mappings

| CSS Property     | Tailwind Prefix | Example                     |
| ---------------- | --------------- | --------------------------- |
| `padding`        | `p-`            | `padding: 16` → `p-4`       |
| `margin`         | `m-`            | `margin: 8` → `m-2`         |
| `display: none`  | `hidden`        |                             |
| `display: block` | `block`         |                             |
| `display: flex`  | `flex`          |                             |
| `fontSize`       | `text-`         | `fontSize: 24` → `text-2xl` |
| `width`          | `w-`            | `width: '100%'` → `w-full`  |
| `gap`            | `gap-`          | `gap: 16` → `gap-4`         |

Tailwind breakpoint prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Conversion approach

1. Find `style:` blocks with breakpoint keys (`sm:`, `md:`, `lg:`, `xl:`, `xxl:` / `2xl:`)
2. For each breakpoint, map the CSS properties to Tailwind classes
3. Add the classes to the block's `class` property (create if it doesn't exist)
4. Remove the breakpoint keys from `style:`
5. If `style:` becomes empty after removing breakpoints, remove the `style:` block entirely

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `sm:|md:|lg:|xl:|2xl:|xxl:` (within `style:` blocks on Lowdefy blocks)

**Important:** `layout.sm.span` (antd Col responsive) is NOT affected — only `style.sm.*` breakpoints are removed. Don't touch responsive keys under `layout:`.

## Examples

### Before — responsive padding

```yaml
- id: container
  type: Box
  style:
    padding: 64
    sm:
      padding: 32
    md:
      padding: 48
```

### After

```yaml
- id: container
  type: Box
  class: p-16 sm:p-8 md:p-12
```

### Before — responsive visibility

```yaml
- id: sidebar
  type: Box
  style:
    display: none
    md:
      display: block
```

### After

```yaml
- id: sidebar
  type: Box
  class: hidden md:block
```

### Before — mixed responsive and static styles

```yaml
- id: card
  type: Card
  style:
    /element:
      borderRadius: 8
      fontSize: 24
      sm:
        fontSize: 16
```

### After

```yaml
- id: card
  type: Card
  style:
    /element:
      borderRadius: 8
  class: text-2xl sm:text-base
```

## Edge Cases

- Not all CSS properties have direct Tailwind equivalents — for complex properties (transforms, animations, specific pixel values), use arbitrary values: `class: "p-[17px] sm:p-[9px]"`
- If the block already has a `class` property, append the responsive classes to it
- Pixel-to-Tailwind-unit conversion: Tailwind uses a 4px scale (1 unit = 4px). `padding: 16` → `p-4`, `margin: 8` → `m-2`
- Some responsive styles may be better left as custom CSS — use judgment for complex layouts
- This migration requires understanding the visual intent, not just mechanical replacement

## Verification

```
grep -rn 'sm:\|md:\|lg:\|xl:\|2xl:' --include='*.yaml' --include='*.yml' . | grep -v layout | grep -v node_modules
```

Remaining matches should only be inside `layout:` blocks (which are not affected) or non-Lowdefy YAML files.
