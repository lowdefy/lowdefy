---
'@lowdefy/block-utils': patch
---

fix(block-utils): HTML links made with `data-page-id` and `data-link` stay on the app's origin. Without a `basePath`, a page id with a leading slash (`data-page-id="/host"`) or an app-relative href whose dot segments resolve to `//host` (`href="/.//host/x" data-link`) was written as a protocol-relative href to another site, and a plain click tried to push that URL through the router. Such links are now left as written.
