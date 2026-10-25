---
'@lowdefy/blocks-antd': minor
---

The `Search` block can show a few best results per group, keep one action row last, and remember the results a person opened. A production app's command palette needs this to search documents, controls and people at once, where one kind used to crowd out the others under `maxResults`.

- `groups[].limit` shows that many rows for a group, with the group's full match count in the heading and a "See all N" row when there are more. `groups[].seeAll` is an object (`label`, `pageId`, `urlQuery`) that fires `onSeeAll` with `{ group, count, query, pageId, urlQuery }`, or the name of an event to fire instead. `maxResults` keeps its meaning when no group sets a limit.
- `pinned: { title, icon, shortcut, event }` adds a row after the list while a query is typed. `{query}` in the title is the typed text. It is selected when nothing matches, reachable with the arrow keys, and its shortcut (for example `mod+enter`) works from any row. It fires `onPinned` with `{ query }`.
- `recentResults: true` lists the last `recentResultsCount` (default 4) selected results when the input is empty, kept per app and signed-in user like recent searches.
- Below 576px the modal is a full-screen sheet with the pinned row kept in view. `footer` adds a line of key hints.
