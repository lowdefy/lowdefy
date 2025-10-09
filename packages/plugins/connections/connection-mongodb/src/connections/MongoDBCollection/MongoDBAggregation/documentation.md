<TITLE>
MongoDBAggregation
</TITLE>

<DESCRIPTION>

The `MongoDBAggregation` request executes an [aggregation pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) in the collection specified in the connectionId. It returns the array of documents returned by the aggregation. Aggregation pipelines are MongoDB's data processing and aggregation framework. They are based on a series of stages, each of which apply a transformation to the data passed through them, like sorting, grouping or calculating additional fields.

>Cursors are not supported. The request will return the whole body of the response as an array.

### Properties

- `pipeline: object[]`: __Required__ - Array containing all the aggregation framework commands for the execution.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#aggregate) for more information. Supported settings are:
  - `allowDiskUse: boolean`: Default: `false` - Allow disk use on the MongoDB server to store temporary results for the aggregation.
  - `authdb: string`: Specifies the authentication information to be used.
  - `batchSize: number`: The number of documents to return per batch.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher.
  - `checkKeys: boolean`: The serializer will check if keys are valid.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the aggregation. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies to return the information on the processing of the pipeline.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: Add an index selection hint to an aggregation command.
  - `ignoreUndefined: boolean`: Default: `true` - Serialize will not emit undefined fields.
  - `let: object`: Specifies an object with a list of variables. This allows you to improve command readability by separating the variables from the query text.
  - `maxAwaitTimeMS: number`: The maximum amount of time for the server to wait on new documents to satisfy a tailable cursor query.
  - `maxTimeMS: number`: Specifies a cumulative time limit in milliseconds for processing operations on the cursor.
  - `noResponse: boolean`: Admin command option.
  - `readConcern: object`: Specifies the level of isolation for read operations.
  - `readPreference: string | object`: The read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern to use with the $out or $merge stage.

</DESCRIPTION>

<CONNECTION>
MongoDBCollection
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBAggregation',
  type: 'object',
  required: ['pipeline'],
  properties: {
    pipeline: {
      type: 'array',
      description: 'Array containing all the aggregation framework commands for the execution.',
      errorMessage: {
        type: 'MongoDBAggregation request property "pipeline" should be an array.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBAggregation request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBAggregation request properties should be an object.',
    required: 'MongoDBAggregation request should have required property "pipeline".',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Calculate average score by region

```yaml
requests:
  - id: avg_spend_by_region
    type:  MongoDBAggregation
    connectionId: my_mongodb_collection_id
    properties:
      pipeline:
        - $group:
            _id: $region
            score:
              $avg: $score
        - $project:
            _id: 0
            region: $_id
            score: 1
        - $sort:
            score: 1
```

</EXAMPLES>
