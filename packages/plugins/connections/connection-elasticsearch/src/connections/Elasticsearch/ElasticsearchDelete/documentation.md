<TITLE>
ElasticsearchDelete
</TITLE>

<DESCRIPTION>

The `ElasticsearchDelete` request removes a JSON document from the specified index.

### Properties

- `id: string|number`: __Required__ - Unique identifier for the document to be deleted.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `routing: string` Custom value used to route operations to a specific shard.
- `timeout: string` Period to [wait for active shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards). Defaults to 1m (one minute).
- `version: integer` Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.
- `version_type` Specific version type: `external`, `external_gte`.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.
  See [Active Shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards).

</DESCRIPTION>

<CONNECTION>
Elasticsearch
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - ElasticsearchDelete',
  type: 'object',
  description: 'Removes a JSON document from the specified index.',
  required: ['id'],
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
        'Only perform the delete operation if the last operation that has changed the document has the specified sequence number.',
    },
    if_primary_term: {
      type: 'integer',
      description:
        'Only perform the delete operation if the last operation that has changed the document has the specified primary term.',
    },
    refresh: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'boolean',
        },
      ],
      description:
        'If true, Elasticsearch refreshes the affected shards to make this operation visible to search, if wait_for then wait for a refresh to make this operation visible to search, if false do nothing with refreshes. Valid values: true, false, wait_for. Default: false.',
      enum: ['true', 'false', true, false, 'wait_for'],
      default: false,
    },
    routing: {
      description: 'Custom value used to route operations to a specific shard.',
      type: 'string',
    },
    timeout: {
      type: 'string',
      description: 'Period to wait for active shards. Defaults to 1m (one minute).',
      default: '1m',
    },
    version: {
      description:
        'Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.',
      type: 'integer',
    },
    version_type: {
      type: 'string',
      description: 'Specific version type.',
      enum: ['internal', 'external', 'external_gte', 'force'],
    },
    wait_for_active_shards: {
      type: 'string',
      description:
        'The number of shard copies that must be active before proceeding with the operation. Set to all or any positive integer up to the total number of shards in the index (number_of_replicas+1). Default: 1, the primary shard.',
      default: '1',
    },
  },
  errorMessage: {
    type: 'ElasticsearchDelete request properties should be an object.',
    required: {
      id: 'ElasticsearchDelete request should have required property "id".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Delete a document

```yaml
requests:
  - id: delete_document
    type:  ElasticsearchDelete
    payload:
      selected_id:
        _state: selected_id
    properties:
      id:
        _payload: selected_id
```

</EXAMPLES>
