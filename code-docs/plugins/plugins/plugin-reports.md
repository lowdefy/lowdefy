# @lowdefy/plugin-reports

Server-side PDF and Excel rendering of Lowdefy pages. The plugin is opt-in: an app that does not declare it in `plugins:` gets no report code in its build or its server.

## Provides

| Type                   | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `Reports` connection   | No properties. Exists so `RenderReport` has a connection to belong to. |
| `RenderReport` request | Renders one page to a `{ name, size, type, content }` base64 envelope. |
| `DownloadFile` action  | Saves any such envelope to the browser as a download.                  |

## Pipeline

```
RenderReport (request resolver, meta.appAccess)
  └─ generateReport
       ├─ semaphore.acquire   (2 concurrent, 8 queued; timeout clock already running)
       ├─ evaluatePage        headless engine: getContext → runOnInit → runOnInitAsync → drain requests
       ├─ evaluateReportChrome  title / header / footer through the page's client operators
       ├─ walkBlocks          evaluated block tree → closed report IR (rows, stacks, leaves)
       └─ renderPdfBuffer | toXlsx
```

### Headless evaluation (`evaluatePage/`)

`createHeadlessLowdefy` assembles the same `lowdefy` object the browser client builds, with server substitutes: a fixed print viewport for `_media`, a synthetic `window.location` from the server URL, an action registry that runs the server-safe actions-core actions (`Request`, `SetState`, `SetGlobal`, `Reset`, `Validate`, `Wait`, `Throw`) and records every other action as skipped, and a tracking `callRequest` so outstanding requests can be drained.

Two things fail the render rather than degrade it:

- **Action errors.** The engine catches every action error and resolves the event, so a failed `Request` in `onInit` would otherwise leave `_request` null and ship an empty table. The handle collects every error `handleError` and the engine logger receive, and `evaluatePage` asserts none were recorded at each phase boundary.
- **`_user` on a system render.** When `app.system` is true (scheduled, webhook, detached endpoints), `_user` is swapped for a guard that records the read. The parser swallows operator throws, so the recorded flag, asserted at each phase boundary, is what stops the render before an init request carries wrong parameters anywhere.

Only `onInit`/`onInitAsync` run. `collectMountEvents` names the blocks with `onMount` events in one warning so an empty report has an explanation.

### Report IR (`ir/`)

A closed, versioned node set: `heading`, `text`, `markdown`, `svg`, `image`, `grid`, `table`, `stat`, `row`, `stack`, `divider`, `spacer`. Block packages emit these as plain object literals from `[Block].static.js` and never import pdfmake or ExcelJS. `validateNode` is complete: every kind's props are type-checked, table rows must match the header length, and cell values must be primitives or `Date`. The last rule is the XLSX formula-injection guard: ExcelJS types cells by shape, so an object with a `formula` key from row data would become a live formula.

`grid` is worksheet data (AgGrid); it is exported to xlsx and only summarised in the PDF. `table` is a presentational table printed in the PDF (Descriptions, markdown tables).

### Walker (`render/walkBlocks.js`, `render/walk/`)

The renderer contract lives here:

```js
toReport({ block, areas, items, layout, context }) => IRNode | IRNode[] | null | Promise<…>
```

- `areas` (containers): `{ [areaKey]: IRNode[] }`, each area walked as its own sibling list.
- `items` (lists): one `areas` object per list item.
- `layout.width` is always a number in points. Row cells are rendered when the row closes, so each cell knows its share of the row (fraction of the row minus gutters for span columns, an equal share for flex children). Charts and Html blocks bake that width into their SVG.
- `context`: `{ logger, icons, renderHtml, contentWidth, signal }`.

A renderer that throws or emits invalid IR is isolated: the block is skipped and recorded in `renderErrors`. A container without a renderer passes its children through.

### Html rendering (`render/html/`)

`createHtmlRenderer({ fonts, stylesheets, logger })` wraps takumi (`@takumi-rs/core`), a Rust layout engine that turns markup plus CSS into an SVG. The plugin owns the native dependency; blocks-basic's `Html.static.js` receives `context.renderHtml` and stays free of it. The compiled stylesheet is the build's `reports/styles.css` (the app's Tailwind pass plus `public/styles.css`) read through `app.readReportStylesheet()`.

### PDF (`render/pdf/`)

`toPdfMake` is a pure IR → pdfmake docDefinition mapping, one `translate*` file per kind. Before translation, `flattenStacks` hoists the children of every page-level `stack` (a layout Box, Card or Content wrapper, which has no width of its own) into the top-level sequence, so `assembleContent` keeps headings with the unbreakable content they introduce and `pageBreakBefore` produces a break at any nesting depth; a stack inside a `row` is a column and is left as is. `renderPdfBuffer` resolves images first, then prints. Fonts are pdfmake's shipped Roboto faces (`pdfmake/build/fonts/Roboto.js`), not a second copy, plus one DejaVu Sans face (`fonts/DejaVuSans.ttf`, Bitstream Vera licence) as the symbol fallback: Roboto has no Arrows, Geometric Shapes, Miscellaneous Symbols or Dingbats glyphs, and pdfmake has no per-glyph fallback, so `applySymbolFont` walks the translated content and wraps every run in those Unicode blocks in the `DejaVuSans` font (never inside svg or image content). Takumi gets the same face as the last family in its fallback chain, so Html-block text covers the same symbols.

### Images (`render/image/`)

`resolveImage({ src, origin, publicDirectory, logger })` never throws; a failure logs and the image is skipped.

- `data:` URIs decode directly.
- Relative paths resolve from `publicDirectory` on disk first (path-traversal safe), and only fall back to a fetch against `origin` under the full guard. There is no own-origin exemption: `origin` is Host-derived and cannot be trusted to bypass anything.
- Remote URLs: the host is resolved once, every address is checked against the private ranges (RFC 1918, loopback, link-local, CGNAT, multicast, reserved, and the IPv6 forms that embed an IPv4 address), and the fetch is made with an undici `Agent` whose `lookup` returns the checked addresses, so DNS rebinding between check and connect cannot reach an unchecked address. Redirects are refused; 5 s timeout; 5 MB cap; `image/*` only.

### Excel (`render/xlsx/toXlsx.js`)

One worksheet per `grid`, sanitised and de-duplicated sheet names (Excel's forbidden characters, apostrophe ends, the reserved `History`, 31-character cap, case-insensitive uniqueness). Cells write the typed value; ISO date strings become real date cells.

### Guardrails (`generateReport.js`)

`createSemaphore` bounds concurrency per process and rejects with `ReportBusyError` past the queue bound. `withTimeout` starts before the slot is acquired, so queue wait counts; on timeout it aborts the generation and every wait in the evaluation races the abort. `ReportTimeoutError` and `ReportBusyError` are classes so a route can map them to 504/503 without matching message text.

## Core seams

- **`app` capability** (`@lowdefy/api` `createApp`): handed only to resolvers with `meta.appAccess: true`. See `code-docs/packages/api.md`.
- **Build** (`@lowdefy/build`): the `report` block key, `validateReport`, and the gated artifacts `plugins/reportsRuntime.js`, `plugins/blocksStatic.js`, `reports/styles.css`. See `code-docs/packages/build.md`.
- **Block packages**: `[Block].static.js` renderers behind a `./static` export, `static: true` in the block meta, shared helpers from `@lowdefy/block-utils/report`.

## Design decisions

- **Closed IR instead of letting blocks emit pdfmake.** One translator per output format, and renderers stay independent of the PDF library; adding a format means one new translator.
- **Grids go to xlsx, not the PDF.** A paginated document cannot show hundreds of rows usefully; the reader wants to sort and filter.
- **Fail the render on action errors.** In the browser the user sees an error toast. On a schedule nobody does, so an empty report must not ship.
- **No own-origin SSRF exemption.** Disk-first for public assets keeps the common logo case working in dev and Docker without trusting the Host header.
