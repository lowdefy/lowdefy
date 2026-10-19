---
'lowdefy': patch
'@lowdefy/connection-axios-http': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-markdown': patch
'@lowdefy/block-utils': patch
---

Update dependencies to releases with published security fixes.

- `axios` 1.20.0 in the CLI and AxiosHttp.
- `dompurify` 3.4.16 in `block-utils`, `blocks-basic` and `blocks-markdown`.

**`dompurify` 3.4.16** keeps the SVG `pointer-events` and `vector-effect` attributes, which earlier releases removed. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.
