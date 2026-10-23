---
'@lowdefy/blocks-table': minor
'@lowdefy/blocks-antd': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(blocks-table): The Table cell details panel can load a cell's raw result on demand

An enrichment or ai cell keeps the provider's whole answer as its raw result, often many times the size of the value, and the rows sent to the browser carried it for every cell although only the details panel shows it. The new `rawEndpoint` property names an API endpoint that returns one cell's raw result: rows can leave `_enrich.<key>.raw` out, and the details panel calls the endpoint with `{ rowKey, key }` when it opens a finished cell whose row has none, showing "Loading the raw result…" meanwhile and an error if the call fails. It loads again when the cell finishes a new run. A table without `rawEndpoint`, or a row that carries the raw result, works as before. TableLight names `rawEndpoint` as a Table-only property.
