---
'@lowdefy/operators-js': minor
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/docs': patch
---

feat: `_request` status, `ListPage` error state, slots and `lowdefy expand`

`_request` can report a request's status, not just its value: `_request: { key: my_request, status: true }` returns `{ loading, error, success, empty }`, so config can tell a failed request from one that succeeded and returned nothing. `ListPage` uses it: the empty state shows only when the request actually succeeded and came back empty, and a new error block shows the failure message with a Retry button, instead of the page rendering blank.

`ListPage` row cells carry labels and are formatted from the collection's declared field type (dates, numbers, booleans and enums each render properly), generated cell ids are namespaced so a field named `card` cannot collide, and the default sort is derived from the collection's first declared date field rather than an assumed `created_at`. `ListPage` gains `header`, `rowActions` and `footer` slots, refuses to silently discard `requests:` or `events:` declared on the page, and the new `lowdefy expand <pageId>` command writes a generated page out as ordinary config so you can take it over. Because the expansion may still change within a minor release, `ListPage` requires `config.experimental.archetypes: true`.
