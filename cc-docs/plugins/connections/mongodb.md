# @lowdefy/connection-mongodb

MongoDB connection for Lowdefy. Full support for CRUD operations and aggregation pipelines.

## Connection Type

| Type | Purpose |
|------|---------|
| `MongoDBCollection` | Connect to a MongoDB collection |

## Connection Configuration

```yaml
connections:
  - id: mongodb
    type: MongoDBCollection
    properties:
      connectionString:
        _secret: MONGODB_URI
      databaseName: myapp
      collection: users
      read: true
      write: true
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `connectionString` | string | MongoDB connection URI |
| `databaseName` | string | Database name |
| `collection` | string | Collection name |
| `read` | boolean | Allow read operations (default: true) |
| `write` | boolean | Allow write operations (default: false) |

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

## Design Notes

### Connection Pooling

MongoDB connections are pooled automatically. The connection string is used as the pool key.

### ObjectId Handling

String IDs are automatically converted to ObjectIds when:
- Field is named `_id`
- Value matches ObjectId pattern

### Date Serialization

JavaScript Date objects are preserved through serialization.
