# Elasticsearch

## Connections

Connection types:
  - Elasticsearch

### Elasticsearch

[`Elasticsearch`](https://www.elastic.co/elasticsearch/) is a distributed, RESTful search and analytics engine capable of addressing a growing number of use cases. As the heart of the Elastic Stack, it centrally stores your data for lightning fast search, fine‑tuned relevancy, and powerful analytics that scale with ease.

The Elasticsearch connection can be used to search for documents in your Elasticsearch cluster. Lowdefy integrates with Elasticsearch using the official [Node.js client from Elastic](https://www.elastic.co/docs/reference/elasticsearch/clients/javascript), version 9, and provides direct access to the full query DSL supported by Elasticsearch.

> The connection needs Elasticsearch 9.0 or newer. Elasticsearch 7 and 8 servers are not supported.

#### Properties
- `node: string|string[]|object|object[]`: The Elasticsearch node(s) to connect to. One of `node`, `nodes` or `cloud` is required.
- `nodes: string|string[]|object|object[]`: Same as `node`.
- `cloud: object`: Connect to Elastic Cloud instead of `node` or `nodes`.
  - `id: string`: __Required__ - The Cloud ID of your deployment.
- `index: string`: The default index to query. You can also provide a per-request index to override this setting.
- `auth: object`: The authentication data, either basic auth credentials (as `username` and `password`), an API key (as `apiKey`), or a bearer token (as `bearer`).
- `tls: object`: [TLS options](https://nodejs.org/api/tls.html#tlsconnectoptions-callback), like `ca` and `rejectUnauthorized`.
- `caFingerprint: string`: The SHA256 fingerprint of the CA certificate that signed the server certificate. Only works with `https` nodes.
- `maxRetries: number`: Max number of retries for each request. Default: `3`.
- `requestTimeout: number`: Max request timeout in milliseconds for each request. By default there is no timeout.
- `compression: boolean`: Compress request bodies with gzip, and ask for compressed responses. Default: `true` with `cloud`, otherwise `false`.
- `agent: object`: Options for the [undici](https://undici.nodejs.org/#/docs/api/Pool) connection pool, like `connections` and `keepAliveTimeout`.
- `disablePrototypePoisoningProtection: boolean|'proto'|'constructor'`: Prototype poisoning protection is off by default (`true`). Set `false` to turn it on.
- `read: boolean`: Allow reads from the Elasticsearch index. Default: `true`.
- `write: boolean`: Allow writes to the Elasticsearch index. Default: `false`.

The connection accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [configuration instructions](https://www.elastic.co/docs/reference/elasticsearch/clients/javascript/basic-config) provided by Elastic. Options that can not be written in YAML, like custom connection classes and functions, are not supported.

#### Examples

###### Authenticated connection with reads and writes:
```yaml
connections:
  - id: elasticsearch
    type: Elasticsearch
    properties:
      write: true
      node:
        _secret: ELASTICSEARCH_HOST
      auth:
        username:
          _secret: ELASTICSEARCH_USER
        password:
          _secret: ELASTICSEARCH_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_ELASTICSEARCH_HOST = https://localhost:9200
LOWDEFY_SECRET_ELASTICSEARCH_USER = es
LOWDEFY_SECRET_ELASTICSEARCH_PASSWORD = password
```

###### Unauthenticated connection with default index:
```yaml
connections:
  - id: elasticsearch
    type: Elasticsearch
    properties:
      write: true
      node:
        _secret: ELASTICSEARCH_HOST
      index:
        _secret: ELASTICSEARCH_INDEX
```
Environment variables:
```
LOWDEFY_SECRET_ELASTICSEARCH_HOST = http://localhost:9200
LOWDEFY_SECRET_ELASTICSEARCH_INDEX = articles
```

###### Elastic Cloud with an API key:
```yaml
connections:
  - id: elasticsearch
    type: Elasticsearch
    properties:
      cloud:
        id:
          _secret: ELASTIC_CLOUD_ID
      auth:
        apiKey:
          _secret: ELASTIC_API_KEY
```

###### Self-signed certificate:
```yaml
connections:
  - id: elasticsearch
    type: Elasticsearch
    properties:
      node: https://localhost:9200
      tls:
        ca:
          _secret: ELASTICSEARCH_CA_CERT
      auth:
        apiKey:
          _secret: ELASTICSEARCH_API_KEY
```

## Requests

Request types:
  - ElasticsearchDelete
  - ElasticsearchDeleteByQuery
  - ElasticsearchIndex
  - ElasticsearchSearch
  - ElasticsearchUpdate
  - ElasticsearchUpdateByQuery

Request properties are passed to the [Elasticsearch client](https://www.elastic.co/docs/reference/elasticsearch/clients/javascript/api-reference) as they are. Everything goes at the top level of `properties`: the client sends each property in the request body, the URL path or the query string, as the Elasticsearch API expects. There is no `body` property. Use the snake_case parameter names from the Elasticsearch API, like `ignore_unavailable`.

### ElasticsearchDelete

The `ElasticsearchDelete` request removes a JSON document from the specified index.

#### Properties
- `id: string|number`: __Required__ - Unique identifier for the document to be deleted.
- `index: string`: The index. Defaults to the connection `index`.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control).
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `routing: string` Custom value used to route operations to a specific shard.
- `timeout: string` Period to wait for active shards. Defaults to 1m (one minute).
- `version: integer` Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.
- `version_type` Specific version type: `external`, `external_gte`.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.

The request returns `id`, the id of the deleted document, and `response`, the response from Elasticsearch.

#### Examples

###### Delete a document:
```yaml
requests:
  - id: delete_document
    type: ElasticsearchDelete
    connectionId: elasticsearch
    payload:
      selected_id:
        _state: selected_id
    properties:
      id:
        _payload: selected_id
```

### ElasticsearchDeleteByQuery

The `ElasticsearchDeleteByQuery` request deletes documents that match the specified query.

#### Properties
- `query: object` The documents to delete, as a query in the [Query DSL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/querydsl).
- `index: string`: The index. Defaults to the connection `index`.
- `max_docs: number` Maximum number of documents to process. Defaults to all documents.
- `sort: string|object|array` The order to process documents in when `max_docs` is set, in the [sort syntax](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/sort-search-results), like `[{ timestamp: desc }]`.
- `conflicts: string` What to do if delete by query hits version conflicts: `abort` or `proceed`. Defaults to `abort`.
- `refresh: boolean` If `true`, Elasticsearch refreshes all shards involved in the delete by query after the request completes. Defaults to `false`.
- `requests_per_second: number` The throttle for this request in sub-requests per second. Defaults to -1 (no throttle).
- `q: string`: Query in the Lucene query string syntax.
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `wait_for_completion: boolean`: If `false`, Elasticsearch runs the operation as a task and the response holds the task id. Default: `true`.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-delete-by-query) provided by Elastic.

The request returns `response`, the response from Elasticsearch.

#### Examples

###### Delete all comments by a user:
```yaml
requests:
  - id: delete_multiple
    type: ElasticsearchDeleteByQuery
    connectionId: elasticsearch
    payload:
      selected_user:
        _state: selected_user
    properties:
      query:
        term:
          user.id:
            _payload: selected_user
```

### ElasticsearchIndex

The `ElasticsearchIndex` request adds a JSON document to the specified data stream or index and makes it searchable. If the target is an index and the document already exists, the request updates the document and increments its version.

#### Properties
- `document: object` __Required__ - The JSON source of the document to index.
- `id: string|number` Unique identifier for the document. If it is not set, Elasticsearch generates one.
- `index: string`: The index. Defaults to the connection `index`.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control).
- `op_type: 'create'|'index'` Set to `create` to only index the document if it does not already exist (_put if absent_). If a document with the specified `_id` already exists, the indexing operation will fail. Same as using the `<index>/_create` endpoint. Valid values: `index`, `create`. If document id is specified, it defaults to `index`. Otherwise, it defaults to `create`.
- `pipeline: string` ID of the pipeline to use to preprocess incoming documents.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `routing: string` Custom value used to route operations to a specific shard.
- `timeout: string` Period the request waits for automatic index creation, dynamic mapping updates and active shards. Defaults to `1m` (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.
- `version: integer` Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.
- `version_type` Specific version type: `external`, `external_gte`.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.
- `require_alias: boolean` If `true`, the destination must be an [index alias](https://www.elastic.co/docs/manage-data/data-store/aliases). Defaults to `false`.

The request returns `id`, the id of the indexed document, and `response`, the response from Elasticsearch.

#### Examples

###### Index a new document.
```yaml
requests:
  - id: insert_new_comment
    type: ElasticsearchIndex
    connectionId: elasticsearch
    payload:
      comment:
        _state: comment_input
    properties:
      document:
        comment:
          _payload: comment
        user_id:
          _user: id
        timestamp:
          _date: now
```

### ElasticsearchSearch

The `ElasticsearchSearch` request searches the Elasticsearch index.

#### Properties
- `query: object`: The query, in the [Query DSL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/querydsl).
- `aggs: object`: The [aggregations](https://www.elastic.co/docs/explore-analyze/query-filter/aggregations) to request from the server.
- `index: string|string[]`: A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices. Defaults to the connection `index`.
- `size: number`: Number of hits to return. Default: `10`.
- `from: number`: Starting offset.
- `sort: string|object|array`: How to sort the hits, in the [sort syntax](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/sort-search-results): a field name, or an array of field names and objects like `{ timestamp: desc }`. A single `field:direction` string also works.
- `_source: boolean|string|string[]|object`: True or false to return the `_source` field or not, or a list of fields to return.
- `_source_excludes: string|string[]`: A list of fields to exclude from the returned `_source` field.
- `_source_includes: string|string[]`: A list of fields to extract and return from the `_source` field.
- `track_total_hits: boolean|number`: Whether to count the matching documents accurately (`true`), not at all (`false`), or accurately up to a number. Defaults to `10000`.
- `post_filter: object`, `highlight: object`, `collapse: object`, `search_after: array`, `fields: array`, `knn: object`, `runtime_mappings: object`, `suggest: object`: See the [search API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-search).
- `q: string`: Query in the Lucene query string syntax.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `allow_partial_search_results: boolean`: Indicate if an error should be returned if there is a partial search failure or timeout.
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `scroll: string`: Specify how long a consistent view of the index should be maintained for scrolled search.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-search) provided by Elastic.

The request returns:
- `hits: object[]`: The matching documents. Each hit is the document's `_source`, with the other hit fields (`_id`, `_index`, `_score`, `sort`) in `_meta`.
- `total: object`: The number of matching documents, as `{ value, relation }`.
- `maxScore: number`: The highest score of the hits.
- `aggregations: object`: The aggregation results.
- `response: object`: The response from Elasticsearch.

#### Examples

###### Fetch the first 10 matching documents.
```yaml
requests:
  - id: fetch_docs
    type: ElasticsearchSearch
    connectionId: elasticsearch
    properties:
      size: 10
      query:
        match_all: {}
```

###### Find a document with ID 42.
```yaml
requests:
  - id: fetch_docs
    type: ElasticsearchSearch
    connectionId: elasticsearch
    properties:
      size: 1
      query:
        term:
          _id: 42
```

###### Fetch articles between yesterday and today, newest first, aggregate by author.
```yaml
requests:
  - id: fetch_docs
    type: ElasticsearchSearch
    connectionId: elasticsearch
    properties:
      size: 20
      sort:
        - timestamp: desc
      query:
        range:
          timestamp:
            gte: now-1d/d
            lt: now/d
      aggs:
        author_aggregation:
          terms:
            field: author
```

### ElasticsearchUpdate

The `ElasticsearchUpdate` request updates a document using a script or partial document.

#### Properties
- `id: string|number` __Required__ - Unique identifier for the document to be updated.
- `doc: object` A partial document to merge into the existing document. One of `doc` or `script` is required.
- `script: object` A [script](https://www.elastic.co/docs/explore-analyze/scripting) to update the document, with `source` or `id`, and optional `params` and `lang`.
- `upsert: object` The document to index if the document does not exist.
- `doc_as_upsert: boolean` If `true`, use the contents of `doc` as the upsert value. Defaults to `false`.
- `scripted_upsert: boolean` If `true`, run the script whether or not the document exists. Defaults to `false`.
- `index: string`: The index. Defaults to the connection `index`.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control).
- `require_alias: boolean` If `true`, the destination must be an [index alias](https://www.elastic.co/docs/manage-data/data-store/aliases). Defaults to `false`.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `retry_on_conflict: number` Specify how many times should the operation be retried when a conflict occurs. Default: `0`.
- `routing: string` Custom value used to route operations to a specific shard.
- `_source: boolean|string[]` Set to `true` to return the updated document in `response.get._source`, or a list of the fields to return. Default: `false`.
- `_source_excludes: string[]` Specify the source fields you want to exclude.
- `_source_includes: string[]` Specify the source fields you want to include.
- `timeout: string` Period the request waits for dynamic mapping updates and active shards. Defaults to `1m` (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.

The request returns `id`, the id of the updated document, and `response`, the response from Elasticsearch.

#### Examples

###### Update a document:
```yaml
requests:
  - id: update
    type: ElasticsearchUpdate
    connectionId: elasticsearch
    payload:
      id:
        _state: _id
      name:
        _state: name
    properties:
      id:
        _payload: id
      doc:
        name:
          _payload: name
```

###### Increase the like counter using a script:
```yaml
requests:
  - id: increase_like_counter
    type: ElasticsearchUpdate
    connectionId: elasticsearch
    payload:
      id:
        _state: _id
    properties:
      id:
        _payload: id
      script:
        source: ctx._source.likes++
```

### ElasticsearchUpdateByQuery

The `ElasticsearchUpdateByQuery` request updates documents that match the specified query. If no query is specified, performs an update on every document in the data stream or index without modifying the source, which is useful for picking up mapping changes.

#### Properties
- `query: object` The documents to update, as a query in the [Query DSL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/querydsl).
- `script: object` A [script](https://www.elastic.co/docs/explore-analyze/scripting) to run on each matching document.
- `index: string`: The index. Defaults to the connection `index`.
- `max_docs: number` Maximum number of documents to process. Defaults to all documents.
- `conflicts: string` What to do if update by query hits version conflicts: `abort` or `proceed`. Defaults to `abort`.
- `refresh: boolean` If `true`, Elasticsearch refreshes all shards involved in the update by query after the request completes. Defaults to `false`.
- `requests_per_second: number` The throttle for this request in sub-requests per second. Defaults to -1 (no throttle).
- `q: string`: Query in the Lucene query string syntax.
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `wait_for_completion: boolean`: If `false`, Elasticsearch runs the operation as a task and the response holds the task id. Default: `true`.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-update-by-query) provided by Elastic.

The request returns `response`, the response from Elasticsearch.

#### Examples

###### Update all red cars:
```yaml
requests:
  - id: update_red_cars
    type: ElasticsearchUpdateByQuery
    connectionId: elasticsearch
    properties:
      query:
        term:
          color:
            value: red
      script:
        source: ctx._source.out_of_stock = true
```
