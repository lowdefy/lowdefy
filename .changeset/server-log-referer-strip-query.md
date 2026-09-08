---
'@lowdefy/server': patch
---

The server's `request completed` access log no longer records the query string of the `referer` header. A browser sends the page's full URL as the Referer of every request that page makes, so a page whose URL carried a magic-link sign-in token or a signed OAuth query (the consent and organisation-picker pages) was writing that value into the log store on each fetch. The referer is now logged as origin and path only; the request `url` field was already path-only.
