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
