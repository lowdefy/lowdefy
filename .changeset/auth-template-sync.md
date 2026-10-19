---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Keep the dev and production auth client templates the same

The development server's auth client now carries the same build check as the production server's, so the two copies stay identical. In development it never reloads a tab: the development server marks no response with a build, and config edits still reach open tabs through its own reload.
