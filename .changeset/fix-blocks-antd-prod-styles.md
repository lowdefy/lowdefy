---
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-markdown': patch
---

fix(blocks-antd): Label, Search and ControlledList styles now apply in production builds.

The `Label` (form-item layout), `Search` (results dropdown) and `ControlledList` (remove icon)
styles are global stylesheets, but they were shipped as CSS Modules (`style.module.css`) imported
for side effect (`import './style.module.css'`) with every rule wrapped in `:global(...)`. The Vite
dev server injected them, but the production client build dropped them — so on `lowdefy build` +
`lowdefy start` (and on Vercel) these blocks rendered with missing styling while `lowdefy dev`
looked correct. (Same class of bug fixed in `@lowdefy/blocks-tiptap`.)

The three files are now plain `.css` (the redundant `:global()` wrappers removed, since the
selectors are already global), which the production build includes reliably. No config or markup
changes. Also removed an unused CSS-module import in `MarkdownWithCode`.
