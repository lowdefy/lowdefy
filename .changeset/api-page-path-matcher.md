---
'@lowdefy/api': minor
---

feat: The server matches page paths to pages

- `matchPagePath({ routes, path })` matches a request path to `{ pageId, pathParams }` against the route table. A fixed segment beats a placeholder at the first position where patterns differ; fixed segments match case-sensitively; each segment is decoded once; an empty segment (other than one trailing `/`), an undecodable segment and a `.` or `..` segment match no page.
- `getPageConfig` takes the request `path` instead of the page id, loads the matched page and returns its `pageId` and `pathParams` with the status. An unmatched path answers as an unknown page id did.
- `getRootConfig` returns `pagePaths`, the path of every page with one that the caller may open.
- Dynamic block endpoints receive `pathParams` in their payload next to `urlQuery`.
- A same-origin navigation URL in Dynamic content is checked on the page its path matches.
