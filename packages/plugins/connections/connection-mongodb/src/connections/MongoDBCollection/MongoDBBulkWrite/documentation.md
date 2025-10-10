<TITLE>
MongoDBBulkWrite
</TITLE>

<DESCRIPTION>

The `MongoDBBulkWrite` request executes [bulkWrite operations](https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/#write-operations) in the collection specified in the connectionId.

### Properties

- `operations: object[]`: __Required__ - Array containing all the bulkWrite operations for the execution.
  - `insertOne: object`:
    - `document: object`: The document to be inserted.
  - `deleteOne: object`:
    - `filter: object`: __Required__ - The filter used to select the document to delete.
    - `collation: object`: Specify collation settings for update operation.
  - `deleteMany: object`:
    - `filter: object`: __Required__ - The filter used to select the documents to delete.
    - `collation: object`: Specify collation settings for update operation.
  - `updateOne: object`:
    - `filter: object`: __Required__ - The filter used to select the document to update.
    - `update: object | object[]`: __Required__ - The update operations to be applied to the document.
    - `upsert: object`: Insert document if no match is found.
    - `arrayFilters: string[]`: Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
    - `collation: object`: Specify collation settings for update operation.
    - `hint: object | string`: 'An optional hint for query optimization.'
  - `updateMany: object`:
    - `filter: object`: __Required__ - The filter used to select the documents to update.
    - `update: object | object[]`: __Required__ - The update operations to be applied to the documents.
    - `upsert: object`: Insert document if no match is found.
    - `arrayFilters: string[]`: Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
    - `collation: object`: Specify collation settings for update operation.
    - `hint: object | string`: An optional hint for query optimization.
  - `replaceOne: object`:
    - `filter: object`: __Required__ - The filter used to select the document to replace.
    - `replacement: object`: __Required__ - The document to be inserted.
    - `upsert: object`: Insert document if no match is found.
    - `collation: object`: Specify collation settings for update operation.
    - `hint: object | string`: An optional hint for query optimization.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#aggregate) for more information. Supported settings are:
  - `ordered: boolean`: Default: `true` - A boolean specifying whether the mongod instance should perform an ordered or unordered operation execution.
  - `writeConcern: object`: An object that expresses the write concern to use.

</DESCRIPTION>

<CONNECTION>
MongoDBCollection
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBBulkWrite',
  type: 'object',
  required: ['operations'],
  errorMessage: {
    type: 'MongoDBBulkWrite request properties should be an object.',
    required: 'MongoDBBulkWrite request should have required property "operations".',
  },
  properties: {
    operations: {
      type: 'array',
      description: 'Array containing all the write operations for the execution.',
      errorMessage: {
        type: 'MongoDBBulkWrite request property "operations" should be an array.',
      },
      items: {
        type: 'object',
        errorMessage: {
          type: 'MongoDBBulkWrite request property "operations" should be an array of write operation objects.',
          additionalProperties: 'MongoDBBulkWrite operation should be a write operation.',
          maxProperties: 'MongoDBBulkWrite operation should be a write operation.',
        },
        additionalProperties: false,
        maxProperties: 1,
        properties: {
          insertOne: {
            type: 'object',
            required: ['document'],
            errorMessage: {
              type: 'insertOne operation should be an object.',
              required: 'insertOne operation should have required property "document".',
            },
            properties: {
              document: {
                type: 'object',
                description: 'The document to be inserted.',
                errorMessage: {
                  type: 'insertOne operation property "document" should be an object.',
                },
              },
            },
          },
          updateOne: {
            type: 'object',
            required: ['filter', 'update'],
            errorMessage: {
              type: 'updateOne operation should be an object.',
              required: {
                filter: 'updateOne operation should have required property "filter".',
                update: 'updateOne operation should have required property "update".',
              },
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the document to update.',
                errorMessage: {
                  type: 'updateOne operation property "filter" should be an object.',
                },
              },
              update: {
                type: ['object', 'array'],
                description: 'The update operations to be applied to the document.',
                errorMessage: {
                  type: 'updateOne operation property "update" should be an object or an array.',
                },
              },
              upsert: {
                type: 'boolean',
                description: 'Insert document if no match is found.',
                errorMessage: {
                  type: 'updateOne operation property "upsert" should be a boolean.',
                },
              },
              arrayFilters: {
                type: 'array',
                description: 'Array filters for the `$[<identifier>]` array update operator.',
                errorMessage: {
                  type: 'updateOne operation property "arrayFilters" should be an array.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'updateOne operation property "collation" should be an object.',
                },
              },
              hint: {
                type: ['object', 'string'],
                description: 'An optional hint for query optimization.',
                errorMessage: {
                  type: 'updateOne operation property "hint" should be an object or a string.',
                },
              },
            },
          },
          updateMany: {
            type: 'object',
            required: ['filter', 'update'],
            errorMessage: {
              type: 'updateMany operation should be an object.',
              required: {
                filter: 'updateMany operation should have required property "filter".',
                update: 'updateMany operation should have required property "update".',
              },
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the documents to update.',
                errorMessage: {
                  type: 'updateMany operation property "filter" should be an object.',
                },
              },
              update: {
                type: ['object', 'array'],
                description: 'The update operations to be applied to the document.',
                errorMessage: {
                  type: 'updateMany operation property "update" should be an object or an array.',
                },
              },
              upsert: {
                type: 'boolean',
                description: 'Insert document if no match is found.',
                errorMessage: {
                  type: 'updateMany operation property "upsert" should be a boolean.',
                },
              },
              arrayFilters: {
                type: 'array',
                description: 'Array filters for the `$[<identifier>]` array update operator.',
                errorMessage: {
                  type: 'updateMany operation property "arrayFilters" should be an array.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'updateMany operation property "collation" should be an object.',
                },
              },
              hint: {
                type: ['object', 'string'],
                description: 'An optional hint for query optimization.',
                errorMessage: {
                  type: 'updateMany operation property "hint" should be an object or a string.',
                },
              },
            },
          },
          deleteOne: {
            type: 'object',
            required: ['filter'],
            errorMessage: {
              type: 'deleteOne operation should be an object.',
              required: 'deleteOne operation should have required property "filter".',
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the document to update.',
                errorMessage: {
                  type: 'deleteOne operation property "filter" should be an object.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'deleteOne operation property "collation" should be an object.',
                },
              },
            },
          },
          deleteMany: {
            type: 'object',
            required: ['filter'],
            errorMessage: {
              type: 'deleteMany operation should be an object.',
              required: 'deleteMany operation should have required property "filter".',
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the documents to delete.',
                errorMessage: {
                  type: 'deleteMany operation property "filter" should be an object.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'deleteMany operation property "collation" should be an object.',
                },
              },
            },
          },
          replaceOne: {
            type: 'object',
            required: ['filter', 'replacement'],
            errorMessage: {
              type: 'replaceOne operation should be an object.',
              required: {
                filter: 'replaceOne operation should have required property "filter".',
                replacement: 'replaceOne operation should have required property "replacement".',
              },
            },
            properties: {
              filter: {
                type: 'object',
                description: 'The filter used to select the documents to update.',
                errorMessage: {
                  type: 'replaceOne operation property "filter" should be an object.',
                },
              },
              replacement: {
                type: 'object',
                description: 'The document to be inserted.',
                errorMessage: {
                  type: 'replaceOne operation property "replacement" should be an object.',
                },
              },
              upsert: {
                type: 'boolean',
                description: 'Insert document if no match is found.',
                errorMessage: {
                  type: 'replaceOne operation property "upsert" should be a boolean.',
                },
              },
              collation: {
                type: 'object',
                description: 'Specify collation settings for update operation.',
                errorMessage: {
                  type: 'replaceOne operation property "collation" should be an object.',
                },
              },
              hint: {
                type: ['object', 'string'],
                description: 'An optional hint for query optimization.',
                errorMessage: {
                  type: 'replaceOne operation property "hint" should be an object or a string.',
                },
              },
            },
          },
        },
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBBulkWrite request property "options" should be an object.',
      },
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Update pizzas

```yaml
requests:
  - id: update_pizzas
    type: MongoDBBulkWrite
    connectionId: my_mongodb_collection_id
    properties:
      operations:
        - insertOne:
            document:
              _id: 3
              type: "beef"
              size: "medium"
              price: 6
        - insertOne:
            document:
              _id: 4
              type: "sausage"
              size: "large"
              price: 10
        - updateOne:
            filter:
              type: "cheese"
              update:
                $set:
                  price: 8
        - deleteOne:
            filter:
              type: "pepperoni"
        - replaceOne:
            filter:
              type: "vegan"
            replacement:
              type: "tofu"
              size: "small"
              price: 4
```

</EXAMPLES>
