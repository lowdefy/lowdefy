---
'@lowdefy/blocks-aggrid': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/blocks-table': minor
'@lowdefy/block-utils': minor
'@lowdefy/client': minor
---

feat: Table, grid, Anchor and HTML links carry `pathParams`

Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.
