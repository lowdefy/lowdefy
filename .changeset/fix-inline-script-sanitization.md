---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(server): Escape theme values embedded in the pre-hydration inline script.

`_document.js` interpolates `configColorMode`, `darkToken.colorBgLayout`, and `lightToken.colorBgLayout` from `theme.json` into a synchronous `<script>` block to set the `<html>` background before hydration. Previously the values went through `JSON.stringify` only — enough to escape JS-string-context characters, but not enough to prevent a value containing `</script>` (or U+2028 / U+2029 line separators) from breaking out of the enclosing `<script>` tag.

Added a `safeScriptJson` helper that additionally escapes `<`, `>`, control chars, and U+2028 / U+2029 to `\uXXXX` sequences after `JSON.stringify`. For every valid color value (`#1e293b`, `rgb(...)`, `slategray`, `oklch(...)`, etc.) the output is byte-identical to the previous behavior; only payloads that would have tripped `<script>` breakout or JS-line-terminator injection are now neutralized.

Closes the six `js/bad-code-sanitization` CodeQL alerts (89 – 94) opened against the per-mode-theme PR.
