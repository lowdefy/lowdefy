---
'@lowdefy/server-dev': patch
---

fix(server-dev): `/lowdefy-docs/find/{id}?pageId=` only matches config on that page.

Built pages share identical key paths for same-named block ids, so a page-scoped find could return locations from other pages. Matches are now resolved against the requested page's own config tree, and the no-match message suggests retrying without `pageId` to scan everything. Cmd/Ctrl+click open-in-editor no longer sends an empty `pageId`.
