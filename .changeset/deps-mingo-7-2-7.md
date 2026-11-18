---
'@lowdefy/connection-google-sheets': patch
'@lowdefy/operators-mql': patch
---

fix(deps): Update mingo to 7.2.7

Updates `mingo`, which runs the `_mql_*` operators and Google Sheets queries, to 7.2.7. It blocks
reads and writes of `Object.prototype` members through query paths, fixes `$elemMatch`,
`$rename`, `$min`, `$bit` and `$graphLookup` edge cases, and makes a `$project` of a missing
nested field return an empty parent object, as MongoDB does.
