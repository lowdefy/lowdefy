---
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat(build): Add the `ListPage` page archetype that expands to blocks and a request from `collections:`.

A page whose root `type` is `ListPage` is expanded, at build, into an ordinary layout block tree plus
one `MongoDBFind` request — the whole `lowdefy-list-pages` recipe generated with one way to be right.
Its typed `properties` (`collection`, `columns`, `filters`, `search`, `rowLink`, `sort`, `pageSize`,
`title`, `emptyState`, `actions`, `layout`) are validated at build, and every named column, filter and
search field resolves its label, type and enum from the app's `collections:` declaration
(`build/collections.json`): an enum field becomes a `Selector`/`Tag`, other fields a `TextInput`/`Html`
cell, and the request drops empty filters and searches with a case-insensitive `_regex`. A collection
that is not declared, or a field that is not one of its declared fields, is a build error naming the
gap (with a "did you mean" suggestion) rather than a silently mistyped column.

Expansion runs as the first step of `buildBlock` (before `expandComponent`), so the generated tree is
validated, id-prefixed and request-built by the ordinary page pipeline, and works unchanged in the full
build and the dev server's JIT page build (which now restores `build/collections.json` onto the build
context). An archetype used anywhere but a page root is a build error. `DetailPage` and `EditPage`,
the app-level `archetypes:` defaults block, and `lowdefy expand` for ejecting are covered by the
sub-design and follow as separate tasks.
