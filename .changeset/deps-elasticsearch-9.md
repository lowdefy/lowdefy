---
'@lowdefy/connection-elasticsearch': major
---

fix(deps)!: Update @elastic/elasticsearch to 9.5.1

The `Elasticsearch` connection now uses version 9 of the official Elasticsearch client, up from 7.17. Request properties now use the client's own shape: everything sits at the top level and there is no `body`.

**Elasticsearch 9.0 or newer is required.** The version 9 client only works with Elasticsearch 9 servers. Elasticsearch 7 and 8 servers reject every request with `media_type_header_exception`. Upgrade your cluster before you upgrade Lowdefy.

**Connection properties.** A request that uses a renamed or removed connection property fails with an error that names the replacement.

- `ssl` → `tls`. Inside a node object, too: `node.ssl` → `node.tls`.
- `cloud.username` and `cloud.password` → `auth.username` and `auth.password`. `cloud.id` on its own is now enough, without `node`.
- `suggestCompression` is removed. Use `compression: true`, which compresses requests and asks for compressed responses.
- `compression: gzip` → `compression: true`. `compression` only takes `true` or `false`.
- `agent` takes undici connection pool options (`connections`, `keepAliveTimeout`, `keepAliveMaxTimeout`, `keepAliveTimeoutThreshold`, `pipelining`, `maxHeaderSize`). The Node.js `http.Agent` options `keepAlive`, `keepAliveMsecs`, `maxSockets` and `maxFreeSockets` are removed. `maxSockets` is closest to `connections`. `agent: false` is removed. Leave `agent` out instead.
- `proxy` is removed. The client's HTTP connection can't send requests through a proxy.
- `requestTimeout` no longer defaults to 30 seconds. By default a request waits as long as Elasticsearch takes. Set `requestTimeout: 30000` to keep the old limit.
- `disablePrototypePoisoningProtection` now defaults to `true`, which turns the protection off. Set it to `false` to keep the old behaviour.
- New: `auth.bearer`, `caFingerprint`, `serverMode` (`serverless` for Elastic Cloud Serverless), `maxResponseSize` and `maxCompressedResponseSize`.

```yaml
# Before
properties:
  node: https://localhost:9200
  ssl:
    rejectUnauthorized: false
  cloud:
    id: my-deployment:abc123
    username: elastic
    password:
      _secret: ES_PASSWORD

# After
properties:
  tls:
    rejectUnauthorized: false
  cloud:
    id: my-deployment:abc123
  auth:
    username: elastic
    password:
      _secret: ES_PASSWORD
```

**Request properties.** All six request types reject `body` with an error. Move everything that was under `body` up to the top level of `properties`. The client sends each property where the Elasticsearch API expects it: in the request body, the URL path or the query string. Parameter names must be snake_case (`ignore_unavailable`, not `ignoreUnavailable`).

`ElasticsearchSearch`: `query`, `aggs` and the other search body fields move up:

```yaml
# Before
type: ElasticsearchSearch
properties:
  size: 10
  body:
    query:
      match:
        title: lowdefy
    aggs:
      by_author:
        terms:
          field: author

# After
type: ElasticsearchSearch
properties:
  size: 10
  query:
    match:
      title: lowdefy
  aggs:
    by_author:
      terms:
        field: author
```

`ElasticsearchSearch` `sort` now uses the Elasticsearch sort syntax. A list of `field:direction` strings fails with `search_phase_execution_exception`. A single `field:direction` string still works.

```yaml
# Before
sort:
  - rating:asc
  - created_at:desc

# After
sort:
  - rating: asc
  - created_at: desc
```

`ElasticsearchSearch` no longer accepts `type` (mapping types were removed in Elasticsearch 8), `_source_include` or `_source_exclude` (use `_source_includes` and `_source_excludes`), `source` or `min_compatible_shard_node`. `track_total_hits` now also takes a number, and `_source` an object with `includes` and `excludes`.

`ElasticsearchIndex`: the document moves from `body` to `document`, which is now required.

```yaml
# Before
type: ElasticsearchIndex
properties:
  id: 42
  body:
    title: Hello

# After
type: ElasticsearchIndex
properties:
  id: 42
  document:
    title: Hello
```

The `ElasticsearchIndex` schema listed `wait_for_active_shard`, which is not an Elasticsearch parameter. It is now `wait_for_active_shards`.

`ElasticsearchUpdate`: `doc` or `script` (one is required), plus `upsert`, `doc_as_upsert`, `scripted_upsert` and `detect_noop`, move up.

```yaml
# Before
type: ElasticsearchUpdate
properties:
  id: 42
  body:
    doc:
      title: Hello again

# After
type: ElasticsearchUpdate
properties:
  id: 42
  doc:
    title: Hello again
```

`ElasticsearchUpdateByQuery` and `ElasticsearchDeleteByQuery`: `query`, `script` (update by query only), `max_docs` and `slice` move up. `_source`, `_source_includes` and `_source_excludes` are removed, because Elasticsearch 9 does not accept them on these APIs. `ElasticsearchDeleteByQuery` `sort` uses the sort syntax above.

```yaml
# Before
type: ElasticsearchUpdateByQuery
properties:
  body:
    query:
      term:
        color: red
    script:
      source: ctx._source.out_of_stock = true

# After
type: ElasticsearchUpdateByQuery
properties:
  query:
    term:
      color: red
  script:
    source: ctx._source.out_of_stock = true
```

**Response data read with `_request`.** Every request returns the same keys as before: `response` and `id`, plus `hits`, `total`, `maxScore` and `aggregations` from `ElasticsearchSearch`. `response` is still the Elasticsearch response body. Elasticsearch 8 and later no longer send `_type`, so `_request: my_search.hits.0._meta._type` and `_request: my_index.response._type` are now `null`. A failed request's error message now includes the root cause Elasticsearch gave, like `index_not_found_exception` followed by `no such index [articles]`.
