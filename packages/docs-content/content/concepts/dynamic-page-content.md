# Dynamic Page Content

Dynamic page content lets parts of a page — or a whole page — be resolved on the server at page load. You place a `Dynamic` block on a page and point it at an [API endpoint](/lowdefy-api). When the page is requested, the server calls the endpoint's routine in-process, the routine returns block config, and the server validates that config and splices it into the page before responding. The client renders the result like any other page.

Dynamic page content is useful when the structure of a page depends on runtime data:

- A dashboard whose sections depend on the user's role, plan, or feature flags.
- A form generated from a workflow definition stored in a database.
- A product page whose layout comes from a CMS record.
- Table views, kanban columns, or navigation derived from tenant configuration.

For content where only the _data_ changes, use [requests](/connections-and-requests) — they are cached, re-fetchable, and don't reset page state. Reach for dynamic page content when the _blocks themselves_ need to change per request.

## How It Works

1. A user requests a page containing a `Dynamic` block.
2. The server checks page authorization as usual, then calls the endpoint configured on each `Dynamic` block — in-process, no HTTP. The endpoint's own auth is also checked against the user's session.
3. The routine executes with a payload containing the block's `params`, the `pageId`, the `blockId`, and the page request's `urlQuery`.
4. The routine returns `{ blocks: [...] }` — ordinary Lowdefy block config.
5. The server builds and validates the returned blocks: block, action and operator types must be in the app's client bundle, block properties are validated against each block type's schema, and `Request` actions must reference requests defined statically on the page.
6. The validated blocks become the `Dynamic` block's content, and the page is sent to the client.

If resolution fails, the `Dynamic` block renders its `fallback` slot (or nothing) and the error is logged on the server — the page still loads. Set `required: true` to fail the whole page request instead.

## The Dynamic Block

```yaml
- id: insights
  type: Dynamic
  properties:
    endpointId: resolve_insights # Required. The endpoint that resolves this content.
    params: # Optional. Static values passed to the endpoint.
      area: insights
    required: false # Optional. true fails the page load on resolution failure.
    types: # Optional. Extra types the endpoint may return.
      blocks:
        - Statistic
  slots:
    fallback: # Optional. Rendered when resolution fails.
      blocks:
        - id: insights_unavailable
          type: Html
          properties:
            html: Insights are unavailable right now.
```

`params` must not contain operators — the page config is static. Runtime values belong in the endpoint routine, which reads the payload with `_payload` and the session with `_user`.

A page that should be entirely dynamic is just a page whose body is a single `Dynamic` block.

## The Resolver Endpoint

The endpoint is a normal API endpoint. Use `type: InternalApi` so it has no HTTP route — it is then only callable by the server itself.

The endpoint receives this payload:

- `params: object` - The `Dynamic` block's `params`, verbatim.
- `pageId: string` - The page being resolved.
- `blockId: string` - The `Dynamic` block's id.
- `urlQuery: object` - The query parameters of the page request.

The routine must return an object with a `blocks` array:

```yaml
api:
  - id: resolve_insights
    type: InternalApi
    auth:
      public: false
    routine:
      - id: get_sections
        type: MongoDBFind
        connectionId: mongodb
        properties:
          query:
            roles:
              $in:
                _user: roles
            area:
              _payload: params.area
      - :return:
          blocks:
            _array.map:
              on:
                _step: get_sections
              callback:
                _function:
                  __object.assign:
                    - id:
                        __args: 0.section_id
                      type: Statistic
                      properties:
                        title:
                          __args: 0.title
                        value:
                          __args: 0.value
```

All operators registered on the server — including shared operators like `_state`, `_if` and `_string` — are evaluated during `:return` (`_state` reads the routine's own `:set_state` state). To defer an operator to the client instead, prefix it with one extra underscore, the same convention `_function` bodies use for `__args`:

```yaml
- :return:
    blocks:
      - id: greeting
        type: Html
        properties:
          html:
            __state: name_input # unescaped to `_state` — evaluates on the client
```

The server strips one leading underscore from `__`-prefixed keys in the returned config, so `__state` reaches the client as `_state` and binds to page state like any static block. Client-only operators (`_request`, `_global`, ...) have no server implementation and need no escaping, but the `__` form works for them too and is the consistent style.

> **Never place `_secret` in returned block config.** It evaluates during `:return` and the resulting value ships to the browser.

## Using urlQuery in the Routine

The page request's query string is forwarded to the resolver as `urlQuery` in the payload. A page loaded as `/products?category=shoes&sort=price` resolves with `urlQuery: { category: 'shoes', sort: 'price' }`:

```yaml
api:
  - id: resolve_products
    type: InternalApi
    routine:
      - id: get_products
        type: MongoDBFind
        connectionId: mongodb
        properties:
          query:
            category:
              _payload: urlQuery.category
          options:
            sort:
              - - _payload: urlQuery.sort
                - 1
      - :return:
          blocks:
            - id: product_count
              type: Html
              properties:
                html:
                  _string.concat:
                    - 'Found '
                    - _array.length:
                        _step: get_products
                    - ' products in "'
                    - _payload: urlQuery.category
                    - '"'
```

The resolver executes on every navigation to the page — a menu link, a `Link` action (including to the same page), or the browser back and forward buttons all re-resolve the content on the server. Dynamic page config is never served from a client cache.

## Client Bundle Types

The client bundle is fixed at build time — resolved content can only use block, action and operator types the build included. Types used on static pages are always available. To use a type that appears _only_ in dynamic content, declare it on the `Dynamic` block:

```yaml
- id: insights
  type: Dynamic
  properties:
    endpointId: resolve_insights
    types:
      blocks:
        - Statistic
        - EChart
      actions:
        - CopyToClipboard
      operators:
        - _number
```

The build bundles declared types into the client. If a routine returns a type that is not in the bundle, resolution fails with a clear error instead of a silently broken page.

## Rules and Limitations

- **No `requests` in resolved content.** Request artifacts are written at build time. Resolved blocks reference requests defined statically on the page via `Request` actions, or call endpoints with `CallAPI`.
- **Nesting is allowed** — resolved content may contain further `Dynamic` blocks, up to 5 levels deep.
- **Page state resets per visit.** Dynamic pages build a fresh context on every navigation, since the server may resolve different content each time. Keep cross-navigation state in `_global` or `_url_query`.
- **Endpoint auth always applies.** A public page pointing at a role-protected endpoint renders the fallback for users without the role — useful for role-gated sections.
- **`blockId` namespace is shared.** Resolved blocks share the page's state namespace, so `_state` binds across static and dynamic blocks. Keep blockIds unique, as on any page.
