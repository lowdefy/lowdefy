---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
---

Extract Tailwind utility classes from block properties for CSS generation. All string values in block properties (HTML content, markdown, class names) are scanned at build time and written to per-page content files so Tailwind v4's Oxide engine generates CSS for all used utilities. Content files are regenerated on each JIT rebuild for hot reload.
