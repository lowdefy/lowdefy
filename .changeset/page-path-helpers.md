---
'@lowdefy/helpers': minor
---

`@lowdefy/helpers` adds the shared helpers for page path patterns: `parsePathPattern(path)` splits a pattern such as `tickets/{space}/{ticket_id}` into fixed segments and placeholders and rejects patterns Lowdefy does not support (partial, optional and catch-all placeholders, repeated names, empty segments, outer slashes, characters page ids do not allow); `buildPagePath({ pageId, path, pathParams })` writes a page's URL path from its values, encoding each one; and `pageInstanceKey({ pageId, path, pathParams })` gives the key a page instance is stored under, one per set of values for a page with placeholders.
