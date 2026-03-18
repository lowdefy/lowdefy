---
'@lowdefy/layout': major
'@lowdefy/client': major
---

Replace antd Row/Col grid with a pure CSS grid layout system.

### Breaking Changes

- **antd Grid dependency removed**: `@lowdefy/layout` no longer imports antd's `Row`, `Col`, or `Grid` components.
- **CSS Grid implementation**: Layout uses a 24-column CSS grid with CSS custom properties and media queries. Responsive breakpoints align with Tailwind CSS v4.
- **`span: 0` hides block**: Setting `layout.span: 0` now applies `display: none` instead of making the block full-width.
- **Responsive `style` breakpoints removed**: `style.sm`, `style.md` etc. no longer work. Use Tailwind classes via `class: "p-16 sm:p-8"` instead.
- **`_media` operator**: Returns `"2xl"` instead of `"xxl"` for the largest breakpoint (1536px instead of 1600px).

### Renamed Layout Properties

The `content*` prefix is dropped. Build normalizes old names with a deprecation warning.

| Old                       | New                | Purpose                        |
| ------------------------- | ------------------ | ------------------------------ |
| `layout.contentGutter`    | `layout.gap`       | Spacing between child blocks   |
| `layout.contentAlign`     | `layout.align`     | Vertical alignment of children |
| `layout.contentJustify`   | `layout.justify`   | Horizontal distribution        |
| `layout.contentDirection` | `layout.direction` | Flex direction                 |
| `layout.contentWrap`      | `layout.wrap`      | Flex wrap                      |
| `layout.contentOverflow`  | `layout.overflow`  | Overflow behavior              |
| `slots.*.gutter`          | `slots.*.gap`      | Gap within a slot              |
| `xxl` breakpoint          | `2xl`              | Aligns with Tailwind v4        |
