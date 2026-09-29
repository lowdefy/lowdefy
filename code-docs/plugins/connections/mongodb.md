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

Two requests serve the `Table` and `TableInput` blocks (`@lowdefy/blocks-table`, see [../blocks/table.md](../blocks/table.md)). Both take view or changeset data from the browser and treat it as untrusted input: it is validated against a `fields` allowlist and compiled to MongoDB syntax on the server. User docs: `packages/docs/connections/MongoDB.yaml`.

### MongoDBTableQuery

`MongoDBCollection/MongoDBTableQuery/`. Serves a `Table` in server mode (`data: { mode: server, request }`); the table fires the request with `{ startRow, endRow, view, groupPath, selected }` as the event.

- `normalizeFields` builds the allowlist, keyed by Table column key: `{ type, path, search, sortable, filterable, groupable }`. `fieldTypes.js` maps each column type to its family, which decides the allowed operators and aggregates.
- `validateView` reads only `sort`, `filter`, `search`, `group` and `aggregates`: `parseSort` (at most 10 levels), `parseCondition` / `parseLeafValue` (operators per type, typed coercion with `coerceScalar`, `{ $user: path }` resolved from the request's `user` property by `resolveUserValue`, which throws when the value is missing), `parseGroup`, `parseAggregates`. Any key not in `fields` throws (`getViewField`).
- `compileTableQuery` compiles one aggregation: base `pipeline` (write stages `$out` / `$merge` refused) -> `$match` filter -> `$match` search (`compileSearch`: each word, regex-escaped, must match one `search: true` field) -> `$match` group path -> `$facet { rows: [$sort (+ _id tiebreak), $skip, $limit] | groups: [$group, $sort, $skip, $limit], total, aggregates? }`. `validateRows` enforces `maxRows` (default 1000).
- Date `eq`, `before`, `after` and `between` on `date` fields compare whole UTC days (`getDayRange`); `within` uses `getWithinRange`.
- On a tenant connection `injectTenantIntoPipeline` puts the tenant `$match` first; `assertUnscopedPipeline` guards unscoped pipelines.
- `readTableResult` shapes `{ rows, total, groups?, aggregates? }`.

The `$sort` runs inside `$facet`, so MongoDB can not use an index for it: every block fetch sorts all documents that match the base pipeline and the view.

### MongoDBTableChanges

`MongoDBCollection/MongoDBTableChanges/`. Saves a `TableInput` value `{ updated, added, removed, moved?, order? }`.

- `normalizeChangeFields` builds the allowlist, keyed by column `field` (dot path), with `type` and the target `path`. `parseChanges` (and `parseUpdatedRows`, `parseAddedRows`, `parseRemovedRows`, `parseMovedRows`, `parseOrder`) validate every key and value: unknown fields, `$`-prefixed or empty path segments (`isSafePath`), operator objects as values or keys, and more than `maxChanges` (default 1000) row changes are refused. Values are coerced per type (`coerceFieldValue`), row keys per `rowKeyType` (`coerceRowKey`: `auto` reads `{"_oid":"…"}` text as an ObjectId).
- A base `filter` is required unless the connection is tenant-scoped (`filter: {}` opts into unscoped writes). `scopeFilter` combines it with each row key under `$and`, so a key can only narrow it.
- Collection mode (`compileCollectionChanges`): `deleteOne`, `updateOne` with one `$set` of the changed paths and the position, `insertOne` with `insertDefaults` under the row's values and a generated ObjectId `_id`. An `order` needs a `positionField` (positions 1024, 2048, …).
- Array mode (`compileArrayChanges`, `array: { documentId, path, itemKeyField }`): up to four ordered updates of one document, `$set` with `arrayFilters`, `$pull`, `$push`, and (`compileArrayOrder`) a pipeline update that reorders items by `order` on the server. Throws when the document is not found inside the filter.
- Runs as one `bulkWrite` (not a transaction; `ordered` default true), writes a change log record when the connection has one, and returns `{ matchedCount, modifiedCount, insertedCount, deletedCount, insertedKeys }` (`readChangesResult`).

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
