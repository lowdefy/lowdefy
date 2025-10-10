<TITLE>
ElasticsearchIndex
</TITLE>

<DESCRIPTION>

The `ElasticsearchIndex` request adds a JSON document to the specified data stream or index and makes it searchable. If the target is an index and the document already exists, the request updates the document and increments its version.

### Properties

- `body: object` The Elasticsearch request body contains the JSON source for the document data.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `op_type: 'create'|'index'` Set to `create` to only index the document if it does not already exist (_put if absent_). If a document with the specified `_id` already exists, the indexing operation will fail. Same as using the `<index>/_create` endpoint. Valid values: `index`, `create`. If document id is specified, it defaults to `index`. Otherwise, it defaults to `create`.
- `pipeline: string` ID of the pipeline to use to preprocess incoming documents.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `routing: string` Custom value used to route operations to a specific shard.
- `timeout: string` Period the request waits for the following operations:
    - [Automatic index creation](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-creation)
    - [Dynamic mapping](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/dynamic-mapping.html) updates
    - [Waiting for active shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards)
  Defaults to `1m` (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.
- `version: integer` Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.
- `version_type` Specific version type: `external`, `external_gte`.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.
  See [Active Shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards).
- `require_alias: boolean` If `true`, the destination must be an [index alias](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/alias.html). Defaults to `false`.

</DESCRIPTION>

<CONNECTION>
Elasticsearch
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - ElasticsearchIndex',
  type: 'object',
  description:
    'Adds a JSON document to the specified data stream or index and makes it searchable. If the target is an index and the document already exists, the request updates the document and increments its version.',
  required: ['body'],
  properties: {
    id: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
      description: 'Unique identifier for the document.',
    },
    index: {
      type: 'string',
      description: 'The name of the index.',
    },
    if_seq_no: {
      type: 'integer',
      description:
        'Only perform the operation if the document has this sequence number. See Optimistic concurrency control.',
    },
    if_primary_term: {
      type: 'integer',
      description:
        'Only perform the operation if the document has this primary term. See Optimistic concurrency control.',
    },
    op_type: {
      type: 'string',
      description:
        'Set to create to only index the document if it does not already exist (put if absent). If a document with the specified _id already exists, the indexing operation will fail. Same as using the <index>/_create endpoint. Valid values: index, create. If document id is specified, it defaults to index. Otherwise, it defaults to create. If the request targets a data stream, an op_type of create is required. See Add documents to a data stream.',
      enum: ['index', 'create'],
      default: 'create',
    },
    pipeline: {
      type: 'string',
      description: 'ID of the pipeline to use to preprocess incoming documents.',
    },
    refresh: {
      type: 'string',
      description:
        'If true, Elasticsearch refreshes the affected shards to make this operation visible to search, if wait_for then wait for a refresh to make this operation visible to search, if false do nothing with refreshes. Valid values: true, false, wait_for. Default: false.',
      enum: ['true', 'false', 'wait_for'],
      default: false,
    },
    routing: {
      description: 'Custom value used to route operations to a specific shard.',
      type: 'string',
    },
    timeout: {
      type: 'string',
      description:
        'Period the request waits for the following operations:\n\nAutomatic index creation\nDynamic mapping updates\nWaiting for active shards\nDefaults to 1m (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.',
      default: '1m',
    },
    version: {
      description:
        'Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.',
      type: 'integer',
    },
    version_type: {
      type: 'string',
      description: 'Specific version type: external, external_gte.',
      enum: ['internal', 'external', 'external_gte'],
    },
    wait_for_active_shard: {
      type: 'string',
      description:
        'The number of shard copies that must be active before proceeding with the operation. Set to all or any positive integer up to the total number of shards in the index (number_of_replicas+1). Default: 1, the primary shard.',
      default: '1',
    },
    require_alias: {
      type: 'boolean',
      description: 'If true, the destination must be an index alias. Defaults to false.',
      default: false,
    },
    body: {
      type: 'object',
      description: 'Request body contains the JSON source for the document data.',
      additionalProperties: true,
    },
  },
  errorMessage: {
    type: 'ElasticsearchIndex request properties should be an object.',
    required: {
      body: 'ElasticsearchIndex request should have required property "body".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Index a new document

```yaml
requests:
  - id: insert_new_comment
    type:  Elasticsearch
    connectionId: elasticsearch
    payload:
      comment:
        _state: comment_input
    properties:
      body:
        comment:
          _payload: comment
        user_id:
          _user: id
        timestamp:
          _date: now
```

</EXAMPLES>
