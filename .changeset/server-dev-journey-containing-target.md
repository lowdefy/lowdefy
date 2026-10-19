---
'@lowdefy/server-dev': minor
---

Journey targets take `containing`: the element whose visible text contains the string, inside the block when a `blockId` is given. `click: { blockId: members_list, containing: ada@example.test }` clicks the row a person would click, reaching the row's click handler, so the cards of a `ListSelector` (neither blocks nor controls) can be opened in a journey. The text is matched as the page shows it, across elements that only layout separates (`<span>Assigned to</span><b>Jane</b>` matches `containing: Assigned to Jane`), and the innermost matching element is picked.
