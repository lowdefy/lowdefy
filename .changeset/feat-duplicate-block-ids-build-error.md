---
'@lowdefy/build': major
'@lowdefy/docs': patch
---

feat(build)!: Duplicate block ids on a page are now a build error.

A block's id is its key in the page `state` object, so two blocks on one page sharing an id silently
wrote and read a single state value — a copy-pasted `id: email` bound two inputs to one field, and
whichever block was visible won the state delete-vs-keep race. The build now fails with:

`Duplicate blockId "email" on page "home". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.`

The error points to the second block's config location. The check is per page (across nested blocks,
areas, slots and `List` templates) and, like every other id check in the build, is case-insensitive:
`email` and `Email` collide. The same block id may still be used on different pages, and `Dynamic`
block content built at runtime is unaffected — its ids are namespaced under the resolving block.

Breaking: apps that relied on two blocks sharing a state key must rename one of them.
