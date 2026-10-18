# @lowdefy/layout-native

v7's layout grid (`@lowdefy/layout`'s `grid.css` and `deriveLayout`) as React Native style objects, for the native renderer (`@lowdefy/client-native`). It has no React Native dependency: it only computes styles.

```js
import { blockOrder, getBreakpoint, layoutStyles } from '@lowdefy/layout-native';

const breakpoint = getBreakpoint({ width, height });
const { container, columnGap } = layoutStyles(slotLayout, breakpoint); // an area
const { child } = layoutStyles(blockLayout, breakpoint, columnGap); // a block in it
```

- **Columns.** `span`, `offset`, `order`, `push` and `pull` over 24 columns, with the fallbacks `deriveLayout`'s CSS variables have: top-level values apply from `md`, an `sm` layout applies at `sm` and below, `xs` over it at `xs`, an `md` layout merges over the top-level offset, order, push and pull, and `lg`, `xl` and `2xl` apply from their breakpoint up. Span 0 hides the block.
- **Gap.** `gap` is a number, `[x, y]`, or either per breakpoint; values round to whole points. A React Native percentage cannot subtract a gap (grid.css sizes a column as `span / 24 * (100% + gap) - gap`), so a gapped area is widened by its column gap with a negative left margin and each block takes the gap as left padding. Span and offset percentages of the widened area then give the web's widths. The renderer puts the area's slot style on an outer view and the block's own style on an inner view, so neither covers the gap.
- **Flex blocks.** A layout with `flex`, `grow`, `shrink` or `size` is placed by flex at every breakpoint, as on the web. A size in points grows by the gap padding.
- **Order.** React Native has no `order` style; `blockOrder` gives the order the renderer sorts an area's blocks by.
- **Breakpoints.** `getBreakpoint` uses v7's thresholds (640, 768, 1024, 1280, 1536). A phone measures its shorter side, so turning it to landscape keeps its portrait layout; a window whose shorter side is 600 points or more (a tablet, Android's `sw600dp`) measures its width. Every phone is `xs`.
- `contentGutter` and the other deprecated layout keys are not read.
