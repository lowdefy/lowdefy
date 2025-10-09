<TITLE>
MongoDBInsertOne
</TITLE>

<DESCRIPTION>

The `MongoDBInsertOne` request inserts a document into the collection specified in the connectionId. If a `_id` field is not specified, a MongoDB `ObjectID` will be generated.

### Properties

- `doc: object`: __Required__ - The document to be inserted.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertone) for more information. Supported settings are:
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher
  - `checkKeys: boolean`: Default: `true` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the query. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: object`: Specifies the verbosity mode for the explain output.
  - `forcesServerObjectId: boolean`: Default: `false` - Force server to assign _id values instead of driver.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `noResponse: boolean`: Admin command option.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
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
  title: 'Lowdefy Request Schema - MongoDBInsertOne',
  type: 'object',
  required: ['doc'],
  properties: {
    doc: {
      type: 'object',
      description: 'The document to be inserted.',
      errorMessage: {
        type: 'MongoDBInsertOne request property "doc" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBInsertOne request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBInsertOne request properties should be an object.',
    required: 'MongoDBInsertOne request should have required property "doc".',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Insert a document

```yaml
requests:
  - id: insert_new_comment
    type:  MongoDBInsertOne
    connectionId: my_mongodb_collection_id
    payload:
      comment:
        _state: comment_input
    properties:
      doc:
        comment:
          _payload: comment
        user_id:
          _user: id
        timestamp:
          _date: now
```

</EXAMPLES>
