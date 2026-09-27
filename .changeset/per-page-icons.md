---
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/client': minor
'@lowdefy/block-utils': patch
'@lowdefy/api': patch
'@lowdefy/block-dev': patch
---

Production pages load only the icons they use.

Icons used to be one app-wide chunk that every page loaded, which is costly for apps with a long `theme.icons.include` list or the react-icons compatibility set. Each page's plugin chunk now carries its own icons: the names in its config and `_js` functions, the icons its blocks draw, and the icons in `menus` and `global`.

- An icon name that only arrives at runtime (from state, a request, HTML built from data, `theme.icons.include`, or another page) still renders. The first time a page draws a bundled icon that is not one of its own, it loads the rest of the app's icons once; the icon keeps its space, empty, until they arrive. A `data-icon` name renders nothing until then.
- A page whose Dynamic content names such an icon loads the app's icons before it first renders, and the HTML preloads them.
- `Client` takes an optional `loadAllIcons` prop, and `createIcon` now takes `{ icons, loadAllIcons }`.

No config changes. The dev server still loads every icon.
