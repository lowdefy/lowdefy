---
'@lowdefy/operators-mql': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/connection-google-sheets': patch
'@lowdefy/cli': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'lowdefy': patch
---

Refresh dependencies and require Node.js 22 or newer.

Updated a range of libraries across the project to current versions (including the MongoDB driver, the
MQL/aggregation engine, and various build and CLI tooling) and set the minimum supported Node.js version
to 22, matching what is tested in CI. Most changes are internal with no effect on your app. One small
behaviour note: in `_mql` expressions, adding to a missing or null field now returns `null` (matching
MongoDB) instead of `NaN`.
