---
'@lowdefy/layout-native': minor
'@lowdefy/client-native': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat(client-native): Native pages lay out, style and theme blocks as the web does

The new `@lowdefy/layout-native` package computes Lowdefy's 24-column layout as React Native styles: span, offset, order, push and pull per breakpoint, gaps that match the web's column widths, and flex blocks. A phone picks its breakpoint from its shorter side, so turning it to landscape keeps its layout; a tablet uses its width. The native renderer applies Tailwind `class:` values from the app's class map after operators run, with `dark:` and `sm:`/`md:`/`lg:` variants, and lays each slot's `style` over them; operator-produced and shared-page styles are converted to React Native values. `ThemeProvider` and `useTheme` give native blocks antd's computed tokens for the mode showing, following `theme.darkMode`, the `SetDarkMode` action and the device, and `_media: darkMode` works as on the web. The mobile root (`/api/mobile/root`) now sends the app's `theme` and `classMap`, in production and dev, and pages the dev server builds on request carry the class map entries of their own classes.
