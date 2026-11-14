---
'@lowdefy/connection-mongodb': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'@lowdefy/helpers': minor
---

feat(connection-mongodb): Read and write MongoDB Decimal128 values exactly

MongoDB requests now carry a Decimal128 as `{ _decimal: '19.99' }`, the way they carry an ObjectId as `{ _oid: '<hex>' }`. Write the marker anywhere in a request (a document, a filter, an update or a pipeline) and MongoDB stores or compares a real decimal, so `$sum`, `$inc` and `$add` are exact: `0.1` plus `0.2` is `0.3`. A decimal read from MongoDB reaches the request response, a routine's `_step` and the page as the same marker, and can be sent back unchanged.

The value is always a string and never passes through a JavaScript number. A number in the marker (`_decimal: 19.99` unquoted in YAML) fails the request instead of storing a rounded value. The connection's change log and the walled client that plugins use keep decimals too, and a journey data set fixture can seed one with `{ _decimal: '12.50' }`.

If your app already reads Decimal128 fields, they used to arrive as `{ $numberDecimal: '19.99' }`, a form that could not be written back. They now arrive as `{ _decimal: '19.99' }`: change any `$numberDecimal` you read in config to `_decimal`.
