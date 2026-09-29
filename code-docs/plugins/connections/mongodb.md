# @lowdefy/connection-mongodb

MongoDB connection for Lowdefy. Full support for CRUD operations and aggregation pipelines.

Uses the [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/) (v6.3.0).

## Connection Type

| Type                | Purpose                         |
| ------------------- | ------------------------------- |
| `MongoDBCollection` | Connect to a MongoDB collection |

## Connection Configuration

```yaml
connections:
  - id: mongodb
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      databaseName: myapp # Optional if included in URI
      collection: users
      read: true
      write: true
```

## Properties

| Property       | Type    | Required | Description                             |
| -------------- | ------- | -------- | --------------------------------------- |
| `databaseUri`  | string  | Yes      | MongoDB connection URI                  |
| `databaseName` | string  | No       | Database name (can be in URI)           |
| `collection`   | string  | Yes      | Collection name                         |
| `read`         | boolean | No       | Allow read operations (default: true)   |
| `write`        | boolean | No       | Allow write operations (default: false) |

## Request Types

### MongoDBFind

Find multiple documents:

```yaml
requests:
  - id: getUsers
    type: MongoDBFind
    connectionId: mongodb
    properties:
      query:
        active: true
      options:
        sort:
          createdAt: -1
        limit: 100
        projection:
          password: 0
```

### MongoDBFindOne

Find single document:

```yaml
requests:
  - id: getUser
    type: MongoDBFindOne
    connectionId: mongodb
    properties:
      query:
        _id:
          _state: userId
```

### MongoDBInsertOne

Insert single document:

```yaml
requests:
  - id: createUser
    type: MongoDBInsertOne
    connectionId: mongodb
    properties:
      doc:
        name:
          _state: name
        email:
          _state: email
        createdAt:
          _date: now
```

### MongoDBInsertMany

Insert multiple documents:

```yaml
requests:
  - id: createUsers
    type: MongoDBInsertMany
    connectionId: mongodb
    properties:
      docs:
        _state: usersToCreate
```

### MongoDBUpdateOne

Update single document:

```yaml
requests:
  - id: updateUser
    type: MongoDBUpdateOne
    connectionId: mongodb
    properties:
      filter:
        _id:
          _state: userId
      update:
        $set:
          name:
            _state: name
          updatedAt:
            _date: now
```

### MongoDBUpdateMany

Update multiple documents:

```yaml
requests:
  - id: deactivateOldUsers
    type: MongoDBUpdateMany
    connectionId: mongodb
    properties:
      filter:
        lastLogin:
          $lt:
            _date:
              - now
              - subtract:
                  - 1
                  - year
      update:
        $set:
          active: false
```

### MongoDBDeleteOne

Delete single document:

```yaml
requests:
  - id: deleteUser
    type: MongoDBDeleteOne
    connectionId: mongodb
    properties:
      filter:
        _id:
          _state: userId
```

### MongoDBDeleteMany

Delete multiple documents:

```yaml
requests:
  - id: cleanupOld
    type: MongoDBDeleteMany
    connectionId: mongodb
    properties:
      filter:
        deleted: true
```

### MongoDBAggregation

Run aggregation pipeline:

```yaml
requests:
  - id: getUserStats
    type: MongoDBAggregation
    connectionId: mongodb
    properties:
      pipeline:
        - $match:
            active: true
        - $group:
            _id: $department
            count:
              $sum: 1
            avgSalary:
              $avg: $salary
        - $sort:
            count: -1
```

### MongoDBBulkWrite

Multiple operations in one request:

```yaml
requests:
  - id: bulkUpdate
    type: MongoDBBulkWrite
    connectionId: mongodb
    properties:
      operations:
        - insertOne:
            document:
              name: New User
        - updateOne:
            filter:
              _id: user123
            update:
              $set:
                status: active
```

## Table Requests

Two requests serve the `Table` and `TableInput` blocks (`@lowdefy/blocks-table`, see [../blocks/table.md](../blocks/table.md)). Both take view, selection or changeset data from the browser and treat it as untrusted input: it is validated against a `fields` allowlist and compiled to MongoDB syntax on the server. User docs: `packages/docs/connections/MongoDB.yaml`.

The two `fields` allowlists are different key spaces: `MongoDBTableQuery.fields` (and `MongoDBTableChanges.queryFields`) are keyed by Table column `key`, the view's keys, with `path` for the document path; `MongoDBTableChanges.fields` are keyed by column `field`, the changeset keys. `notInFieldsError` names the mismatch when a changeset key is the `path` of a field keyed otherwise.

### MongoDBTableQuery

`MongoDBCollection/MongoDBTableQuery/`. Serves a `Table` in server mode (`data: { mode: server, request }`); the table fires the request with `{ startRow, endRow, view, groupPath, selected }` as the event.

- `normalizeFields` builds the allowlist: `{ type, path, search, sortable, filterable, groupable }`. `fieldTypes.js` maps each column type to its family, which decides the allowed operators and aggregates: the operators the Table filter menus offer for that type (`tags` / `people` include `notContains`; `avatar` filters as text), and `min` / `max` on numeric and text fields. `countDistinct` needs `groupable: true`, since it groups by the field.
- `validateView` reads only `sort`, `filter`, `search`, `group` and `aggregates`: `parseSort` (at most 10 keys), `parseCondition` / `parseLeafValue` (operators per type, typed coercion with `coerceScalar`, `{ $user: path }` resolved from the request's `user` by `resolveUserValue`, which throws when the value is missing), `parseGroup` (at most 5 levels), `parseAggregates`. Any key not in `fields` throws (`getViewField`).
- Limits, all checked before the query runs: a filter has at most 200 nodes (conditions and groups, empty groups included) nested at most 8 deep, at most 1000 values in all and 500 per `in` / `nin`, and strings of at most 200 characters (the search too). `validateRows` enforces `maxRows` (default 1000). `options.maxTimeMS` defaults to 10000.
- Day comparisons (`eq` / `ne` on dates, `before`, `after`, `between` on `date`, `within`) use the days of `timezone` (`getTimeZone`, IANA, default UTC; `getZonedMidnight`, `getZonedParts`, `getDayRange`, `getWithinRange`). The browser filters by the user's local days, so apps pass the user's zone.
- `compileTableQuery` compiles one aggregation: base `pipeline` (write stages `$out` / `$merge` refused) -> `$match` filter -> `$match` search (`compileSearch`: each word, regex-escaped, must match one `search: true` field) -> `$match` group path -> `$sort` (view sort, then `_id`) before `$facet`, so an index on the match and sort fields serves it -> `$facet { rows: [$skip, $limit, $project] | groups: [$group, $sort, $skip, $limit], total, aggregates?, distinct_<n>? }`. Each `countDistinct` over the whole result counts groups in its own facet branch.
- `compileProjection`: with `project: true` (default) rows return only `_id`, the `fields` paths and `returnFields`; `project: false` keeps the base pipeline's output.
- On a tenant connection `injectTenantIntoPipeline` puts the tenant `$match` first; `assertUnscopedPipeline` guards unscoped pipelines.
- `readTableResult` shapes `{ rows, total, groups?, aggregates? }`.

### MongoDBTableChanges

`MongoDBCollection/MongoDBTableChanges/`. Saves a `TableInput` value `{ updated, added, removed, moved?, order? }`, or (bulk mode) writes the same values to a `Table` selection.

- `normalizeChangeFields` builds the allowlist, with `type` and the target `path`. `parseChanges` (and `parseUpdatedRows`, `parseAddedRows`, `parseRemovedRows`, `parseMovedRows`, `parseOrder`) validate every key and value: unknown fields, `$`-prefixed or empty path segments (`isSafePath`), operator objects as values or keys, and more than `maxChanges` (default 1000) row changes are refused. Values are coerced per type (`coerceFieldValue`).
- Row keys (`coerceRowKey`, `getKeyForms`, `getKeyMatch`): `rowKeyType: auto` reads `{"_oid":"…"}` text as an ObjectId, and matches a numeric key in both forms (`{ $in: [5, "5"] }`), because object keys (`updated`, `moved`) are always strings while `removed` and `order` keep numbers. A string counts as a number only when it is exactly how the number prints.
- Scope (`getFilterScope`, `getChangeScope`, `getInsertDefaultPaths`, `pathsOverlap`): a base `filter` is required unless the connection is tenant-scoped (`filter: {}` opts into unscoped writes); `scopeFilter` ANDs it with each row key. A field or `positionField` that overlaps a `filter` field (including inside `$and`, `$or`, `$nor`) or an `insertDefaults` path is refused. New rows are stamped with the filter's equality conditions (`buildInsertDocument`); a conflicting `insertDefaults` value is refused, a non-equality filter condition needs its field in `insertDefaults`, and row values never override `insertDefaults`.
- Collection mode (`compileCollectionChanges`): `deleteOne`, `updateOne` with one `$set` of the changed paths and the position, `insertOne` with the stamped scope, `insertDefaults` and a generated ObjectId `_id`. An `order` needs a `positionField` (positions 1024, 2048, …).
- Array mode (`compileArrayChanges`, `array: { documentId, path, itemKeyField }`): up to four ordered updates of one document, `$set` with `arrayFilters`, `$pull`, `$push`, and (`compileArrayOrder`) a pipeline update that reorders items by `order` on the server. Throws when the document is not found inside the filter.
- Bulk mode (`parseSelection`, `parseBulkUpdate`, `compileBulkChanges`): `selection` is the Table's `selected` value, a key list (`$in`) or `{ all: true, except, filter, search }`, whose filter and search are validated and compiled with the `MongoDBTableQuery` code against `queryFields` (with its limits, `user` and `timezone`), plus `$nin: except`. `set` / `unset` are `fields` keys, never scope fields. One `updateMany` under `$and: [filter, …]`; not in array mode.
- `runChanges` runs one `bulkWrite` (not a transaction; `ordered` default true). It reads the keys of removed rows before the write and, only when fewer rows matched than were updated, of updated rows after it (`readKeyIds` / `readItemKeyIds`, scoped like the writes), and `findUnmatchedKeys` compares them in every key form, so `readChangesResult` can return `unmatchedKeys` (rows the changeset named that matched nothing; apps treat a non-empty list as a failed save). The response is `{ matchedCount, modifiedCount, insertedCount, deletedCount, insertedKeys, unmatchedKeys }`, or `{ matchedCount, modifiedCount }` in bulk mode. A change log record is written when the connection has one.

## Dynamic Queries

Use operators in queries:

```yaml
properties:
  query:
    $or:
      - name:
          $regex:
            _state: searchTerm
          $options: i
      - email:
          $regex:
            _state: searchTerm
          $options: i
```

## User-Scoped Data

Filter by authenticated user:

```yaml
properties:
  query:
    userId:
      _user: id
```

## Tenant Wall

Under `auth.organizations.policy: tenant`, `MongoDBCollection` implements the scoping contract
(`types.js` `connectionMetas.MongoDBCollection.tenant: true`). The api resolves, per request,
`tenant` (the verdict: filter every read and stamp every write with `{ field, value }`) and
`tenantGuard` (`resolveTenancy`), and passes both to the resolver. Helpers live in
`src/connections/MongoDBCollection/tenant/`.

**Unscoped write guard** (`guardUnscopedWrite.js`). Given to `tenant: none` requests on a scoped
connection and to `tenant: shared` connections whose collection a scoped connection reads (the
build marks those `walled`, reusing `validateSharedChangeLog`'s target matching). Every row the
write leaves behind must carry a non-empty string organization id: insert and replacement
documents are checked, updates are walked as a state machine over the tenant field, and
aggregations may not contain `$out`/`$merge` (return the rows and write them with
`MongoDBInsertMany`/`MongoDBBulkWrite`). The build also refuses a literal `$out`/`$merge` from any
shared connection into a walled collection of the same database (`validateSharedPipelineWrite`,
best effort: operator-built targets and `{ db, coll }` targets are not resolved).

**Change-log records** (`stampTenantOnLogRecord.js`). Scoped writes stamp the verdict. Under
`tenant: none` (`tenantGuard.stampChangeLog`), the record carries the organization of the rows it
records: the inserted, updated (after) or deleted (before) row for single-document writes, with
no record when nothing matched; for multi-document writes the one organization the write was
held to before running (`changeLogOrganizationOfDocs` / `changeLogOrganizationOfFilter`) —
otherwise the write is refused. Shared connections keep unstamped records, since the build keeps
their change log out of walled collections.

**Preflight** (`tenantPreflight.js`). Probes a walled collection for rows missing the field; the
api refuses to serve while any exist.

## Auth Adapter

`MongoDBAuthAdapter` wraps the vendored BetterAuth MongoDB adapter (`src/auth/adapters/`). It
supports standalone MongoDB, so it uses no transactions. The constructed adapter exposes
`options.ensureUniqueIndexes({ indexes: [{ model, fields }] })` (`createEnsureUniqueIndexes.js`):
it maps BetterAuth model and field names to the physical collections and snake*case fields,
accepts any existing equivalent unique non-partial index, and otherwise creates
`lowdefy_unique*<fields>`. The engine uses it for the organization slug and member
`(userId, organizationId)` indexes that make concurrent organization writes safe.

## Design Notes

### Connection Pooling

MongoDB connections are pooled automatically. The connection string is used as the pool key.

### ObjectId Handling

String IDs are automatically converted to ObjectIds when:

- Field is named `_id`
- Value matches ObjectId pattern

### Date Serialization

JavaScript Date objects are preserved through serialization.
