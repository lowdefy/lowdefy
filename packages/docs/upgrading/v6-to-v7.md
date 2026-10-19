This guide covers every breaking change between Lowdefy v6 and v7 that an app or plugin author has to act on. Most apps need three things:

- **Node.js 24.** The CLI and servers no longer run on Node.js 22.
- **The upgrade command.** `npx lowdefy upgrade` runs the v7 codemods: `react-icons-to-lucide` rewrites icon names, `clickable-html-data-events` adds `dataEvents` to `ClickableHtml` blocks, and `nested-event-bubbling` adds `bubble: true` where nested events depend on each other. The rest of this guide covers what the codemods don't change.
- **The auth migration, if the app has `auth`.** NextAuth is replaced by BetterAuth, which has its own guide: [Auth Upgrade](/auth-upgrade). This guide covers only the auth changes outside that one.

```bash
npx lowdefy upgrade
```

## Summary of breaking changes

| Change                                                         | Impact                                                            | Action                                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Node.js 24 is the minimum                                      | All apps                                                          | Upgrade Node.js, and change `FROM node:22-slim` to `node:24-slim` in Dockerfiles |
| NextAuth is replaced by BetterAuth                             | Apps with `auth`                                                  | Follow [Auth Upgrade](/auth-upgrade)                                             |
| With `auth.email`, production needs a pinned public URL        | Apps that send auth emails                                        | Set `BETTER_AUTH_URL` or the environment's `url`                                 |
| The client address comes from the connection                   | Self-hosted apps behind a proxy                                   | List the proxy in `config.trustedProxies`                                        |
| react-icons names are not built in                             | Almost every app                                                  | Run `lowdefy upgrade`, or install the compatibility set                          |
| An unknown icon name fails the build                           | Apps with old or misspelled names                                 | Fix the name the error names                                                     |
| Block and Ant Design icons are Lucide                          | All apps                                                          | None; check screens that depend on the old look                                  |
| `theme.icons.aliases` targets are Lucide names                 | Apps with aliases                                                 | Drop the `Lu` prefix: `LuReceipt` becomes `Receipt`                              |
| Icon hover titles come from the new names                      | Apps that show Icon block hover titles                            | Set `title` where the text matters                                               |
| Events no longer bubble to outer blocks                        | Apps with clickable blocks inside clickable blocks or AgGrid rows | Run `lowdefy upgrade`, or set `bubble: true` on the inner event                  |
| A declared `payloadSchema` is enforced on every caller         | Apps whose endpoints declare `payloadSchema`                      | Fix the callers or the schema                                                    |
| Webhook endpoints must be listed in `auth.api.public`          | Apps with webhook endpoints                                       | Add each webhook endpoint id to `auth.api.public`                                |
| Webhooks run untrusted until a verifier passes                 | Webhooks that call protected endpoints                            | Add a `webhook.verify` request                                                   |
| Webhooks answer plain JSON with set statuses                   | Webhook senders that read the response                            | Check dates, errors and `:reject` answers                                        |
| A detached `CallApi` runs as the user who started it           | Detached runs of protected endpoints started by users             | Make sure the user may call the target endpoint                                  |
| Module endpoints and agents need a signed-in caller            | Apps with auth that call them signed out                          | List them in `auth.api.public` to keep them public                               |
| Auth refusals keep their error class in the browser            | `catch` actions that check `_error.name`                          | Branch on the refusal's class, not `ActionError`                                 |
| A refused signed-in caller gets `403`, a wrong method `405`    | Outside callers that check status codes                           | Handle `403` and `405`                                                           |
| HTTP 429 is a `ServiceError`                                   | `catch` and `:catch` that check `RequestError`                    | Check `ServiceError`, or `statusCode` `429`                                      |
| MongoDB driver errors are `ServiceError`s                      | Code that reads the driver's error message                        | Read `code` and `hint` instead                                                   |
| `_if` without `test` fails the build                           | Apps with a malformed `_if`                                       | Add `test`                                                                       |
| A `CallMethod` to a missing block fails production builds      | Apps with stale `CallMethod` targets                              | Fix the `blockId`                                                                |
| An invalid `payloadSchema` or schedule payload fails the build | Apps with endpoint schemas or `schedules`                         | Fix the schema or the schedule's `payload`                                       |
| `_operator` names read at runtime need a list                  | Apps with a runtime `_operator` name                              | List the operators it may call in `operators`                                    |
| Dynamic blocks render only written blocks                      | Apps returning stored blocks as data                              | Use a policy with `ValidateDynamic`                                              |
| Escaped keys in Dynamic data keep their underscores            | Apps that read `_typename`-style keys from Dynamic data           | Read the key with both underscores                                               |
| `ClickableHtml` fires only listed data events                  | Apps that use `data-event`                                        | Run `lowdefy upgrade`, or list the events in `dataEvents`                        |
| `RenderNotification` `landingPage` is a page id                | Apps with a notification landing page                             | Pass the landing page's id, not its path                                         |
| A `system` message in AI `messages` is refused                 | AI requests that build system messages into `messages`            | Move it to `system`, or set `allowSystemInMessages: true`                        |
| Files the server downloads for AI calls are limited            | AI calls with `http:`, private or large file links                | Use public `https:` links, or raise `fileDownload`                               |
| AI calls are cancelled at the request timeout                  | Synchronous routines with long AI calls                           | Use `async: true`                                                                |
| Agent hook payloads follow AI SDK 7                            | Agent hooks that read the event payload                           | Check the fields the hook reads                                                  |
| Cross-origin websocket upgrades are refused                    | Apps behind a proxy or CDN that rewrites `Host`                   | Forward the original `Host`, or set `X-Forwarded-Host`                           |
| Websockets close with code `4401` when the session changes     | Apps with websocket subscriptions and auth                        | None; check subscriptions after sign-out or an organization switch               |
| Change stream subscriptions run the `read` check               | Connections with `read: false` used for `MongoDBChangeStream`     | Remove `read: false` from the connection                                         |
| Block links accept only safe schemes                           | Apps with `href`s on other schemes                                | Use an allowed scheme or a relative URL                                          |
| `Pagination` events report the correct `skip`                  | Apps that corrected `_event: skip`                                | Remove the correction                                                            |
| Block properties that were ignored now apply                   | Apps that set them                                                | Check the pages that set them                                                    |
| `ColorSelector` clears to `null`                               | Apps that read a cleared colour                                   | Handle `null`                                                                    |
| `PhoneNumberInput` renders as a compact group                  | Apps with CSS for its addon, or `addonBg`                         | Update the CSS, and use `selectorBg`                                             |
| `TitleInput` and `ParagraphInput` show no edit icon            | Apps that rely on the pencil icon                                 | Set `editable.icon`                                                              |
| Vercel functions check environment guards                      | Vercel apps with `guards`                                         | Make the runtime variables match the build's                                     |
| Server-side Sentry runs on Vercel                              | Vercel apps with `SENTRY_DSN`                                     | None; set `logger.sentry.server: false` to turn it off                           |
| The agent MCP server is renamed `lowdefy`                      | Projects set up with `lowdefy agent-setup`                        | Rerun `lowdefy agent-setup`                                                      |
| `lowdefy dev` uses the port you set or fails                   | Scripts that set a port that may be taken                         | Free the port, or set another                                                    |
| `@lowdefy/e2e-utils` doesn't reuse a running server            | e2e runs against `pnpm e2e:server`                                | Set `LOWDEFY_E2E_REUSE_SERVER=true`                                              |
| Generated servers are their own pnpm workspace                 | Apps inside a pnpm workspace                                      | Remove `.lowdefy/*` from the parent's `pnpm-workspace.yaml`                      |
| `react-icons` is not a server dependency                       | Plugins that import `react-icons`                                 | Render `components.Icon` with a name, or add `react-icons` to the plugin         |
| Block plugins should pin `antd@6.6.5`                          | Block plugins that import `antd`                                  | Pin `antd@6.6.5`                                                                 |
| Blocks must declare the types they run themselves              | Block plugins that register their own actions or operators        | List them in `meta.actions` and `meta.operators`                                 |
| `createIcon` takes an object                                   | Code that calls `createIcon` from `@lowdefy/client`               | Pass `{ icons, loadAllIcons }`                                                   |

## Node.js 24

Lowdefy v7 needs Node.js 24 or later. The CLI refuses to start on an older version, and the CLI and servers declare `"node": ">=24"` in `engines`.

- **Docker.** `lowdefy init-docker` now writes a Dockerfile on `node:24-slim`. In a Dockerfile written by an earlier version, change every `FROM node:22-slim` line to `FROM node:24-slim`.
- **Vercel.** The build output declares the `nodejs24.x` function runtime. Set the project's Node.js version to 24 so the install and build steps run on it too.
- **CI.** Run builds and tests on Node.js 24.

## Auth

Apps with an `auth` block move from NextAuth to BetterAuth. `@lowdefy/plugin-next-auth` and `@lowdefy/plugin-auth0` are removed. Follow [Auth Upgrade](/auth-upgrade) for providers, sessions, hooks, auth pages and the user object. The next section covers the auth changes that apply whichever login methods the app uses: the pinned auth URL, the client address and the email link pages.

## Auth links and client addresses

These changes affect apps with auth. See [Auth Upgrade](/auth-upgrade), [Auth configuration](/auth-configuration) and [Deploy with Docker](/docker#behind-a-reverse-proxy).

- **Pinned auth URL.** With `auth.email` configured, the production server refuses to start unless `BETTER_AUTH_URL` or the current environment's `url` in `config.environments` is set, so emailed auth links cannot take their host from a request. The dev server is unchanged.
- **Client address.** The server takes the client address for auth rate limits, sessions and request logs from the connection, and reads `X-Forwarded-For` only from the proxies listed in `config.trustedProxies`. Behind a reverse proxy or load balancer, list it there; otherwise every client shares the proxy's rate limits. On Vercel nothing changes.
- **Email link pages.** `SignUp` and `SendVerificationEmail` without a `callbackUrl` send the verification link to `auth.authPages.verifyEmail` (default `/verify-email`), not the home page. `RequestPasswordReset` without `redirectTo` sends the reset link to `auth.authPages.resetPassword` (default `/reset-password`). The build warns when the app sends these emails and the page does not exist.

## Icon names

An icon name has one of three forms:

- **Semantic:** `edit`, `delete`, `chevron-down`. Built-in names for common jobs. [Theming](/theming) lists them all.
- **Lucide:** `Pencil`, `CreditCard`. The PascalCase name from [lucide.dev/icons](https://lucide.dev/icons).
- **Qualified:** `lucide:Pencil`. A name in a named [icon set](/plugins-icon-sets).

```yaml
# v6
- id: delete_button
  type: Button
  properties:
    title: Delete
    icon: AiOutlineDelete
- id: card_icon
  type: Icon
  properties:
    name: AiOutlineCreditCard

# v7
- id: delete_button
  type: Button
  properties:
    title: Delete
    icon: delete
- id: card_icon
  type: Icon
  properties:
    name: CreditCard
```

## Run the codemod

```bash
npx lowdefy upgrade
```

The v7 phase includes the `react-icons-to-lucide` codemod. It rewrites icon names as text, so it reaches:

- YAML, Nunjucks (`.njk`) and JSON config
- single-quoted names in `_js` code
- string literals and `meta.icons` in local plugin code
- `theme.icons.aliases` targets

Each old name maps to a semantic name where one fits, otherwise to a Lucide name. `Lu*` names drop the prefix (`LuPencil` becomes `Pencil`). The table lives in `@lowdefy/codemods` at `v7-0-0/react-icons-to-lucide.json`, and the build uses the same table for its error suggestions.

The codemod reports what it cannot decide for you:

- **Judgement calls**, where the closest Lucide glyph differs from the old one.
- **Known losses**: filled variants (`AiFillStar`), brand icons such as WhatsApp, and Word and PDF file glyphs. Lucide has no equivalents.
- **Runtime icon names**: icon properties set from `_state`, `_payload` or `_request`. The codemod does not change data. Use the compatibility set for names stored in a database.

## Build errors for old names

A literal icon name at an icon property that resolves to nothing fails the build. An old react-icons name gets a migration message:

```
Icon "AiOutlineDelete" is a react-icons name. Lowdefy 7 uses Lucide icons.
Use "delete" (or "Trash"). To keep react-icons names, install @lowdefy/icons-react-icons
and set theme.icons.set: react-icons. Run `lowdefy upgrade` to migrate names automatically.
```

Old Ant Design names such as `HomeOutlined` get the same message, pointing at their semantic name. In v6 these names drew nothing, so the error may show icons that were missing all along.

An icon property is a key ending in `icon` (`icon`, `prefixIcon`, `suffixIcon`, ...), its `name` field, the Icon block's `name`, a `data-icon` attribute in HTML, and `theme.icons.aliases` and `theme.icons.include`. Names inside an operator are bundled but not checked. An unknown name that reaches the page at runtime draws a red `icon-missing` icon.

## Keep old names: the compatibility set

`@lowdefy/icons-react-icons` holds every react-icons 5.6.0 icon under its old name. Install it to keep old names working without edits, or for names stored in data:

```yaml
plugins:
  - name: '@lowdefy/icons-react-icons'
    version: '^7'
theme:
  icons:
    set: react-icons
```

Old names then resolve in the compatibility set, and semantic and Lucide names still work. Block and Ant Design icons stay Lucide. Without `set: react-icons`, reach an old name with its qualified name: `react-icons:FaWhatsapp`. See [Icon Sets](/plugins-icon-sets).

## Visual changes

- **Block icons are Lucide.** Date picker calendars, input validation marks, selector arrows, the loading spinner, menu toggles and the dark mode toggle all use semantic names and draw Lucide icons.
- **Ant Design icons are Lucide.** Close buttons on modals, drawers, tags and alerts, alert and message status icons, collapse and menu arrows, pagination arrows, and button spinners use the same semantic names. Spin, Progress, QRCode, the Empty and Result illustrations, and the date picker panel arrows stay as Ant Design draws them.
- **Stroke width is a setting.** Lucide draws a 2px line on a 24px grid. Set `theme.icons.strokeWidth: 1.5` for a lighter look closer to Ant Design outline icons, or set `strokeWidth` on one icon.
- **Size is unchanged.** Icons default to `1em`, as before. Change it with `theme.icons.size`.
- **`color` and `rotate` go through CSS.** `color` colours stroke and fill icons alike, and `rotate` now turns the icon.
- **Hover titles change.** The Icon block's title comes from the name: `Pencil` gives "Pencil", and `more-vertical` gives "More vertical". Old names in the compatibility set give titles such as "Ai outline user". Set `title` where the text matters, or `title: ''` for none.
- **Icons without a title are hidden from screen readers** (`aria-hidden`).

## `theme.icons`

`theme.icons.aliases` targets are now Lucide or qualified names. The codemod rewrites them:

```yaml
# v6
theme:
  icons:
    aliases:
      invoice: LuReceipt
    include:
      - LuFlag

# v7
theme:
  icons:
    aliases:
      invoice: Receipt
    include:
      - Flag
```

`theme.icons` also has new keys: `set`, `size`, `strokeWidth` and `nonScalingStroke`. See [Theming](/theming).

## Events no longer bubble

In v6, a click on a block inside another clickable block ran the events of both: a `Button` in a clickable `Card` also opened the card. In v7 a browser event runs only the innermost block event that handles it. Once a block with actions for the event fires, the blocks around it skip that same browser event. A block without an event for the interaction, like a `Paragraph` in the card, still passes the click on to the card.

Set `bubble: true` on the inner event to also run the events of the blocks around it:

```yaml
# v6: clicking the button ran the button's and the card's onClick
- id: order_card
  type: Card
  events:
    onClick:
      - id: open_order
        type: Link
        params: order-detail
  blocks:
    - id: select_button
      type: Button
      events:
        onClick:
          - id: select_order
            type: SetState
            params:
              selected: true

# v7: bubble: true keeps the card's onClick running after the button's
- id: order_card
  type: Card
  events:
    onClick:
      - id: open_order
        type: Link
        params: order-detail
  blocks:
    - id: select_button
      type: Button
      events:
        onClick:
          bubble: true
          try:
            - id: select_order
              type: SetState
              params:
                selected: true
```

Inside an `AgGrid` block, clicks on a cell's buttons, links, menus, inputs, selectors, switches or selection checkbox fire only that control's event, never `onRowClick` or `onCellClick`.

The `nested-event-bubbling` codemod in `lowdefy upgrade` adds `bubble: true` only where the outer event reads a value the inner event sets, moves AgGrid row-click state setup into the cell control events that relied on it, and lists the other nested events for you to review. Most nested pairs were bugs the app worked around, like a delete button that also opened its card, and need no change. See [Events and Actions](/events-and-actions).

## Endpoints and webhooks

### `payloadSchema` is enforced

In v6 an endpoint's `payloadSchema` was only advertised to MCP clients and agents. In v7 every call checks the payload against it before the routine runs, and refuses a payload that doesn't match. There is no opt-out: an endpoint that should not validate must not declare a `payloadSchema`.

Who built the payload decides how the refusal is reported:

- **An outside caller's payload** is a `UserError`, logged as a warning. A REST call to `POST /api/endpoints/<endpointId>` answers `400` with `{ name: 'UserError', message }`, an MCP `tools/call` answers with `isError: true`, and an agent tool call gets a tool error the model can retry.
- **A payload the app's own config built** is a `ConfigError` with its config location, logged as a server error. That covers a page's `CallAPI`, a nested or detached `CallApi` step, a Dynamic block's endpoint, an auth or agent hook and a scheduled run's `payload`. A page's `CallAPI` fails with `_error.name: ConfigError`, a nested `CallApi` reaches the routine's `:catch`, and a detached or scheduled run fails.

The message names the endpoint and the failing location:

```
Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.
```

A common cause is a number or boolean that a page sends as a string, for example straight from a text input. Fix the caller, or loosen the schema.

An endpoint can't declare both `webhook` and `payloadSchema`, because a webhook routine receives `{ body, query, headers }`, not the schema's shape. The build fails when it finds both.

### Webhooks

In v6 a webhook endpoint ran as a trusted system context: nested `CallApi` steps to protected endpoints always passed. In v7 a webhook starts untrusted and has to earn trust.

- **List the endpoint in `auth.api.public`.** The build fails for a webhook endpoint that is not listed there, including one that is public only because no rule names it. This applies with or without app auth.
- **Add `webhook.verify` to call protected endpoints.** `verify` is a request that checks the sender before the routine runs. When it returns `true` or `{ verified: true }`, the routine runs as a trusted system context. When it returns anything else or throws, the endpoint answers `401` and the routine never runs. A webhook without `verify` runs untrusted throughout, so its `CallApi` steps to protected endpoints fail, as do those to module endpoints, which are protected by default.

```yaml
# v6
api:
  - id: github-webhook
    type: Api
    webhook: true
    routine:
      # ...

# v7
auth:
  api:
    public:
      - github-webhook
api:
  - id: github-webhook
    type: Api
    webhook:
      verify:
        connectionId: github_signature
        type: GitHubSignature
        properties:
          rawBody:
            _payload: rawBody
          signature:
            _payload: headers.x-hub-signature-256
          secret:
            _secret: GITHUB_WEBHOOK_SECRET
    routine:
      # ...
```

The verifier's `_payload` is `{ body, rawBody, query, headers }`. Use `rawBody` for signature checks.

Webhook responses change too:

- **Plain JSON.** A date in the `:return` value arrives as an ISO string, not `{ "~d": 1767323045000 }`, and an error as its message fields, not `{ "~e": ... }`.
- **Statuses.** A `:reject` without `:status` answers `400` with `{ error: { code: 'rejected', message } }`. A failed `ValidateSchema` step answers `400` (`invalid_request`), a failed verifier `401` (`unauthorized`), and any other error `500` (`internal_error`) with nothing from the error. A routine that succeeds still answers `200` with its return value.

Set `:status` (400 to 499) and `:body` on a `:reject` to choose the answer. See [Lowdefy APIs](/lowdefy-api).

### Detached `CallApi` runs as the user who started it

In v6 a `CallApi` step with `detached: true` always ran its target as system. In v7 the detached run carries the identity of the run that started it, and checks the target endpoint's `auth` as a synchronous call would. A detached run that a user started fails when that user may not call the target endpoint. Runs started by a schedule, an auth hook or a verified webhook still run as system.

### Module endpoints and agents are protected by default

In an app with auth, an API endpoint or agent that a module ships needs a signed-in caller, unless the module lists it as public in its manifest (`auth.api.public` for endpoints, `auth.agents.public` for agents) or the app makes it public with `auth.api.public: true` or a `public` list that names it. An app endpoint with no `auth.api` rule stays public, but a module endpoint does not.

This covers `CallApi` steps too: a public app endpoint, or a webhook without `verify`, that calls a module endpoint is refused when the caller is signed out. To keep a module endpoint or agent public, list its id in the app's `auth.api.public`. Apps without auth are unchanged.

## Error classes

A few failures now have a different error class or HTTP status. Update `catch` actions and routine `:catch` blocks that check `_error.name`, and outside callers that check status codes.

- **Auth refusals keep their class in the browser.** When a `Request` or `CallAPI` is refused, `_error.name` (and `_actions.<id>.error.name`) is the refusal's class: `AuthenticationError` (signed out, `401`), `AuthorizationError` (missing role, `403`), `TwoFactorEnrolmentRequiredError` (`403`), or `UserError` for a `400`. In v6 all of these were `ActionError`. The message still shows and `catch` actions still run, but the error logs to the browser console only.
- **A refused signed-in caller gets `403`.** A request, endpoint, agent or websocket that refuses a signed-in caller answers `403` with an `AuthorizationError`. In v6 an endpoint refused for a missing role answered `500` with a "does not exist" error.
- **A wrong HTTP method gets `405`**, not `500`.
- **HTTP 429 is a `ServiceError` on every connection**, not a `RequestError`. Its `statusCode` is `429` and `retryAfter` holds the service's `Retry-After` value. A check on `_error.statusCode` keeps working.
- **MongoDB driver errors are `ServiceError`s.** Every `MongoDBCollection` request maps a driver failure to a `ServiceError` whose message names the collection and the operation, whose `code` is the MongoDB error code, and whose `hint` says what to do. The driver's own message no longer reaches the browser, because it can quote values from the document. It stays in the server log.

## Build checks

These checks fail builds that v6 accepted. Each points at the config location.

- **`_if` without `test`.** An `_if` whose params are an object without a `test` key, such as `_if: { _eq: [1, 1], then: a, else: b }`, fails the build. In v6 it failed at runtime with `_if takes a boolean type for parameter test`. Params that are one operator, such as `_if: { _state: if_params }`, still pass. Silence the check on a node with `~ignoreBuildChecks: [if-test]`.
- **`CallMethod` to a missing block.** A `CallMethod` whose literal `blockId` names no block on the page warns in dev and fails production builds. Pages with Dynamic blocks are not checked. Silence it with `~ignoreBuildChecks: [callmethod-refs]`.
- **Endpoint `payloadSchema`.** A `payloadSchema` that is not valid JSON Schema fails the build, as does a `schedules` entry whose `payload` doesn't match its endpoint's schema.
- **Webhooks.** A webhook endpoint not listed in `auth.api.public`, or one that also declares `payloadSchema`, fails the build. See Webhooks above.

## `_operator` names read at runtime

An `_operator` whose `name` is read at runtime (from state, a request, a payload or `__args`) must list the operators it may call in `operators`, or the build fails. The build loads exactly those operators with the page, so the call works on a direct page load, and `_operator` refuses any other name. A literal `name`, and the literal branches an `_if` or `_switch` returns, need no list.

```yaml
# v6
_operator:
  name:
    _state: aggregation
  params:
    _state: values

# v7
_operator:
  name:
    _state: aggregation
  operators:
    - _sum
    - _product
  params:
    _state: values
```

## Blocks returned as data by a Dynamic endpoint

A `Dynamic` block without a dynamic blocks policy renders only the blocks and actions its endpoint writes in its `:return` config. Block config the endpoint reads as data (a database record, routine state, a nested endpoint's result) and returns as it is now renders the block's fallback, even when it holds no operators. Data can still fill values in written blocks, for example by mapping stored fields into blocks with `_array.map`.

To render stored or generated block config, declare a [dynamic blocks policy](/dynamic-page-content#dynamic-blocks-policies) that lists what the content may use, put it on the `Dynamic` block, and return the content through a `ValidateDynamic` step with the same policy:

```yaml
- id: check
  type: ValidateDynamic
  properties:
    policy: stored_content
    blocks:
      _step: get_record.blocks
- :return:
    blocks:
      _step: check.blocks
```

### Escaped keys in Dynamic data

A Dynamic endpoint writes client operators with an extra underscore (`__state`), so the server leaves them for the page to run. In 6.1 the server stripped one underscore from every key that started with `__`, data included, so GraphQL's `__typename` reached the page as `_typename`. In v7 only operator keys lose the underscore. Data keys pass through unchanged:

```yaml
- :return:
    blocks:
      - id: orders
        type: Table
        properties:
          data:
            _step: get_orders # rows like { __typename: Order, id: 42 }

# v6: the rows reached the block with a _typename key
# v7: the rows reach the block with a __typename key
```

Config that read such a key by its 6.1 name, `_typename`, has to use the original name, `__typename`. Data read into a Dynamic `:return` may also nest at most 200 levels deep. Deeper data fails resolution with an error that says so.

## `ClickableHtml` data events

A `ClickableHtml` block now fires only the events its `dataEvents` property lists. A `data-event` whose name is not listed does nothing and logs a console warning, and a block without `dataEvents` fires no events from its HTML. HTML is often built from request or user data, and sanitising keeps `data-*` attributes, so in v6 markup inside that data could fire any event the block declared.

```yaml
# v6
- id: rows
  type: ClickableHtml
  properties:
    html: '<i data-icon="delete" data-event="onDelete" data-id="42" data-confirm="Delete?"></i>'

# v7
- id: rows
  type: ClickableHtml
  properties:
    dataEvents:
      - name: onDelete
        confirm: true
    html: '<i data-icon="delete" data-event="onDelete" data-id="42" data-confirm="Delete?"></i>'
```

An entry is an event name, or `{ name, confirm }`: with `confirm`, every click on the event asks first, whatever the markup says. The `clickable-html-data-events` codemod in `lowdefy upgrade` adds `dataEvents` to each block and reports HTML built from data that inserts values without escaping them. It only reaches the app's files: add `dataEvents` yourself to `ClickableHtml` blocks that [dynamic page content](/dynamic-page-content) builds at page load, for example from config stored in a database. See [HTML attributes](/html-attributes).

## `RenderNotification` landing page

`properties.landingPage` on a `RenderNotification` step names the landing page by its id, or as `{ pageId, pathParams }` when the page's `path` has placeholders. The step builds the landing URL from the page's path like any other notification link. A value that names no page, such as the v6 path string, fails the step with an error that says to pass the page id.

```yaml
# v6
- id: render
  type: RenderNotification
  properties:
    landingPage: /notifications/link

# v7
- id: render
  type: RenderNotification
  properties:
    landingPage: notifications-link
```

See [Lowdefy APIs](/lowdefy-api).

## AI requests and agents

The AI plugins move to AI SDK 7. Lowdefy's own config is unchanged apart from the points below.

### System messages in `messages`

`GenerateText` and `GenerateObject` refuse a `role: system` message in `messages` unless the request sets `allowSystemInMessages: true`. A message list built from user input (`_payload`, `_state`) could otherwise carry a system turn the model treats as the app's own instructions. Put the system prompt in `system`:

```yaml
# v6
- id: summarise
  type: GenerateText
  connectionId: claude
  properties:
    messages:
      - role: system
        content: Summarise the ticket in one line.
      - role: user
        content:
          _payload: ticket

# v7
- id: summarise
  type: GenerateText
  connectionId: claude
  properties:
    system: Summarise the ticket in one line.
    messages:
      - role: user
        content:
          _payload: ticket
```

If the system message is written in your own config and has to stay in `messages`, set `allowSystemInMessages: true`. Never set it for messages that come from a user.

### Files the server downloads

When the model doesn't take a file in `messages` as a link (a CSV or text file on most providers, most files on Google), the server downloads it. `GenerateText`, `GenerateObject` and agents now limit that download:

- Only an `https:` link to a public address is downloaded. The address is checked after DNS resolution and on every redirect, so `http:` links and links to private or internal addresses fail.
- A file is capped at 20 MB and 30 seconds by default. Raise the limits with `fileDownload: { maxBytes, timeout }` (bytes and milliseconds) on the request or agent.

### Calls are cancelled at the request timeout

An AI call is cancelled when the request that started it closes: when `config.requestTimeout` answers first, or, on the Node server, when the client disconnects. In v6 a synchronous routine kept running, and billing, after its request timed out. A call stopped by the timeout fails with a `ServiceError`, and one stopped because the client left fails with a `UserError`. Endpoints with `async: true`, detached runs and agent chat turns are not cancelled with their request, so move work that takes longer than `config.requestTimeout` into an `async: true` endpoint.

### Agent hook payloads

Agent hooks keep their names, but the event payloads passed to `onStart`, `onStepStart`, `onToolCallStart`, `onToolCallFinish` and `onStepFinish` now follow AI SDK 7's event shapes. Check any hook endpoint that reads fields from them.

## Websockets

- **Cross-origin upgrades are refused.** `/api/websocket` accepts an upgrade only when its `Origin` matches the `Host` it arrived on, the first `X-Forwarded-Host`, or the app's public URL (`BETTER_AUTH_URL`, the current environment's `url`, or an auth trusted origin). A request with no `Origin`, such as a server or script, is accepted. Any other upgrade gets a `403`. Behind a proxy or CDN, forward the original `Host` or set `X-Forwarded-Host`.
- **Connections follow the session.** The server checks the caller again before every subscribe and at least once a minute. When the user signs out, the session ends, the membership is removed, the roles change or the user switches organization, the server closes the connection with code `4401`. The client reconnects at once as the current caller and resubscribes. A subscription the new caller may not hold fails, as it would on a freshly loaded page.
- **Change streams run the connection `read` check.** A connection with `read: false` refuses a `MongoDBChangeStream` subscription, as it refuses read requests. Remove `read: false` from a connection used for change streams.

## Blocks

### Link schemes

A block `href` is used only when it is a relative path, a query, a fragment, or uses one of these schemes: `http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` or `matrix`. Any other value, including one with leading whitespace or control characters, renders no link. This covers `Button`, `Tag` and `FloatButton`, table and AgGrid link cells, `AgentChat` links, Tiptap mention links, and every `href` given to Lowdefy's `Link` component. A `Link` with a refused `href` doesn't fall back to its `pageId` or `url`, and the `Link` action throws "Invalid Link: no target resolved."

### `Pagination` `skip`

The `onChange` and `onSizeChange` events of `Pagination` passed a `skip` one page too high (`current * pageSize`). They now pass `(current - 1) * pageSize`, the same as the block value in state. Remove any correction the app applied:

```yaml
# v6
skip:
  _subtract:
    - _event: skip
    - _event: pageSize

# v7
skip:
  _event: skip
```

Apps that read `skip` from the block value in state are not affected.

### Properties that now apply

These properties were accepted but had no effect in v6. They now work, so pages that set them may look or behave differently:

- **Page blocks:** `class`, `loading` and `skeleton` set on the page block.
- **Layout:** `layout.align` sets the vertical alignment of a block's content area. In v6 it was dropped, with a console warning, unless `layout.selfAlign` was also set.
- **`theme`:** on `Layout`, `Sider`, `PageHeaderMenu` and `PageSiderMenu`, and on `AutoComplete`, `ColorSelector`, `Search`, `Label`, `ConfirmModal` and `ConfigProvider`. `TreeSelector` and `TreeMultipleSelector` now apply the selector tokens.
- **`Menu`:** an inline `Menu` with `collapsed: true` outside a `Sider` collapses, and the `item` style applies.
- **`Sider`:** the collapse trigger toggles the sider.
- **CSS keys:** `Tabs` `tabBar`, `tabPane` and `inkBar`; the `menu` key of `DropdownButton` and `DropdownMenu`; the `profileMenu` and `localeSelectorMenu` keys of `Header` and the page layouts; `Modal` `header`, `footer` and `content`; and the `Popover` keys.
- **Other:** `Pagination` `showTotal: false` hides the total, `Tour` `gap: { x, y }` applies, a `Notification` `button` closes the notification, and `ConfirmModal` fires `onClose`.

### `ColorSelector`

Clearing the colour sets the value to `null`. In v6 it was the last colour with zero alpha, such as `#1677ff00`. A cleared `ColorSelector` with `required: true` now fails validation. In gradient mode the value is a `linear-gradient(...)` CSS string.

### `PhoneNumberInput`

The region selector and the input are siblings in an `.ant-space-compact` group, not an `.ant-input-group-addon`. The `ldf-phone-number-input` class and `element` style stay on the outer wrapper, but CSS that targets `.ant-input-group-addon` or `.ant-input-group-wrapper` needs updating. The `addonBg` theme token no longer applies; use `selectorBg`.

### `TitleInput` and `ParagraphInput`

Both now edit in place and show no edit icon by default. Set `editable.icon` to bring one back:

```yaml
- id: title
  type: TitleInput
  properties:
    editable:
      icon: edit
```

Expanding a `ParagraphInput` ellipsis fires `onExpand`, not `onCopy`.

## Vercel

The function entry that `lowdefy vercel-output` writes now starts the same way as the Node server. Redeploy to pick it up.

- **Environment guards are checked.** `config.environments.<name>.guards` run when a function starts. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables. See [Deployment Environments](/deployment-environments).
- **Server-side Sentry runs.** With `SENTRY_DSN` set, server errors now reach Sentry from Vercel functions, where v6 only logged them. It reports errors only; set `logger.sentry.serverTracing: true` to trace requests, or `logger.sentry.server: false` to turn server reporting off.

## Dev tools and coding agents

- **The MCP server is renamed `lowdefy`.** It was `lowdefy-docs`, so its tools are now `mcp__lowdefy__*`. Rerun `lowdefy agent-setup`: it replaces the `lowdefy-docs` entry in `.mcp.json` with a `lowdefy mcp` entry that names no port, and renames the server in `.claude/settings.json` and `.claude/settings.local.json`, including tool permission rules. Update any other place that names `mcp__lowdefy-docs__` tools, such as hooks. The `--port` option of `agent-setup` is removed. The dev server's `/lowdefy-docs` routes are unchanged.
- **`lowdefy dev` uses the port you set.** A port set with `--port`, `PORT` or `cli.port` is used, or the command fails when it is taken. In v6 it moved to the next free port. Only the default port 3000 still moves.
- **`@lowdefy/e2e-utils` no longer reuses a running server by default.** A server left on the port could serve an old build. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse one, for example after `pnpm e2e:server`, and `LOWDEFY_E2E_PORT` to run on another port. A reused server must be this app's own e2e build, or the run stops with an error.
- **Generated servers are their own pnpm workspace.** `lowdefy dev`, `build`, `emails` and `test` give the server in `.lowdefy/` its own `pnpm-workspace.yaml` and lockfile, carrying over the parent workspace's settings. If the app sits inside a pnpm workspace, remove the `.lowdefy/*` globs from the parent's `pnpm-workspace.yaml` `packages`. If the parent's patches only apply to the servers, also set `allowUnusedPatches: true` there.

## Plugins

Blocks no longer import icons from `react-icons` or `@ant-design/icons`, and the Lowdefy server no longer installs `react-icons`. A local block plugin should render icons by name with `components.Icon`, and list the names it uses in its `meta.icons`, so apps can restyle them:

```js
// v6
import { AiOutlineDelete } from 'react-icons/ai';
<AiOutlineDelete />;

// v7
<components.Icon blockId={`${blockId}_delete`} events={events} properties="delete" />;
```

A plugin that must keep importing `react-icons` adds it to its own `dependencies`.

### antd version

Lowdefy v7 uses antd 6.6.5, Ant Design X 2.9.0 and `@ant-design/icons` 6.3.4. A block plugin that imports from `antd` directly should pin `antd@6.6.5`, so the app keeps one copy of antd.

### Declare the actions and operators a block runs

Production pages now load only the blocks, actions, operators and icons they use. A block that runs actions or operators for events it registers itself, the way `PageHeaderMenu` runs `SetLocale` from its locale selector, must list them in its `meta`. Otherwise, on a page that doesn't use those types anywhere else, they are not loaded, and the action fails with `Invalid action type`:

```js
MyHeader.meta = {
  category: 'container',
  actions: ['SetDarkMode', 'SetLocale'],
  operators: ['_event'],
  icons: [],
};
```

The dev server still loads every type, so this shows up only in production builds.

### `createIcon`

`createIcon` in `@lowdefy/client` takes `{ icons, loadAllIcons }` instead of the icon map on its own.
