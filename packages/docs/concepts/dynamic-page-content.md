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

### Data in the returned config is literal

While a Dynamic block's endpoint evaluates its `:return`, no operator may return a value that contains operators. That covers data read at runtime — step results, the payload, routine state, `:for` items — and values built from data, such as `_json.parse` of a stored string. A record holding `{ _request: ... }` or `{ __state: ... }` fails resolution, and the block renders its fallback. The error names the operator and where in its result the operator was found.

Write client operators in the `:return` config itself. Only operators that pass their own already-checked params through — `_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array` and `_object` (except `_object.fromEntries` and `_object.defineProperty`) — may return them, so mapping data rows into blocks with `_array.map` and `_function` works as shown above.

These patterns return config through data and fail resolution:

- **Blocks built up in routine state** (`:set_state` in a loop, then `_state` in `:return`). Build the list inside `:return` with `_array.map` or `_array.concat`.
- **Blocks returned by a nested endpoint** and read with `_step`. Share block config with `_ref` instead.
- **A `:for` over a literal list of block configs**, read with `_item`. Map the list inside `:return`.
- **Blocks built by `_js` or `_jsonata`.** Return the data from them and map it into blocks inside `:return`.

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

## Dynamic Policies

A dynamic policy lets a Dynamic block render block config that is stored as data — a form built by a form builder, or config a model generated — within limits the app declares. The policy lists what the content may use. Anything unlisted fails, and the policy is checked twice with the same function: by a `ValidateDynamic` step before the content is stored, and on every page get before the content renders.

```yaml
dynamicPolicies:
  - id: generated_form
    blocks:
      - Title
      - Paragraph
      - TextInput
      - Selector
    actions:
      - SetState
      - CallAPI
    operators:
      - _state
      - _eq
      - _if
    endpoints:
      - submit_form_response
    links:
      pages:
        - form_submitted
      origins:
        - https://example.com
    state: form
```

| Key             | Default   | Meaning                                                                                                     |
| --------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `id`            | required  | Policy id, referenced by Dynamic blocks and steps.                                                          |
| `blocks`        | required  | Block types the content may use. `Dynamic` cannot be listed.                                                |
| `actions`       | `[]`      | Action types the content may use.                                                                           |
| `operators`     | `[]`      | Client operator names. `_string` allows every `_string` method. `_operator` cannot be listed.               |
| `endpoints`     | `[]`      | Endpoints a `CallAPI` action in the content may call.                                                       |
| `requests`      | `[]`      | Page requests a `Request` action may call. The build checks every page that hosts the policy defines them.  |
| `links.pages`   | `[]`      | Pages the content may navigate to, by `pageId` or by an app path such as `/form_submitted`.                 |
| `links.origins` | `[]`      | Exact origins (`https://example.com`) the content may link to or load from.                                 |
| `state`         | none      | When set, every input block id and every `SetState` key must sit under this state path.                     |
| `html`          | `false`   | When `false`, no string in the content may contain HTML tag syntax.                                         |
| `limits`        | see below | `depth` (10), `blocks` (500), `bytes` (262144) and `actionsPerEvent` (20). They can be raised, not removed. |

Besides the lists, a policy requires literal values wherever the content names a target: `properties`, `style`, events and action lists; the params of `Link`, `CallAPI`, `Request` and `SetState`; and every `pageId` and URL. URLs must be app paths or use a listed origin — including image sources, markdown links and CSS `url()`.

> With `html: false`, an operator that builds strings (`_string`, `_uri`, `_base64`, `_json`) can still assemble HTML at render time from content that passed the check. The build warns when a policy lists one. Leave them out of policies for generated content.

### Rendering stored content under a policy

Put the policy on the Dynamic block, and return the content through a `ValidateDynamic` step with the same policy. Data stays literal in a Dynamic endpoint (see [Data in the returned config is literal](#data-in-the-returned-config-is-literal)); the blocks of a `ValidateDynamic` step that passed with the block's policy are the one exception.

```yaml
pages:
  - id: form
    type: PageHeaderMenu
    blocks:
      - id: generated
        type: Dynamic
        properties:
          endpointId: get_form_blocks
          policy: generated_form
      - id: submit
        type: Button
        properties:
          title: Submit
        events:
          onClick:
            - id: save
              type: CallAPI
              params:
                endpointId: submit_form_response
                payload:
                  answers:
                    _state: form

api:
  - id: get_form_blocks
    type: InternalApi
    routine:
      - id: get_form
        type: MongoDBFindOne
        connectionId: forms
        properties:
          query:
            _id:
              _payload: urlQuery.formId
      - id: check
        type: ValidateDynamic
        properties:
          policy: generated_form
          blocks:
            _step: get_form.blocks
      - :return:
          blocks:
            _step: check.blocks
```

The policy's types are bundled into the page, so a Dynamic block with `policy` does not declare `properties.types`. Content that breaks the policy at page get renders the fallback, and the log lists each violation.

### Checking generated content

A generator calls `ValidateDynamic` with `throwOnInvalid: false` and feeds the errors back to the model. Each error has a `path` into the submitted content, a `rule` and a `message`. `DescribeDynamicPolicy` returns what the policy allows, with the properties schema of each block and the params schema of each action and operator, to build the prompt from. See [Validating Dynamic Content As A Routine Step](/lowdefy-api#validating-dynamic-content-as-a-routine-step).

## Rules and Limitations

- **No `requests` in resolved content.** Request artifacts are written at build time. Resolved blocks reference requests defined statically on the page via `Request` actions, or call endpoints with `CallAPI`.
- **Nesting is allowed** — resolved content may contain further `Dynamic` blocks, up to 5 levels deep.
- **Page state resets per visit.** Dynamic pages build a fresh context on every navigation, since the server may resolve different content each time. Keep cross-navigation state in `_global` or `_url_query`.
- **Endpoint auth always applies.** A public page pointing at a role-protected endpoint renders the fallback for users without the role — useful for role-gated sections.
- **Data cannot carry operators.** Operators in step results, payload or state returned into `:return` fail resolution, except the blocks of a `ValidateDynamic` step under the block's policy. See [Data in the returned config is literal](#data-in-the-returned-config-is-literal) and [Dynamic Policies](#dynamic-policies).
- **`blockId` namespace is shared.** Resolved blocks share the page's state namespace, so `_state` binds across static and dynamic blocks. Keep blockIds unique, as on any page.
