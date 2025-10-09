<TITLE>
MongoDBCollection
</TITLE>

<DESCRIPTION>

The `MongoDBCollection` connection sets up a connection to a MongoDB deployment. A [connection URI](https://docs.mongodb.com/manual/reference/connection-string/index.html) with authentication credentials (username and password) is required. The URI can be in the standard or dns seedlist (srv) formats. Connections are defined on a collection level, since this allows for read/write access control on a per collection level. Access control can also be managed using the roles in the database.

>Since the connection URI contains authentication secrets, it should be stored using the [`_secret`](operators/secret.md) operator.

When using MongoDBUpdateOne and MongoDBDeleteOne requests, take note that the responses differ if the connection has a log collection.

### Properties

- `databaseUri: string`: __Required__ - Connection uri string for the MongoDb deployment. Should be stored using the [_secret](operators/secret.md) operator.
- `databaseName: string`: Default: Database specified in connection string - The name of the database in the MongoDB deployment.
- `collection: string`: __Required__ - The name of the MongoDB collection.
- `read: boolean`: Default: `true` - Allow read operations like find on the collection.
- `write: boolean`: Default: `false` - Allow write operations like update on the collection.
- `options: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/interfaces/mongoclientoptions.html) for more information.

</DESCRIPTION>

<REQUESTS>

- MongoDBAggregation
- MongoDBBulkWrite
- MongoDBDeleteMany
- MongoDBDeleteOne
- MongoDBFind
- MongoDBFindOne
- MongoDBInsertMany
- MongoDBInsertOne
- MongoDBUpdateMany
- MongoDBUpdateOne

</REQUESTS>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - MongoDBCollection',
  type: 'object',
  required: ['databaseUri', 'collection'],
  properties: {
    databaseUri: {
      type: 'string',
      description: 'Connection uri string for the MongoDb deployment.',
      errorMessage: {
        type: 'MongoDBCollection connection property "databaseUri" should be a string.',
      },
    },
    databaseName: {
      type: 'string',
      description: 'Database name.',
      errorMessage: {
        type: 'MongoDBCollection connection property "databaseName" should be a string.',
      },
    },
    collection: {
      type: 'string',
      description: 'Collection name.',
      errorMessage: {
        type: 'MongoDBCollection connection property "collection" should be a string.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the collection.',
      errorMessage: {
        type: 'MongoDBCollection connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the collection.',
      errorMessage: {
        type: 'MongoDBCollection connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBCollection connection properties should be an object.',
    required: {
      databaseUri: 'MongoDBCollection connection should have required property "databaseUri".',
      collection: 'MongoDBCollection connection should have required property "collection".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### MongoDB collection with reads and writes

```yaml
connections:
  - id: my_collection
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: my_collection_name
      write: true
```

### MongoDB collection with reads, writes and a log collection

```yaml
connections:
  - id: my_collection
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: my_collection_name
      write: true
      changeLog:
        collection: log_collection_name
        meta:
          user:
            _user: true
```

Environment variables:

```
LOWDEFY_SECRET_MONGODB_URI = mongodb+srv://username:password@server.example.com/database
```

</EXAMPLES>
