---
'@lowdefy/server': patch
---

The server's `request completed` access log now redacts credential parameters in the `referer` header. A browser sends the page's full URL as the Referer of every request that page makes, so a page whose URL carried a magic-link sign-in token or a signed OAuth query (the consent and organisation-picker pages) was writing that value into the log store on each fetch. The query string is kept, since it often identifies the page view, but the value of any parameter named like a credential (`token`, `code`, `state`, `sig`, `otp`, `*_token`, `*secret*`, `*signature*`, `*credential*`, `*password*`, and similar) is replaced with `[redacted]`. The request `url` field was already path-only.
