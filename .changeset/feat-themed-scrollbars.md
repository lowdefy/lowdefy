---
'@lowdefy/build': minor
---

feat(build): Themed default scrollbars in generated `globals.css`.

Every Lowdefy app now ships with themed scrollbars out of the box. Native Windows/Linux scrollbars were rendering as light grey on dark surfaces (Modal, Drawer, overflowing containers), clashing with dark themes — macOS overlay scrollbars hid the problem. The generated `globals.css` now emits a `@layer base` block that:

- Sets `scrollbar-width: thin` and `scrollbar-color` for Firefox and modern browsers.
- Styles `::-webkit-scrollbar` (10px, transparent track, subtle thumb with inset border, hover darkens) for Chromium / WebKit.
- Drives all colors from antd CSS custom properties (`--ant-color-border-secondary`, `--ant-color-text-tertiary`) so they auto-swap on dark / light mode toggle.

User-provided CSS remains in `@layer components`, so any app-level `::-webkit-scrollbar` overrides in `public/styles.css` still win.
