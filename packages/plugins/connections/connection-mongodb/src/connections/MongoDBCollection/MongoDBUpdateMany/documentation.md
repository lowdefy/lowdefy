<TITLE>
MongoDBUpdateMany
</TITLE>

<DESCRIPTION>

The `MongoDBUpdateMany` request updates multiple documents that match a certain criteria in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select the documents to update.

### Properties

- `filter: object`: __Required__ - The filter used to select the document to update.
- `update: object | object[]`: __Required__ - The update operations to be applied to the document.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/3.3/api/Collection.html#updateOne) for more information. Supported settings are:
  - `arrayFilters: string[]`: Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `forceServerObjectId: boolean`: Force server to assign _id values instead of driver.
  - `hint: object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `j: boolean`: Specify a journal write concern.
  - `upsert: boolean`: Default: `false` - Insert document if no match is found.
  - `w: number | string`: The write concern.
  - `wtimeout: number`: The write concern timeout.

</DESCRIPTION>

<CONNECTION>
MongoDBCollection
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBUpdateMany',
  type: 'object',
  required: ['filter', 'update'],
  properties: {
    filter: {
      type: 'object',
      description: 'The filter used to select the documents to update.',
      errorMessage: {
        type: 'MongoDBUpdateMany request property "filter" should be an object.',
      },
    },
    update: {
      type: ['object', 'array'],
      description: 'The update operations to be applied to the documents.',
      errorMessage: {
        type: 'MongoDBUpdateMany request property "update" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBUpdateMany request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBUpdateMany request properties should be an object.',
    required: {
      filter: 'MongoDBUpdateMany request should have required property "filter".',
      update: 'MongoDBUpdateMany request should have required property "update".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Set a list of documents as resolved

```yaml
requests:
  - id: set_resolved
    type:  MongoDBUpdateMany
    connectionId: my_mongodb_collection_id
    payload:
      selected_issues_list:
        _state: selected_issues_list
    properties:
      # Select all documents where the _id is in selected_issues_list in state
      filter:
        _id:
          $in:
            _payload: selected_issues_list
      update:
        $set:
          resolved: true
```

### Mark all documents with score less than 6 as urgent

```yaml
requests:
  - id: set_resolved
    type:  MongoDBUpdateMany
    properties:
      filter:
        score:
          $lt: 6
      update:
        $set:
          status: urgent
```

</EXAMPLES>
