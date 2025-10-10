<TITLE>
MongoDBFindOne
</TITLE>

<DESCRIPTION>

The `MongoDBFindOne` request executes a MongoDB [query](https://docs.mongodb.com/manual/tutorial/query-documents/) on the collection specified in the connectionId. It returns the first document that matches the specified query.

>Cursors are not supported. The request will return the whole body of the response as an array.

### Properties

- `query: object`: __Required__ - A MongoDB query object.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findone) for more information. Supported settings are:
  - `allowDiskUse: boolean`: Allows disk use for blocking sort operations exceeding 100MB memory. (MongoDB 3.2 or higher)
  - `allowPartialResults: boolean`: For queries against a sharded collection, allows the command (or subsequent getMore commands) to return partial results, rather than an error, if one or more queried shards are available.
  - `authdb: string`: Specifies the authentication information to be used.
  - `awaitData: boolean`: Specify if the cursor is a tailable-await cursor. Requires `tailable` to be true.
  - `batchSize: number`: Set the batchSize for the getMoreCommand when iterating over the query results.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `checkKeys: boolean`: The serializer will check if keys are valid.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the query. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: Tell the query to use specific indexes in the query. Object of indexes to use, `{'_id':1}`.
  - `ignoreUndefined: boolean`: Default: `true` - Serialize will not emit undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `limit: number`: Sets the limit of documents returned in the query.
  - `max: object`: The exclusive upper bound for a specific index.
  - `maxAwaitTimeMS: number`: The maximum amount of time for the server to wait on new documents to satisfy a tailable cursor query. Requires `tailable` and `awaitData` to be true.
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `min: object`: The inclusive lower bound for a specific index.
  - `noCursorTimeout: boolean`: The server normally times out idle cursors after an inactivity period (10 minutes) to prevent excess memory use. Set this option to prevent that.
  - `noResponse: boolean`: Admin command option.
  - `projection: object`: The fields to return in the query. Object of fields to either include or exclude (one of, not both), `{'a':1, 'b': 1}` or `{'a': 0, 'b': 0}`.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: string | object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `returnKey: boolean`: If true, returns only the index keys in the resulting documents.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `showRecordId: boolean`: Determine whether to return the record identifier for each document. If true, adds a field $recordId to the returned documents.
  - `singleBatch: boolean`: Default: `false` - Determines whether to close the cursor after the first batch.
  - `skip: number`: Set to skip N documents ahead in your query (useful for pagination).
  - `sort: array | object`: Set to sort the documents coming back from the query.
  - `tailable: boolean`: Specify if the cursor is tailable.
  - `timeout: boolean`: Specify if the cursor can timeout.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

</DESCRIPTION>

<CONNECTION>
MongoDBCollection
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBFindOne',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'object',
      description: 'A MongoDB query object',
      errorMessage: {
        type: 'MongoDBFindOne request property "query" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBFindOne request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBFindOne request properties should be an object.',
    required: 'MongoDBFindOne request should have required property "query".',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Find a document by id

```yaml
requests:
  - id: find_by_id
    type:  MongoDBFindOne
    connectionId: my_mongodb_collection_id
    payload:
      _id:
        _input: _id
    properties:
      query:
        _id:
          _payload: _id
```

</EXAMPLES>
