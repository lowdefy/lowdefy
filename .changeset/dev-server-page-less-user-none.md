---
'@lowdefy/server-dev': patch
---

fix(server-dev): A page-less journey with `user: none` runs on a data set while auth is configured

The dev server refused every data-set journey with `user: none` while auth was configured, to keep a signed-out sign-in off the app's real auth database. A journey with no `pageId` (calls and webhooks only) signs nobody in, so it now runs, as it does with `lowdefy test --headless --build`. A journey that opens a page signed out on a data set is still refused.
