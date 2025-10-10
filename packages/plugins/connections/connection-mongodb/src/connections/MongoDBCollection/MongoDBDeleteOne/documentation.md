<TITLE>
MongoDBDeleteOne
</TITLE>

<DESCRIPTION>

The `MongoDBDeleteOne` request deletes a single document in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a document to delete. It will delete the first document that matches the filter.
> MongoDBDeleteOne response differs when the connection has a log collection. When a log collection is set on the connection, a findOneAndDelete operation is performed compared to the standard deleteOne operation.

### Properties

- `filter: object`: __Required__ - The filter used to select the document to update.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#deleteone) for more information. Supported settings are:
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
  title: 'Lowdefy Request Schema - MongoDBDeleteOne',
  type: 'object',
  required: ['filter'],
  properties: {
    filter: {
      type: 'object',
      description: 'The filter used to select the document to update.',
      errorMessage: {
        type: 'MongoDBDeleteOne request property "filter" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBDeleteOne request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBDeleteOne request properties should be an object.',
    required: 'MongoDBDeleteOne request should have required property "filter".',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Delete a document by _id

```yaml
requests:
  - id: delete_selected_document
    type:  MongoDBDeleteOne
    connectionId: my_mongodb_collection_id
    payload:
      selected_id
        _state: selected_id
    properties:
      filter:
        _id:
          _payload: selected_id
```

</EXAMPLES>
