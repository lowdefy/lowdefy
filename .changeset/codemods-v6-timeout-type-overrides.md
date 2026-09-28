---
'@lowdefy/codemods': minor
---

Two new v6.0.0 codemods for `lowdefy upgrade`

- **`request-timeout`:** v6 cuts requests off after 30 seconds by default, where v5 had no timeout. A cut-off request shows a generic error while the rest of the page renders from the requests that finished. The codemod adds `config.requestTimeout: 0` to keep the v5 behaviour, and reports how to choose a real limit.
- **`report-type-overrides`:** report-only. After a build, it lists custom plugin types that override a Lowdefy built-in type of the same name. A plugin holding a v5 copy of a built-in (for example an old `AwsS3Bucket` connection) keeps its v5 behaviour and can break v6 blocks without an error. Each override is reported for the author to keep, delete or rename.
