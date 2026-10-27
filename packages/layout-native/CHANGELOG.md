# @lowdefy/layout-native

## 7.2.0

### Minor Changes

- 048e010: feat(client-native): Native pages lay out, style and theme blocks as the web does

  The new `@lowdefy/layout-native` package computes Lowdefy's 24-column layout as React Native styles: span, offset, order, push and pull per breakpoint, gaps that match the web's column widths, and flex blocks. A phone picks its breakpoint from its shorter side, so turning it to landscape keeps its layout; a tablet uses its width. The native renderer applies Tailwind `class:` values from the app's class map after operators run, with `dark:` and `sm:`/`md:`/`lg:` variants, and lays each slot's `style` over them; operator-produced and shared-page styles are converted to React Native values. `ThemeProvider` and `useTheme` give native blocks antd's computed tokens for the mode showing, following `theme.darkMode`, the `SetDarkMode` action and the device, and `_media: darkMode` works as on the web. The mobile root (`/api/mobile/root`) now sends the app's `theme` and `classMap`, in production and dev, and pages the dev server builds on request carry the class map entries of their own classes.

### Patch Changes

- 2007fea: fix(native): Read lengths, typed numbers and html labels in linear time

  Five regular expressions in the native client took time that grew with the square of the input on long strings that do not match: a CSS length (`toPixels`, a block `size` or `flex` basis) and the text typed in a NumberInput, given a long run of digits; an option label or "supports html" text given a long run of `<`; and the app server url given a long run of `/`. A string of 100,000 such characters held the JavaScript thread for several seconds. Each now reads the same strings with a pattern that does not backtrack, so the results are unchanged. Text with an unclosed `<` before a tag now keeps that `<`: `<a<b>` shows as `<a`, where before the whole of it was dropped.

- 73982e8: fix: Blocks aligned in a wrapping row on mobile take their content's height

  A block's inner view grew to fill its placement, so in a wrapping row with `align` set every line took the whole row's height and the lines after the first drew over the next block. The inner view now grows only when its placement is taller than its content: stretched by a row, or grown in a column (`fillsPlacement` in `@lowdefy/layout-native`).

- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [3cd6d62]
- Updated dependencies [b1d42ca]
  - @lowdefy/helpers@7.2.0
