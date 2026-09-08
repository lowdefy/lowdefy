---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): Editor styles now apply in production builds.

The Tiptap block styles (wrapper, ProseMirror content, mention menu, tables) are global
stylesheets, but they were shipped as CSS Modules (`style.module.css`) imported for side effect
(`import './style.module.css'`) with every rule wrapped in `:global(...)`. The Vite dev server
injected them, but the production client build dropped them — so on `lowdefy build` + `lowdefy
start` (and on Vercel) the Tiptap inputs rendered unstyled while `lowdefy dev` looked correct.

The files are now plain `.css` (the redundant `:global()` wrappers removed, since the selectors are
already global), which the production build includes reliably. No config or markup changes.
