---
'@lowdefy/layout': major
'@lowdefy/client': major
---

Replace antd Row/Col grid with pure CSS grid layout system.

### Breaking Changes

- **antd Grid dependency removed**: `@lowdefy/layout` no longer imports antd's `Row`, `Col`, or `Grid` components.
- **CSS Grid implementation**: Layout uses a 24-column CSS grid with CSS custom properties and media queries. Responsive breakpoints (xs, sm, md, lg, xl, 2xl) align with Tailwind CSS v4.
- **`Slot.js` removed**: Slot rendering is handled directly by the layout grid, eliminating the intermediate Slot component.
- **`span: 0` hides block**: Setting `layout.span: 0` now applies `display: none` instead of making the block full-width.
- **Responsive `style` breakpoints removed**: `style.sm`, `style.md` etc. no longer work. Use Tailwind classes via `class: "p-16 sm:p-8"` instead.
- **`_media` operator**: Returns `"2xl"` instead of `"xxl"` for the largest breakpoint.

### Renamed Layout Properties

The `content*` prefix is dropped. Build normalizes old names with a deprecation warning (`ConfigWarning`, error in production).

| Old                       | New                | Purpose                                                                                                                                          |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `layout.contentGutter`    | `layout.gap`       | Spacing between child blocks                                                                                                                     |
| `layout.contentGap`       | `layout.gap`       | Alias, also renamed to `gap`                                                                                                                     |
| `layout.contentAlign`     | `layout.align`     | Vertical alignment of children                                                                                                                   |
| `layout.contentJustify`   | `layout.justify`   | Horizontal distribution of children                                                                                                              |
| `layout.contentDirection` | `layout.direction` | Flex direction                                                                                                                                   |
| `layout.contentWrap`      | `layout.wrap`      | Flex wrap                                                                                                                                        |
| `layout.contentOverflow`  | `layout.overflow`  | Overflow behavior                                                                                                                                |
| `layout.align` (self)     | `layout.selfAlign` | Block's own alignment within parent (runtime heuristic — if `selfAlign` is not set, `align` is treated as self-alignment with a console warning) |
| `slots.*.gutter`          | `slots.*.gap`      | Gap within a slot                                                                                                                                |
| `xxl` breakpoint          | `2xl`              | Aligns with Tailwind v4 (1536px instead of antd's 1600px)                                                                                        |
