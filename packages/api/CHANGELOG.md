# Change Log

## 6.0.0

### Major Changes

- 8a82fb0: feat!: Replace Next.js with Vite + Hono.

  Lowdefy servers no longer run on Next.js. The production server is a
  [Hono](https://hono.dev) app serving a [Vite](https://vite.dev)-built React
  client; the dev server runs Vite with the Hono app mounted as middleware,
  giving instant hot module replacement for plugin changes (~700ms instead of
  the previous 20–40s rebuild-and-restart cycle). Authentication moves from
  NextAuth v4 to the Auth.js v5 engine (`@auth/core` via `@hono/auth-js`) with
  the `auth:` YAML schema unchanged.

  **Your YAML config does not change.** `lowdefy build`, `lowdefy dev` and
  `lowdefy start` work as before.

  Breaking changes:

  - **Auth sessions invalidate once on upgrade.** The session cookie prefix
    changes from `next-auth.*` to `authjs.*` — users sign in again after the
    upgrade. Provider, adapter, callback and event configuration is unchanged.
  - **`NEXTAUTH_SECRET` is removed — rename it to `AUTH_SECRET`.** The build
    fails with a config error when auth providers are configured and
    `AUTH_SECRET` is not set. `NEXTAUTH_URL` still works as an Auth.js
    fallback, but `AUTH_URL` is the preferred name.
  - **Custom `next.config.js` files no longer apply.** Customize the client
    build with a `vite.config.js` in the server directory instead.
  - **`LOWDEFY_BUILD_OUTPUT_STANDALONE` is removed.** `lowdefy build` writes a
    complete runnable server to `.lowdefy/server` — copy that folder (or build
    in Docker) and run `node src/index.js`. See the updated Docker and node
    server deployment docs.
  - **`NEXT_PUBLIC_SENTRY_DSN` is removed.** Set `SENTRY_DSN` on the server —
    it is passed to the browser client at runtime, so rotating it no longer
    requires a rebuild. Source maps upload via `@sentry/vite-plugin` when
    `SENTRY_AUTH_TOKEN` is set.
  - **Page navigation is now client-side (SPA).** The first page load embeds
    config in the HTML; navigating fetches page config from `/api/page/*`
    without a full browser reload.

### Minor Changes

- c188656: feat: Scheduled API endpoints (cron) on Vercel.

  `Api` and `InternalApi` endpoints can now declare `schedules` to run their routine on a timer:

  ```yaml
  id: purge-stale-conversations
  type: Api
  schedules:
    - cron: '0 6 * * *'
      payload: { mode: full }
    - cron: '*/15 * * * *'
      payload: { mode: incremental }
  routine:
    - id: purge
      type: MongoDBDeleteMany
      connectionId: conversations
      properties:
        filter: { updatedAt: { $lt: { _payload: cutoff } } }
  ```

  - **build**: `schedules` is validated (Vercel cron syntax, unique crons per endpoint, object
    payloads) and passed through to the endpoint artifact; a `build/schedules.json` manifest is
    emitted for scheduled endpoints.
  - **api/servers**: a new `/api/cron/*` route runs a scheduled endpoint's routine as a system context
    (no user session — `_user` is `undefined`), resolving the payload from the firing schedule via the
    `x-vercel-cron-schedule` header, and secured by the `CRON_SECRET` env var (fails closed).
  - **cli**: the Vercel deployment now uses the Build Output API. `lowdefy init-vercel` scaffolds a
    `vercel.build.sh` and a new `lowdefy vercel-output` command assembles `.vercel/output/`
    (static + one `api.func` + `config.json`), generating the `crons` array from the declared schedules
    on every deploy — nothing is committed by hand.

  This migrates how all Lowdefy Vercel apps deploy; re-run `lowdefy init-vercel` (or update the
  `deploy/` files by hand) after upgrading. Cron jobs run in UTC and are subject to Vercel plan limits
  (Hobby: daily only; Pro: per-minute).

- b496a77: feat: AI in API routines — one-shot LLM requests and CallAgent steps

  **One-shot LLM request types (`@lowdefy/connection-anthropic`, `@lowdefy/connection-openai`, `@lowdefy/connection-google`, `@lowdefy/connection-ai-gateway`)**

  All AI provider connections now provide `GenerateText` and `GenerateObject` request types — single model calls usable as API routine steps and page requests. The type names are shared across providers, so switching providers only means changing the `connectionId`.

  - `GenerateText` generates text from a prompt and returns `{ text, reasoningText, finishReason, usage }`.
  - `GenerateObject` generates structured data matching a JSON Schema and returns `{ object, finishReason, usage }` — ideal for classify, extract, and routing decisions inside routines.

  ```yaml
  routine:
    - id: classify
      type: GenerateObject
      connectionId: claude
      properties:
        model: claude-haiku-4-5
        prompt:
          _payload: ticket_text
        schema:
          type: object
          properties:
            category: { type: string }
  ```

  **CallAgent routine step (`@lowdefy/api`, `@lowdefy/build`, `@lowdefy/ai-utils`)**

  API endpoint routines can now run an agent to completion with the new `CallAgent` step. The agent runs headlessly — no chat UI, no streaming — looping through its tools until done, and stores `{ text, finishReason, usage, toolCalls, toolResults }` in `_step`.

  ```yaml
  routine:
    - id: research
      type: CallAgent
      properties:
        agentId: research_agent
        prompt: Summarize yesterday's signups and flag anomalies.
  ```

  - Tools marked `confirm: true` auto-execute in headless runs (the build emits a warning — there is no client to approve them).
  - Agent server hooks still fire; `onFinish` `dataParts` are ignored since there is no stream.
  - Agent tool and hook endpoint calls now count toward the endpoint call depth cap of 10, so recursive agent/endpoint configurations terminate with an error.
  - The build validates that a static `agentId` on a `CallAgent` step references an existing agent.

- 60401aa: feat: Add `_app` operator and structured app metadata.

  The `_app` operator reads the app's declared metadata — `slug`, `name`,
  `version`, `description`, `license`, `lowdefyVersion`, `gitSha`. It
  resolves both at build time and at runtime (client and server) with
  identical values, including inside `modules-mongodb` request filters and
  inside `_js` functions via a bound `lowdefyApp(p)` callable. For
  build-time positions nested inside another `_build.*` operator (e.g. a
  `_build.object.fromEntries` map key), use the `_build.app` form so it
  resolves in time.

  A referenced `slug` is mandatory: `_app: slug` (or `_build.app: slug`)
  fails the build when `slug` is not declared, guarding against a `null`
  slug silently scoping namespaced data. The object form with an explicit
  `default` is the opt-out. Other fields return `null` when unset, and an
  app that never references `slug` need not declare it.

  The root `lowdefy.yaml` schema gains two new optional fields:

  - `slug` — a kebab-case identifier (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`),
    validated at build time. Build fails with a clear error if invalid.
  - `description` — a free-form string.

  Root metadata fields (`slug`, `name`, `description`, `version`,
  `license`, `lowdefy`) accept literals and `_build.*` operators only;
  `_ref`, `_var`, and static `_` operators are no longer resolved in these
  positions and fail the build with a clear error naming the field. Use
  `_build.env` for a deploy-time slug or name.

  `gitSha` resolves through a fallback chain: `LOWDEFY_GIT_SHA` env var
  when set non-empty → `git rev-parse HEAD` → `null`. This lets apps
  deployed without `.git` (Docker, Vercel, Netlify, Render, hermetic
  PaaS sandboxes) pin the SHA explicitly by mapping their platform's
  commit env var via shell expansion in the build command.

  Build emits a new `appMeta.json` artifact alongside `app.json`. The
  existing `app.git_sha` field is removed; consumers (internal telemetry)
  read `gitSha` from `appMeta` instead.

  See the `_app` operator reference for the full key set and examples.

- 37c8c14: feat: `auth.strategies` — apiKey and JWT header authentication for API callers.

  - New `auth.strategies` config block: apiKey (default `X-API-Key` header) and jwt strategies, each granting the caller the strategy's `roles`.
  - MCP and service clients that cannot hold a session cookie authenticate per request; a matched strategy yields a caller (`apiKey:{strategyId}:{keyId}`) that flows through the existing authorization and `_user` machinery.
  - Unauthenticated calls to role-gated endpoints now return 401 (`AuthenticationError`) instead of a masked error.

- 7ce6e36: feat: Per-environment cron schedules, forwarded from the production deployment.

  Vercel fires cron jobs only on the production deployment, so staging and other environments never
  ran their schedules. Declare the deployment environments once and Lowdefy registers every
  environment's schedules on production, forwarding the ones for other environments to that
  environment's own `/api/cron/<endpointId>` as a fire-and-forget ping:

  ```yaml
  config:
    cron:
      environments:
        production: {} # no url: the deployment Vercel fires crons on
        staging:
          url: https://staging.example.com
          secret: STAGING_CRON_SECRET # Lowdefy secret holding staging's CRON_SECRET
  ```

  `schedules` can then be keyed by environment, with a `default` every other environment inherits and
  `[]` turning crons off — including through module vars, so a module's
  `schedules: { _module.var: tick_schedule }` needs no change:

  ```yaml
  schedules:
    default:
      - cron: '*/5 * * * *'
    staging:
      - cron: '0 * * * *'
    develop: []
  ```

  - **build**: validates `config.cron` (exactly one environment without `url`; `url` + `secret` on the
    others; `enabled: false` registers nothing), resolves keyed schedules onto every declared
    environment, and emits `schedules.json` entries with `environment` and `forward`.
  - **api/servers**: a new `/api/cron-forward/<environment>/<endpointId>` route (secured by
    `CRON_SECRET`) pings the target environment with its own `CRON_SECRET` read from
    `LOWDEFY_SECRET_<secret name>` on the production deployment (fails closed when unset) and answers
    immediately; `/api/cron/*` honours the `x-lowdefy-cron-environment` header forwarded requests carry.
  - **cli**: `lowdefy vercel-output` registers forwarded schedules as `/api/cron-forward/...` cron jobs.

  Existing apps without `config.cron` are unaffected.

- e0a06a2: feat: Dynamic page content — server-resolved blocks at page load.

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

- 58ae85e: feat: Email branding defaults from app config, and relative logo paths.

  Notification email branding (`app.email`) now inherits from your existing app config when not set explicitly:

  - `companyName` defaults to the app's root `name:`. Note this means apps with a `name:` now render a company name header in emails by default — set `companyName: ''` to opt out.
  - `primaryColor` defaults to `theme.antd.token.colorPrimary`, so branded apps get brand-colored email buttons without repeating the color.

  The email `logo` can now be an app-relative path to a `public/` asset (for example `logo: /logo-light-theme.png`). It resolves against the `serverUrl` passed to the `RenderNotification` step, so one config works across environments. When no server URL is available — including the `lowdefy emails` preview — the logo is omitted and the header falls back to the `companyName` text instead of a broken image.

- 742a900: feat: Email notification rendering

  Lowdefy apps can now define notifications in config: branded emails rendered from framework templates, delivered over any SMTP provider. The framework renders; storing and sending are composed in YAML routines — so any database works through its normal request types, and apps or modules own the notification record.

  **`notifications:` config section (`@lowdefy/build`, `@lowdefy/api`)**

  - New root section where the template is the type: `{ id, type, properties }` with per-notification `theme` overrides and `testData`
  - Template properties are nunjucks data templates — `{{ task.title }}` interpolates against the pipeline's data with no operator syntax; interpolated values are inert (can never inject markup or links)
  - New `RenderNotification` API routine step: renders one data item per call and returns `{ subject, title, preview, html, text, data }` where `data` is the link-resolved item — inserting the record, deduplicating, sending and updating send results are plain routine steps (`:for`, requests, `_uuid`)
  - New `app.email` theme settings (logo, companyName, primaryColor, signature, footer)
  - Link resolution is driven by the step's `serverUrl`, `landingPage` and `recordId` properties: `{ pageId, urlQuery }` links resolve to direct page URLs, or through a landing page (`?_id=<recordId>&option=<dotpath>`) that can mark the record read before redirecting (for example the modules-mongodb notifications module's link page)

  **Email templates (`@lowdefy/email-templates`)**

  - Three React Email templates: `NotificationEmail` (message, metadata table, quoted comment, CTA button, action list), `DigestEmail` (item roundups) and `AlertEmail` (status-toned notices)
  - Sections render only when configured; markdown in `message` with raw HTML disabled
  - Custom templates are plain React Email plugin packages under the new `notifications` type category

  **SMTP connection (`@lowdefy/connection-smtp`)**

  - New `SMTP` connection wrapping nodemailer — works with SES, Postmark, Mailgun, Resend and self-hosted servers; `SMTPMailSend` request type
  - Environment-aware delivery `filter` (`replaceAddress` catch-all, domain `allowlist`, `regex`) applied to every send

  **SendGrid (`@lowdefy/connection-sendgrid`)**

  - Supports the same delivery `filter` and default `replyTo`; interchangeable with SMTP wherever a routine sends notification emails
  - Array requests now send per message; request-level `templateId` is no longer overridden by an unset connection `templateId`

  **Preview CLI (`lowdefy`)**

  - New `lowdefy emails` command: builds the app, generates a preview per notification from its `testData`, and opens React Email's preview server; warns when a template data key is missing from `testData`

  Builds also now validate that `CallAgent` steps reference existing agents — previously this check existed but never ran, so broken agent references that used to build will now fail with a config error.

- 51c3008: feat: Endpoint execution controls for serverless deployments.

  - `config.vercel { maxDuration, memory }` in `lowdefy.yaml` flows into the generated Vercel function config (default stays 60s).
  - `async: true` on Api/InternalApi endpoints responds `{ accepted: true }` immediately and runs the routine in the background (kept alive via the platform request context; outcome observable through logs).
  - `detached: true` on CallApi steps fire-and-forgets the target through the new `POST /api/detached/<endpointId>` route (CRON_SECRET transport auth), running it in its own invocation with a fresh duration budget.
  - `webhook: true` on endpoints turns them into third-party webhook receivers on the standard `/api/endpoints` route: raw `{ body, query, headers }` payload, verbatim response body, system context — caller auth is the routine's first step. Non-webhook endpoints are unchanged.

- a858f8f: feat: MCP server exposing API endpoints as tools.

  - New root `mcp` config block (`name`, `version`, `endpoints`) — listed `Api` endpoints are served as MCP tools at `POST /api/mcp` over streamable HTTP.
  - Endpoint `description` and `payloadSchema` become the tool description and inputSchema; both are required for exposed endpoints, and `InternalApi` endpoints cannot be exposed.
  - Tool listing and calls are authorized per request with the caller's session; the build always writes an `mcp.json` artifact (`configured: false` when no endpoints are listed).

- c97b1da: feat: MCP server branding — `mcp.title`, `mcp.websiteUrl` and `mcp.icons`

  MCP clients such as claude.ai render a card for each connected server, and with only `name` and `version` in `serverInfo` they fall back to guessing a logo from the host — often a stale or unrelated favicon. The app's `mcp` block now accepts the MCP `Implementation` branding fields, passed through verbatim in the `initialize` result:

  ```yaml
  mcp:
    name: encircle
    version: '1.0.0'
    title: Encircle
    websiteUrl: https://encircle.co.za
    icons:
      - src: https://app.encircle.co.za/icon-512.png
        mimeType: image/png
        sizes: ['512x512']
    endpoints: [...]
  ```

  Each icon needs a `src`; `mimeType`, `sizes` and `theme` (`light` | `dark`) are optional. Keys that are not configured are omitted from `serverInfo` rather than sent as `undefined`.

- 660bbfc: feat: Support running multiple dev apps side by side.

  Running several Lowdefy dev servers on `localhost` previously clashed on
  ports and shared a single auth cookie jar (browsers scope cookies by host,
  not port), so logging into one app logged you out of another. Three changes
  make concurrent dev apps work:

  - **Per-app auth cookies.** Cookie names are now resolved through a
    precedence chain: an explicit `auth.advanced.cookies` is used verbatim;
    otherwise an explicit `auth.advanced.cookiePrefix` namespaces the cookie
    names (dev and prod); otherwise the dev server derives a prefix from the
    app `slug`/`name` so each app gets its own cookie jar. Production with no
    config is unchanged (Auth.js defaults). Only cookie names are overridden —
    cookie options continue to come from Auth.js defaults via its config
    merge. The schema gains an optional `auth.advanced.cookiePrefix` string.
  - **Automatic port selection.** The CLI now finds the next available port
    instead of erroring when the requested port is in use, warning which port
    it landed on.
  - **Auth URL mismatch warning.** Auth.js derives the app origin from
    request headers (`trustHost`), so an unset `AUTH_URL` already works on
    whatever port the dev server lands on. When `AUTH_URL` (or the v4
    fallback `NEXTAUTH_URL`) is pinned to a different port, the dev server
    warns that sign-in callbacks and redirects will target the pinned URL.

  Set the same `cookiePrefix` on two apps to intentionally share an auth
  session in dev.

- efd1967: feat: Add websockets — a first-class realtime primitive.

  Define channels under a new top-level `websockets:` key and subscribe pages to them with `subscriptions:` — live dashboards, notifications, and chat without polling or an external socket service. The same Lowdefy server that serves your pages pushes messages over a single multiplexed WebSocket connection, locally and on Vercel (native WebSocket support on Fluid compute). Authentication uses your existing session, with per-channel `auth.websockets` roles.

  **Channels (`websockets:`)**

  - Websocket types are plugins: `Channel` (client pub/sub relay) and `Interval` (timed ticks) ship in the new `@lowdefy/websockets-core` package; `MongoDBChangeStream` in `@lowdefy/connection-mongodb` pushes MongoDB change events to subscribed pages.
  - Channel `properties` are evaluated server-side per subscription — `_payload` and `_user` make channels user-specific. Subscribers with identical evaluated properties share one running source.

  **Page subscriptions (`subscriptions:`)**

  - Pages subscribe on mount and unsubscribe on navigation — no wiring needed.
  - React to messages with `onMessage`, `onSubscribe` and `onError` events, or read channel state anywhere with the new `_websocket` operator (`connected`, `messages`, `lastMessage`, `messageCount`, `error`).
  - Renders are throttled (`client.throttleRender`) and message history is bounded (`client.maxMessages`).

  **Actions**

  - New `Publish`, `Subscribe` and `Unsubscribe` actions in `@lowdefy/actions-core` — publish messages to a channel or control subscriptions dynamically.

  The client reconnects with backoff and resubscribes automatically, so serverless connection limits (e.g. Vercel function `maxDuration`) are invisible to users. See the new WebSockets section in the docs for a quick start.

### Patch Changes

- 6d38790: fix(api): Close the pre-authentication endpoint existence oracle.

  With `auth.strategies`, an anonymous call to a protected endpoint returns 401, while a missing endpoint id still returned "does not exist" — so a logged-out caller could enumerate endpoint ids by response difference. On an app with auth configured, a session-less caller now gets the identical `Authentication required for API endpoint "..."` answer for a missing id, an `InternalApi` id and a protected id, over both `/api/endpoints/*` and MCP `tools/call`. Authenticated callers, apps without auth, and system runs (scheduled, webhook, detached) keep the opaque "does not exist".

- 0f9487d: fix(api): Log routine errors under pino's `err` key so the error serializer runs.

  `controlThrow`, `controlReject`, and `handleValidateSchema` logged the thrown
  `Error` under the key `error`, but the logger built by `createNodeLogger`
  registers its error serializer for the `err` key only. Since `Error.message`
  and `stack` are non-enumerable, the un-serialized dump lost the message
  entirely — every `:throw`/`:reject` printed as
  `{"name":"UserError","isLowdefyError":true,"isReject":false}` with no way to
  tell which error occurred. Logging under `err` runs the registered serializer
  and lands the full serialized error (message, stack, cause) in the log line.

- 8398345: fix(api): CallApi steps inside scheduled, webhook, and detached endpoint routines no longer fail authorization; the system context now authorizes nested endpoint calls.

  Scheduled (cron), webhook, and detached endpoint runs execute as a system context with no
  user session. Nested CallApi steps in those routines were re-authorized against that
  session-less context, so any call to a protected (`auth.public: false`) endpoint threw
  `API Endpoint "<id>" does not exist.` — silently breaking cron endpoints that compose other
  endpoints via CallApi. A routine that is already executing was authorized at its entry point
  (CRON_SECRET or webhook token), so the system context now authorizes nested endpoint calls
  unconditionally. User-session behavior is unchanged: a user-initiated CallApi chain still
  re-authorizes each target against the user's roles.

- Updated dependencies [082acec]
- Updated dependencies [da0c62c]
- Updated dependencies [a647873]
- Updated dependencies [c188656]
- Updated dependencies [b496a77]
- Updated dependencies [60401aa]
- Updated dependencies [37c8c14]
- Updated dependencies [a6daf0b]
- Updated dependencies [0dccf40]
- Updated dependencies [7ce6e36]
- Updated dependencies [0407d43]
- Updated dependencies [28cb944]
- Updated dependencies [082acec]
- Updated dependencies [e0a06a2]
- Updated dependencies [58ae85e]
- Updated dependencies [742a900]
- Updated dependencies [51c3008]
- Updated dependencies [6730996]
- Updated dependencies [596212a]
- Updated dependencies [a858f8f]
- Updated dependencies [c97b1da]
- Updated dependencies [206d947]
- Updated dependencies [660bbfc]
- Updated dependencies [8a82fb0]
- Updated dependencies [efd1967]
- Updated dependencies [c5f176a]
- Updated dependencies [ae5f618]
- Updated dependencies [7746ce2]
- Updated dependencies [6446ae6]
- Updated dependencies [47ba6df]
- Updated dependencies [c9bea1c]
- Updated dependencies [982a3db]
- Updated dependencies [704cf4b]
  - @lowdefy/build@6.0.0
  - @lowdefy/operators@6.0.0
  - @lowdefy/operators-js@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/node-utils@6.0.0
  - @lowdefy/nunjucks@6.0.0
  - @lowdefy/ajv@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 3ead269: feat(helpers): Reject prototype-pollution key names in dot paths and key maps.

  `__proto__`, `constructor`, `prototype`, `__defineGetter__`, `__defineSetter__`,
  `__lookupGetter__` and `__lookupSetter__` are no longer accepted as path segments or as keys
  in maps built from user-supplied values.

  Previously these names were silently _filtered_ on write, which was worse than rejecting
  them: `SetState: { 'a.__proto__.b': 1 }` quietly wrote to `a.b` instead — a different
  location than the one you asked for. Reads could also walk up the prototype chain.

  What you will see now:

  - `:set_state` and the `SetState` action raise a config error naming the offending key and
    pointing at the line in your YAML.
  - Data-reading operators (`_state`, `_get`, `_user`, `_payload`, ...) return their default
    instead of a value.
  - A module entry id, an agent or endpoint id, or a `LOWDEFY_SECRET_*` environment variable
    using one of these names now fails at build or boot with a message naming it, instead of
    silently vanishing.

  Apps that do not use these names are unaffected. If you have a form field, state key, or API
  response property named `constructor`, rename it.

  Deep merges of configuration are hardened the same way, but skip reserved keys rather than
  raising — a reserved name arriving inside a merged _value_ is dropped so a single poisoned
  field can't abort an otherwise valid merge.

  `@lowdefy/helpers` also now exports `isReserved(key)`, so plugin and connection authors can
  test a key against this policy directly instead of catching a `ReservedKeyError`.

- 9e19a21: fix: Anonymous calls to protected agents are rejected.

  The `/api/agent` route ran agents without checking the session: on an app with `auth.api.protected: true`, a session-less caller could still execute any agent — tool calls failed endpoint auth, but the model call ran on the app's provider account. Agents now follow the `auth.api` config exactly like endpoints: `public`, `protected`, and `roles` patterns match agent ids, and unauthorized calls fail with the same error as an unknown agent id. Sub-agent invocations are authorized against the same session per call, matching how in-run endpoint tool calls are authorized.

  Note for apps using wildcard patterns in `auth.api.public` or `auth.api.roles`: those patterns now also match agent ids.

- 79bbd84: fix(api): Redact server internals from every client-bound error, not just the 500 response.

  Errors sent to a browser or an API caller now have `received` and `stack` stripped at
  **every** level of the error, and a non-`Error` `cause` dropped unless the error is a
  `UserError`. Two live leaks are closed:

  - The 500 handlers stripped fields from the outermost error only, so `cause.stack` — and
    the absolute server paths in its frames — reached production browsers.
  - An endpoint result body (`callEndpoint` and the agent route) and a request response body
    (`callRequest`) were not redacted at all. They carried `received`, which on the request
    path holds the **evaluated** request properties, so a `_secret` resolved into a request
    header crossed the wire at HTTP 200.

  `source` is now guaranteed config-relative (`pages/home.yaml:5`, never `/var/task/...`),
  and `configKey` is kept again: the browser deduplicates errors on `message:configKey`, so
  stripping it collapsed two different errors that happened to share a message and silently
  dropped the second.

  **Breaking for app config that reads `error.received`.** Server-originated errors no longer
  carry it, so `_actions` and `_request_details` expose `received` as `undefined`, and the
  browser console no longer prints the `Received: <json>` line for them. This is deliberate —
  the field can contain your own resolved secrets. The error `message` is unchanged, and
  server logs still record `received` and `stack` in full in every environment, including dev.

  Also fixes internal errors being logged twice. A `LowdefyInternalError` never gets a
  `source`, and the browser used `source` to decide whether the server had already logged an
  error, so it POSTed every internal error back to `/api/client-error` for a second log. The
  browser now reads the `handled` flag the server sets when it logs.

- 824f4be: fix(helpers): Serialized errors mark the values they cannot carry instead of dropping them.

  An error is turned into plain data in three places: the `err` field of a server log line, an error
  sent to a browser or API caller, and — new in this release — a dot-path read of an error value from
  config. That conversion used to lose fields silently and let a few live values through. Every own
  field of an error now appears, with anything unserializable replaced by a marker string:

  - A field holding a class instance no longer vanishes. A Node error carrying a `socket`, `agent` or
    similar field had that key dropped from the log line altogether, which is indistinguishable from
    the error not having the field; it now logs as `'[Object: Socket]'`. The instance's internals are
    still never expanded.
  - A field holding a function, a bigint or a symbol was passed through live. That leaked a closure
    over server state into serialized output, and a bigint field made `JSON.stringify` of the result
    throw `TypeError: Do not know how to serialize a BigInt`. These are now `'[Function: handler]'`,
    `'[BigInt: 10]'` and `'[Symbol: s]'`.
  - A circular `cause`, or an own field pointing back at the error itself, had its key dropped. Both
    are now `'[Circular]'`.
  - A `cause` chain longer than three levels ended with the fourth `cause` key simply absent. It is
    now `'[Truncated]'`.

  The markers are literal strings, so they show up wherever the serialized error does: a log line's
  `err.agent` reads `[Object: Socket]`, and `_actions: someAction.error.someField` can now resolve to
  `'[Object: Socket]'` rather than to the operator default.

  `extractErrorProps` also takes a new `omit` option — `extractErrorProps(error, { omit: (error) =>
['stack'] })`, called once per error node in the `cause` walk so a policy can key on the node it is
  looking at. `serializer.serialize` accepts the same function as `omitErrorProps` and passes it down.
  This is plugin and server API; app config is unaffected by it.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [6785e0e]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/operators@5.6.0
  - @lowdefy/node-utils@5.6.0
  - @lowdefy/operators-js@5.6.0
  - @lowdefy/nunjucks@5.6.0
  - @lowdefy/ajv@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/operators@5.5.1
- @lowdefy/operators-js@5.5.1
- @lowdefy/ajv@5.5.1
- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1
- @lowdefy/node-utils@5.5.1
- @lowdefy/nunjucks@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/operators@5.5.0
- @lowdefy/operators-js@5.5.0
- @lowdefy/ajv@5.5.0
- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0
- @lowdefy/node-utils@5.5.0
- @lowdefy/nunjucks@5.5.0

## 5.4.0

### Minor Changes

- 5e498dd: feat: Add ajv-formats + ajv-keywords plugins, a `compile({ schema })` export, and a `ValidateSchema` routine step

  **Breaking change:** `@lowdefy/ajv` now registers `ajv-formats` and `ajv-keywords` on the shared Ajv instance. Schemas that use `format: date-time` / `email` / `uri` / `uuid` / etc. or the `instanceof` keyword previously slipped through `validate()` un-validated; they are now checked. Schemas that were already invalid against these definitions will surface errors they did not before.

  **Additions**

  - `addFormats(ajv)` — registers all standard JSON Schema formats (`date`, `date-time`, `time`, `email`, `uri`, `uuid`, `regex`, `ipv4`, `ipv6`, …).
  - `addKeywords(ajv, ['instanceof', 'transform', 'regexp'])` — registers three `ajv-keywords` extensions:
    - `instanceof` — match JS class instances (e.g. `{ instanceof: 'Date' }`).
    - `transform` — normalise string values during validation (`transform: ['trim', 'toUpperCase']`); mutates the parent object in place. Useful for upload pipelines that need cleaned values before downstream processing.
    - `regexp` — full regex with flags (`regexp: '/^l[0-9]+$/i'` or `regexp: { pattern: '...', flags: 'i' }`); fills the gap left by JSON Schema's `pattern:` which has no flag support.
  - New `compile({ schema })` named export — returns a `(data) => { valid, errors }` function so callers can pre-compile a schema and reuse the validator across many calls without re-resolving through `Ajv.prototype.validate`.

  **Internal**

  - The configured Ajv instance is extracted into a new `src/ajvInstance.js`. Both `validate.js` and `compile.js` share it.
  - Plugin registration order is `ajv-formats` → `ajv-keywords` → `ajv-errors` so the `errorMessage` keyword can attach to format / instanceof errors.

  **`ValidateSchema` routine step (built-in)**

  A new connectionless server routine step (sibling to `CallApi`) that runs `@lowdefy/ajv` `validate` inside a routine. Properties:

  - `schema` — JSON Schema (required, operators evaluated).
  - `data` — value to validate (required, operators evaluated).
  - `throwOnInvalid` — boolean, default `true`. On invalid + `true`, the routine short-circuits with `status: 'error'` and the AJV errors attached as `error.cause`. On invalid + `false`, the routine continues and the step result `{ valid, errors }` is available to downstream steps as `_step.<stepId>`.

  Example:

  ```yaml
  routine:
    - id: validate_input
      type: ValidateSchema
      properties:
        schema:
          type: object
          required: [email]
          properties:
            email: { type: string, format: email }
        data:
          _payload: true
  ```

  Wired through the existing build → runtime path used by `CallApi`: `setStepId` assigns a `validate:` id prefix, `validateStep` enforces required props and forbids `connectionId`, `countStepTypes` skips it, and `runRoutine` dispatches the prefix to a new `handleValidateSchema` handler in `@lowdefy/api`.

  **Use case**

  The hydra `data-upload` plugin uses `compile({ schema })` to build a row validator from a tool's `columns[]` once per import and runs it against every row in the upload — pre-compilation avoids per-row dictionary lookup on large XLSX files.

- 60401aa: feat: Add `_app` operator and structured app metadata.

  A new runtime operator `_app` reads the app's declared metadata —
  `slug`, `name`, `version`, `description`, `license`, `lowdefyVersion`,
  `gitSha`. It works on both client and server, including inside
  `modules-mongodb` request filters, and inside `_js` functions via a
  bound `lowdefyApp(p)` callable.

  The root `lowdefy.yaml` schema gains two new optional fields:

  - `slug` — a kebab-case identifier (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`),
    validated at build time. Build fails with a clear error if invalid.
  - `description` — a free-form string.

  `gitSha` resolves through a fallback chain: `LOWDEFY_GIT_SHA` env var
  when set non-empty → `git rev-parse HEAD` → `null`. This lets apps
  deployed without `.git` (Docker, Vercel, Netlify, Render, hermetic
  PaaS sandboxes) pin the SHA explicitly by mapping their platform's
  commit env var via shell expansion in the build command.

  Build emits a new `appMeta.json` artifact alongside `app.json`. The
  existing `app.git_sha` field is removed; consumers (internal telemetry)
  read `gitSha` from `appMeta` instead.

  See the `_app` operator reference for the full key set and examples.

- f11addd: feat: Extend i18n coverage to Lowdefy agents.

  Builds on the i18n / locale support from
  `feat-i18n-locale-support.md`. End-user-visible strings in the agent
  runtime and the `AgentChat` block now localize automatically when
  `config.i18n` is configured.

  **Agent runtime errors.** HTTP 4xx/5xx responses from the agent
  endpoint (`Only POST requests are supported.`, `Invalid agent path`,
  `Agent "X" does not exist.`, `Agent type "Y" can not be found.`,
  `Endpoint execution failed`, etc.) translate per request via the
  `Accept-Language` header against `agent.runtime.*` builtin keys.

  **AgentChat block UI.** Framework-rendered strings in the chat UI go
  through `methods.translate` against new `agent.*` builtin keys:

  - `agent.sender.placeholder` — `'Type a message...'`
  - `agent.toolApproval.{approve,reject}` — `'Approve'` / `'Reject'`
  - `agent.message.{copy,feedback,regenerate,delete}` — message actions
  - `agent.toolResult.{completed,completedNoData,empty,emptyList,showMore,showLess}` — tool result captions

  Override per locale via `config.i18n.messages.{locale}` — same
  mechanism as any other built-in message.

  **antd X locale wiring.** The app shell now uses
  `@ant-design/x@2.7.x`'s `XProvider` at the root (drop-in superset of
  antd's `ConfigProvider`) with a merged antd + antd-X locale pack.
  antd X ships only `en_US` and `zh_CN` packs; other locales fall back
  to `en_US` for X-native strings (`'New chat'`, `'Stop loading'`,
  `'Like'`/`'Dislike'`, bubble edit `'OK'`/`'Cancel'`). Apps can
  override these in unsupported locales via the new `agent.antdx.*`
  reference keys.

  **Plugin-author surface.** Agent hook endpoints (`onStart`,
  `onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`,
  `onFinish`) now receive `locale: <activeCode>` in their payload, so
  hook routines can branch on the user's locale.

  **System prompt translation.** `agent.properties.instructions` passes
  through the operator parser at request time — `_t:` works there for
  locale-aware system prompts.

  ```yaml
  agents:
    - id: assistant
      type: AISDKAgent
      connectionId: anthropic
      properties:
        agent:
          model: claude-sonnet-4
          instructions:
            _t: agent.systemPrompt
  ```

  **What stays English** (explicit choices):

  - Built-in tool descriptions used in the model prompt (English-trained
    models perform best with English tool descriptions).
  - Build-time agent validation errors (developer diagnostics).
  - Console warnings (ops diagnostics).
  - The `[File truncated — showing first NKB...]` notice in the
    `read-file` built-in tool (model-facing).
  - Model-streamed natural-language output (owned by the model).

- 0108f38: feat: First-class i18n / locale support for Lowdefy apps.

  Apps can now declare supported locales and message catalogs under
  `config.i18n`, switch language at runtime, and translate their own
  strings with ICU MessageFormat. Ant Design's component strings (date
  pickers, modal Ok/Cancel, pagination, form validation messages),
  dayjs date formatting, and the engine's built-in framework strings
  (loading toasts, validation summaries, popup blocker warnings, error
  page) all localize automatically once `config.i18n` is set.

  ```yaml
  config:
    i18n:
      defaultLocale: en-US
      locales:
        - { code: en-US, label: English, antd: en_US, dayjs: en }
        - { code: de-DE, label: Deutsch, antd: de_DE, dayjs: de }
      messages:
        en-US: { greeting: 'Hello, {name}!' }
        de-DE: { greeting: 'Hallo, {name}!' }
  ```

  **New schema** — `config.i18n` with `defaultLocale`, `locales[]`, and
  `messages`. Validated at build time; only declared locales are bundled
  (antd and dayjs locale imports are codegen'd, no ~150KB unused). The
  missing-key fallback is always `en-US`, so plugin and module authors
  should ship `en-US` translations as a baseline.

  **New operators**

  - [`_t`](/_t) — translate operator with ICU MessageFormat. Resolution
    order: active locale → fallback locale → built-in framework message
    → key.

    ```yaml
    _t:
      key: cart.items
      values: { count: { _state: itemCount } }
    ```

  - [`_locale`](/_locale) — read `active` / `default` / `fallback`
    (always `'en-US'`) / `supported` locale state. Use with `Selector`
    to build a language picker.

  **New action** — [`SetLocale`](/SetLocale) sets the user's preferred
  locale (persisted to `localStorage`). Pass `'auto'` to clear the
  preference and fall back to the browser language or default.

  **Built-in framework strings.** Engine and client strings (`'Loading'`,
  `'Success'`, `'This field is required'`, validation summaries, popup
  blocker, error page) live in a built-in catalog and surface as English
  by default. Authors override per-locale by adding the same key to
  `config.i18n.messages`:

  ```yaml
  messages:
    de-DE:
      engine.action.loading: 'Laden'
      engine.validation.fieldRequired: 'Pflichtfeld'
  ```

  See the [Internationalization concept page](/i18n) for the full list
  of overridable keys.

  **Ant Design block cleanup.** `Modal`/`ConfirmModal` `okText`/`cancelText`
  and date picker placeholders (`DateSelector`, `DateRangeSelector`,
  `DateTimeSelector`, `MonthSelector`, `WeekSelector`) no longer hardcode
  English defaults — they fall through to antd's `ConfigProvider locale`,
  so a German app gets `'OK'` / `'Abbrechen'` / `'Datum auswählen'`
  without per-block configuration. The antd `ConfigProvider` block
  itself now accepts a `locale` prop for subtree overrides.

  **Server-side translation.** API requests resolve the user's active
  locale from the `Accept-Language` header and thread it into the server
  operator parser, so `_t` works the same in server-side actions and
  requests as on the client.

  **Translation engine.** A new `translate()` helper in `@lowdefy/helpers`
  backs both the `_t` operator and the engine/client adapter (installed
  on `lowdefy._internal.translate`). One source of truth for the lookup
  chain; no duplication. Adds `intl-messageformat` as a foundational dep.

  **Plugin-author surface.** Action and block plugins receive
  `methods.translate(key, values)` and `methods.getLocale()` for runtime
  translation in their JS code. Plugin packages can ship default
  messages via a `./messages` export — the build merges them into the
  app's i18n catalog (user app messages > plugin messages > framework
  builtins > key).

  **DatePicker and NumberInput auto-localization.** Date selector blocks
  (`DateSelector`, `DateRangeSelector`, `DateTimeSelector`,
  `MonthSelector`) and `NumberInput` derive their default `format` /
  `decimalSeparator` from the active locale via `Intl.DateTimeFormat` /
  `Intl.NumberFormat`. A German user sees `DD.MM.YYYY` and `1234,56`
  automatically; an en-US user sees `MM/DD/YYYY` and `1234.56`.

- 302e330: feat(api): Add `callApi({ endpointId, payload })` to the request-resolver argument bag.

  Request resolvers (the JS resolvers shipped by connection plugins — e.g. `plugin-http`'s `get`, `plugin-mongodb`'s `find`) now receive a `callApi` function in their argument bag. Calling it invokes another Lowdefy endpoint in-process with the same semantics as the routine `:call_api` step: depth cap (10), caller's user identity, isolated routine context, inherited parser closure (`_user`, `_secret`, `_env`, `_payload`), and `InternalApi` endpoints reachable. Returns the target routine's response or throws on failure — `UserError` for `:throw`/`:reject`, original Lowdefy error class preserved otherwise.

  Supporting improvements landed alongside:

  - `_state` is now scoped to the routine frame. `:set_state` writes no longer leak across routine boundaries. Two sibling `:call_api` invocations see independent state.
  - `UserError` now accepts and forwards `cause`. `controlThrow` (`:throw`) and `controlReject` (`:reject`) construct `UserError` so routine-step and JS-boundary surfaces carry the same class for user-authored failures.
  - `callRequestResolver` passes all Lowdefy errors (those with `isLowdefyError === true`) through unchanged. Only raw errors are wrapped into `RequestError` / `ServiceError`. A deep `callApi` chain no longer accumulates redundant `cause` nesting.
  - `runRoutine` guards against double `handleError` invocations when the same error crosses multiple `runRoutine` boundaries on a `callApi` chain.
  - The endpoint-invocation sequence (`depth check → load config → authorize → child routineContext → runRoutine`) is factored into a shared `invokeEndpoint` helper used by both the routine `:call_api` step and the new `callApi` function.

  **Behavior change:** any app that accidentally relied on `:set_state` writes leaking across routine boundaries (e.g., a routine called via `:call_api` reading state set by its caller) will break. The leakage was a bug, not a contract — there is no backwards-compatibility shim.

### Patch Changes

- b6e555f: fix(api,build): Render MenuDivider items in menus.

  MenuDivider items defined in a menu's `links` were silently dropped at request time by `filterMenuList`, which only let `MenuLink` and `MenuGroup` items through. Dividers now pass the filter and render via the existing Antd menu block code. A post-pass removes orphaned dividers (leading, trailing, or adjacent to another divider) so an item left dangling after auth-based filtering does not produce a broken-looking separator. The `menuDivider` shape was also added to the build schema so configs containing dividers no longer trigger a schema warning, and `buildMenu` now assigns `auth: { public: true }` to dividers for consistency with other menu items.

- Updated dependencies [5e498dd]
- Updated dependencies [60401aa]
- Updated dependencies [25225ab]
- Updated dependencies [ba1d3bd]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/ajv@5.4.0
  - @lowdefy/operators@5.4.0
  - @lowdefy/operators-js@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/node-utils@5.4.0
  - @lowdefy/nunjucks@5.4.0

## 5.3.0

### Minor Changes

- 6955341: feat: Add AI agent support with multi-provider chat and tool use

  **Agent Runtime (`@lowdefy/ai-utils`)**

  - `handleAgentChat` orchestrates the full agent lifecycle: tool merging, MCP client lifecycle, hook callbacks, and stream composition
  - `ToolLoopAgent` handles multi-turn tool calling, streaming responses, and artifact cleaning
  - `createAgentUIStreamResponse` converts agent output to a streaming HTTP response for the client
  - `buildAgentTools` merges endpoint tools, MCP tools, and sub-agent tools into AI SDK tool objects
  - `buildPrepareStep` enables dynamic tool phasing per step
  - `buildUpdatePageStateTool` provides a built-in tool for the agent to write to page state via the AgentChat block
  - File system agent tools: `listFiles`, `readFile`, `searchFiles`, `statFile`, `resolvePath` for sandboxed access to agent-scoped file directories
  - `pruneMessages` for context compaction
  - `experimental_repairToolCall` integration
  - Sub-agent support — agents can be exposed as tools to other agents
  - Reserved tool name collision detection (e.g. `update-page-state`)
  - Server-side hooks (`instructions`, `onStart`, `onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`, `onFinish`) callable as Lowdefy endpoints
  - Provider-agnostic design using the Vercel AI SDK — supports reasoning/thinking display, `providerOptions` passthrough, and source citation streaming via `sendSources`
  - Strip `data:` URL prefix from file attachments before AI SDK processing

  **AgentChat Block (`@lowdefy/blocks-antd-x`)**

  - New `AgentChat` composite block built on Ant Design X with real-time streaming display
  - Sequential message part rendering with configurable reasoning/thinking display
  - Tool approval UI for endpoint and MCP tools marked `confirm: true`
  - File attachment support (configurable accept types and max size) with S3 upload integration
  - Drawer display mode with a `FloatButton` trigger for embedding chat on any page
  - Source citation rendering for `source-url` and `source-document` parts
  - Mermaid diagrams, LaTeX, and syntax-highlighted code blocks (with copy + language label) — toggled via `renderMermaid` and `codeHighlighter`
  - Copy, feedback, regenerate, and delete message actions
  - Suggestions and `Sender.Header` / `Sender.Switch` UI affordances
  - Configurable roles, avatars, and names per message role
  - Event bridging for agent lifecycle events (`onSuccess`, `onError`, `onFinish`, `onFeedback`)
  - `sharedState` two-way binding lets the agent read and write page state via the `update-page-state` tool

  **`AgentConversations` Block (`@lowdefy/blocks-antd-x`)**

  - New standalone conversations sidebar block, extracted from AgentChat for independent placement

  **Connection Plugins**

  - `@lowdefy/connection-anthropic`: Anthropic connection with `AnthropicAgent` resolver supporting Claude models
  - `@lowdefy/connection-openai`: OpenAI connection with `OpenAIAgent` resolver supporting GPT models
  - `@lowdefy/connection-google`: Google AI connection with `GeminiAgent` resolver, including `thinkingConfig` and `safetySettings` sugar props
  - `@lowdefy/connection-ai-gateway`: Vercel AI Gateway connection with `AIGatewayAgent` resolver for routing to multiple providers through a single endpoint

  **MCP Integration (`@lowdefy/connection-mcp`, `@lowdefy/ai-utils`, `@lowdefy/build`)**

  - New `Mcp` connection type for HTTP, SSE, and stdio transport config
  - Agents can reference MCP connections via `connectionId` or inline config with build-time validation
  - Runtime MCP client creation with automatic tool discovery, merging, and cleanup
  - Tool approval support via `confirm: true` on both endpoint tools and MCP sources

  **Build Pipeline (`@lowdefy/build`)**

  - `buildAgents` validates agent config (model, tools, sub-agents, MCP) and normalizes tool definitions
  - `writeAgents` writes agent artifacts for server consumption
  - Sub-agent circular reference detection
  - Tool object format with `confirm` support
  - MCP `connectionId` normalization (inline config vs reference)
  - Lazy module variable resolution for agent properties referenced from modules
  - Agent schema validation integrated into the build pipeline
  - `copyAgentFileSystems` emits an `agentFileSystems.json` manifest so the production server can include each agent's `fileSystem.basePath` directory in Next.js file tracing — agents that read files now work on Vercel and standalone (`output: 'standalone'`) deployments without manual `next.config.js` configuration

  **API (`@lowdefy/api`)**

  - Agent route handler (`callAgent`) for streaming agent responses
  - Endpoint tool execution context with operator evaluation
  - Sub-agent resolver methods for agents-as-tools
  - MCP `connectionId` resolution at request time
  - `getAgentConfig` and `getAgentResolver` helpers for runtime agent resolution

  **Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

  - Agent API route (`/api/agent/[...path]`) added to both production and development servers
  - `urlQuery` validation
  - 10 MB request body limit for file attachments
  - Server-side hooks for agent lifecycle callbacks (`instructions`, `onFinish`)

### Patch Changes

- @lowdefy/operators@5.3.0
- @lowdefy/operators-js@5.3.0
- @lowdefy/ajv@5.3.0
- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0
- @lowdefy/node-utils@5.3.0
- @lowdefy/nunjucks@5.3.0

## 5.2.0

### Minor Changes

- 73fa2b9: feat: Internal API endpoint calls

  **Endpoint-to-Endpoint Calls (`@lowdefy/api`)**

  - API endpoint routines can call other endpoints server-side via `CallApi` steps, without HTTP
  - Each called endpoint runs in an isolated context with its own `steps` and `payload` namespaces
  - Recursive endpoint call depth is capped at 10 to prevent infinite loops
  - `InternalApi` endpoints are blocked from HTTP access — they return the same response as a missing endpoint

  **Build Support (`@lowdefy/build`)**

  - `CallApi` routine steps validated at build time: require `properties.endpointId`, reject `connectionId`
  - `InternalApi` endpoint type accepted alongside `Api`
  - Client-side `CallAPI` actions targeting `InternalApi` endpoints produce a build warning (error in production)

  **Operator Parser (`@lowdefy/operators`)**

  - `ServerParser.parse()` accepts `steps` and `payload` per call for routine context isolation

### Patch Changes

- Updated dependencies [1d18a13]
- Updated dependencies [73fa2b9]
- Updated dependencies [69a59c0]
- Updated dependencies [0d44433]
- Updated dependencies [1e964c4]
  - @lowdefy/operators-js@5.2.0
  - @lowdefy/operators@5.2.0
  - @lowdefy/ajv@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0
  - @lowdefy/node-utils@5.2.0
  - @lowdefy/nunjucks@5.2.0

## 5.1.0

### Patch Changes

- Updated dependencies [af8ef77cb]
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/operators@5.1.0
  - @lowdefy/ajv@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/node-utils@5.1.0
  - @lowdefy/nunjucks@5.1.0

## 5.0.0

### Minor Changes

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [155c0b9724]
- Updated dependencies [e3e922538]
- Updated dependencies [c8f4a41063]
- Updated dependencies [fd8225b7a1]
- Updated dependencies [905d5d406]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/nunjucks@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/ajv@5.0.0
  - @lowdefy/operators@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- 9de3276dc: fix(api): Validate session.user.roles is an array of strings.

  Misconfigured `auth.userFields` mapping roles to a non-array provider field (e.g., a string) caused silent authorization bypasses via `String.prototype.includes` substring matching. Session roles are now validated after session assembly, throwing a clear `ConfigError` pointing to the auth configuration. Added a defense-in-depth guard in `createAuthorize` for the same check.

- Updated dependencies [c5ce5b972]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/operators@4.7.3
  - @lowdefy/ajv@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/node-utils@4.7.3
  - @lowdefy/nunjucks@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/operators@4.7.2
- @lowdefy/operators-js@4.7.2
- @lowdefy/ajv@4.7.2
- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2
- @lowdefy/node-utils@4.7.2
- @lowdefy/nunjucks@4.7.2

## 4.7.1

### Patch Changes

- Updated dependencies [fac48c10a]
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/operators@4.7.1
  - @lowdefy/ajv@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/node-utils@4.7.1
  - @lowdefy/nunjucks@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/operators@4.7.0
  - @lowdefy/helpers@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/nunjucks@4.7.0
  - @lowdefy/ajv@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

- 43a5243da: feat(server-dev): Add mock user support for e2e testing

  Set `LOWDEFY_DEV_USER` env var or `auth.dev.mockUser` in config to bypass login in dev server.

### Patch Changes

- aebca6ab51: refactor: Consolidate error classes into @lowdefy/errors package with environment-specific subpaths

  **Error Package Restructure**

  - New `@lowdefy/errors` package with all error classes (`ConfigError`, `PluginError`, `ServiceError`, `UserError`, `LowdefyInternalError`, `ConfigWarning`)
    - `@lowdefy/errors/build` - Build-time errors with sync resolution via keyMap/refMap
  - Moved ConfigMessage, resolveConfigLocation from node-utils to errors/build

  **TC39 Standard Constructor Signatures**

  - All error constructors standardized to `new MyError(message, { cause, ...options })`:
    ```javascript
    new ConfigError('Property must be a string.', { configKey });
    new OperatorError(e.message, { cause: e, typeName: '_if', received: params });
    new ServiceError(undefined, { cause: error, service: 'MongoDB', configKey });
    ```
  - Plugins throw simple errors without knowing about configKey
  - Interface layer adds configKey before re-throwing

  **configKey Added to ALL Errors**

  - Interface layer now adds configKey to ALL error types (not just PluginError):
    - ConfigError: adds configKey if not present, re-throws
    - ServiceError: created via `new ServiceError(undefined, { cause: error, service, configKey })`
    - Plain Error: wraps in PluginError with configKey
  - Helps developers trace any error back to its config source, including service/network errors

  **Cause Chain Support**

  - All error classes use TC39 `error.cause` instead of custom stack copying
  - CLI logger walks cause chain displaying `Caused by:` lines
  - `extractErrorProps` recursively serializes Error causes for pino JSON logs
  - ConfigError and PluginError extract `received` and `configKey` from `cause`:
    ```javascript
    new ConfigError(undefined, { cause: plainError }); // extracts cause.received and cause.configKey
    new PluginError(undefined, { cause: plainError }); // same extraction
    ```

  **Error Display**

  - `errorToDisplayString()` formats errors for display, appending `Received: <JSON>` when `error.received` is defined
  - `rawMessage` stores the original unformatted message on PluginError

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/operators@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/nunjucks@4.6.0
  - @lowdefy/ajv@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/operators@4.5.2
- @lowdefy/operators-js@4.5.2
- @lowdefy/ajv@4.5.2
- @lowdefy/helpers@4.5.2
- @lowdefy/node-utils@4.5.2
- @lowdefy/nunjucks@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/operators@4.5.1
- @lowdefy/operators-js@4.5.1
- @lowdefy/ajv@4.5.1
- @lowdefy/helpers@4.5.1
- @lowdefy/node-utils@4.5.1
- @lowdefy/nunjucks@4.5.1

## 4.5.0

### Patch Changes

- Updated dependencies [09ae496d8]
  - @lowdefy/operators@4.5.0
  - @lowdefy/operators-js@4.5.0
  - @lowdefy/ajv@4.5.0
  - @lowdefy/helpers@4.5.0
  - @lowdefy/node-utils@4.5.0
  - @lowdefy/nunjucks@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [156fa7f2e]
- Updated dependencies [729a9780a]
  - @lowdefy/nunjucks@4.4.0
  - @lowdefy/ajv@4.4.0
  - @lowdefy/operators@4.4.0
  - @lowdefy/operators-js@4.4.0
  - @lowdefy/helpers@4.4.0
  - @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/operators@4.3.2
- @lowdefy/operators-js@4.3.2
- @lowdefy/ajv@4.3.2
- @lowdefy/helpers@4.3.2
- @lowdefy/node-utils@4.3.2
- @lowdefy/nunjucks@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/operators@4.3.1
- @lowdefy/operators-js@4.3.1
- @lowdefy/ajv@4.3.1
- @lowdefy/helpers@4.3.1
- @lowdefy/node-utils@4.3.1
- @lowdefy/nunjucks@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/operators@4.3.0
- @lowdefy/operators-js@4.3.0
- @lowdefy/ajv@4.3.0
- @lowdefy/helpers@4.3.0
- @lowdefy/node-utils@4.3.0
- @lowdefy/nunjucks@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/operators@4.2.2
- @lowdefy/operators-js@4.2.2
- @lowdefy/ajv@4.2.2
- @lowdefy/helpers@4.2.2
- @lowdefy/node-utils@4.2.2
- @lowdefy/nunjucks@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/nunjucks@4.2.1
  - @lowdefy/operators@4.2.1
  - @lowdefy/operators-js@4.2.1
  - @lowdefy/ajv@4.2.1
  - @lowdefy/helpers@4.2.1
  - @lowdefy/node-utils@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies [95663d1d5]
  - @lowdefy/nunjucks@4.2.0
  - @lowdefy/ajv@4.2.0
  - @lowdefy/operators@4.2.0
  - @lowdefy/operators-js@4.2.0
  - @lowdefy/helpers@4.2.0
  - @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/operators@4.1.0
- @lowdefy/operators-js@4.1.0
- @lowdefy/ajv@4.1.0
- @lowdefy/helpers@4.1.0
- @lowdefy/node-utils@4.1.0
- @lowdefy/nunjucks@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/operators@4.0.2
- @lowdefy/operators-js@4.0.2
- @lowdefy/ajv@4.0.2
- @lowdefy/helpers@4.0.2
- @lowdefy/node-utils@4.0.2
- @lowdefy/nunjucks@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/operators@4.0.1
- @lowdefy/operators-js@4.0.1
- @lowdefy/ajv@4.0.1
- @lowdefy/helpers@4.0.1
- @lowdefy/node-utils@4.0.1
- @lowdefy/nunjucks@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies [84e479d11]
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/operators@4.0.0
  - @lowdefy/operators-js@4.0.0
  - @lowdefy/ajv@4.0.0
  - @lowdefy/helpers@4.0.0
  - @lowdefy/nunjucks@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Features

- **api:** Add connectionId to request object. ([df16dbc](https://github.com/lowdefy/lowdefy/commit/df16dbca8545128cb51f78d173a2a96e47cbf729))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Features

- **api:** Add connectionId to request object. ([df16dbc](https://github.com/lowdefy/lowdefy/commit/df16dbca8545128cb51f78d173a2a96e47cbf729))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- **api:** Use lowdefy get,set helpers in auth user fields. ([40dded4](https://github.com/lowdefy/lowdefy/commit/40dded47a92cce829787244e1ce1dbd5fb6e478f))
- Logging cleanup. ([30a495c](https://github.com/lowdefy/lowdefy/commit/30a495c3e40fe566af306b54d7c8ece3c79de1b9))

### Features

- Add logger to next auth options. ([b30412f](https://github.com/lowdefy/lowdefy/commit/b30412f7cda93be43226728340061465bf6597f4))
- **api:** Refactor next auth configuration for logging. ([5d04948](https://github.com/lowdefy/lowdefy/commit/5d04948cc34b7d95dfc781254e0d5acb346bd2be))
- Auth event logs WIP ([7601894](https://github.com/lowdefy/lowdefy/commit/760189432f271f682eb9f23abd960ff5d5b12873))
- Server logging polish and cleanup. ([fe46d23](https://github.com/lowdefy/lowdefy/commit/fe46d23408d3d24d15cc284faa74c2e0eb154f8b))
- **server:** Add info logs to request calls. ([0f90fdd](https://github.com/lowdefy/lowdefy/commit/0f90fdd9a3d0b18e57829447dfa0097e1a858006))
- **server:** Log server errors with pino. ([ed36f2f](https://github.com/lowdefy/lowdefy/commit/ed36f2f1aa1134ff4deb7da46f18463b8f70c173))
- Update dev server to work with logger. ([f036a62](https://github.com/lowdefy/lowdefy/commit/f036a623067bdcc225d37137511baacd4f317535))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- Update serializer util to not clash with \_date operator ([b8cdcb3](https://github.com/lowdefy/lowdefy/commit/b8cdcb3e44a0b1157c111bc7679ac428138c6f97))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Features

- Rename nodeParser to serverParser and buildParser. ([0b61e5e](https://github.com/lowdefy/lowdefy/commit/0b61e5e5710084cc19bba4eb6de95c3a53beb4b9))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

### Bug Fixes

- **api:** Fix readConfigFile tests. ([f2591f2](https://github.com/lowdefy/lowdefy/commit/f2591f29775d3b669fb553ebb9dd9a7e75faa002))
- Cache API file reads across all requests. ([2b90efb](https://github.com/lowdefy/lowdefy/commit/2b90efb041cf43e5344c5f2f5a8630ae06c8aad6))

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

### Bug Fixes

- **api:** Fix "too many files open" error in api. ([b2d0b63](https://github.com/lowdefy/lowdefy/commit/b2d0b63cceac0b2b3dc870a8b435c6f187ff7a5a))

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Features

- **api:** Pass blockId, requestId, pageId and parsed payload to requests. ([edc25ef](https://github.com/lowdefy/lowdefy/commit/edc25efc3cbb0d61ddfdf7ac13275a66321a2a8a))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Features

- **api:** Map nextAuthConfig.pages. ([0798d39](https://github.com/lowdefy/lowdefy/commit/0798d393c65bd22ece769be7d56d456d07b3b74b))

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- Fix addUserFieldsToSession when using auth adapter. ([850ee69](https://github.com/lowdefy/lowdefy/commit/850ee69e1ab2245b9abb1af4eeb1636286a6af64))

### Features

- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- Fix addUserFieldsToSession when using auth adapter. ([850ee69](https://github.com/lowdefy/lowdefy/commit/850ee69e1ab2245b9abb1af4eeb1636286a6af64))

### Features

- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

### Bug Fixes

- **api:** Should be passing profile, not provider. ([02f9fe0](https://github.com/lowdefy/lowdefy/commit/02f9fe0d5e284fc7ce802a7bd9617ca7cb58f5ba))

### Features

- **api:** Add provider to linkAccountEvent. ([a90f10b](https://github.com/lowdefy/lowdefy/commit/a90f10b68d2a291dcb98883fdf54c53ecbbd3a71))

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Features

- Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **build:** Evaluate build operators in lowdefy.yaml ([49ed3e1](https://github.com/lowdefy/lowdefy/commit/49ed3e14fd7453cd246324d1b791e902dc5a3c8f))
- Fix package.json fixes. ([17f54ac](https://github.com/lowdefy/lowdefy/commit/17f54aceafc749be7e513fdcad829cd3ad4673ac))
- Fix userFields implementation. ([c566541](https://github.com/lowdefy/lowdefy/commit/c566541538749c27cdda32381c7255e3e37ae32e))
- Remove userFields debug logs. ([8fad19f](https://github.com/lowdefy/lowdefy/commit/8fad19f28c4e4f39dc3135e0a3f1e2e2c8e4689c))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **build:** Evaluate build operators in lowdefy.yaml ([49ed3e1](https://github.com/lowdefy/lowdefy/commit/49ed3e14fd7453cd246324d1b791e902dc5a3c8f))
- Fix package.json fixes. ([17f54ac](https://github.com/lowdefy/lowdefy/commit/17f54aceafc749be7e513fdcad829cd3ad4673ac))
- Fix userFields implementation. ([c566541](https://github.com/lowdefy/lowdefy/commit/c566541538749c27cdda32381c7255e3e37ae32e))
- Remove userFields debug logs. ([8fad19f](https://github.com/lowdefy/lowdefy/commit/8fad19f28c4e4f39dc3135e0a3f1e2e2c8e4689c))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- Add openid connect standard claims to user object. ([7f099e1](https://github.com/lowdefy/lowdefy/commit/7f099e1d55cab7ba79214870f1bc23235b8fd09a))
- **engine:** Add payload and blockId to context.requests[requestId]. ([e29d88b](https://github.com/lowdefy/lowdefy/commit/e29d88b326338fdec22db325dcda31ee4f73cf51))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- Fix auth tests. ([c2a8fc7](https://github.com/lowdefy/lowdefy/commit/c2a8fc7206f6a0432a95f1c99749f861a1bf45f5))

### Features

- Add support for auth callback plugins. ([a16e074](https://github.com/lowdefy/lowdefy/commit/a16e074ca801a5e9e05424fc09cb8c1e1da81cee))
- Add support for auth event plugins. ([35f28b8](https://github.com/lowdefy/lowdefy/commit/35f28b849d945d14616fc5269bdb980cceb9dee4))
- **api:** Add user to api context and user roles to authorization. ([133245e](https://github.com/lowdefy/lowdefy/commit/133245ea16b7c1aed85f67dacb503b879b027edd))
- Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
- Read auth secret from secrets object. ([f266fbf](https://github.com/lowdefy/lowdefy/commit/f266fbfa7cabbca8bcfa7e89fb06843db3bd88ce))
- Updates to auth configuration. ([8f7abf7](https://github.com/lowdefy/lowdefy/commit/8f7abf7fdb1cbe0dbaabe209787a128854680f7b))
- Use next-auth session to authenticate in api. ([462c0ac](https://github.com/lowdefy/lowdefy/commit/462c0ac0d05429514ecd2a2b11a6a21b8915b462))

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Features

- **api:** evaluteOperators is sync. ([40ba4df](https://github.com/lowdefy/lowdefy/commit/40ba4df14370a7a928ffc1487092b529211b2636))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- Add missing api and helpers tests. ([aa1d72c](https://github.com/lowdefy/lowdefy/commit/aa1d72c19122eb7d4343108ba6ad21c423dc2493))
- **api:** Fix callRequest tests. ([58655cb](https://github.com/lowdefy/lowdefy/commit/58655cba190a3a2371e301d2bf4779bd13651ad5))
- **api:** Fixes using jest with es modules. ([d69a4dc](https://github.com/lowdefy/lowdefy/commit/d69a4dca33d49c639b3c80d90eed4ffa6ef28950))
- **cli:** Fix jest es module mocks. ([78480e8](https://github.com/lowdefy/lowdefy/commit/78480e80022f79a0ab449a9a8d804e6213b676c4))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- Strip auth prop from page config in api. ([693667d](https://github.com/lowdefy/lowdefy/commit/693667db5bece8081865e74dc2e4391b62f10f93))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- V4 fixes. ([088e210](https://github.com/lowdefy/lowdefy/commit/088e210620ffd8d7735cc785483845d082d5485d))

### Features

- Import operator plugins in server. ([f913e9e](https://github.com/lowdefy/lowdefy/commit/f913e9e261777a0c7f4b0a79995ef18290186b2e))

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/api

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

### Bug Fixes

- Fixes for CLI build. ([3e58d59](https://github.com/lowdefy/lowdefy/commit/3e58d599829e1393de52e94e6e1e82f6876231ec))

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- **api:** add createContext test ([af14e7c](https://github.com/lowdefy/lowdefy/commit/af14e7c4470379df51588fbc3b63090d8c439959))
- **api:** Add request handler tests. ([b827137](https://github.com/lowdefy/lowdefy/commit/b8271376f1d20f2cc2d036aa50f69caa3b6b0c4a))
- **api:** Add tests ([db478c9](https://github.com/lowdefy/lowdefy/commit/db478c970ef2360e512ad5c9e7872440f238a4c3))
- **api:** Fix api context tests. ([8aa2642](https://github.com/lowdefy/lowdefy/commit/8aa264243706ea089377d11302e9d81fc02ef26b))
- **api:** Fix tests. ([7791951](https://github.com/lowdefy/lowdefy/commit/7791951a115704fcba4812ea7068979a44aca798))
- **api:** JSON web token tests and fixes. ([30f7267](https://github.com/lowdefy/lowdefy/commit/30f7267c3e2435647b1b5f0b4b48137d6c3357d6))
- Authorisation flows working. ([5b32ca8](https://github.com/lowdefy/lowdefy/commit/5b32ca86bae8a13fea477d4d7ef19a4c5ad4fdc8))
- Clean up server configuration. ([dea25de](https://github.com/lowdefy/lowdefy/commit/dea25dec2303f19937253a0d9c699b56b28fb82b))
- **deps:** Update dependency openid-client to v4.9.1. ([5b28ee4](https://github.com/lowdefy/lowdefy/commit/5b28ee46833d283661e0492f92632531ee3fc14d))
- ES module and next server fixes. ([83bca45](https://github.com/lowdefy/lowdefy/commit/83bca458e4ba5a5d2f62a23f603b69672bc0418b))
- Fix tests ([80c00f4](https://github.com/lowdefy/lowdefy/commit/80c00f4403067493351347ca91cb953586bb97da))
- Next server fixes ([d5ab3d9](https://github.com/lowdefy/lowdefy/commit/d5ab3d92f24b09a59e6c20e31a8b01dce9d1056f))
- Remove auth dependencies from api ([a1f72e1](https://github.com/lowdefy/lowdefy/commit/a1f72e1087f1cec4f2313b96ec727457c5e97e6d))
- Replace all front end testing with @testing-library/react, jest and other updates. ([22ec295](https://github.com/lowdefy/lowdefy/commit/22ec2954047853096aabcddba7a2c509342f95f2))

### Features

- Add authentication flows ([15e1be9](https://github.com/lowdefy/lowdefy/commit/15e1be90d063ca4e0b315ed8be1641897b694d5c))
- Add requests support to @lowdefy/api package ([86533ee](https://github.com/lowdefy/lowdefy/commit/86533ee6a9f93a71c0e66b89924ff737d7e1d47b))
- Add requests to client and server. ([320c4a1](https://github.com/lowdefy/lowdefy/commit/320c4a10a14b14488f13bb3b98bb100c7e6227af))
- **api:** Add api tests and fixes. ([457890b](https://github.com/lowdefy/lowdefy/commit/457890bea65b103e82ee758d96109cc3e5198c54))
- **api:** Add authorization functions. ([a039f41](https://github.com/lowdefy/lowdefy/commit/a039f41526352d11889414f679221da5b185821f))
- **api:** Api package tests and fixes. ([1f4b2f2](https://github.com/lowdefy/lowdefy/commit/1f4b2f29de3489641db5f80e833ecd6682a5a6e0))
- **api:** Init package @lowdefy/api ([cbe7569](https://github.com/lowdefy/lowdefy/commit/cbe75694f1f348e3e89ac38b45ca075f8ece0241))
- Build html files for each page, and serve from api ([3f53d8b](https://github.com/lowdefy/lowdefy/commit/3f53d8b20f89b2179ffe18a510e8d5415de2be39))
- Fixes fro requests in next server ([e341d8d](https://github.com/lowdefy/lowdefy/commit/e341d8ded222902ce07ea1ea1d18940ac000c4da))
- Init @lowdefy/client package ([909cef7](https://github.com/lowdefy/lowdefy/commit/909cef766d8e48634b6cc0a048f71bd82565cbf4))
- Mount home page on the home route if configured. ([ff23ea8](https://github.com/lowdefy/lowdefy/commit/ff23ea82cf8399ff012ca07a58520cda1b5853ac))
- Next server rendering blocks ([e625e07](https://github.com/lowdefy/lowdefy/commit/e625e07a29b5ae3f09f74c629f35fe52ce73dace))
- Remove @lowdefy/renderer package ([c584778](https://github.com/lowdefy/lowdefy/commit/c58477852d36f101dd38a0e48143b4a483273ee2))
- Render Lowdefy blocks in client package. ([c24bcf1](https://github.com/lowdefy/lowdefy/commit/c24bcf193123bf1b09b886160df4dafd9298d750))
- Requests working on next server ([8d6abe2](https://github.com/lowdefy/lowdefy/commit/8d6abe27f967be6c11d1f4c29e8af73c4734dd68))
- Restructure plugin files. ([f651ed7](https://github.com/lowdefy/lowdefy/commit/f651ed7639181fb0a3db91706cb1c13950bfe654))
- Root config and link working on next server. ([cf2562b](https://github.com/lowdefy/lowdefy/commit/cf2562b088075290ddf3c354624c3c5c6d89ecf9))
- **server:** Add auth routes to server. ([4a97f4c](https://github.com/lowdefy/lowdefy/commit/4a97f4c3be64fbb0cc5e8625bb35cf34217e0e89))
- **server:** Convert server to fastify. ([0d2c1c3](https://github.com/lowdefy/lowdefy/commit/0d2c1c34d969fab5049fb501f027bea60bce54ed))
- Use logger in request api call. ([83b885b](https://github.com/lowdefy/lowdefy/commit/83b885bc415e6e3bc7e67db6efc5f04f6f70db6e))
