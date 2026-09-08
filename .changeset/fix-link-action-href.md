---
'@lowdefy/client': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(client): Make the `Link` action honour `href`.

`createLink` routes `href` to `newOriginLink`, but the action's `newOriginLink` in
`setupLink.js` only ever read `url` — so `{ type: Link, params: { href: '/some/path' } }`
navigated to the literal string `"undefined"`. The anchor renderer used for `Link` blocks
(`createLinkComponent.js`) already prefers `href` over `url`; this brings the action to the
same precedence, and `href` is used verbatim: no protocol added, no `urlQuery` appended.

That verbatim handling is the point of having the parameter at all. `url` means an external
address and gains an `https://` prefix when the value has no scheme, which turns a
root-relative `/reports?id=1` into a request for a host named `reports`. `href` is how you
link to a same-origin path, a fragment, or any address that must be passed through as
written — so the fix removes the need to work around `url`'s prefixing.

`href` was also missing from the `Link` action docs, which is presumably how the gap went
unnoticed. Documented alongside the fix.
