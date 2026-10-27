---
'@lowdefy/client-native': minor
---

feat(client-native): One native icon renderer, installed as components.Icon

`@lowdefy/client-native` now installs `components.Icon` on every page, as the web client does. It draws an icon by name from `types.icons` with the same `Icon` IconData renderer the shell's menus use, sized from the element font size (`1em` by default) and coloured from the element colour or the theme text colour. A spinning icon, or one whose `onClick` is running, draws `loading`; an unknown name draws `icon-missing`. `createIcon`, `formatIconTitle` and `toPixels` are exported for block sets.
