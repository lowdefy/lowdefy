---
'@lowdefy/connection-mongodb': minor
---

`MongoDBTableQuery` and `MongoDBTableChanges` for the Table blocks

- **`MongoDBTableQuery`** serves `Table` in server mode. It turns the table's view (sort, a nested filter, search, grouping and totals) into one aggregation, checked against a `fields` allowlist. It pages rows as the table scrolls, returns groups one level at a time, and returns totals. The browser never sends MongoDB syntax: unknown fields, operators a field's type doesn't allow, and operator-shaped values are all refused. Your base `pipeline` always runs first, so a filter can only narrow it. `{ $user: path }` values are resolved on the server from `user: { _user: true }`.
- **`MongoDBTableChanges`** saves a `TableInput` changeset in one `bulkWrite`:

  - `$set` on the changed dot paths only;
  - inserts, deletes, and position writes for dragged rows.

  With `array: { documentId, path }` the rows are items embedded in one document, such as a recipe's items. It then writes with `arrayFilters`, `$push` and `$pull`, and reorders by moving items on the server. Only allowlisted fields can be written, and the base `filter` scopes every operation.

- Bulk write errors (`MongoBulkWriteError`, from `MongoDBBulkWrite`, `MongoDBInsertMany` and the new request) are now mapped like other driver errors, so the failing document's values no longer reach the browser.
