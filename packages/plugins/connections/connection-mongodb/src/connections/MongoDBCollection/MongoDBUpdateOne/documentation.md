<TITLE>
MongoDBUpdateOne
</TITLE>

<DESCRIPTION>

The `MongoDBUpdateOne` request updates a single document in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a document to update. It will update the first document that matches the filter. If the `upsert` option is set to true, it will insert a new document if no document is found to update.
> MongoDBUpdateOne response differs when the connection has a log collection. When a log collection is set on the connection, a findOneAndUpdate operation is performed compared to the standard updateOne operation.

### Properties

- `filter: object`: __Required__ - The filter used to select the document to update.
- `update: object | object[]`: __Required__ - The update operations to be applied to the document.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#updateone) for more information. Supported settings are:
  - `arrayFilters: object[]`: _Array_ - Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: A user-provided comment to attach to this command.
  - `dbName: string`: The database name.
  - `explain: object`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `noResponse: boolean`: Admin command option.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `upsert: boolean`: Default: `false` - Insert document if no match is found.
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
  title: 'Lowdefy Request Schema - MongoDBUpdateOne',
  type: 'object',
  required: ['filter', 'update'],
  properties: {
    filter: {
      type: 'object',
      description: 'The filter used to select the document to update.',
      errorMessage: {
        type: 'MongoDBUpdateOne request property "filter" should be an object.',
      },
    },
    update: {
      type: ['object', 'array'],
      description: 'The update operations to be applied to the document.',
      errorMessage: {
        type: 'MongoDBUpdateOne request property "update" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBUpdateOne request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBUpdateOne request properties should be an object.',
    required: {
      filter: 'MongoDBUpdateOne request should have required property "filter".',
      update: 'MongoDBUpdateOne request should have required property "update".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Update a document

```yaml
requests:
  - id: update
    type:  MongoDBUpdateOne
    connectionId: my_mongodb_collection_id
    payload:
      _id:
        _state: _id
    properties:
      filter:
        _id:
          _payload: _id
      update:
        $set:
          _state: true
```

### Like a comment

```yaml
requests:
  - id: like_comment
    type:  MongoDBUpdateOne
    connectionId: my_mongodb_collection_id
    payload:
      comment_id:
        _state: comment._id
    properties:
      filter:
        _id:
          _payload: comment_id
      update:
        $inc:
          likes: 1
        $push:
          liked_by:
            _user.id:
        $set:
          last_liked:
            _date: now
```

</EXAMPLES>
