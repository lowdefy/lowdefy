---
'@lowdefy/server-dev': patch
'@lowdefy/server': patch
---

Browser-only POST routes (`/api/client-error`, and `/api/feedback` in the dev server) now share one cross-site defence instead of copies of the same check, and additionally refuse a request the browser itself marks as cross-site via `Sec-Fetch-Site`, so a page on another site can no longer post to your log sink with the user's cookies attached.
