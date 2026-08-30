---
name: lowdefy-aggregations
description: Use when a page or endpoint needs grouped, counted, joined or reshaped data from MongoDB — an aggregation pipeline behind a request, its payload filters, and the shape the page reads back.
---

# Aggregation requests

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Connections and Requests

`/lowdefy-docs/content/concepts/connections-and-requests`

In a Lowdefy app you can integrate with other services like API's or databases using `connections` and `requests`. Connections configure the settings to the external service, and often contain parameters like connection strings, urls and secrets like passwords or API keys. Requests are used to interact with the connection, such as inserting a data record, executing a query or calling an API end-point.

#### MongoDB

`/lowdefy-docs/content/connections/mongodb`

MongoDB is a NoSQL database that stores JSON-like documents. These documents are stored in collections, which are like database tables. The fields inside these document can differ from document to document, but generally they are all more or less the same. However documents with different schemas can be stored in the same collection.

#### _request

`/lowdefy-docs/content/operators/_request`

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. The leading segment of a `_request` path is the request id and is matched exactly, so the rule above applies to the part of the path after it. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _request

Provided by `@lowdefy/operators-js`.

Accepts string: Dot-notation path to request response data. First segment is the request ID, remaining segments access nested properties.

#### _payload

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in payload object.

**Form 2** — integer: Index to access in payload object.

**Form 3** — `true`: Return all payload data.

**Form 4** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all payload data. |

### Connections

Live schema: `lowdefy_get_schema` with kind `connections`.

#### MongoDBCollection

Provided by `@lowdefy/connection-mongodb`.

Requests: `MongoDBAggregation`, `MongoDBBulkWrite`, `MongoDBDeleteMany`, `MongoDBDeleteOne`, `MongoDBFind`, `MongoDBFindOne`, `MongoDBInsertConsecutiveId`, `MongoDBInsertMany`, `MongoDBInsertManyConsecutiveIds`, `MongoDBInsertOne`, `MongoDBUpdateMany`, `MongoDBUpdateOne`, `MongoDBVersionedUpdateOne`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `databaseUri` | string | yes |  | Connection uri string for the MongoDb deployment. |
| `databaseName` | string |  |  | Database name. |
| `collection` | string | yes |  | Collection name. |
| `changeLog` | object |  |  | Log all changes made by write requests to a log collection. |
| `read` | boolean |  | `true` | Allow reads from the collection. |
| `write` | boolean |  | `false` | Allow writes to the collection. |

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBAggregation

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: read.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `pipeline` | array | yes |  | Array containing all the aggregation framework commands for the execution. |
| `options` | object |  |  | Optional settings. |
<!-- generated:reference:end -->

## Recipe

Must cover: when to aggregate instead of find, driving `$match` from `payload`, `$lookup` for joins, `$facet` for rows-plus-count, projecting only what the page reads, and where an aggregation belongs (request vs. Api endpoint).
