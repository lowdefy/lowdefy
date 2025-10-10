<TITLE>
MongoDBDeleteMany
</TITLE>

<DESCRIPTION>

The `MongoDBDeleteMany` request deletes multiple documents in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a documents to delete.

### Properties

- `filter: object`: __Required__ - The filter used to select the document to update.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#deletemany) for more information. Supported settings are:
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string`: A user-provided comment to attach to this command.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `maxTimeMS: number`: Specifies a cumulative time limit in milliseconds for processing operations on the cursor.
  - `noResponse: boolean`: Admin command option.
  - `ordered: boolean`: If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: string | object`: The read preference.
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
  title: 'Lowdefy Request Schema - MongoDBDeleteMany',
  type: 'object',
  required: ['filter'],
  properties: {
    filter: {
      type: 'object',
      description: 'The filter used to select the document to update.',
      errorMessage: {
        type: 'MongoDBDeleteMany request property "filter" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBDeleteMany request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBDeleteMany request properties should be an object.',
    required: 'MongoDBDeleteMany request should have required property "filter".',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Delete all documents older than a specific date

```yaml
requests:
  - id: delete_old_documents
    type:  MongoDBDeleteMany
    connectionId: my_mongodb_collection_id
    properties:
      filter:
        created_date:
          $lt:
            _date: 2020-01-01
```

</EXAMPLES>
