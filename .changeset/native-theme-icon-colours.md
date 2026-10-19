---
'@lowdefy/blocks-native': patch
'@lowdefy/client-native': minor
---

fix: Selector option `iconColor` and icon `color` resolve through the theme on mobile

- A Selector option's `iconColor` (the glyph in the menu and sheet rows and the sheet) takes a palette hue (`amber`, `blue`), a theme token (`colorPrimary`, `colorTint`) or a colour value, as Tag, ListItem and the other native blocks read colours.
- The native icon renderer resolves an icon's `color` the same way, so the Icon block's `color: colorPrimary` and every icon a block draws from config (a ListItem's leading icon, a badge icon) follow the theme in light and dark mode.
- `resolveColor` moves from `@lowdefy/blocks-native` into `@lowdefy/client-native`, which exports it.
