---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Server routes for mobile shells

- `GET /api/mobile/root` returns what a mobile shell syncs on start: the `mobile.menus` frame with the items the caller may open, menu icon data, the index of the mobile pages the caller may open with each page's hash and type set key, those type sets, `minShellVersion`, and placeholder theme fields. It answers 404 for an app without a `mobile` key. The dev server lists page paths only, without hashes or type sets.
- `GET /api/page/*` sends an `ETag`, and both routes answer `304` to a matching `If-None-Match`.
- Pages are gated by surface: a request with `x-lowdefy-shell` gets only pages listed in `mobile.pages`, and a browser never gets a page listed only there. The other surface answers `404` with `{ pageConfig: null, surface }`. Page access still comes from `auth.pages`.
- `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` are served from `mobile.shells` when a shell declares iOS or Android signing details.
- The dev server builds mobile pages on demand, resolving their blocks against the native block set.
