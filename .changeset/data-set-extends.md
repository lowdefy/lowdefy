---
'@lowdefy/node-utils': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(node-utils): A journey data set can extend other data sets

A data set file now takes a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id` replaces an earlier one and a later index with the same `key` replaces an earlier one, as within one file, and a later user replaces an earlier user of the same name. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused. `lowdefy data list`, the `journeys` commands and journey runs read the merged data set, so a multi-tenant set no longer copies the shared tenant's rows.
