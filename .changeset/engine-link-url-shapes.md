---
'@lowdefy/engine': patch
---

fix(engine): Links and auth callbacks resolve every `url` shape. A fragment (`#section`) moves within the current page, a bare query (`?tab=2`) or a dot path (`./reports`) is relative to the current page, and `mailto:`, `tel:` and app-scheme urls keep their shape, with `urlQuery` as their query. A url is read the way the browser reads it, and a url the browser cannot parse resolves to no link instead of stopping the block from rendering.
