---
'@lowdefy/connection-mongodb': major
'@lowdefy/operators-js': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'@lowdefy/test-utils': minor
---

feat(connection-mongodb): Read and write MongoDB Decimal128 values exactly

The new `_decimal` operator writes a decimal in a MongoDB request: `_decimal: '19.99'`. MongoDB stores or compares a real Decimal128 anywhere in a request (a document, a filter, an update or a pipeline), so `$sum`, `$inc` and `$add` are exact: `0.1` plus `0.2` is `0.3`. A decimal read from MongoDB reaches the request response, a routine's `_step` and the page as the marker `{ '~dec': '19.99' }`, the way an ObjectId reaches them as `{ _oid: '<hex>' }`. The marker can be sent back unchanged, or passed through `_decimal`.

The value is always a string and never passes through a JavaScript number. A number given to `_decimal` (`_decimal: 19.99` unquoted in YAML) fails with an error that says to quote it, instead of returning a rounded value. The connection's change log and the walled client that plugins use keep decimals too, and a journey data set fixture can seed one with `{ '~dec': '12.50' }`. A journey's `expect: { db }` reads a stored decimal as `{ '~dec': '0.30' }` as well, and its `match` takes the fixture markers (`{ '~dec' }`, `{ _oid }` and `{ '~d' }`), so it can find a document by an exact decimal, an ObjectId or a date.

**Breaking:** if your app already reads Decimal128 fields, they used to arrive as `{ $numberDecimal: '19.99' }`, a form that could not be written back. They now arrive as `{ '~dec': '19.99' }`: change any `$numberDecimal` you read in config to `~dec`.
