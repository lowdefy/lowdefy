---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-aggrid': minor
'@lowdefy/blocks-table': minor
'@lowdefy/helpers': minor
---

feat(journeys): Blocks mark the controls a journey `control` target names

Each control a `{ blockId, control }` target names carries `data-lf-block` and `data-lf-control`, and a grid cell control also `data-lf-row-key`, wherever antd draws it: `Modal` and `ConfirmModal` OK and Cancel buttons (`ok`, `cancel`), `DropdownButton`, `DropdownMenu` and `Menu` items, and the buttons, menu items and switches in AgGrid and `Table` cells. `journeyTargetSelectors.controlMarks` writes the attributes. An AgGrid row with no `id`, `_id` or `rowId` field now gets the generated key `__row_<n>` in place of a random number. Nothing changes visually.
