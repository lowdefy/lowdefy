---
'@lowdefy/engine': patch
---

fix(engine): Links and auth callbacks resolve every `url` shape again. The navigation resolver threw `Invalid URL` on a fragment (`url: '#products'`) or a bare query (`?tab=2`), which crashed the block rendering the link (a Breadcrumb item with a fragment url took the block down), and it wrote `mailto:`, `tel:` and app-scheme urls as `null…` hrefs. A fragment now moves within the current page, a bare query or a dot path (`./reports`) is relative to the current page, `mailto:`, `tel:` and app schemes keep their shape (a `urlQuery` becomes their query, such as a mail subject), and a protocol-relative `//host` or `/\host` url is classified by its origin instead of being pushed through the router as a page path. `javascript:`, `vbscript:` and `data:` urls resolve to no target.
