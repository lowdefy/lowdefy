---
'@lowdefy/client': patch
'@lowdefy/actions-core': minor
'@lowdefy/docs': patch
---

feat(actions): Link action accepts `replace` and `scroll`.

A same-page `Link` that only reflects state into the `urlQuery` no longer has to jump the page to
the top or push a history entry per click: `scroll: false` keeps the current scroll position and
`replace: true` swaps the current history entry instead of pushing one. The router and the `<Link>`
block component already supported both; the Link action's same-origin path now forwards them too.
