---
'@lowdefy/block-utils': patch
---

fix(block-utils): Links from the HTML enhancers only point inside the app. A `data-page-id` or `data-link` value that does not resolve to a page of the app is left as written.
