---
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

fix(server): Colours written with `light-dark()` in `public/styles.css` survive the production build. Vite minifies client CSS with Lightning CSS, which rewrote every `light-dark()` into variables that only a CSS `color-scheme` declaration defines. Lowdefy sets `color-scheme` from JavaScript, so those variables were never set and every such colour was dropped in production while the dev server, which does not minify, showed it. The client build now leaves `light-dark()` as written.
