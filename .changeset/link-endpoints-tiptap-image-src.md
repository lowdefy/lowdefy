---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/blocks-tiptap': minor
'@lowdefy/docs': minor
---

feat(api): Link endpoints serve a file at a stable URL, and Tiptap editors save it with `imageSrc`

An `Api` endpoint with `link: true` answers a `GET` on `/api/endpoints/<endpointId>/<path...>`: its routine runs as the signed-in caller, with `{ path, query }` as payload and the endpoint's `auth` applied, and the endpoint answers `302` to the URL its `:return` gives (an absolute http(s) URL or a path starting with `/`), with `Cache-Control: private, no-store`. Endpoint ids can hold slashes, so the longest link id the URL starts with wins. A signed-out caller on a protected link gets `401`, a caller without its roles `403`, a `:reject` its `:status` (default `400`), all with no body; an unknown id answers `404` (`401` to a signed-out caller on an app with auth), and any other error `500` with a fixed message. A `POST` to a link endpoint is refused as a missing endpoint. The build refuses `link` on `InternalApi` and with `webhook` or `async`, and allows `:status`, not `:body`, on a `:reject` in a link endpoint. Link endpoints must have no side effects, since any page that embeds the URL can trigger the `GET`.

`TiptapInput` and `TiptapMentionInput` take an `imageSrc` `_function`, called with `{ key, bucket, name, type }` once an image is uploaded; its string is the inserted `src`. It takes precedence over `downloadPolicyRequestId`, so no download request runs. Pointing it at a link endpoint lets the bucket behind inline images stay private.
