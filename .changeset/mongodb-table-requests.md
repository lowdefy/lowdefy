---
'@lowdefy/connection-mongodb': minor
---

`MongoDBTableQuery` and `MongoDBTableChanges` for the Table blocks

- **`MongoDBTableQuery`** serves `Table` in server mode. It turns the table's view (sort, a nested filter, search, grouping and totals) into one aggregation, checked against a `fields` allowlist. It pages rows as the table scrolls, returns groups one level at a time, and returns totals. The browser never sends MongoDB syntax: unknown fields, operators a field's type doesn't allow, and operator-shaped values are all refused. Your base `pipeline` always runs first, so a filter can only narrow it. Rows return only `_id`, the `fields` paths and any `returnFields`, unless you set `project: false`. `{ $user: path }` values are resolved on the server from `user: { _user: true }`. Date filters compare the days of `timezone` (default UTC), so pass the user's time zone to match the table. The work one view can ask for is bounded (filter size, value length, `maxTimeMS` 10 seconds by default), and rows are sorted before the facet so an index can serve the sort.
- **`MongoDBTableChanges`** saves a `TableInput` changeset in one `bulkWrite`:

  - `$set` on the changed dot paths only;
  - inserts, deletes, and position writes for dragged rows.

  With `selection` (the `Table` `selected` value, keys or `{ all: true, except, filter, search }`) and `set`, it writes the same values to every selected row in one `updateMany`, for bulk actions such as assigning an owner.

  With `array: { documentId, path }` the rows are items embedded in one document, such as a recipe's items. It then writes with `arrayFilters`, `$push` and `$pull`, and reorders by moving items on the server. Only allowlisted fields can be written, and the base `filter` scopes every operation. The `filter` and `insertDefaults` fields can not be in `fields`, and new rows are stamped with the filter's equality conditions, so a row can never move out of scope or be added to another organization. The response lists the rows that matched nothing (outside the filter, or gone) in `unmatchedKeys`, and a numeric row key matches whether the table sends it as `5` or `"5"`.

- Bulk write errors (`MongoBulkWriteError`, from `MongoDBBulkWrite`, `MongoDBInsertMany` and the new request) are now mapped like other driver errors, so the failing document's values no longer reach the browser.
