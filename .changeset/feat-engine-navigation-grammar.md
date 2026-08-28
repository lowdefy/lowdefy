---
'@lowdefy/engine': minor
---

feat(engine): Add `resolveTarget`, the single resolver for the `{ home, pageId, url, urlQuery }` navigation grammar, and route `createLink` through it.

`getHomePathname` is now the one place the home rule lives, so `home: true` in an app whose `home`
config names no page falls through to `Invalid Link.` instead of pushing `/undefined` into history
and writing `inputs['page:undefined']` on the way.

Two behaviour changes come with routing `createLink` through the resolver:

- A `url` with a leading slash (`/foo`) now navigates to the in-app page `/foo`. It previously
  produced the broken external URL `https:///foo`.
- A same-origin absolute `url` now becomes a soft client-side navigation rather than a full page
  load. An app relying on the reload will see the difference — the app-correct spelling of a
  same-origin destination is a `pageId`.

The ambiguity error now comes from the resolver and reads
`only one of 'home', 'pageId' or 'url' can be defined`. `back` and `href` are handled before the
resolver — `back` has no pathname to resolve, and `href` is an HTML-attribute passthrough rather
than a navigation target.
