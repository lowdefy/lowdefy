# Responsive Style Breakpoints Migration

## What Changed

Responsive breakpoint keys inside `style:` blocks (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) are no longer supported. Use Tailwind utility classes via the `class` property instead.

**Note:** `layout.sm.span` (responsive column spans) is NOT affected — only `style.sm.*` breakpoints are removed.

## How to Migrate

### 1. Find affected files

Search for responsive breakpoint keys in style objects:

```bash
grep -rn 'sm:\|md:\|lg:\|xl:\|xs:\|2xl:' . --include='*.yaml' --include='*.yml' | grep -v node_modules | grep -v .codemod-backup
```

### 2. For each match, check context

Only matches inside a `style:` block on a Lowdefy block need migration. Layout responsive keys (`layout: { sm: { span: 12 } }`) are unaffected.

### 3. Replace with Tailwind classes

Move responsive styles to the `class` property using Tailwind breakpoint prefixes.

#### Before

```yaml
- id: hero_section
  type: Box
  style:
    --element:
      padding: 64
      fontSize: 24
      sm:
        padding: 32
        fontSize: 16
      md:
        display: none
```

#### After

```yaml
- id: hero_section
  type: Box
  properties:
    class: 'p-16 text-2xl sm:p-8 sm:text-base md:hidden'
```

### Common Mappings

| Style Property   | Tailwind Class |
| ---------------- | -------------- |
| `padding: 64`    | `p-16`         |
| `padding: 32`    | `p-8`          |
| `margin: 16`     | `m-4`          |
| `fontSize: 24`   | `text-2xl`     |
| `fontSize: 16`   | `text-base`    |
| `display: none`  | `hidden`       |
| `display: block` | `block`        |
| `display: flex`  | `flex`         |
| `width: '100%'`  | `w-full`       |
| `width: '50%'`   | `w-1/2`        |

### Checklist

- [ ] Search for responsive breakpoint keys in `style:` blocks
- [ ] For each match, verify it's inside a `style:` block (not `layout:`)
- [ ] Convert each responsive style to Tailwind classes on the `class` property
- [ ] Remove the responsive keys from `style:`
- [ ] Test at each breakpoint width to verify visual equivalence
