<TITLE>
ElasticsearchDeleteByQuery
</TITLE>

<DESCRIPTION>

The `ElasticsearchDeleteByQuery` request deletes documents that match the specified query.

### Properties

- `body: object` The Elasticsearch query body, expressed in the [JSON Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html).
  - `query: object`: The Elasticsearch query.
- `_source: string|string[]|boolean`: True or false to return the `_source` field or not, or a list of fields to return.
- `_source_excludes: string|string[]`: A list of fields to exclude from the returned `_source` field.
- `_source_includes: string|string[]`: A list of fields to extract and return from the `_source` field.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `max_docs: number` Maximum number of documents to process. Defaults to all documents.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `requests_per_second: number` The throttle for this request in sub-requests per second. Defaults to -1 (no throttle).
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `from: number`: Starting offset.
- `size: number`: Number of hits to return.
- `index: string|string[]`: A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices.
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `scroll: string`: Specify how long a consistent view of the index should be maintained for scrolled search.
- `sort: string|string[]`: A comma-separated list of <field>:<direction> pairs.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-delete-by-query.html#docs-delete-by-query-api-query-params) provided by Elastic.

</DESCRIPTION>

<CONNECTION>
Elasticsearch
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - ElasticsearchDeleteByQuery',
  type: 'object',
  description: 'Deletes documents that match the specified query.',
  properties: {
    index: {
      type: 'string',
      description: 'The name of the index.',
    },
    allow_no_indices: {
      type: 'boolean',
      description:
        'If false, the request returns an error if any wildcard expression, index alias, or _all value targets only missing or closed indices. This behavior applies even if the request targets other open indices. For example, a request targeting foo*,bar* returns an error if an index starts with foo but no index starts with bar.',
      default: true,
    },
    analyzer: {
      description: 'The analyzer to use for the query string.',
      type: 'string',
    },
    analyze_wildcard: {
      description: 'Specify whether wildcard and prefix queries should be analyzed.',
      type: 'boolean',
      default: false,
    },
    conflicts: {
      type: 'string',
      enum: ['abort', 'proceed'],
      description:
        'What to do if delete by query hits version conflicts: abort or proceed. Defaults to abort.',
      default: 'abort',
    },
    default_operator: {
      description: 'The default operator for query string query (AND or OR).',
      enum: ['AND', 'OR'],
      type: 'string',
      default: 'OR',
    },
    df: {
      description:
        'The field to use as default where no field prefix is given in the query string.',
      type: 'string',
    },
    expand_wildcards: {
      description:
        'Whether to expand wildcard expression to concrete indices that are open, closed or both.',
      enum: ['all', 'closed', 'hidden', 'none', 'open'],
      type: 'string',
      default: 'open',
    },
    from: {
      description: 'Starting offset.',
      type: 'number',
      default: 0,
    },
    ignore_unavailable: {
      description:
        'Whether specified concrete indices should be ignored when unavailable (missing or closed)',
      type: 'boolean',
    },
    lenient: {
      description:
        'Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.',
      type: 'boolean',
    },
    max_docs: {
      type: 'integer',
      description: 'Maximum number of documents to process. Defaults to all documents.',
    },
    preference: {
      description: 'Specify the node or shard the operation should be performed on.',
      type: 'string',
      default: 'random',
    },
    pretty: {
      description: 'Pretty format the returned JSON response.',
      type: 'boolean',
    },
    q: {
      description: 'Query in the Lucene query string syntax.',
      type: 'string',
    },
    request_cache: {
      description:
        'Specify if request cache should be used for this request or not, defaults to index level setting.',
      type: 'boolean',
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
        'If true, Elasticsearch refreshes all shards involved in the delete by query after the request completes. Defaults to false.',
      enum: ['true', 'false', true, false, 'wait_for'],
      default: false,
    },
    requests_per_second: {
      type: 'integer',
      description:
        'The throttle for this request in sub-requests per second. Defaults to -1 (no throttle).',
      default: -1,
    },
    routing: {
      type: 'string',
      description: 'Custom value used to route operations to a specific shard.',
    },
    scroll: {
      type: 'string',
      description: 'Period to retain the search context for scrolling. See Scroll search results.',
    },
    scroll_size: {
      type: 'integer',
      description: 'Size of the scroll request that powers the operation. Defaults to 1000.',
      default: 1000,
    },
    search_type: {
      description: 'Search operation type.',
      enum: ['dfs_query_then_fetch', 'query_then_fetch'],
      type: 'string',
    },
    search_timeout: {
      type: 'string',
      description: 'Explicit timeout for each search request. Defaults to no timeout.',
    },
    slices: {
      type: 'integer',
      description:
        "The number of slices this task should be divided into. Defaults to 1 meaning the task isn't sliced into subtasks.",
    },
    sort: {
      description: 'A comma-separated list of <field>:<direction> pairs.',
      examples: ['name:asc', ['rating:asc', 'created_at:desc']],
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    _source: {
      anyOf: [
        {
          type: 'boolean',
        },
        {
          type: 'array',
        },
      ],
      items: {
        type: 'string',
      },
      description:
        'True or false to return the _source field or not, or a list of fields to return.',
    },
    _source_excludes: {
      type: 'array',
      items: {
        type: 'string',
      },
      description:
        'A comma-separated list of source fields to exclude from the response.\n\nYou can also use this parameter to exclude fields from the subset specified in _source_includes query parameter.\n\nIf the _source parameter is false, this parameter is ignored.',
    },
    _source_includes: {
      type: 'array',
      items: {
        type: 'string',
      },
      description:
        'A comma-separated list of source fields to include in the response.\n\nIf this parameter is specified, only these source fields are returned. You can exclude fields from this subset using the _source_excludes query parameter.\n\nIf the _source parameter is false, this parameter is ignored.',
    },
    stats: {
      description: 'Specific tag of the request for logging and statistical purposes',
      anyOf: [
        {
          items: {
            type: 'string',
          },
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
    terminate_after: {
      description:
        'The maximum number of documents to collect for each shard, upon reaching which the query execution will terminate early. Elasticsearch collects documents before sorting.\nUse with caution. Elasticsearch applies this parameter to each shard handling the request. When possible, let Elasticsearch perform early termination automatically. Avoid specifying this parameter for requests that target data streams with backing indices across multiple data tiers.',
      type: 'number',
    },
    timeout: {
      type: 'string',
      description:
        'Period each deletion request waits for active shards. Defaults to 1m (one minute).',
      default: '1m',
    },
    version: {
      description:
        'Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.',
      type: 'integer',
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
  },
};
```

</SCHEMA>

<EXAMPLES>

### Delete all comments by a user

```yaml
requests:
  - id: delete_multiple
    type:  ElasticsearchUpdate
    payload:
      selected_user:
        _state: selected_user
    properties:
      body:
        query:
          term:
            user.id:
              _payload: selected_user
```

</EXAMPLES>
