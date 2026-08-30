---
name: lowdefy-change-stamps
description: Use when records need created/updated audit fields — who changed what and when — written consistently from a page action or an Api routine.
---

# Change stamps

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### _date

`/lowdefy-docs/content/operators/_date`

The `_date` operator returns a date object representing a single moment in time. It can take a string in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format, or a number that is the number of milliseconds since 1 January 1970 UTC (the [UNIX epoch](https://en.wikipedia.org/wiki/Unix_time)).

#### _user

`/lowdefy-docs/content/operators/_user`

The `_user` operator gets a value from the [`user`](/user-object) object — the caller Lowdefy resolves for the signed-in user in their active organization. It has a [fixed shape](/user-object); see that page for the available fields.

#### _dayjs

`/lowdefy-docs/content/operators/_dayjs`

The `_dayjs` operator provides date manipulation and formatting using the [Day.js](https://day.js.org/) library.

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _date

Provided by `@lowdefy/operators-js`.

Accepts any: Date method params. Accepts a date string/number, or array/object with named args depending on method.

#### _user

Provided by `@lowdefy/operators-js`.

**Form 1** — string: Dot-notation path to value in user object, or a role name when used with a role method.

**Form 2** — integer: Index to access in user object.

**Form 3** — `true`: Return all user data.

**Form 4** — array: Array of role names when used with a role method.

**Form 5** — object

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string \\| integer |  |  |  |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all user data. |

### Requests

Live schema: `lowdefy_get_schema` with kind `requests`.

#### MongoDBInsertOne

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: write.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `doc` | object | yes |  | The document to be inserted. |
| `options` | object |  |  | Optional settings. |

#### MongoDBUpdateOne

Provided by `@lowdefy/connection-mongodb` on connection `MongoDBCollection`. Connection access checked: write.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `filter` | object | yes |  | The filter used to select the document to update. |
| `update` | object \\| array | yes |  | The update operations to be applied to the document. |
| `options` | object |  |  | Optional settings. |
| `disableNoMatchError` | boolean |  |  | Do not throw an error when no document matches the filter. By default the request throws "No matching record to update." when nothing matched and upsert is not set. |
<!-- generated:reference:end -->

## Recipe

Must cover: the `created`/`updated` `{ at, by }` shape, setting `created` only with `$setOnInsert`, stamping server-side in the request (never trusting client dates), which `_user` fields to store, and MongoDB `_date: now` versus the driver `Date`.
