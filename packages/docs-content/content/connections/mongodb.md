# MongoDB

MongoDB is a NoSQL database that stores JSON-like documents. These documents are stored in collections, which are like database tables. The fields inside these document can differ from document to document, but generally they are all more or less the same. However documents with different schemas can be stored in the same collection.

##### ObjectIds

MongoDB uses the _id field as the id for a document. This has to be unique for every document in the collection. If no _id is provided when the document is created, a MongoDB [ObjectId](https://docs.mongodb.com/manual/reference/method/ObjectId/) is created for that document. This id includes a timestamp, a random element and an incrementing counter, to ensure it is unique even if multiple ids are created at the same time.

The _id is often represented as:

```js
{
  _id: ObjectId("507f1f77bcf86cd799439011")
}
```

To be able to transmit these ids over JSON network connections, and to use them in Lowdefy apps, Lowdefy serializes these ids as (in YAML):
```yaml
_id:
  _oid: 507f1f77bcf86cd799439011
```

Ids specified in this way will be treated as ObjectIds by MongoDB requests and mutations.


## Connections

Connection types:
  - MongoDBCollection

### MongoDBCollection

The `MongoDBCollection` connection sets up a connection to a MongoDB deployment. A [connection URI](https://docs.mongodb.com/manual/reference/connection-string/index.html) with authentication credentials (username and password) is required. The URI can be in the standard or dns seedlist (srv) formats. Connections are defined on a collection level, since this allows for read/write access control on a per collection level. Access control can also be managed using the roles in the database.

>Since the connection URI contains authentication secrets, it should be stored using the [`_secret`](operators/secret.md) operator.

When the connection has a `changeLog` collection, all write requests log a change record to that collection. The record contains the request arguments, the request context (`blockId`, `pageId`, `requestId`, `connectionId`, `payload`), a `timestamp`, the request `type`, the connection's `changeLog.meta` value, and either the driver response or `before`/`after` document snapshots (for `MongoDBUpdateOne`, `MongoDBVersionedUpdateOne` and `MongoDBDeleteOne`). The response shape of every request stays the same whether or not a log collection is configured.

#### Properties
- `databaseUri: string`: __Required__ - Connection uri string for the MongoDb deployment. Should be stored using the [_secret](operators/secret.md) operator.
- `databaseName: string`: Default: Database specified in connection string - The name of the database in the MongoDB deployment.
- `collection: string`: __Required__ - The name of the MongoDB collection.
- `changeLog: object`: Log all changes made by write requests to a log collection.
  - `collection: string`: __Required__ - The name of the collection change log records are written to.
  - `meta: object`: Additional data to include in every change log record, for example the user making the change.
- `read: boolean`: Default: `true` - Allow read operations like find on the collection.
- `write: boolean`: Default: `false` - Allow write operations like update on the collection.
- `options: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/interfaces/mongoclientoptions.html) for more information.

#### Connection pooling

The MongoDB client is created once per unique `databaseUri` and `options` combination and reused for all requests, so requests share the driver's connection pool instead of opening a new connection for every request. The pool can be tuned with the standard driver options, for example:

```yaml
connections:
  - id: my_collection
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: my_collection_name
      options:
        maxPoolSize: 20
        minPoolSize: 0
        maxIdleTimeMS: 60000
```

#### Examples

###### MongoDB collection with reads and writes:
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
###### MongoDB collection with reads, writes and a log collection:
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

## Requests

Request types:
  - MongoDBAggregation
  - MongoDBBulkWrite
  - MongoDBDeleteMany
  - MongoDBDeleteOne
  - MongoDBEnrichmentClaim
  - MongoDBEnrichmentComplete
  - MongoDBEnrichmentEnqueue
  - MongoDBFind
  - MongoDBFindOne
  - MongoDBInsertConsecutiveId
  - MongoDBInsertMany
  - MongoDBInsertManyConsecutiveIds
  - MongoDBInsertOne
  - MongoDBTableChanges
  - MongoDBTableQuery
  - MongoDBUpdateMany
  - MongoDBUpdateOne
  - MongoDBVersionedUpdateOne


### MongoDBAggregation

The `MongoDBAggregation` request executes an [aggregation pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) in the collection specified in the connectionId. It returns the array of documents returned by the aggregation. Aggregation pipelines are MongoDB's data processing and aggregation framework. They are based on a series of stages, each of which apply a transformation to the data passed through them, like sorting, grouping or calculating additional fields.

>Cursors are not supported. The request will return the whole body of the response as an array.

#### Properties
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

#### Examples

###### Calculate average score by region:
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

### MongoDBBulkWrite

The `MongoDBBulkWrite` request executes [bulkWrite operations](https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/#write-operations) in the collection specified in the connectionId.

#### Properties
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

#### Examples

###### Update pizzas:

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

### MongoDBDeleteMany

The `MongoDBDeleteMany` request deletes multiple documents in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a documents to delete.

#### Properties
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

#### Examples

###### Delete all documents older than a specific date:
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

### MongoDBDeleteOne

The `MongoDBDeleteOne` request deletes a single document in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a document to delete. It will delete the first document that matches the filter.
> When the connection has a log collection, a findOneAndDelete operation is performed instead of the standard deleteOne operation so the deleted document can be captured in the change log. The response shape is the same in both cases.

#### Properties
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

#### Examples

###### Delete a document by _id:
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

### Enrichment run queue

Three requests run the enrichment columns of a `Table`: columns whose cells are computed per row by a provider (an API endpoint of the app) or an AI prompt, from the values of other columns. `MongoDBEnrichmentEnqueue` marks cells queued, `MongoDBEnrichmentClaim` hands a worker a batch of queued cells, and `MongoDBEnrichmentComplete` writes the worker's results. There is no queue collection: each cell's run state is stored in its row, under `_enrich.<column key>`, next to the row's data.

```yaml
_enrich:
  email:                    # the column key
    status: ok              # queued | running | ok | error | empty
    value: ada@acme.test    # the result the column shows (its field is _enrich.email.value)
    raw: { ... }            # the provider's response, for the details panel
    error: null             # the message, with status error (or the last failed attempt, while queued again)
    inputHash: 0659b6fcca796a  # the hash of the inputs the value was computed from
    runId: 66f9…            # the enqueue that queued the cell
    attempts: 1
    claimToken: …           # the claim of the worker that ran it
    queuedAt, startedAt, finishedAt, leaseUntil
    waitingFor: [company]   # while queued behind the enrichment columns it reads
```

A cell moves from `queued` to `running` (claimed by a worker, with a lease) to `ok`, `empty` (the provider found nothing) or `error`. A failed attempt goes back to `queued` after a backoff until `maxAttempts`. While a cell is queued or running again, its previous `value`, `raw` and `inputHash` stay, so the table keeps showing the old value until a new result lands.

The three requests take the table's columns as `columnDefs`, the declared and user-defined columns merged, as the app passes them to the `Table` (a Table columns list can be passed as it is). Enrichment and ai columns run; other columns are only looked up by key:

```yaml
- key: email
  kind: enrichment                 # or ai
  provider: finder                 # the worker calls the endpoint enrich_finder; ai columns default to ai
  inputs:
    domain: { column: domain }     # another column's value; required unless required: false
    country: { value: ZA }         # a literal value
  autoRun: true                    # run when an input column completes
- key: pitch
  kind: ai                         # provider defaults to ai (the enrich_ai endpoint)
  prompt: Write a two line pitch for {{ name }}
  inputs:
    name: { column: name }         # list every column the prompt uses
    email: { column: email }       # an enrichment column: its value, once its cell is ok
  output: { type: tag, options: [Hot, Warm, Cold] }  # text, number, boolean, tag or tags
```

>Read the columns on the server, never from the browser. A request payload is whatever the browser sends: an endpoint that passes `_payload: columnDefs` to these requests lets any user run any column config (another provider, other inputs, another prompt) against the rows the filter allows. Build `columnDefs` in the endpoint from your declared columns and the stored user columns, as the examples below do, and check user columns when they are saved.

>AI prompts and formula templates are user content: they only take `{{ column }}` placeholders, filled in as plain text. Never render a prompt with a template engine (`_nunjucks` or a `_js` template) on the server: a template can run code. The `Table` refuses prompts and formulas with tags (`{% %}`), comments (`{# #}`) or expressions (`{{ a | upper }}`); check the same when you save a user column.

A `{ column }` input reads another enrichment or ai column's value (only when that cell is `ok`; while it is queued or running, the cell waits for it: it is queued with `waitingFor`, out of claims until that cell finishes), or a field of `fields`, the table's `MongoDBTableQuery` fields keyed by column key, at its `path`. A column outside both is refused, so a user-defined column can never send a field the table does not list to a provider. A required input that is `null`, missing or `''` sets the cell to `empty` with `error: Missing input: <column>` instead of running it. A chain of inputs that comes back to a column is refused, since `autoRun` would run it forever.

The browser never sends MongoDB syntax, and the requests only ever write the cell properties above, under `_enrich.<column key>` of an enrichment or ai column of `columnDefs` (column keys are 1 to 128 letters, digits, `_` or `-`). Every read and write is scoped by the base `filter` (required unless the connection is tenant-scoped; `filter: {}` for every document) and, on a tenant connection, by the tenant; the `filter` may not name `_enrich`. No request runs JavaScript on the database server.

##### Input hash

`inputHash` is the hash of a cell's inputs, `{ [param]: value }` with optional inputs that have no value left out: [cyrb53](https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js) (seed 0) of the canonical JSON of the inputs, as 14 lowercase hex digits. The canonical JSON has object keys sorted at every depth, no whitespace, dates as ISO strings, ObjectIds as hex strings and undefined values left out. The `Table` computes the same hash in the browser, so a cell whose row's inputs changed since its value was computed shows as stale, and `mode: stale` re-runs exactly those cells. A claim hashes the inputs it gives the worker, and the result is stored with that hash.

##### Columns and fields on the server

Every endpoint that runs these requests reads the table's columns itself, with a request or step (declared columns merged with the stored user columns), and builds `fields` the same way: the declared `MongoDBTableQuery` fields, plus one field per user-defined input column. The recommended layout keeps what users type under `values.<key>` (set the Table's `inputFieldPrefix: values`), so a user column can never name, read or write another field of the row:

```yaml
# leads/load_table.yaml, referenced by every enrichment endpoint
- id: load_columns
  type: MongoDBAggregation
  connectionId: table_columns
  properties:
    pipeline:
      - $match: { tableId: leads }
      - $sort: { position: 1 }
- :set_state:
    columnDefs:
      _array.concat:
        - _ref: leads/columns.yaml       # the declared columns
        - _step: load_columns            # the user columns, as stored
    fields:
      _js:
        fn: |
          const fields = { ...args.declared };
          args.columns
            .filter((column) => column.userDefined === true && column.kind === 'input')
            .forEach((column) => {
              fields[column.key] = { type: column.type ?? 'text', path: `values.${column.key}` };
            });
          return fields;
        args:
          declared:
            _ref: leads/fields.yaml      # the declared MongoDBTableQuery fields
          columns:
            _step: load_columns
```

`columnDefs` and `fields` may come from any operator (`_state`, `_step`, `_payload` for data you checked); the requests validate them each time they run.

##### The worker

The worker is an API endpoint: it claims a batch of cells, calls each cell's provider endpoint with `:parallel_for` (`:concurrency` limits how many run at once), and completes each cell. Complete queues the `autoRun` columns a completed cell feeds (a waterfall between columns) and releases the cells waiting for it, so a later round runs them. It loops until a claim returns nothing, or for at most ten rounds. A schedule runs it every minute, and the endpoint that enqueues a run starts it at once with a detached call. A worker that crashes loses nothing: its cells are claimed again when their lease runs out, and a result from a worker whose lease ran out is ignored.

```yaml
api:
  - id: enrichment_worker
    type: InternalApi
    schedules:
      - cron: '* * * * *'
    routine:
      - _ref: leads/load_table.yaml   # columnDefs and fields, read on the server
      - :set_state:
          claimed: 1
          rounds: 0
      - :while:
          _and:
            - _gt: [{ _state: claimed }, 0]
            - _lt: [{ _state: rounds }, 10]
        :do:
          - id: claim
            type: MongoDBEnrichmentClaim
            connectionId: leads
            properties:
              filter: {} # cells were scoped when they were queued
              fields:
                _state: fields
              columnDefs:
                _state: columnDefs
              limit: 20
          - :parallel_for: cell
            :in:
              _step: claim
            :concurrency: 5 # at most five provider calls at once
            :do:
              - :try:
                  - id: call_provider
                    type: CallApi
                    properties:
                      endpointId:
                        _string.concat: [enrich_, { _item: cell.provider }]
                      payload:
                        inputs:
                          _item: cell.inputs
                        prompt:
                          _item: cell.prompt # ai columns
                        output:
                          _item: cell.output # the column's output config
                  - id: complete
                    type: MongoDBEnrichmentComplete
                    connectionId: leads
                    properties:
                      filter: {}
                      columnDefs:
                        _state: columnDefs
                      results:
                        # The claim's cell, with the provider's answer merged in:
                        # { status, value, raw } or { status, error, retry }.
                        - _object.assign:
                            - rowKey:
                                _item: cell.rowKey
                              columnKey:
                                _item: cell.columnKey
                              claimToken:
                                _item: cell.claimToken
                            - _step: call_provider.$
                :catch:
                  - id: complete_error
                    type: MongoDBEnrichmentComplete
                    connectionId: leads
                    properties:
                      filter: {}
                      columnDefs:
                        _state: columnDefs
                      results:
                        - rowKey:
                            _item: cell.rowKey
                          columnKey:
                            _item: cell.columnKey
                          claimToken:
                            _item: cell.claimToken
                          status: error
                          error:
                            _error: message
          - :set_state:
              claimed:
                _array.length:
                  _step: claim
              rounds:
                _sum: [{ _state: rounds }, 1]
```

A request or service error a `:catch` handles is logged at debug, so a provider that fails on purpose (a 404 in a waterfall) does not fill the log with errors. Config, operator and internal errors are still logged as errors, with their config location, even when a `:catch` handles them.

Each provider endpoint `enrich_<provider id>` takes `{ inputs, prompt, output }` and returns `{ status: ok | empty, value, raw }`, or `{ status: error, error, retry: false }` for a final failure; throwing is a failed attempt that is retried. `null` for `error` or `retry` (what `_step` gives for a key the provider did not return) is the same as leaving it out. The app declares these endpoints, so a column can only call what the app exposes, and API keys stay on the server. For a concurrency per provider, group the claimed cells by `provider` and run each group with its own `:concurrency`, or run a worker per provider with `providers` on the claim.

The AI provider (`enrich_ai`) fills the prompt's `{{ input }}` and `{{ input.path }}` placeholders (a dot path reads into the input's value, the pattern the Table accepts) with the cell's inputs by plain string replacement, in one pass, so a row value that looks like a template stays text, and asks the model for an answer of the column's `output.type`.

The endpoint the table's run events call queues the cells, then starts the worker without waiting for it (a detached call needs the `CRON_SECRET` environment variable):

```yaml
api:
  - id: run_enrichment
    type: Api
    routine:
      - _ref: leads/load_table.yaml
      - id: enqueue
        type: MongoDBEnrichmentEnqueue
        connectionId: leads
        properties:
          filter:
            org_id:
              _user: organization.id
          fields:
            _state: fields
          columnDefs:
            _state: columnDefs # read on the server, never _payload
          columns:
            _payload: columns
          mode:
            _payload: mode
          selection:
            _payload: selection
          user:
            _user: true
      - id: start_worker
        type: CallApi
        properties:
          endpointId: enrichment_worker
          detached: true
      - :return:
          _step: enqueue
```

A claim reads the oldest due cells of each column. On a large table, index each enrichment column's queue fields, for example `{ "_enrich.email.status": 1, "_enrich.email.queuedAt": 1 }`, with the base filter fields first when every run is scoped by them.

### MongoDBEnrichmentClaim

The `MongoDBEnrichmentClaim` request claims up to `limit` enrichment cells for a worker: the oldest cells that are queued and due (`queuedAt` passed, so a retry waits out its backoff), and running cells whose lease ran out. Each claimed cell is set to `running` with `startedAt`, `leaseUntil` (now plus `leaseMs`), `attempts` plus one and a new random `claimToken`. See [Enrichment run queue](#enrichment-run-queue).

Each claim carries the column config the worker needs (`kind`, `title`, `provider`, `prompt`, `output`), so the worker never looks the column up again.

Concurrent workers never claim the same cell. Every claim is a compare-and-set: the write matches the cell only in the state the claim read (its status, token, attempts and run) and while it is still claimable, so when two workers read the same cell, only the first write changes it. A worker that lost cells to another reads further candidates, up to five rounds, so it does not stop while cells are still queued.

A claim also settles cells it can not hand out: a cell whose required input is now missing is set to `empty` with the missing column named, a cell whose enrichment input is queued or running again waits for it (queued with `waitingFor`, released when that input finishes), and a running cell whose lease ran out on its last attempt (`maxAttempts`) becomes an `error`. A cell a claim sets to `empty` or `error` releases the cells waiting for it, as a final result does.

##### Response

```yaml
- rowKey: 66f9…              # the row key (rowKeyField)
  columnKey: email
  kind: enrichment           # or ai
  title: Email               # when the column has one
  provider: finder           # ai columns: ai unless they name another
  prompt: …                  # ai columns
  output: email              # when set: the enrichment result path, or the ai answer's { type, options? }
  runId: 66f9…
  claimToken: 3b1f…:0659b6fcca796a
  attempt: 1
  inputHash: 0659b6fcca796a
  inputs:                    # resolved from columnDefs
    domain: acme.test
  row:                       # _id, the row key and the fields paths only
    _id: …
    name: Acme
    domain: acme.test
```

#### Properties
- `columnDefs: object[]`: __Required__ - The table columns, declared and user-defined merged. See [Enrichment run queue](#enrichment-run-queue).
- `fields: object`: __Required__ - The table's `MongoDBTableQuery` fields, keyed by column key: the fields column inputs read and claimed rows return.
- `columns: string[]`: Claim only cells of these enrichment or ai columns. Defaults to every enrichment and ai column.
- `providers: string[]`: Claim only cells of columns that use these providers, for a worker per provider.
- `filter: object`: The base filter every read and write is scoped by. Required unless the connection is tenant-scoped. Set it to `{}` to claim cells of every document.
- `limit: integer`: Default: `20` - The most cells one claim returns, at most 200.
- `leaseMs: integer`: Default: `120000` - How long a claimed cell stays with its worker. After it, the cell can be claimed again, and the first worker's result is ignored. Keep it longer than a provider call, and keep the servers' clocks in sync.
- `maxAttempts: integer`: Default: `3` - A cell whose lease ran out on this attempt becomes an error instead of being claimed again. Use the same value as `MongoDBEnrichmentComplete`.
- `rowKeyField: string`: Default: `_id` - The document field returned as `rowKey`.

### MongoDBEnrichmentComplete

The `MongoDBEnrichmentComplete` request writes a worker's results to the cells it claimed. A result is applied only while its cell still holds the claim, its `claimToken` with status `running`, so a worker whose lease ran out (and whose cell was claimed again or queued again since) changes nothing, and a result sent twice is applied once. See [Enrichment run queue](#enrichment-run-queue).

- `ok` and `empty` results replace the cell's `value` and `raw` (an empty result has no value), and store `finishedAt` and the `inputHash` of the inputs the claim gave the worker.
- An `error` below `maxAttempts` goes back to `queued` with its error message, due after `backoffMs * 2^(attempt - 1)` (30 seconds, then 60, …, at most a day), or after the result's `retryAfterMs` when the provider said how long to wait (a rate limit's `Retry-After`). On the last attempt, or with `retry: false`, the error is final. The previous value stays in both cases.
- A final result (`ok`, `empty`, or an error that is not retried) releases the cells of the row waiting for it (`waitingFor`), so they are claimed next; one whose input failed then finds it missing.
- An `ok` result queues the `autoRun` columns that read the column, in its row, unless they are queued or running already.
- A `raw` larger than `rawMaxBytes` is stored as `{ _truncated: true, bytes, maxBytes, preview }`, with the first 1000 characters of its JSON, so one large response can not fill the row. A `value` larger than `rawMaxBytes` makes the result a final error.

##### Response

```yaml
applied: 18      # results written
ignored: 2       # results whose claim no cell holds any more
requeued: 1      # errors queued again for a retry
released: 4      # waiting cells released by the results
downstream:      # autoRun columns that read a column that just completed ok, now queued
  - rowKey: 66f9…
    columns: [pitch]
```

The `downstream` columns are already queued: the worker's next claim runs them.

#### Properties
- `results: object[]`: __Required__ - At most 1000 results, each:
  - `rowKey: any`: __Required__ - The `rowKey` of the claim.
  - `columnKey: string`: __Required__ - The `columnKey` of the claim.
  - `claimToken: string`: __Required__ - The `claimToken` of the claim.
  - `status: enum`: __Required__ - `ok`, `empty` (no result) or `error`.
  - `value: any`: The result the column shows.
  - `raw: any`: The provider's response.
  - `cost: integer`: What the provider call behind the result cost, in micro-USD, such as a [`TregCall`](/Treg) `cost.micro`. Stored as the cell's `cost` with any status; a result without a cost leaves the cell's cost as it was.
  - `error: string | null`: The error message, with status `error`. `null` is the same as leaving it out.
  - `retry: boolean | null`: Default: `true` - With status `error`, `false` makes the error final. `null` is the same as leaving it out.
  - `retryAfterMs: integer | null`: With status `error` below `maxAttempts`, the wait before the cell is claimed again, in place of the exponential backoff, at most a day. A worker passes a `ServiceError`'s `retryAfter` (seconds, such as a [`TregCall`](/Treg) 429 or 503) times 1000. `null` is the same as leaving it out.
- `columnDefs: object[]`: __Required__ - The table columns, declared and user-defined merged.
- `filter: object`: The base filter every read and write is scoped by. Required unless the connection is tenant-scoped.
- `maxAttempts: integer`: Default: `3` - The attempts a cell gets.
- `backoffMs: integer`: Default: `30000` - The wait before a failed cell is claimed again, doubled per attempt made.
- `rawMaxBytes: integer`: Default: `65536` - The largest raw response (BSON bytes) stored as it is.
- `rowKeyField: string`: Default: `_id` - The document field a row key matches.
- `rowKeyType: enum`: Default: `auto` - How row keys are read, as for `MongoDBTableChanges`.

### MongoDBEnrichmentEnqueue

The `MongoDBEnrichmentEnqueue` request queues cells of enrichment columns: the cells of `columns` in the selected rows that `mode` names. See [Enrichment run queue](#enrichment-run-queue).

- `all`: every cell that is not queued, or running with a live lease. A run in progress is never restarted, whatever the mode.
- `empty`: cells never run, or whose last result was empty.
- `errors`: cells that failed.
- `stale`: cells with a result whose inputs changed since it was computed. The request reads each candidate row's inputs (in batches of 1000 rows, with only the input paths projected) and compares their hash with the cell's `inputHash`.

A queued cell gets `status: queued`, the `runId`, `queuedAt` and `attempts: 0`; its previous value, raw and inputHash stay until a new result lands. A cell whose required input has no value is set to `empty` with `error: Missing input: <column>` instead, and its previous result is cleared.

Columns can run together with the columns they read: the request plans them upstream first, and a cell whose required enrichment input is queued in the same call (or is queued or running already) is queued with `waitingFor: [<column>]`, out of claims until that input finishes, never `Missing input`. So one call can run `[email, pitch]` where the pitch reads the email.

`selection` is the table's `selected` value: row keys, or `{ all: true, except, filter, search }`, compiled against `fields` like `MongoDBTableChanges` compiles it, with the same limits. Leave it out to run every row inside the base `filter`. Row keys are read as in `MongoDBTableChanges` Row keys: an ObjectId as `{ _oid }` or its Table key text, and a numeric key as the number or its text.

The cells are written as unordered bulkWrites of 1000 cells, each write guarded by the mode's condition, so a cell a worker took since it was read is left alone. When more than `maxCells` cells would be written, nothing is written and the request throws, so a large run can be confirmed first.

##### Response

```yaml
queued: 2400          # cells queued, those waiting for an input column included
skipped: 12           # selected cells the mode left alone (live, fresh or not matching)
missingInputs: 3      # cells set to empty for a missing input
runId: 66f9…
```

#### Properties
- `columns: string[]`: __Required__ - The keys of the enrichment or ai columns to run.
- `columnDefs: object[]`: __Required__ - The table columns, declared and user-defined merged.
- `fields: object`: __Required__ - The table's `MongoDBTableQuery` fields, keyed by column key: the fields column inputs read and a select-all selection is compiled against.
- `selection: object | any[]`: The rows to run, the `Table` `selected` value. Defaults to every row inside `filter`.
- `mode: enum`: Default: `all` - `all`, `empty`, `errors` or `stale`.
- `filter: object`: The base filter every read and write is scoped by, for example `{ org_id: { _user: organization.id } }`. Required unless the connection is tenant-scoped. Set it to `{}` to run on every document.
- `maxCells: integer`: Default: `10000` - The most cells one enqueue may write, queued and missing input cells together.
- `maxTimeMS: integer`: Default: `30000` - The time limit of each read.
- `runId: string`: The `runId` the queued cells get, 1 to 64 letters, digits, `_` or `-`. Generated when left out.
- `user: object`: The user that `{ $user: path }` values in a selection filter resolve from. Set it to `{ _user: true }`.
- `timezone: string`: Default: `UTC` - The IANA time zone whose days the date filters of a selection compare.
- `rowKeyField: string`: Default: `_id` - The document field a row key matches.
- `rowKeyType: enum`: Default: `auto` - How row keys are read, as for `MongoDBTableChanges`.

### MongoDBFind

The `MongoDBFind` request executes a MongoDB [query](https://docs.mongodb.com/manual/tutorial/query-documents/) on the collection specified in the connectionId. It returns the array of documents returned by the query.

>Cursors are not supported. The request will return the whole body of the response as an array.

#### Properties
- `query: object`: __Required__ - A MongoDB query object.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#find) for more information. Supported settings are:
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

#### Examples

###### Find top ten scores above 90:
```yaml
requests:
  - id: scores_top_ten_scores_above_90
    type:  MongoDBFind
    connectionId: my_mongodb_collection_id
    properties:
      query:
        score:
          $gt: 90
      options:
        sort:
          - - score
            - -1
        limit: 10
        projection:
          score: 1
          name: 1
```

### MongoDBFindOne

The `MongoDBFindOne` request executes a MongoDB [query](https://docs.mongodb.com/manual/tutorial/query-documents/) on the collection specified in the connectionId. It returns the first document that matches the specified query.

>Cursors are not supported. The request will return the whole body of the response as an array.

#### Properties
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

#### Examples

###### Find a document by id:
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

### MongoDBInsertConsecutiveId

The `MongoDBInsertConsecutiveId` request inserts a single document into the collection specified in the connectionId, assigning a sequential, human-readable `_id` like `INV0001`. The id is built from a prefix and the next consecutive number for that prefix, zero-padded to `length` digits. The id read and the insert run inside a transaction so concurrent requests cannot claim the same id.

> Transactions require MongoDB to run as a replica set. Standalone deployments are not supported by this request.

#### Properties
- `doc: object`: __Required__ - The document to be inserted. The `_id` is assigned by the request.
- `prefix: string`: __Required__ - Prefix to add to the id, for example `INV`.
- `length: number`: The numeric part of the id is zero-padded to this number of digits. If omitted, the number is not padded.
- `options: object`: Optional settings passed to the insert. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertone) for more information.

#### Examples

###### Insert an invoice with a sequential id (INV0001, INV0002, ...):
```yaml
requests:
  - id: insert_invoice
    type: MongoDBInsertConsecutiveId
    connectionId: my_mongodb_collection_id
    properties:
      prefix: INV
      length: 4
      doc:
        amount:
          _state: amount
```

### MongoDBInsertMany

The `MongoDBInsertMany` request inserts an array of documents into the collection specified in the connectionId. If a `_id` field is not specified on a document, a MongoDB `ObjectID` will be generated.

#### Properties
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

#### Examples

###### Insert a set of documents:
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

### MongoDBInsertManyConsecutiveIds

The `MongoDBInsertManyConsecutiveIds` request inserts an array of documents into the collection specified in the connectionId, assigning each document a sequential, human-readable `_id` like `INV0001`. Ids continue from the highest existing id for the prefix. The id read and the insert run inside a transaction so concurrent requests cannot claim the same ids.

> Transactions require MongoDB to run as a replica set. Standalone deployments are not supported by this request.

#### Properties
- `docs: object[]`: __Required__ - The documents to be inserted. The `_id` values are assigned by the request.
- `prefix: string`: __Required__ - Prefix to add to the ids, for example `INV`.
- `length: number`: The numeric part of each id is zero-padded to this number of digits. If omitted, the numbers are not padded.
- `options: object`: Optional settings passed to the insert. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertmany) for more information.

#### Examples

###### Insert order lines with sequential ids:
```yaml
requests:
  - id: insert_order_lines
    type: MongoDBInsertManyConsecutiveIds
    connectionId: my_mongodb_collection_id
    properties:
      prefix: LINE
      length: 6
      docs:
        _state: order_lines
```

### MongoDBInsertOne

The `MongoDBInsertOne` request inserts a document into the collection specified in the connectionId. If a `_id` field is not specified, a MongoDB `ObjectID` will be generated.

#### Properties
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

#### Examples

###### Insert a document:
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

### MongoDBTableChanges

The `MongoDBTableChanges` request saves the value of a `TableInput` block. The value of a `TableInput` is not its rows but a changeset: only what changed since `data`. The request validates the changeset against an allowlist of `fields` and compiles it to one `bulkWrite` on the server. The browser never sends MongoDB syntax: keys that are not in `fields`, keys that start with `$` (operators such as `$where`, positional paths such as `items.$[x]`), values of the wrong type, and operator objects such as `{ $ne: null }` as values or row keys are refused before anything is written.

The changeset is the `TableInput` value:

```yaml
updated:                # changed fields of existing rows: { [rowKey]: { [field]: value } }
  flour:
    qty: 450            # the key is the column field, a dot path
    details.note: strong
added:                  # new rows: [{ rowKey, ...fields }]
  - rowKey: 3f2c9a61-…  # a temporary key the browser generated
    ingredient: Yeast
    qty: 7
removed:                # existing rows to delete: [rowKey]
  - salt
moved:                  # with rowDrag.positionField: { [rowKey]: position }
  water: 1536
order: [salt, flour]    # with rowDrag and no positionField: every row key in the new order
```

The `fields` keys are the column `field` dot paths, because those are the keys of the changeset, and only those fields can be written (at their `path`). This differs from `MongoDBTableQuery`, whose `fields` are keyed by the column `key`: a `TableInput` column `{ key: owner, field: owner.name }` is `owner.name` here and `owner` (with `path: owner.name`) in `MongoDBTableQuery`. A changeset key that is the `path` of a field keyed otherwise is refused with an error that names the mismatch. Values are coerced to the field type like `MongoDBTableQuery` values: numbers from numeric strings, dates from date strings and timestamps, and `null` clears a value of any type. `avatar`, `image` and `json` fields accept documents, but not with keys that start with `$`.

Every operation is scoped by the base `filter`, for example the organization or owner of the rows. The row key is combined with the filter using `$and`, so it can only narrow it. `filter` is required, unless the connection is tenant-scoped: then the tenant is merged into every operation and stamped on new rows, as for `MongoDBBulkWrite`. Set `filter: {}` to allow writes to every document in the collection.

##### Scope fields

The `filter` and `insertDefaults` fields are the scope of the rows, such as their organization or owner, and the table can never write them:

- A field (or the `positionField`) whose path is a `filter` field, or inside or over one, is refused (with a `filter` on `owner.id`, the fields `owner.id`, `owner` and `owner.id.name` are all refused). Otherwise an update could move a row out of scope. This includes fields named inside `$and`, `$or` and `$nor`.
- A field whose path is set by `insertDefaults`, or inside or over one of its values, is refused, so a new row can not replace a default. A default `{ address: { country: FR } }` still leaves `address.city` writable. For a starting value the user may change, give the `TableInput` column a default instead.
- New rows are stamped with the equality conditions of the `filter`: `{ org_id: X }`, `{ org_id: { $eq: X } }` and the equalities inside `$and`. A row added with a `filter` of `{ org_id: { _user: organization.id } }` belongs to that organization without an `insertDefaults` entry. `insertDefaults` may repeat such a value, but a different value is refused.
- Any other `filter` condition (`$ne`, `$in`, a regex, the clauses of `$or`) can not be stamped. A save that adds rows then needs that field set by `insertDefaults`. A `filter` with an operator such as `$expr` or `$where` refuses added rows. Saves that only update, move or remove rows are not affected.

In array mode the `filter` scopes the document: every operation, the `$push` of new items included, matches only the document with `array.documentId` inside the `filter`. Item fields are compared with the `filter` at their path in the document (`items.<field>`), and new items are not stamped, since they are not documents of the collection.

##### Collection mode

By default every row is a document, matched by `rowKeyField` (default `_id`). The changeset compiles to:

```yaml
- deleteOne: { filter: { $and: [<filter>, { _id: <key> }] } }             # one per removed row
- updateOne:                                                                # one per updated or moved row
    filter: { $and: [<filter>, { _id: <key> }] }
    update: { $set: { qty: 450, details.note: strong, position: 1536 } }   # its fields and position in one $set
- insertOne: { document: { <insertDefaults>, <row fields>, _id: <new ObjectId> } }   # one per added row
```

An update sets only the changed dot paths, so the rest of the document is kept. A move writes one position field on one row. An `order` needs a `positionField` in collection mode: it writes positions 1024, 2048, … to every row in the order.

##### Array mode

With `array: { documentId, path }`, the rows are the items of an embedded array in one document, such as the ingredients of a recipe. Every operation matches that document inside the base filter, and field paths and `positionField` are paths in the item. MongoDB can not `$set` into, `$pull` from and `$push` to the same array in one update, so the changeset compiles to up to four updates of that document, run in order:

```yaml
- $set: { items.$[r0].qty: 450, items.$[r1].position: 1536 }   # arrayFilters: [{ r0._id: flour }, { r1._id: water }]
- $pull: { items: { _id: { $in: [salt] } } }
- $push: { items: { $each: [<new items>] } }
- <a pipeline update that puts the items in the order of "order">  # only for an order without a positionField
```

New items get a generated ObjectId `_id` when `itemKeyField` is `_id`. Without a `positionField`, the array order is the row order, and an `order` is applied by a pipeline update that reorders the items on the server, as the array is when the update runs. Items are moved, never rewritten, so an edit someone else saved to an item in the meantime is kept; items the order does not name (added since the table loaded) follow in their current order, and keys of items that are gone are skipped. Setting the whole array from the browser's copy instead would overwrite such edits.

When the document is not found inside the filter, nothing is written and the request throws.

##### Response

```yaml
matchedCount: 2       # collection mode: rows matched by updates and moves
modifiedCount: 2
insertedCount: 1
deletedCount: 1
insertedKeys:         # the key each added row got, by its temporary rowKey
  3f2c9a61-…: { _oid: 66f9… }
unmatchedKeys: []     # updated, moved or removed rows that matched nothing
```

In array mode `matchedCount` and `modifiedCount` count the document (0 or 1), `insertedCount` is the items pushed and `deletedCount` the removed items that were in the array.

`unmatchedKeys` lists the existing rows the changeset named that matched nothing: outside the `filter` (another organization's row), deleted by someone else, or never there. Treat a non-empty `unmatchedKeys` as a failed save, for example with a `Throw` action after the request, since nothing was written for those rows. Numeric keys are listed as numbers and ObjectId keys as `{ _oid }`. The rows are found with a read of their keys, scoped like the writes: removed rows are read before the write (a removed row that someone else deletes between that read and the write counts as matched, since it is gone as asked), and updated rows after it, only when fewer rows matched than were updated. A save that only updates rows that all match is one round trip.

The operations are one `bulkWrite`, not a transaction: with `ordered: true` the first failing operation stops the rest, and the ones before it stay written.

##### Row keys

The `TableInput` keys rows by `rowKey` (default `_id`, then `id`). An ObjectId key comes back from the browser as the text `{"_oid":"…"}`, which the default `rowKeyType: auto` reads as an ObjectId. Object keys are always strings, so a numeric key `5` arrives as `"5"` in `updated` and `moved`, and as `5` in `removed` and `order`. With `rowKeyType: auto` both are the same row, and it matches a document key `5` or `"5"` (`{ $in: [5, "5"] }`). A string is read as a number only when it is exactly how that number prints (`"5"`, `"-2"`, `"1.5"`; not `"05"` or `"1e3"`). If a collection holds both `5` and `"5"` as different rows, set `rowKeyType: number` or `rowKeyType: string` to match one form only. `rowKeyType: objectId` also reads 24 character hex strings as ObjectIds.

##### Bulk selection

Set `selection` instead of `changes` to write the same values to many rows, such as a bulk "Assign owner" action on the rows selected in a `Table`. `selection` is the table's `selected` value:

- an array of row keys, which compiles to `{ <rowKeyField>: { $in: [keys] } }`;
- `{ all: true, except, filter, search }` when the header checkbox selects every row the view matches: the keys in `except` were deselected since, and `filter` and `search` are the view's. It compiles to the view's filter and search, validated and compiled like `MongoDBTableQuery` against `queryFields` (the table's `MongoDBTableQuery` `fields`, with the same limits and refusals), and `{ <rowKeyField>: { $nin: [except] } }`.

`set` is `{ [field]: value }` and `unset` a list of fields, both `fields` keys, checked and coerced like `updated` values, and never a scope field. The save is one `updateMany`:

```yaml
- updateMany:
    filter: { $and: [<filter>, <view filter>, <view search>, { _id: { $nin: [<except>] } }] }
    update: { $set: { owner.name: Ada }, $unset: { due: '' } }
```

The base `filter` (and the tenant, on a tenant connection) is one clause of the `$and`, so a crafted view can only narrow it. Row keys are read as in Row keys, and a `selection` has at most `maxChanges` keys. The response is `{ matchedCount, modifiedCount }`. `selection` can not be used in array mode.

#### Properties
- `changes: object`: The `TableInput` value, `{ _payload: changes }`: `{ updated, added, removed, moved, order }`. Required unless `selection` is set.
- `selection: object | any[]`: Bulk mode: the rows to write `set` and `unset` to, the `Table` `selected` value, `{ _payload: selected }`. See Bulk selection.
- `set: object`: Bulk mode: `{ [field]: value }` to set on every selected row.
- `unset: string[]`: Bulk mode: fields to remove from every selected row.
- `queryFields: object`: Bulk mode: the `MongoDBTableQuery` `fields` of the table, keyed by column key. Needed when a `selection` has a `filter` or `search`.
- `user: object`: Bulk mode: the user that `{ $user: path }` values in a `selection` filter resolve from. Set it to `{ _user: true }`.
- `timezone: string`: Default: `UTC` - Bulk mode: the IANA time zone whose days the date filters of a `selection` compare, as for `MongoDBTableQuery`.
- `fields: object`: __Required__ - The allowlist, keyed by the `TableInput` column `field` (its dot path, the changeset key), not the column `key` that `MongoDBTableQuery` fields use. Each field is an object:
  - `type: enum`: __Required__ - The column type, as for `MongoDBTableQuery`. Values are checked and coerced to it.
  - `path: string`: Default: the field key - Dot path the value is written to, in the document or, in array mode, in the item.
- `filter: object`: The base filter that scopes every operation, for example `{ org_id: { _user: organization.id } }`. New rows are stamped with its equality conditions, and `fields` can not write its fields. Required unless the connection is tenant-scoped. Set it to `{}` to allow writes to every document. See Scope fields.
- `rowKeyField: string`: Default: `_id` - The document field a row key matches, in collection mode. With any other field, added rows need their key from a column or `insertDefaults`.
- `rowKeyType: enum`: Default: `auto` - How row keys are read and matched: `auto`, `objectId`, `string` or `number`. See Row keys.
- `array: object`: Array mode: the rows are the items of an embedded array in one document.
  - `documentId: any`: __Required__ - The `_id` of the document. Use `{ _oid: <hex string> }` for an ObjectId from a string.
  - `path: string`: __Required__ - Dot path of the array in the document.
  - `itemKeyField: string`: Default: `_id` - The item field a row key matches.
- `positionField: string`: Dot path of the numeric position field, the `TableInput` `rowDrag.positionField`. Needed to save `moved`, and to save `order` in collection mode.
- `insertDefaults: object`: Values every added row gets, for example `{ created_by: { _user: id } }` or a created date. `fields` can not write them. Keys may be dot paths. See Scope fields.
- `ordered: boolean`: Default: `true` - Run the operations in order and stop at the first error. `false` (collection mode only) runs every operation and reports every error.
- `maxChanges: integer`: Default: `1000` - The most row changes one request may apply (updated, added, removed and moved rows, plus order entries). A larger changeset throws.
- `options: object`: Optional `bulkWrite` settings, for example `writeConcern`, `bypassDocumentValidation` or `comment`. See `MongoDBBulkWrite`.

#### Examples

###### Save the ingredients of a recipe (array mode):
The ingredients are an array in the recipe document, ordered by a `position` field. Dragging a row gives it a position between its neighbours, so a move saves one field on one item.
```yaml
id: recipe
type: Box
requests:
  - id: get_recipe
    type: MongoDBAggregation
    connectionId: recipes
    payload:
      recipe_id:
        _url_query: id
    properties:
      pipeline:
        - $match:
            _id:
              _payload: recipe_id
            org_id:
              _user: organization.id
        - $project:
            title: 1
            items:
              $sortArray:
                input: $items
                sortBy:
                  position: 1
  - id: save_items
    type: MongoDBTableChanges
    connectionId: recipes
    payload:
      recipe_id:
        _url_query: id
      changes:
        _state: items
    properties:
      array:
        documentId:
          _payload: recipe_id
        path: items
      filter:
        org_id:
          _user: organization.id
      positionField: position
      fields:
        ingredient:
          type: text
        qty:
          type: number
        unit:
          type: text
      changes:
        _payload: changes
events:
  onMount:
    - id: fetch
      type: Request
      params: get_recipe
blocks:
  - id: items
    type: TableInput
    properties:
      data:
        _request: get_recipe.0.items
      addRow: true
      rowDrag:
        positionField: position
      rowActions:
        delete: true
      columns:
        - key: ingredient
          editable: true
        - key: qty
          type: number
          editable: true
        - key: unit
          editable: true
  - id: save
    type: Button
    properties:
      title: Save
    events:
      onClick:
        - id: save_items
          type: Request
          params: save_items
        - id: check_saved
          type: Throw
          params:
            throw:
              _gt:
                - _array.length:
                    _if_none:
                      - _request: save_items.unmatchedKeys
                      - []
                - 0
            message: Some items were changed or removed by someone else. Reload and try again.
        - id: refetch
          type: Request
          params: get_recipe
        - id: reset
          type: CallMethod
          params:
            blockId: items
            method: resetChanges
```

###### Save edits to a list of deals (collection mode):
Every row is a document. New deals get the organization from the `filter` and the creator from `insertDefaults`. The table can not set either, and a `fields` entry for `org_id` or `created_by` would be refused.
```yaml
requests:
  - id: save_deals
    type: MongoDBTableChanges
    connectionId: deals
    payload:
      changes:
        _state: deals_table
    properties:
      filter:
        org_id:
          _user: organization.id
      fields:
        # Keyed by the TableInput column field, the changeset keys.
        name:
          type: text
        stage:
          type: tag
        amount:
          type: currency
        owner.name:
          type: text
        close_date:
          type: date
      insertDefaults:
        org_id:
          _user: organization.id
        created_by:
          _user: id
        created:
          _date: now
      changes:
        _payload: changes
```

###### Assign an owner to the selected deals (bulk selection):
The `deals_table` `Table` in server mode shows the deals of `deals_page` (the `MongoDBTableQuery` example below). A button in its `bulkActions` sends the table's `selected` value, a list of keys or every row matching the view, and the request sets the owner on those rows inside the organization.
```yaml
requests:
  - id: assign_owner
    type: MongoDBTableChanges
    connectionId: deals
    payload:
      selected:
        _state: deals_table.selected
      owner:
        _state: new_owner
    properties:
      filter:
        org_id:
          _user: organization.id
      fields:
        owner.name:
          type: text
      # The table's MongoDBTableQuery fields, keyed by column key.
      queryFields:
        name:
          type: text
          search: true
        stage:
          type: tag
        owner:
          type: text
          path: owner.name
          search: true
        amount:
          type: currency
      user:
        _user: true
      selection:
        _payload: selected
      set:
        owner.name:
          _payload: owner
```

### MongoDBTableQuery

The `MongoDBTableQuery` request serves a `Table` block in server mode. The table sends its view (sort, filter, search, grouping and aggregates) and the rows it needs, and the request compiles them to one aggregation on the server, against an allowlist of `fields`. The browser never sends MongoDB syntax: view keys that are not in `fields`, operators the field type does not allow and values of the wrong type are refused, regex input is escaped, and no `$where`, `$expr` or raw stages are accepted from the view.

The base `pipeline` always runs first, so use it for tenant or permission scoping. The view can only narrow what the base pipeline returns. On a tenant connection the tenant scope is added before the base pipeline, as for `MongoDBAggregation`.

Rows return only `_id`, the `fields` paths and the `returnFields` paths (`project: true`, the default), so a field the table does not list never reaches the browser, even when the documents hold it. Add the paths that cells read without a field of their own to `returnFields`, such as an avatar `srcField`, a link `labelField` or a `rowKey` other than `_id`. Set `project: false` to return the documents as the base pipeline leaves them, for example when it ends with its own `$project`.

The request compiles to:

```yaml
- <base pipeline stages>
- $match: <view filter>
- $match: <view search>
- $match: <groupPath>
- $sort: <view sort, then _id>        # when rows are returned
- $facet:
    rows: [$skip, $limit, $project]   # or groups: [$group, $sort, $skip, $limit]
    total: [$count]
    aggregates: [$group]              # when the view has aggregates
    distinct_a0: [$group, $count]     # one per countDistinct
```

Rows are sorted by the view sort with `_id` as a tiebreak, so blocks of rows never repeat or skip a row. The sort runs before `$facet`, so an index on the base pipeline match, filter and sort fields (for example `{ org_id: 1, amount: -1, _id: 1 }` for a table of one organization sorted by amount) serves it, and each block reads the rows in index order. Without such an index, MongoDB sorts every matching document for each block, so add indexes for the sorts a large table offers.

##### Response

```yaml
rows: [...]           # the rows from startRow to endRow, [] when groups are returned
total: 12408          # rows matching the view, or the number of groups at this level
groups:               # only when view.group has more levels than groupPath
  - key: won          # the group value (null for missing values)
    count: 210
    aggregates: { amount: 125000 }
aggregates:           # only when view.aggregates is set, over the rows this request matches
  amount: 3400000
```

When `view.group` is set and `groupPath` is shorter than it, the request returns the groups of the next level, inside the groups in `groupPath`. When `groupPath` has a value for every level, it returns the leaf rows of that group.

##### Filters

The view `filter` is a condition: `{ and: [...] }`, `{ or: [...] }` or `{ key, op, value }`. The operators each field type allows:

| Field types | Operators |
| --- | --- |
| all | `eq`, `ne`, `in`, `nin`, `empty`, `notEmpty` |
| `text`, `email`, `phone`, `url`, `link`, `html`, `relation`, `tag`, `status`, `avatar` | `contains`, `notContains`, `startsWith`, `endsWith` |
| `number`, `currency`, `percent`, `progress`, `rating` | `gt`, `gte`, `lt`, `lte`, `between` (`value: [from, to]`) |
| `date`, `datetime` | `before`, `after`, `between`, `within` (`value: { last or next: n, unit: day, week, month or year }`) |
| `boolean` | `isTrue`, `isFalse` |
| `tags`, `people` | `contains` (has the value), `notContains` (does not have the value); `in` is has any of, `nin` is has none of |
| `image`, `json` | the operators for all types only |

These are the operators the `Table` filter menus offer for each column type, so any filter a user builds is accepted. An `avatar` field filters on the text at its `path` (the name the cell shows), like a `text` field.

- Text comparisons are case-insensitive.
- `empty` matches null, missing, `''` and `[]`.
- `eq` and `ne` on dates compare whole days, and so do `before`, `after` and `between` on `date` fields. `within` covers whole days, from the start of the day `n` units ago to the end of today (or from the start of today to the end of the day `n` units ahead), as the table filters in the browser.
- Days are the days of `timezone`, UTC by default. The browser filters by the user's local days, so pass the user's time zone for day-based filters, for example `timezone: { _payload: timezone }` with `timezone: { _js: 'return Intl.DateTimeFormat().resolvedOptions().timeZone;' }` in the request `payload`. A date-only value such as `2026-03-01` (what `date` column filters send) is that day in the time zone. An instant is compared by the day it falls on there.
- `isFalse` matches every value that is not `true`.
- Numeric values may be numbers or numeric strings, and date values dates, date strings or timestamps.

A value can be `{ $user: path }`, for example `{ key: owner, op: eq, value: { $user: id } }`. It is resolved on the server from the request's `user` property, which should be set to `{ _user: true }` (evaluated on the server from the session), never from a value the browser sends. The request throws when the user value is not set, rather than matching rows where the field is empty.

##### Aggregates

`view.aggregates` maps field keys to a function. All field types allow `count`, `countDistinct`, `countEmpty`, `countNotEmpty` and `percentEmpty` (a fraction from 0 to 1). Numeric types also allow `sum`, `avg`, `min` and `max`, text types (`text`, `email`, `phone`, `url`, `link`, `html`, `relation`, `tag`, `status`, `avatar`) `min` and `max`, and date types `earliest` and `latest`. `min` and `max` of text leave out empty values and compare strings as MongoDB does: by code point, so `Z` comes before `a`, unless `options.collation` sets a locale.

`countDistinct` groups by the field's values, so it needs `groupable: true` on the field, like grouping by it. Over the whole result it counts the groups in their own `$facet` branch, so a field with many distinct values never builds them all into one document; in a group level it collects the values of each group.

##### Limits

The view comes from the browser, so the work one request can ask of MongoDB is bounded:

- A filter has at most 200 conditions and groups (empty groups count), nested at most 8 levels deep.
- A filter has at most 1000 values in all, and `in` and `nin` at most 500 each.
- A string value (a `contains` text, an `eq` value, a list item) has at most 200 characters, like the search.
- A sort has at most 10 keys, and a view at most 5 group levels.
- One request returns at most `maxRows` rows or groups (default 1000).
- The aggregation stops after `options.maxTimeMS`, 10000 (10 seconds) by default. Set a larger value in `options` for a slow collection, or add indexes for the filters and sorts the table uses.

A request over a limit throws before the query runs.

#### Properties
- `fields: object`: __Required__ - The allowlist, keyed by the Table column `key` (the view's keys), not the column `field` that `MongoDBTableChanges` fields use; `path` gives the field path. Each field is an object:
  - `type: enum`: __Required__ - The column type: `text`, `email`, `phone`, `url`, `link`, `html`, `relation`, `tag`, `status`, `number`, `currency`, `percent`, `progress`, `rating`, `date`, `datetime`, `boolean`, `tags`, `people`, `avatar`, `image` or `json`. It decides the operators and aggregates the field allows.
  - `path: string`: Default: the field key - Dot path of the value in the documents the base pipeline returns.
  - `search: boolean`: Default: `false` - Include the field in the view search. Each search word must match at least one search field.
  - `sortable: boolean`: Default: `true` - Allow sorting by the field.
  - `filterable: boolean`: Default: `true` - Allow filtering by the field.
  - `groupable: boolean`: Default: `false` - Allow grouping by the field, and `countDistinct` on it. `tags` and `people` fields can not be grouped.
- `pipeline: object[]`: Default: `[]` - Base aggregation stages that always run first, for example tenant scoping and a `$project`. `$out` and `$merge` are not allowed.
- `view: object`: The Table view, `{ _payload: view }`. Only `sort`, `filter`, `search`, `group` and `aggregates` are read.
- `startRow: integer`: Default: `0` - Index of the first row to return, `{ _payload: startRow }`.
- `endRow: integer`: Default: `startRow + maxRows` - Index after the last row to return, `{ _payload: endRow }`.
- `groupPath: any[]`: Default: `[]` - The group values of the expanded group, one per group level, `{ _payload: groupPath }`.
- `maxRows: integer`: Default: `1000` - The most rows or groups one request may return. A request for more throws.
- `user: object`: The user that `{ $user: path }` filter values resolve from. Set it to `{ _user: true }`.
- `timezone: string`: Default: `UTC` - The IANA time zone, for example `Europe/London`, whose days date filters compare. See Filters.
- `project: boolean`: Default: `true` - Return only `_id`, the `fields` paths and `returnFields` in each row. Set it to `false` to return the documents as the base pipeline leaves them.
- `returnFields: string[]`: More dot paths each row returns, for values that cells read without a field of their own, for example an avatar `srcField` or a link `labelField`.
- `options: object`: Optional aggregate settings, for example `collation`, `maxTimeMS` (default `10000`), `allowDiskUse` or `hint`. See `MongoDBAggregation`.

#### Examples

###### A Table in server mode:
The Table sends `{ startRow, endRow, view, groupPath }` as the fetch event. The request `payload` reads it with `_event`, and the properties read the payload with `_payload`. Field keys match the Table column keys.
```yaml
id: deals
type: PageHeaderMenu
requests:
  - id: deals_page
    type: MongoDBTableQuery
    connectionId: deals
    payload:
      view:
        _event: view
      startRow:
        _event: startRow
      endRow:
        _event: endRow
      groupPath:
        _event: groupPath
    properties:
      pipeline:
        - $match:
            org_id:
              _user: organization.id
      # Rows return _id, the field paths and these paths only.
      returnFields:
        - owner.avatar
      fields:
        name:
          type: text
          search: true
        stage:
          type: tag
          groupable: true
        owner:
          type: text
          path: owner.name
          search: true
          groupable: true
        amount:
          type: currency
        created:
          type: date
      user:
        _user: true
      view:
        _payload: view
      startRow:
        _payload: startRow
      endRow:
        _payload: endRow
      groupPath:
        _payload: groupPath
blocks:
  - id: deals_table
    type: Table
    properties:
      data:
        mode: server
        request: deals_page
      columns:
        - key: name
        - key: stage
          type: tag
          groupable: true
        - key: owner
          field: owner.name
          type: avatar
          groupable: true
          cell:
            srcField: owner.avatar
        - key: amount
          type: currency
          aggregate: sum
        - key: created
          type: date
```

###### Only the current user's deals, with a filter the table can not remove:
```yaml
requests:
  - id: my_deals_page
    type: MongoDBTableQuery
    connectionId: deals
    payload:
      view:
        _event: view
      startRow:
        _event: startRow
      endRow:
        _event: endRow
    properties:
      pipeline:
        - $match:
            owner_id:
              _user: id
      fields:
        name:
          type: text
          search: true
        amount:
          type: currency
        closed:
          type: boolean
      view:
        _payload: view
      startRow:
        _payload: startRow
      endRow:
        _payload: endRow
      maxRows: 500
```

### MongoDBUpdateMany

The `MongoDBUpdateMany` request updates multiple documents that match a certain criteria in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select the documents to update.

#### Properties
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

#### Examples

###### Set a list of documents as resolved:
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

###### Mark all documents with score less than 6 as urgent:
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

### MongoDBUpdateOne

The `MongoDBUpdateOne` request updates a single document in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a document to update. It will update the first document that matches the filter. If the `upsert` option is set to true, it will insert a new document if no document is found to update.

If no document matches the filter, the request throws `No matching record to update.` — a silent no-op update usually indicates a bug. Set `disableNoMatchError: true` on the request to restore the pre-5.5.0 behavior of returning `matchedCount: 0`. Requests with the `upsert` option never throw this error. Running `lowdefy upgrade` adds `disableNoMatchError: true` to existing requests so upgraded apps keep their behavior.

> When the connection has a log collection, a findOneAndUpdate operation is performed instead of the standard updateOne operation so before and after document snapshots can be captured in the change log. The response shape is the same in both cases.

#### Properties
- `filter: object`: __Required__ - The filter used to select the document to update.
- `update: object | object[]`: __Required__ - The update operations to be applied to the document.
- `disableNoMatchError: boolean`: Default: `false` - Do not throw an error when no document matches the filter.
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

#### Examples

###### Update a document:
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

Like a comment:
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

### MongoDBVersionedUpdateOne

The `MongoDBVersionedUpdateOne` request updates a single document while preserving the previous version. The matched document is re-inserted under a new `_id`, and the update is applied to the new copy — so the collection keeps a full version history of the document.

If no document matches the filter, the request throws `No matching record to update.`. Set `disableNoMatchError: true` on the request to suppress the error. Requests with the `upsert` update option never throw this error.

> The version insert and the update are separate operations, not a transaction. If the update fails, the inserted version copy remains in the collection.

> When the connection has a log collection, a findOneAndUpdate operation is performed instead of the standard updateOne operation so before and after document snapshots can be captured in the change log. The response shape is the same in both cases.

#### Properties
- `filter: object`: __Required__ - The filter used to select the document to version and update.
- `update: object | object[]`: __Required__ - The update operations to be applied to the new copy of the document.
- `disableNoMatchError: boolean`: Default: `false` - Do not throw an error when no document matches the filter.
- `options: object`: Optional settings for each underlying operation:
  - `find: object`: Options for the find one operation. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findone).
  - `insert: object`: Options for the insert one operation that creates the version copy. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertone).
  - `update: object`: Options for the update operation. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#updateone).

#### Examples

###### Update a document, keeping the previous version:
```yaml
requests:
  - id: versioned_update
    type: MongoDBVersionedUpdateOne
    connectionId: my_mongodb_collection_id
    payload:
      doc_id:
        _state: doc_id
    properties:
      filter:
        doc_id:
          _payload: doc_id
        current: true
      update:
        $set:
          status:
            _state: status
```

## Websockets

Websocket types:
  - MongoDBChangeStream

### MongoDBChangeStream

The `MongoDBChangeStream` [websocket](/websockets-introduction) opens a MongoDB [change stream](https://www.mongodb.com/docs/manual/changeStreams/) on the collection specified in the connection, and pushes every change event to subscribed pages in real time. The source starts when the first page subscribes and stops when the last one leaves — any number of subscribers share one change stream.

Properties are evaluated per subscription, so `_user` and `_payload` operators in the `pipeline` produce user-specific streams.

> Change streams require MongoDB to run as a replica set — they are not available on standalone deployments. MongoDB Atlas clusters support them out of the box.

#### Properties

- `pipeline: object[]`: An array of [aggregation pipeline stages](https://www.mongodb.com/docs/manual/changeStreams/#modify-change-stream-output) applied to the change stream, e.g. `$match` on `operationType` or `fullDocument` fields.
- `fullDocument: string`: The change stream [fullDocument](https://www.mongodb.com/docs/manual/reference/method/db.collection.watch/) option. Defaults to `updateLookup`, which includes the current document on update events.

#### Examples

###### Refetch a table when the user's orders change:
```yaml
websockets:
  - id: order_updates
    type: MongoDBChangeStream
    connectionId: my_mongodb_collection_id
    properties:
      pipeline:
        - $match:
            operationType:
              $in:
                - insert
                - update
            fullDocument.owner_id:
              _user: id

pages:
  - id: orders
    type: PageHeaderMenu
    requests:
      - id: get_orders
        type: MongoDBFind
        connectionId: my_mongodb_collection_id
        properties:
          query:
            owner_id:
              _user: id
    subscriptions:
      - websocketId: order_updates
        events:
          onMessage:
            - id: refetch
              type: Request
              params: get_orders
    blocks:
      - id: orders_table
        type: AgGridAlpine
        properties:
          rowData:
            _request: get_orders
```

The change event payload is available on `_event: messages` in `onMessage` and via the [`_websocket`](/websocket-subscriptions) operator — each message is the MongoDB change event, including `operationType`, `documentKey` and `fullDocument`.

## Errors

When MongoDB rejects an operation, the request fails with a `ServiceError` that carries:

- `code` — the MongoDB error code, for example `11000` for a duplicate key.
- `message` — a plain sentence naming the collection and the request type, like `MongoDB: Duplicate key on collection "orders".`
- `hint` — a sentence saying what to do about it, for example to insert with `MongoDBUpdateOne` and `upsert: true`, to add an index covering the filter, or to grant the database user a role.

The driver's own message is never sent to the browser — it can quote values from the document that triggered the error. It is logged on the server instead, where the dev server terminal prints it under the located error line as `Caused by: MongoServerError: E11000 …`.

Network, DNS and TLS failures are also `ServiceError`s, classified by the connection layer rather than by an error code.
