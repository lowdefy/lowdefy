---
'@lowdefy/client': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(client): Sync `color-scheme` with the resolved dark mode.

Nothing set `color-scheme` on the document, so every native scrollbar, `<select>` and date picker in
a dark app rendered with light browser chrome. `useDarkMode` now sets it explicitly on every toggle,
and the pre-hydration inline script in `_document.js` sets it before React mounts so a dark app never
flashes light chrome. It is always set explicitly — an unset `color-scheme` falls back to
`prefers-color-scheme`, which would give a light app dark scrollbars on a dark OS.
