---
'@lowdefy/build': minor
'@lowdefy/style-native': minor
---

feat(build): Mobile builds write the app's theme tokens and Tailwind class map, and check styles for native blocks

For an app with a `mobile` key, `lowdefy build` now writes `build/mobile/theme.json`, antd's computed tokens for light and dark mode, and `build/mobile/classMap.json`, every Tailwind class on mobile pages compiled to a React Native style with the app's own theme, including `dark:` and `sm:`/`md:`/`lg:` variants. Styles on mobile pages are checked against what React Native can do: px and rem become numbers and shorthands expand, while `display: grid`, `:hover`, `calc()`, `position: fixed`, transitions and `cursor` fail the build naming the page, block, slot and key. A class with no native form, such as `hover:` or `grid-cols-2`, fails the build naming the page, block and class. The new `@lowdefy/style-native` package holds the style converter the mobile shell shares. Web builds are unchanged.
