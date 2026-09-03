---
name: lowdefy-data-schema
description: Use when designing the document shape for a collection — ids, embedded vs. referenced data, enums, stamps, versioning — before writing pages against it.
---

# Data schema

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### MongoDB

`/lowdefy-docs/content/connections/mongodb`

MongoDB is a NoSQL database that stores JSON-like documents. These documents are stored in collections, which are like database tables. The fields inside these document can differ from document to document, but generally they are all more or less the same. However documents with different schemas can be stored in the same collection.

#### _type

`/lowdefy-docs/content/operators/_type`

The `_type` operator performs a type test on an object, and returns true if the object is of the specified type.

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _type

Provided by `@lowdefy/operators-js`.

**Form 1** — `"string"`, `"array"`, `"date"`, `"object"`, `"boolean"`, `"number"`, `"integer"`, `"null"`, `"undefined"`, `"none"`, `"empty"`, `"primitive"`: Type name to test against state value at current location. The "empty" test is true for null, undefined, '' and [], and false for 0, false and {}.

**Form 2** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `"string"`, `"array"`, `"date"`, `"object"`, `"boolean"`, `"number"`, `"integer"`, `"null"`, `"undefined"`, `"none"`, `"empty"`, `"primitive"` | yes |  | Type name to test. |
| `on` | any |  |  | Value to test the type of. |
| `key` | string |  |  | State key to test the type of. |

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBInsertOne

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: write.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `doc` | object | yes |  | The document to be inserted. |
| `options` | object |  |  | Optional settings. |

#### MongoDBVersionedUpdateOne

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: write.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `filter` | object | yes |  | The filter used to select the document to find and insert. |
| `update` | object \\| array | yes |  | The update operations to be applied to the new inserted document. |
| `options` | object |  |  | Optional settings for each mongodb operation. |
| `disableNoMatchError` | boolean |  |  | Do not throw an error when no document matches the filter. By default the request throws "No matching record to update." when nothing matched and upsert is not set. |
<!-- generated:reference:end -->

## Recipe

Must cover: `_id` conventions, embedding vs. referencing, naming, required fields enforced in requests, `MongoDBVersionedUpdateOne` for history, and writing a `schema.yaml` beside the collection that pages and endpoints reference.
