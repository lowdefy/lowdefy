---
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

Keep the CSS of `.module.css` files that blocks import only for their side effects

Vite 8 tree-shakes a `.module.css` imported as `import './style.module.css'`, and drops its CSS with it, so `:global(...)` rules in block and plugin stylesheets never reached the built client. Webpack kept them in v5. Affected styles included the `Menu` flyout height cap, the `UploadDragger` drop-zone height, and every custom plugin block styled this way. The production build now marks CSS modules as side-effectful, so their CSS is kept whatever the import style. The dev server was not affected.
