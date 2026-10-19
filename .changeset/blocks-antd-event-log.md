---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): new `EventLog` block

A virtualised log viewer for any array of records - audit trails, job runs, deploys or
application events. Rows are searchable, filtered by severity and expandable to show the actor,
a rich detail body and a flattened context table that can be copied as JSON. The record shape is
mapped with the `fields` property, event types are labelled, coloured and iconed with
`eventTypeConfig`, severity is read from an explicit `level`, and every string the block renders
can be changed with the `text` property. Large logs can be set imperatively with the `setData`
method.
