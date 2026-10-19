---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

fix: Journey evidence and data set follow-ups

- A journey file with an `evidence.dev` key is refused, with a message to delete the key. Nothing writes or reads dev counts: `lowdefy journeys evidence` counts production use and mutation scores, and dev sessions are read with `lowdefy journeys session`.
- A data set is refused when a generated `_id` is also held by a fixture or a generated document of another connection that names the same collection. Before, the fixture silently replaced the generated document, so the collection held one document fewer than the data set said.
