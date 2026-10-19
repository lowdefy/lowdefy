---
'@lowdefy/server-dev': minor
---

Journey targets take `containing`: the element whose visible text contains the string, inside the block when a `blockId` is given. `click: { blockId: members_list, containing: ada@example.test }` clicks the row a person would click, reaching the row's click handler, so the cards of a `ListSelector` (neither blocks nor controls) can be opened in a journey.
