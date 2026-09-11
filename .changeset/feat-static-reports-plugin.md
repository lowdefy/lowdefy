---
'@lowdefy/plugin-reports': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/block-utils': minor
'@lowdefy/blocks-aggrid': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/blocks-echarts': minor
'@lowdefy/blocks-markdown': minor
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

feat: Static reports as an opt-in plugin (`@lowdefy/plugin-reports`)

Render any Lowdefy page to a PDF or an Excel workbook on the server, from the same config that renders it in the browser.

**New plugin `@lowdefy/plugin-reports`**

- `Reports` connection and `RenderReport` request: evaluates the page headlessly (the same `onInit` flow the browser runs, seeded with the caller's `urlQuery`, `input`, and `state`), walks the evaluated block tree into a closed report document model, and returns a base64 file envelope (`{ name, size, type, content }`) as PDF or xlsx.
- `DownloadFile` action: saves any such envelope to the browser as a download.
- A `RenderReport` request runs anywhere a request runs, so a scheduled API endpoint can email a report. On a schedule the render fails fast if the page reads `_user`.
- A failed `onInit` action fails the render instead of shipping an empty document; generation is bounded by a concurrency semaphore and a timeout that includes queue wait.
- Images resolve from the app's `public/` folder on disk first, and remote images fetch under SSRF guardrails pinned to the address that was checked.

**New `report` block key (`@lowdefy/build`)**

- Page-level: `title`, `header`, `footer`, `size` (`A4` | `letter`), `orientation`. Block-level: `exclude`, `pageBreakBefore`, `sheetName`. The build validates placement, Excel sheet-name rules, and warns when the key is used without the plugin declared.
- The build emits `plugins/reportsRuntime.js` and, only when the plugin is declared, `plugins/blocksStatic.js` and `reports/styles.css` (the app's compiled Tailwind for Html blocks). An app that does not declare the plugin pays nothing at runtime.

**Static renderers in block packages**

- `blocks-antd`: Title, Paragraph, Statistic, Divider, Descriptions, Card, Content, Alert, Tabs, Collapse. `blocks-basic`: Box, Span, Img, Icon, Html, DangerousHtml. `blocks-echarts`: EChart (SVG, theme honoured). `blocks-markdown`: Markdown, MarkdownWithCode, DangerousMarkdown. `blocks-aggrid`: display grids export as worksheets (`defaultColDef` and column groups honoured).
- Shared renderer helpers ship in `@lowdefy/block-utils/report`.

**`@lowdefy/api`**

- Request resolvers whose meta declares `appAccess: true` receive a narrow `app` capability (`getPageConfig`, `callRequest`, `readBlockMetas`, `readGlobal`, `readReportStylesheet`, `system`, `publicDirectory`). Authorization is applied inside core, never handed out.
