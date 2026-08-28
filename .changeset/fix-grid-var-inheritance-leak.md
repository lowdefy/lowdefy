---
'@lowdefy/layout': patch
---

fix(layout): Stop grid layout custom properties from inheriting into nested blocks.

The grid emitted column-span, gap, offset, order, push/pull and display values as plain CSS custom properties, which inherit by default. A nested row or column with no value of its own therefore picked up an ancestor's value instead of falling through its `var(…, fallback)` chain — so a box's `gap` leaked as row-gap into every nested box (inflating stacked content), and a column's breakpoint span leaked into nested columns. Registered these properties with `inherits: false` (universal syntax, no initial value) so each block resolves its own value while the existing fallback chains and `calc()` usage are unchanged.
