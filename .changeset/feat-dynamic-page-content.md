---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/engine': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Dynamic page content — server-resolved blocks at page load.

Pages can now include a `Dynamic` block whose content is resolved on the server at page load by an api endpoint routine. The routine returns block config; the server builds and validates it, splices it into the page, and the client renders the result like any other page.

**`Dynamic` block (`@lowdefy/blocks-basic`)**

- New container block configured with `properties.endpointId`, static `params`, an optional `fallback` slot rendered when resolution fails, and `required: true` to fail the page load instead.
- `properties.types` declares extra block, action and operator types the endpoint may return, so build includes them in the client bundle.

**Server resolution (`@lowdefy/api`, `@lowdefy/server`, `@lowdefy/server-dev`)**

- The endpoint is called in-process during page get with a payload of `{ params, pageId, blockId, urlQuery }` — the page request's query string is forwarded on both initial loads and SPA navigations.
- Returned blocks are validated before reaching the client: types must be in the client bundle, block properties are checked against plugin schemas (operator values are exempt), and `Request` and `CallAPI` action references are verified.
- Nested `Dynamic` blocks resolve recursively up to 5 levels; endpoint auth is enforced per resolution.
- Client-evaluated operators in returned config are escaped with one extra underscore (`__state` → `_state`), the same deferral convention as `_function` args — a plain `_state` evaluates against the routine's own state.

**Build (`@lowdefy/build`)**

- Validates `Dynamic` block config, flags dynamic pages in the page artifact, and bundles declared types.
- New `@lowdefy/build/dynamic` entry builds and validates runtime block config with the same pipeline as static pages.

**Engine (`@lowdefy/engine`)**

- Dynamic pages build a fresh context on every navigation, since the server may resolve different content per request.
