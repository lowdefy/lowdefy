<TITLE>
MongoDBInsertMany
</TITLE>

<DESCRIPTION>

The `MongoDBInsertMany` request inserts an array of documents into the collection specified in the connectionId. If a `_id` field is not specified on a document, a MongoDB `ObjectID` will be generated.

### Properties

- `docs: object[]`: __Required__ - The array of documents to be inserted.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertmany) for more information. Supported settings are:
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
  - `ordered: boolean`: If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails.
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
  title: 'Lowdefy Request Schema - MongoDBInsertMany',
  type: 'object',
  required: ['docs'],
  properties: {
    docs: {
      type: 'array',
      description: 'The array of documents to be inserted.',
      errorMessage: {
        type: 'MongoDBInsertMany request property "docs" should be an array.',
      },
      items: {
        type: 'object',
        errorMessage: {
          type: 'MongoDBInsertMany request property "docs" should be an array of documents to insert.',
        },
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBInsertMany request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBInsertMany request properties should be an object.',
    required: 'MongoDBInsertMany request should have required property "docs".',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Insert a set of documents

```yaml
requests:
  - id: insert_documents
    type:  MongoDBInsertMany
    connectionId: my_mongodb_collection_id
    properties:
      docs:
        - _id: 1
          value: 4
        - _id: 2
          value: 1
        - _id: 3
          value: 7
```

</EXAMPLES>
