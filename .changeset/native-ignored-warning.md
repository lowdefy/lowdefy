---
'@lowdefy/build': minor
'@lowdefy/block-utils': minor
'@lowdefy/errors': minor
'@lowdefy/blocks-native': minor
---

feat(build): Warn when a mobile page sets a property the phone ignores

Native blocks accept the web properties a phone cannot honour (such as `hoverable`, `copyable`, a label's `align` or an input's `prefixIcon`), so a page shared by web and mobile stays valid. The build now warns when a mobile or shared page sets one: once per page for each block type and property, naming the page, the block and the property. `~ignoreBuildChecks: [native-ignored]` silences it.

- `extractBlockTypes` lists the property paths a meta marks `nativeIgnored: true` in the block meta it returns.
- The native list and input blocks now mark their ignored properties `nativeIgnored`, as the layout and display blocks do.
