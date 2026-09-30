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

- 5ad9fd5: feat: Per-call `user` for the agent tools that render a page headless

  The headless renderer signs in as a roleless user, so any page or request gated on a role rendered empty or refused for an agent — and the only lever was `--mock-user`, which bypasses login for the whole dev server, the developer's own browser included.

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` now accept a `user` — merged over the default headless user, so `{"roles": ["admin"]}` is usually all you need:

  ```json
  { "pageId": "users", "user": { "roles": ["admin"] } }
  ```

  Each call opens its own browser context, so one call can act as an admin and the next as a plain member. Since no auth engine runs for an injected caller, nothing derives the rest of the record — pass `email`, `profile` or `attributes` too when a page reads them.

  `user` is headless-only, because a page the developer opens in their own browser carries their real session. Passing `user` to `lowdefy_inspect_state`/`lowdefy_eval_operator` therefore selects the headless source, and combining it with `source: "tab"` is an error rather than a silently ignored role — as is combining it with `lowdefy_load_state`'s `mode: "registry-only"`, which hands the developer a URL to open themselves.

  The plain HTTP routes take the same param — `?user={"roles":["admin"]}` on the GET routes, a `user` key in the body of `POST /lowdefy-docs/eval-operator` and `POST /lowdefy-docs/state-checkpoints/load`. A malformed or contradictory `user` answers `400`, distinct from the `502` a failed render returns, so an agent can tell "fix your call" from "retry".

- ea4de26: feat: Live state x-ray, state & data checkpoints, request execution, and app map for AI agents

  The dev server's agent toolbelt grows from discovery and build feedback to full runtime visibility — 23 MCP tools total at `/lowdefy-docs/mcp`.

  **Live state x-ray (`@lowdefy/server-dev`)**

  - `lowdefy_inspect_state`: read the ACTUAL state, request results, and event log of a running page. When you have the page open in your browser it reads your live tab — reproduce a bug by clicking through the app, then let the agent look at exactly what you see. Falls back to a headless run otherwise.
  - `lowdefy_eval_operator`: evaluate any operator expression (like `{"_state": "customer.name"}`) against live page state — a REPL for config, running in the real browser runtime.

  **State & data checkpoints**

  - `lowdefy_snapshot_state` captures a page's state and every request's recorded response into a committable `checkpoints/<name>/` folder — one file per part, one file per request, easy to review in git.
  - `lowdefy_load_state` puts the app back into that state: recorded request data is served by the dev server automatically, and `?_checkpoint=<name>` on any page URL restores the state in a normal browser tab — hand a teammate a URL that opens the app mid-scenario.
  - `lowdefy_checkpoint_to_mocks` converts a checkpoint into `@lowdefy/e2e-utils` `mocks.yaml` fixtures for e2e tests.
  - `lowdefy_checkpoint` / `lowdefy_revert_checkpoint` snapshot and restore config files around risky edits.

  **Request execution and app understanding**

  - `lowdefy_run_request` executes a request with a test payload to verify data shape. Read-only types always run; write requests need `cli.agentTools.allowWriteRequests: true` in lowdefy.yaml (dev-only opt-in).
  - `lowdefy_app_map`: every page, menu, connection, endpoint, and agent in one call — onboard to a large app instantly.

  **@lowdefy/e2e-utils**

  - New `@lowdefy/e2e-utils/runtime` export: the runner-agnostic surface (navigation, state/request getters, mocking, page manager) usable outside the Playwright test runner. Assertions moved to `src/assertions/` — the package's public API is unchanged.
  - Fixed `setState` silently doing nothing — it now uses the engine's real state primitives.

- a647873: feat: Agent feedback loop, scaffolding, screenshots, and llms.txt

  Building on the dev server docs/MCP endpoint, agents now get a full edit-verify loop and one-command project setup.

  **Feedback loop (`@lowdefy/server-dev`, `@lowdefy/build`)**

  - The dev build now persists its result to `build/buildStatus.json`, and `GET /lowdefy-docs/build-status` (or the `lowdefy_build_status` MCP tool) returns the current build errors and warnings — with source file and line — plus recent browser runtime errors. Edit config, ask what broke, fix it.
  - `GET /lowdefy-docs/page-config/{pageId}` / `lowdefy_get_page_config`: the fully built page config, or its structured build errors.
  - `GET /lowdefy-docs/find/{id}` / `lowdefy_find_config`: which yaml file (and line) defines a page, block, or request id.

  **Visual verification (`@lowdefy/server-dev`)**

  - `GET /lowdefy-docs/screenshot/{pageId}` / `lowdefy_screenshot_page`: PNG of the rendered page via headless Chromium (playwright-core), so agents can see what they built.

  **Scaffolding (`@lowdefy/server-dev`, `lowdefy` CLI)**

  - `lowdefy_scaffold_page` MCP tool creates a canonical new page file.
  - New `lowdefy agent-setup` CLI command writes `.mcp.json`, a Claude Code skill, and an `AGENTS.md` section into your project (merge-safe).

  **Docs reach**

  - docs.lowdefy.com now serves every docs page as raw markdown at `/md/{section}/{slug}.md`, plus `llms.txt` and `llms-full.txt` for AI crawlers.

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

- 37c8c14: feat: `auth.strategies` — apiKey and JWT header authentication for API callers.

  - New `auth.strategies` config block: apiKey (default `X-API-Key` header) and jwt strategies, each granting the caller the strategy's `roles`.
  - MCP and service clients that cannot hold a session cookie authenticate per request; a matched strategy yields a caller (`apiKey:{strategyId}:{keyId}`) that flows through the existing authorization and `_user` machinery.
  - Unauthenticated calls to role-gated endpoints now return 401 (`AuthenticationError`) instead of a masked error.

- 079b7d6: feat: Option/Alt+click any element to open its yaml in VS Code

  Hold Option (macOS) or Alt (Windows/Linux) and click any element in the running dev app to open the yaml file that defines its block in VS Code, at the exact line. While the modifier is held, the hovered block shows a blue highlight with its blockId and the cursor becomes a pointer, so you see exactly what a click will open. Blocks generated at runtime (list items, dynamic content) resolve to their nearest configured ancestor, and blocks defined in modules open the module file that defines them. Plain clicks, Option/Alt+clicks outside any block, and Cmd/Ctrl+clicks (the browser's open-in-new-tab) keep their normal behaviour. Dev server only.

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

- 28cb944: feat: Dev server docs and MCP endpoint for AI coding agents

  The dev server now always serves documentation for everything installed in your project — every block, operator, action, connection and request type, from core plugins and your own local plugins — plus the full Lowdefy docs as markdown.

  **Docs API and MCP endpoint (`@lowdefy/server-dev`)**

  - Plain GET routes under `/lowdefy-docs`: list all available types per kind, JSON schemas per type, block usage examples, docs pages as markdown, and search.
  - An MCP endpoint (streamable HTTP) at `/lowdefy-docs/mcp` exposing the same as tools (`lowdefy_list_types`, `lowdefy_get_schema`, `lowdefy_get_examples`, `lowdefy_get_doc`, ...) so agents like Claude Code can look up exact type contracts instead of guessing.
  - The `/lowdefy-docs` page path prefix is now reserved in dev.

  **Discovery build artifacts (`@lowdefy/build`)**

  - Dev builds now write `plugins/availableTypes.json` (every installed type, used or not) and `plugins/connectionSchemas.json` + `plugins/requestSchemas.json` (collected from connection definitions).
  - Fixed custom/local plugin schemas being silently missing from all schema maps — plugin modules now also resolve from the server directory.

  **Docs content package (`@lowdefy/docs-content`)**

  - New package shipping the Lowdefy docs extracted as markdown with a manifest, generated from the docs app build (`pnpm docs:content`).

  **Block plugins**

  - Block packages now publish their `gallery.yaml`/`examples.yaml`/`tests.yaml` files in `dist/`, so the docs API can serve real examples.

- ae5f618: feat(server-dev): Send feedback annotations directly from the annotation panel.

  The separate review step is gone: "Copy for agent" now sends straight from the panel and always includes the annotation you are writing, "Add another" banks it and returns to picking, and banked annotations stay visible in a pending tray where they can be removed before sending. Enter triggers the send in both states.

- 6f87741: feat: Authenticate the dev server as a mock user for headless rendering and agent tools

  The dev server's headless renderer (used by the AI-agent screenshot and state-inspection tools) now authenticates, so auth-protected pages render instead of returning 404.

  - **New `lowdefy dev --mock-user [user]` flag** — start the development server authenticated as a mock user. Pass a JSON user object to set the identity and roles (e.g. `--mock-user '{"sub":"dev","roles":["admin"]}'`), or use the bare flag for a default user. This drives the same `auth.dev.mockUser` mechanism from the command line.
  - **Headless renderer authenticates** — the docs/MCP headless browser now carries an authenticated session, so `lowdefy_screenshot_page` and headless state inspection work on pages with `auth.public: false`. The developer's real browser session is unaffected. To render role-gated pages, configure `auth.dev.mockUser` (or `--mock-user`) with matching roles.

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

- 7f49378: feat: Annotation helper — point, draw, copy, and paste feedback to your agent

  Press **Cmd+/** (macOS) / **Ctrl+/** (Windows/Linux) on any page of your running dev app: an overlay appears where you hover-highlight blocks, click to select, draw rectangles/arrows/freehand, comment, and batch several annotations. No browser extension — it's injected by the dev server.

  Hitting **Copy** puts an agent-readable feedback block on your clipboard, **each annotation enriched with the blockId and the exact yaml file and line that defines it**, plus drawn geometry and, by default, **an annotated PNG screenshot of the page with your drawings on it** (saved under `.lowdefy/annotations/`, path included in the block — untick "Include annotated screenshot" to skip). Paste it into whichever agent session you want. Press Enter to drive the primary action (save annotation, then copy).

  Also:

  - `lowdefy_screenshot_page` gains `clip` + `scrollX`/`scrollY` params to capture exactly an annotated region.
  - New reserved dev route prefix: `/lowdefy-feedback` (the overlay's enrichment endpoint).
  - The generated AGENTS.md and Claude Code skill (`lowdefy agent-setup`) teach agents to recognize pasted feedback blocks.

- a858f8f: feat: MCP server exposing API endpoints as tools.

  - New root `mcp` config block (`name`, `version`, `endpoints`) — listed `Api` endpoints are served as MCP tools at `POST /api/mcp` over streamable HTTP.
  - Endpoint `description` and `payloadSchema` become the tool description and inputSchema; both are required for exposed endpoints, and `InternalApi` endpoints cannot be exposed.
  - Tool listing and calls are authorized per request with the caller's session; the build always writes an `mcp.json` artifact (`configured: false` when no endpoints are listed).

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

- 082acec: chore: Bump `yaml` to 2.9.0, clearing vite's `yaml@^2.4.2` peer warning.
- 59190b5: Refresh dependencies and require Node.js 22 or newer.

  Updated a range of libraries across the project to current versions (including the MongoDB driver, the
  MQL/aggregation engine, and various build and CLI tooling) and set the minimum supported Node.js version
  to 22, matching what is tested in CI. Most changes are internal with no effect on your app. One small
  behaviour note: in `_mql` expressions, adding to a missing or null field now returns `null` (matching
  MongoDB) instead of `NaN`.

- da0c62c: chore: Update pino from 8.16.2 to 10.3.1.

  No behavior change — the log output format, levels, and configuration are unchanged. The pino 9 and 10 majors only drop support for Node.js versions below 20, and Lowdefy already requires Node.js 22 or newer.

- a2b0f93: fix(server-dev): a dev tab now holds one event-stream connection instead of two. The dev server runs on HTTP/1.1, where browsers allow six connections per host, and each open event stream keeps one for the life of the tab. With the config-reload stream and the inspector stream both open per tab, three tabs of the same app saturated the pool and the next request on any of them queued forever — the page sat on its loading skeleton with a request pending and no server error. The inspector now listens on the reload stream and reports page navigation with a small POST instead of reconnecting. The manager's proxy also now closes the upstream request when a browser tab disconnects, so closed tabs leave the inspectable-tab registry instead of lingering and shadowing live ones.
- 0407d43: feat(build): Deferred-content records — one registry for all module deferral.

  Module deferral (component bodies, menu links, var defaults, entry
  vars/connections) moves from fragile in-tree markers onto a build-level record
  registry with demand-driven, wait-graph-guarded resolution. Entry order no
  longer matters for mutually-embedding modules, cycle errors name the actual
  value chain (e.g. `a:consumerVars.x → b:vars.y.default → a:consumerVars.x`),
  and the entry state machine, `~deferredModuleRef`/`~deferredFrom` markers, and
  per-context resolve chains are deleted. A new `deferredRecords.json` build
  artifact carries record bodies for JIT; the dev server hydrates the registry
  from it.

  User-visible changes:

  - New config errors: `~deferred` is a reserved key; `_module.var` in manifest
    headers or component/menu ids errors (export names are module-static); `_var`
    inside an operator-generated `components:` section errors (var-free operator
    composition keeps working).
  - Module ref errors now list available component/menu ids and distinguish a
    missing export from an empty one.
  - Lazy semantics: a broken var default or a cyclic menu that nothing consumes
    no longer fails the build — errors surface at consumption.

  Also includes the buildRefs cleanups: single marker-preserving clone
  (`cloneWithMarkers`), no redundant clones or duplicate `lowdefy.yaml`
  re-resolution in the app pass, `validateModuleSecrets` walks instead of
  cloning, and a shared `expectTerminates` test guard.

- 082acec: feat: Dev DX quick wins — fast warm boots, no mid-session reloads.

  - `lowdefy dev` no longer resets the server `package.json` at boot, so plugin
    packages discovered by previous sessions stay installed — no more
    uninstall/reinstall churn, no install pause when navigating to pages whose
    plugins were already known, and a stable lockfile that preserves Vite's
    dependency optimizer cache across sessions.
  - Installs are skipped entirely when `package.json` is unchanged (hash stored
    inside `node_modules`, so deleting `node_modules` forces a reinstall). Warm
    boots drop from ~30s to a few seconds.
  - The dev server pre-discovers all client dependencies at startup
    (`optimizeDeps.entries`), eliminating mid-session "optimized dependencies
    changed" full page reloads.
  - Tailwind scan inputs are excluded from Vite's watcher — first visits to a
    page no longer force a full browser reload that aborts in-flight requests
    ("Failed to fetch" error walls). CSS recompilation is driven by the
    `tailwind-candidates.css` import, now touched only when a build actually
    changes tailwind content.
  - Build artifact writes skip byte-identical content, so unchanged JIT page
    builds no longer invalidate `clientJsMap.js` (Routing HMR churn) or
    `serverJsMap.js` (SSR graph reloads). New `writeFileIfChanged` and
    `installIfPackageJsonChanged` utilities in `@lowdefy/node-utils`.
  - Polish: dev server shutdown log no longer says "next server"; the missing
    `./messages` plugin export notice logs once per process instead of on every
    rebuild.

- 6730996: feat: Provider-neutral file storage — upload and download files to S3-compatible providers, Google Cloud Storage, and Azure Blob Storage.

  **Generic file blocks (`@lowdefy/blocks-files`, new)**

  - New `Upload`, `UploadPhoto`, `UploadDragger`, and `Download` blocks that work with any storage provider. Upload blocks call an upload-policy request by id (`uploadPolicyRequestId`) and support both POST form uploads (S3, R2, MinIO, GCS) and PUT body uploads (Azure SAS), with upload progress on both.
  - `emitFileContent: true` reads the file in the browser and emits `{ name, size, type, content }` (base64) as the block value and `onChange` event, for storing files through an API endpoint routine with a server-side write request.

  **S3-compatible providers (`@lowdefy/plugin-aws`)**

  - `AwsS3Bucket` connections accept `endpoint` and `forcePathStyle`, unlocking Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, and Wasabi with a one-line config change.
  - `AwsS3PresignedGetObject` returns a stable, non-expiring public URL when the request sets `public: true`; the connection-level `publicUrlBase` overrides the constructed URL for CDN domains.
  - New `AwsS3PutObject` write and `AwsS3GetObject` read requests store and read base64 object content from endpoint routines or page requests, so routines can process file content in steps.
  - The `S3UploadButton`, `S3UploadPhoto`, `S3UploadDragger`, and `S3Download` blocks are now deprecated aliases of the generic blocks — existing apps keep working unchanged.

  **Google Cloud Storage (`@lowdefy/plugin-gcp`, new)**

  - `GoogleCloudStorageBucket` connection with `GcsSignedPostPolicy`, `GcsSignedGetUrl`, `GcsGetObject`, and `GcsPutObject` requests.

  **Azure Blob Storage (`@lowdefy/plugin-azure`, new)**

  - `AzureBlobContainer` connection with `AzureBlobUploadSas`, `AzureBlobDownloadSas`, `AzureBlobGet`, and `AzureBlobPut` requests.

  **Editor and chat uploads (`@lowdefy/blocks-tiptap`, `@lowdefy/blocks-antd-x`)**

  - Tiptap editors and AgentChat attachments now upload through the shared provider-neutral flow. New `uploadPolicyRequestId` and `downloadPolicyRequestId` properties replace `s3PostPolicyRequestId` (kept as a deprecated alias). Inline image and attachment URLs resolve through the download request when configured.

  **Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

  - `/api/endpoints/*` request bodies are capped at 10 MiB (matching the agent route), bounding base64 file payloads sent via `CallAPI`.

  **Codemod (`@lowdefy/codemods`)**

  - Optional `s3-blocks-to-file-blocks` codemod renames the deprecated S3\* blocks and `s3PostPolicyRequestId`/`s3GetPolicyRequestId` properties to the provider-neutral names via `lowdefy upgrade`.

- fc89b99: fix: Agent tools work on auth-enabled apps, in monorepos, and keep user data out of git.

  **Agent request execution on auth-enabled apps (`@lowdefy/server-dev`)**

  - `POST /lowdefy-docs/run-request` (and the `lowdefy_run_request` MCP tool) no longer fails with `Cannot read properties of undefined (reading 'secret')` on apps with authentication configured. Reads, and writes opted in via `cli.agentTools.allowWriteRequests`, now execute the same way app requests do. Calls without a session cookie run as an anonymous visitor.
  - `.env` changes now restart the dev server with the updated values — previously changed variables kept their old values until a full dev server restart.

  **State checkpoints are no longer committable (`@lowdefy/server-dev`)**

  - State checkpoints are written to `.lowdefy/state-checkpoints/<name>/` instead of `checkpoints/<name>/` in the app directory. Checkpoints capture the signed-in user's data and recorded backend responses, so they now live in the conventionally gitignored `.lowdefy` folder — this also stops checkpoint writes from triggering rebuilds.

  **`agent-setup` supports monorepos (`lowdefy` CLI)**

  - `lowdefy agent-setup` now writes `.mcp.json`, the Claude Code skill, and agent instructions at the project root (nearest ancestor with `.git`) so coding agents launched from the repo root discover them. Generated instructions point at the app subdirectory (e.g. `cd apps/myapp && pnpm dev`).
  - When the project root already has a `CLAUDE.md` and no `AGENTS.md`, the Lowdefy section is appended to `CLAUDE.md` instead of creating a competing instructions file.
  - A new `--project-directory` option overrides root detection. Single-app repos are unchanged.

  **Operator REPL (`@lowdefy/server-dev`)**

  - `POST /lowdefy-docs/eval-operator` accepts `operator` as an alias for the `expression` body key, and returns a clear error naming the expected key when it is missing.

- 54882e6: fix: Annotated feedback screenshots now capture the developer's actual tab

  Annotation screenshots (Cmd/Ctrl+/ Feedback Mode) previously re-rendered the page in a headless browser, which could diverge from what the developer was looking at — wrong theme, unsettled loading skeletons, missing client-only state. The overlay now rasterizes the live tab itself (theme, loaded data, exact pixels) with the annotations drawn on, and posts the PNG to the dev server to save under `.lowdefy/annotations/`. The headless render remains as a fallback when the in-tab capture is unavailable.

- ae5f618: fix(server-dev): Annotated screenshots render responsive images correctly.

  Tab captures embedded each image's fallback `src` instead of the variant the browser was displaying, warping `<picture>`/`srcset` images — most visibly the header logo squashed into its mobile mark. Captures now pin every responsive image to the displayed variant and restore the page afterwards.

- ae5f618: fix(server-dev): `/lowdefy-docs/find/{id}?pageId=` only matches config on that page.

  Built pages share identical key paths for same-named block ids, so a page-scoped find could return locations from other pages. Matches are now resolved against the requested page's own config tree, and the no-match message suggests retrying without `pageId` to scan everything. Option/Alt+click open-in-editor no longer sends an empty `pageId`.

- 806e1af: fix: Serve the dev mock session to the browser client

  With a mock user (`auth.dev.mockUser` / `LOWDEFY_DEV_USER` / `lowdefy dev --mock-user`) or a headless renderer session, server-side requests authenticated but the browser client's session stayed empty — `GET /api/auth/session` was answered by Auth.js alone, which knows nothing about dev sessions. Client-side `_user` values (roles, custom userFields like tenant claims) were missing, breaking auth-driven routing; apps could remount-loop between pages whose conditions read `_user`.

  Dev sessions are now built in one place (`getDevSession`) and served from it to both the server request context and the browser session endpoint, so the two can never diverge. The dev user also runs through the identical Auth.js session callback a real sign-in uses — userFields mapping, custom session-callback plugins, roles validation, `hashed_id` — so mock and headless sessions behave exactly like a production authenticated user.

- 49ad033: fix(server-dev): Annotations now work over open modals, plus an annotate hint on dev server startup.

  - The annotation overlay is now rendered into the document body, so its comment box stays clickable and typeable even when a modal is open on the page.
  - On startup the dev server now prints a notice box for coding agents: the docs & MCP endpoint URL with the `lowdefy agent-setup` command to connect an agent, and the Cmd/Ctrl+/ annotation shortcut.
  - `lowdefy agent-setup` now enables the `lowdefy-docs` MCP server in the committed `.claude/settings.json`, so everyone on the project has it approved without a prompt.

- 021dfa8: fix: Resolve list item block ids to their `$` config source

  Blocks inside lists render with array indices applied to their ids (`my_list.0.name`) while config — and the build keyMap — hold the `$` placeholder form (`my_list.$.name`). Config lookups for these ids missed, so Option/Alt+click open-in-editor, annotation location resolution, and the `lowdefy_find_config` tool fell back to the nearest configured ancestor — usually the list block itself. `findConfig` now folds runtime indices back to `$` when the exact id misses, so list content resolves to the yaml that defines the item block.

- 87ac211: fix(server-dev): Build the page JIT before serving a request. Page artifacts are built on `GET /api/page/*` and dropped on every page invalidation, so a client that already held the page config could fire a request during a rebuild and get `Request "x" does not exist.` — a fresh sign-in landing on a protected gate page hit this every time a config file was saved. `POST /api/request/*` now runs the same idempotent `buildPageIfNeeded` the page route runs.
- 36656ce: fix(server-dev): Keep the public port bound across dev-server restarts.

  The manager now owns the public port with a lightweight proxy and runs the
  Vite child on an internal loopback port. Previously every child restart (js
  module change, .env change, plugin install) dropped the TCP listener for the
  whole Vite boot, so long-lived clients — MCP coding agents on
  /lowdefy-docs/mcp, the reload SSE stream, HMR websockets — hit ECONNREFUSED;
  MCP clients in particular latch the failure and demand a manual reconnect
  (sometimes surfacing a spurious authentication prompt). Requests and websocket
  upgrades that arrive while the child is down now wait for it to come back (up
  to 30s) instead of failing, so a restart reads as one slow request.

- Updated dependencies [11662bc]
- Updated dependencies [0201358]
- Updated dependencies [082acec]
- Updated dependencies [59190b5]
- Updated dependencies [da0c62c]
- Updated dependencies [2da4907]
- Updated dependencies [a647873]
- Updated dependencies [e7a9270]
- Updated dependencies [c188656]
- Updated dependencies [b496a77]
- Updated dependencies [60401aa]
- Updated dependencies [37c8c14]
- Updated dependencies [ef707bd]
- Updated dependencies [a6daf0b]
- Updated dependencies [0dccf40]
- Updated dependencies [7ce6e36]
- Updated dependencies [46029df]
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
- Updated dependencies [1cc1521]
- Updated dependencies [6d38790]
- Updated dependencies [0f9487d]
- Updated dependencies [8398345]
- Updated dependencies [ae5f618]
- Updated dependencies [01d7552]
- Updated dependencies [01d7552]
- Updated dependencies [ae5f618]
- Updated dependencies [7746ce2]
- Updated dependencies [629837d]
- Updated dependencies [6446ae6]
- Updated dependencies [47ba6df]
- Updated dependencies [c9bea1c]
- Updated dependencies [ae5f618]
- Updated dependencies [16fdeb8]
- Updated dependencies [fb80e0a]
- Updated dependencies [0e71ebd]
- Updated dependencies [c2e0823]
- Updated dependencies [704cf4b]
- Updated dependencies [6d7cd8e]
- Updated dependencies [53a36ed]
  - @lowdefy/blocks-antd-x@6.0.0
  - @lowdefy/build@6.0.0
  - @lowdefy/operators-yaml@6.0.0
  - @lowdefy/operators-mql@6.0.0
  - @lowdefy/logger@6.0.0
  - @lowdefy/docs-content@6.0.0
  - @lowdefy/blocks-aggrid@6.0.0
  - @lowdefy/api@6.0.0
  - @lowdefy/client@6.0.0
  - @lowdefy/operators-js@6.0.0
  - @lowdefy/plugin-next-auth@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/blocks-antd@6.0.0
  - @lowdefy/engine@6.0.0
  - @lowdefy/blocks-basic@6.0.0
  - @lowdefy/blocks-echarts@6.0.0
  - @lowdefy/blocks-loaders@6.0.0
  - @lowdefy/blocks-markdown@6.0.0
  - @lowdefy/blocks-tiptap@6.0.0
  - @lowdefy/node-utils@6.0.0
  - @lowdefy/actions-core@6.0.0
  - @lowdefy/websockets-core@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/layout@6.0.0
  - @lowdefy/operators-change-case@6.0.0
  - @lowdefy/operators-dayjs@6.0.0
  - @lowdefy/operators-diff@6.0.0
  - @lowdefy/operators-nunjucks@6.0.0
  - @lowdefy/operators-uuid@6.0.0
  - @lowdefy/block-utils@6.0.0
  - @lowdefy/connection-axios-http@6.0.0

## 5.6.0

### Patch Changes

- 8306262: feat(blocks-aggrid): Add `AgGridLowdefy`, upgrade to AG Grid v33, and theme every grid through the Theming API.

  **Two new blocks.** `AgGridLowdefy` (display) and `AgGridLowdefyInput` (input) are grids themed from the app's antd design tokens — primary colour, surfaces, fonts and radius — so they look like they belong in a Lowdefy app and follow light/dark mode automatically, with no configuration and no separate dark block. They take a `size` property (`small | middle | large`, default `middle`) mirroring antd Table's densities, which sets row and header height to 36 / 44 / 54 pixels. Everything else — properties, events, methods, cell renderers — is identical to the existing grids.

  To adopt, change `type: AgGridBalham` to `type: AgGridLowdefy` (or `type: AgGridInputBalham` to `type: AgGridLowdefyInput`). Every property carries over unchanged and the grid will deliberately look different afterwards. It is a visual opt-in, so there is no codemod.

  Note that `size` loses to an explicit height: `rowHeight` and `headerHeight` are AG Grid grid options, and a grid option beats the theme parameter `size` sets. Setting `size: large` alongside `rowHeight: 30` gives 30 pixel rows under a 54 pixel header — use one or the other.

  **AG Grid v33.** The package moves from `@ag-grid-community/*@32` to `ag-grid-community` + `ag-grid-react@33.3.2`, with `AllCommunityModule` registered explicitly. The Theming API is v33's default and class-based file themes are gone, so no block imports AG Grid CSS any more.

  **The Balham, Alpine and Material blocks change appearance slightly.** They are kept indefinitely with the same API and the same names, but they now render AG Grid's prebuilt Theming API equivalents of those themes, with the antd colour mapping carried across as theme parameters. No config change is needed. What shifts:

  - Spacing and header weight move a little — Balham rows go 28px to 29px, cell horizontal padding tightens on Balham and Alpine, the wrapper corner radius now comes from each theme (Balham 2px, Alpine 3px, Material 0) rather than a uniform 6px, and Balham's header weight goes from 600 to bold. Icons come from each theme's own SVG set, so glyph shapes differ from the old icon font.
  - Row height now tracks the app's antd font size on Balham and Material, because v33 derives it from the data font size. It was font-size-independent before. The height only moves once the font size passes the theme's icon size (16px on Balham, 18px on Material), so at antd's default 14px nothing changes — you will see it at 18px or 20px. Alpine is unaffected at any font size.
  - Four colours are re-pointed: row hover is a neutral fill rather than a primary tint, borders are lighter, the checkbox outline tone changes, and popup shadows are softer.
  - Zebra striping, fonts and overall row density are preserved.

  **A new `themeParams` property, on all eight blocks.** `themeParams` takes AG Grid Theming API parameter names and merges them onto the block's theme — the recommended way to retint a single grid:

  ```yaml
  - id: my_table
    type: AgGridLowdefy
    properties:
      themeParams:
        headerBackgroundColor: '#1a1a2e'
        headerTextColor: '#e0e0ff'
        borderColor: var(--ant-color-primary)
  ```

  Values are CSS strings and may reference antd tokens. Neither Lowdefy nor AG Grid validates parameter names, so a misspelled key is a silent no-op — check spelling against AG Grid's theming parameter reference.

  Overriding `--ag-*` variables through a block's `style` — the documented `custom_theme` technique — **still works**; the Theming API honours an ancestor's declaration by design. The one caveat is that v33 renamed or folded away a number of the v32 `--ag-*` variables, and an override naming one of those is now a silent no-op. `--ag-header-foreground-color`, which appears in the documented example, is the case to watch: it is now `headerTextColor` (`--ag-header-text-color`). The AgGrid docs page carries the mapping table.

  **One deprecation warning existing apps may see.** `rowSelection: multiple` / `single` is deprecated in v33 in favour of `rowSelection: { mode: multiRow }` / `{ mode: singleRow }`. The string form still works. If you migrate it, three things must move together:

  - **Set `enableClickSelection: true`.** The string form defaults click-to-select on; the object form defaults it **off**. A bare `{ mode: singleRow }` silently stops clicking a row from selecting it, and `onRowSelected` / `onSelectionChanged` stop firing. The object form is not equivalent without this.
  - **Move the colDef flags in the same edit.** `checkboxSelection` and `headerCheckboxSelection` on a column become `rowSelection.checkboxes` and `rowSelection.headerCheckbox`. v33 only supports `headerCheckboxSelection` alongside the _string_ form, so migrating one without the other breaks the header checkbox.
  - **Six sibling options are read only in the string branch and are silently lost on migration:** `suppressRowClickSelection`, `suppressRowDeselection`, `rowMultiSelectWithClick`, `groupSelectsChildren`, `groupSelectsFiltered` and `isRowSelectable`. All six are deprecated in favour of `rowSelection.*` — move any you use across.

  **Dark-mode apps now get dark browser chrome throughout (`@lowdefy/client`, `@lowdefy/server`, `@lowdefy/server-dev`, `@lowdefy/server-e2e`).** `color-scheme` is now set on `<html>` from the resolved dark-mode state — in the client's dark-mode effect and in each server's pre-hydration inline script, so first paint matches too. Native scrollbars, `<select>` dropdowns, date pickers and autofill backgrounds render dark in a dark app, inside grids and everywhere else. This is an app-wide behaviour change, well beyond AgGrid, and it is what lets the grid's own scrollbars follow dark mode. Apps pinned to light with `theme.darkMode: light` are unaffected, including on a dark OS. Apps that leave `theme.darkMode` unset get the default, `system`, so on a dark OS they resolve to dark and do pick up `color-scheme: dark` — set `theme.darkMode: light` if that is not wanted.

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

- b09ad62: fix: Allow dependency build scripts via pnpm-workspace.yaml so installs succeed on pnpm 11.

  `lowdefy dev` and `lowdefy build` failed with `Dependency installation failed.` on pnpm 11 (`ERR_PNPM_IGNORED_BUILDS`), because dependency build scripts (sharp, better-sqlite3) were only allowed via the `pnpm.onlyBuiltDependencies` field in the server package.json — a field pnpm no longer reads (and strips at publish), while pnpm 11 turns ignored build scripts into a hard install error. The CLI now writes a `pnpm-workspace.yaml` with the build allowlist into the server directory before installing, covering pnpm 9 (`packages`), pnpm 10 (`onlyBuiltDependencies`), and pnpm 10.29+/11 (`allowBuilds`). An existing file is never overwritten, so users can extend the allowlist for their own plugins' native dependencies. When the app lives inside a pnpm workspace (e.g. `apps/*/.lowdefy/*` in the workspace globs, plugins pinned as `workspace:*`), the CLI writes nothing — the server installs as part of the parent workspace, where isolating it would break `workspace:*` plugin resolution and the root's `overrides`/`packageExtensions`, and build allowlists belong in the workspace root's `pnpm-workspace.yaml`. `lowdefy-e2e init` used the same dead mechanism for mongodb-memory-server and now writes the same allowlist to `pnpm-workspace.yaml` (the workspace root's if the app is inside a workspace, otherwise a new file in the app directory). The dead `pnpm` fields were removed from the server packages. Fixes #2191.

- Updated dependencies [3d59f5f]
- Updated dependencies [3d59f5f]
- Updated dependencies [5b590c7]
- Updated dependencies [8306262]
- Updated dependencies [0ec9154]
- Updated dependencies [3ead269]
- Updated dependencies [9399e4e]
- Updated dependencies [9e19a21]
- Updated dependencies [7d97d03]
- Updated dependencies [79bbd84]
- Updated dependencies [508708d]
- Updated dependencies [842d71c]
- Updated dependencies [291b4cf]
- Updated dependencies [508708d]
- Updated dependencies [bb02f06]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [4ae3fb9]
- Updated dependencies [3ead269]
- Updated dependencies [5b4c305]
  - @lowdefy/blocks-antd-x@5.6.0
  - @lowdefy/blocks-aggrid@5.6.0
  - @lowdefy/client@5.6.0
  - @lowdefy/engine@5.6.0
  - @lowdefy/helpers@5.6.0
  - @lowdefy/api@5.6.0
  - @lowdefy/build@5.6.0
  - @lowdefy/node-utils@5.6.0
  - @lowdefy/blocks-antd@5.6.0
  - @lowdefy/layout@5.6.0
  - @lowdefy/operators-js@5.6.0
  - @lowdefy/logger@5.6.0
  - @lowdefy/connection-axios-http@5.6.0
  - @lowdefy/blocks-markdown@5.6.0
  - @lowdefy/blocks-tiptap@5.6.0
  - @lowdefy/actions-core@5.6.0
  - @lowdefy/blocks-basic@5.6.0
  - @lowdefy/blocks-loaders@5.6.0
  - @lowdefy/operators-change-case@5.6.0
  - @lowdefy/operators-dayjs@5.6.0
  - @lowdefy/operators-diff@5.6.0
  - @lowdefy/operators-mql@5.6.0
  - @lowdefy/operators-nunjucks@5.6.0
  - @lowdefy/operators-uuid@5.6.0
  - @lowdefy/operators-yaml@5.6.0
  - @lowdefy/block-utils@5.6.0
  - @lowdefy/plugin-next-auth@5.6.0
  - @lowdefy/blocks-echarts@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- Updated dependencies [33e062f]
- Updated dependencies [59cae71]
  - @lowdefy/build@5.5.1
  - @lowdefy/blocks-antd@5.5.1
  - @lowdefy/engine@5.5.1
  - @lowdefy/blocks-aggrid@5.5.1
  - @lowdefy/blocks-tiptap@5.5.1
  - @lowdefy/api@5.5.1
  - @lowdefy/client@5.5.1
  - @lowdefy/layout@5.5.1
  - @lowdefy/actions-core@5.5.1
  - @lowdefy/blocks-antd-x@5.5.1
  - @lowdefy/blocks-basic@5.5.1
  - @lowdefy/blocks-echarts@5.5.1
  - @lowdefy/blocks-loaders@5.5.1
  - @lowdefy/blocks-markdown@5.5.1
  - @lowdefy/connection-axios-http@5.5.1
  - @lowdefy/operators-change-case@5.5.1
  - @lowdefy/operators-dayjs@5.5.1
  - @lowdefy/operators-diff@5.5.1
  - @lowdefy/operators-js@5.5.1
  - @lowdefy/operators-mql@5.5.1
  - @lowdefy/operators-nunjucks@5.5.1
  - @lowdefy/operators-uuid@5.5.1
  - @lowdefy/operators-yaml@5.5.1
  - @lowdefy/plugin-next-auth@5.5.1
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/errors@5.5.1
  - @lowdefy/helpers@5.5.1
  - @lowdefy/logger@5.5.1
  - @lowdefy/node-utils@5.5.1

## 5.5.0

### Patch Changes

- Updated dependencies [c5cc340]
- Updated dependencies [6dcdb6a]
- Updated dependencies [b368e15]
- Updated dependencies [f88fe33]
- Updated dependencies [7ab09d6]
  - @lowdefy/blocks-aggrid@5.5.0
  - @lowdefy/blocks-tiptap@5.5.0
  - @lowdefy/blocks-antd-x@5.5.0
  - @lowdefy/build@5.5.0
  - @lowdefy/api@5.5.0
  - @lowdefy/client@5.5.0
  - @lowdefy/engine@5.5.0
  - @lowdefy/layout@5.5.0
  - @lowdefy/actions-core@5.5.0
  - @lowdefy/blocks-antd@5.5.0
  - @lowdefy/blocks-basic@5.5.0
  - @lowdefy/blocks-echarts@5.5.0
  - @lowdefy/blocks-loaders@5.5.0
  - @lowdefy/blocks-markdown@5.5.0
  - @lowdefy/connection-axios-http@5.5.0
  - @lowdefy/operators-change-case@5.5.0
  - @lowdefy/operators-dayjs@5.5.0
  - @lowdefy/operators-diff@5.5.0
  - @lowdefy/operators-js@5.5.0
  - @lowdefy/operators-mql@5.5.0
  - @lowdefy/operators-nunjucks@5.5.0
  - @lowdefy/operators-uuid@5.5.0
  - @lowdefy/operators-yaml@5.5.0
  - @lowdefy/plugin-next-auth@5.5.0
  - @lowdefy/block-utils@5.5.0
  - @lowdefy/errors@5.5.0
  - @lowdefy/helpers@5.5.0
  - @lowdefy/logger@5.5.0
  - @lowdefy/node-utils@5.5.0

## 5.4.0

### Minor Changes

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

### Patch Changes

- d1fb1d7: feat: Plugin-driven `serverExternalPackages` for Next.js.

  Plugins can now declare which of their dependencies need to be passed
  through to Next.js's `serverExternalPackages` config — used for CJS
  packages whose runtime `require()` chains Turbopack can't resolve
  through pnpm's isolated symlink layout (e.g. `turndown` →
  `@mixmark-io/domino`, `@aws-sdk/client-s3` → `fast-xml-parser` →
  `strnum`).

  Declare in the plugin's `package.json`:

  ```json
  {
    "lowdefy": {
      "serverExternalPackages": ["turndown"]
    }
  }
  ```

  Build aggregates declarations from every plugin the app actually uses
  (across blocks, connections, operators, actions, agents, auth, icons,
  requests) and writes a per-app `serverExternalPackages.json` artifact,
  read by `server`, `server-dev`, and `server-e2e` Next.js configs.

  Replaces a hardcoded list in the three server configs. Apps not using
  `blocks-tiptap` or `plugin-aws` no longer carry their externals.

  Initial declarations:

  - `@lowdefy/blocks-tiptap` → `turndown`
  - `@lowdefy/plugin-aws` → `@aws-sdk/client-s3`

- dc1d13a: fix(server-dev): Stop false "non-existent endpoint" warnings for CallAPI actions in dev.

  Under `lowdefy dev`, every `CallAPI` action logged a `ConfigWarning` that its endpoint did not exist, even when the endpoint was correctly defined under `api:` and worked at runtime. A full `lowdefy build` was unaffected.

  The JIT page builder validates CallAPI references against `context.components.api`, but the dev server's build context (`getBuildContext`) is rebuilt from disk artifacts and never restored the api endpoints, so the endpoint set was always empty and every reference was flagged. The dev context now hydrates the endpoints from the persisted `build/api/<endpointId>.json` artifacts (written by the skeleton build), so the non-existent-endpoint and InternalApi-not-client-callable checks behave the same in dev as in a full build.

  Module endpoints are written to nested paths (`build/api/<moduleId>/<endpointId>.json`) because their scoped `endpointId` contains a `/`. The artifact reader now walks the api directory recursively so these endpoints are hydrated too; previously every module CallAPI was still flagged as referencing a non-existent endpoint.

- Updated dependencies [ff7ed66]
- Updated dependencies [5e498dd]
- Updated dependencies [60401aa]
- Updated dependencies [c2c3a7f]
- Updated dependencies [25225ab]
- Updated dependencies [2aaf365]
- Updated dependencies [ba1d3bd]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [5f00be7]
- Updated dependencies [1db0ef9]
- Updated dependencies [302e330]
- Updated dependencies [d1fb1d7]
- Updated dependencies [27659ef]
- Updated dependencies [4e189a0]
- Updated dependencies [0027a41]
- Updated dependencies [b182517]
- Updated dependencies [7c97d3b]
- Updated dependencies [27659ef]
- Updated dependencies [42db297]
- Updated dependencies [e324c72]
- Updated dependencies [b6e555f]
- Updated dependencies [f8a5d80]
- Updated dependencies [60c193c]
- Updated dependencies [86919df]
  - @lowdefy/blocks-antd-x@5.4.0
  - @lowdefy/api@5.4.0
  - @lowdefy/build@5.4.0
  - @lowdefy/client@5.4.0
  - @lowdefy/operators-js@5.4.0
  - @lowdefy/blocks-antd@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/actions-core@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/engine@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/blocks-tiptap@5.4.0
  - @lowdefy/connection-axios-http@5.4.0
  - @lowdefy/operators-change-case@5.4.0
  - @lowdefy/operators-dayjs@5.4.0
  - @lowdefy/operators-diff@5.4.0
  - @lowdefy/operators-mql@5.4.0
  - @lowdefy/operators-nunjucks@5.4.0
  - @lowdefy/operators-uuid@5.4.0
  - @lowdefy/operators-yaml@5.4.0
  - @lowdefy/layout@5.4.0
  - @lowdefy/blocks-aggrid@5.4.0
  - @lowdefy/blocks-basic@5.4.0
  - @lowdefy/blocks-loaders@5.4.0
  - @lowdefy/logger@5.4.0
  - @lowdefy/node-utils@5.4.0
  - @lowdefy/blocks-echarts@5.4.0
  - @lowdefy/blocks-markdown@5.4.0
  - @lowdefy/plugin-next-auth@5.4.0

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

- Updated dependencies [6955341]
- Updated dependencies [99fe9b8]
- Updated dependencies [7f40746]
- Updated dependencies [e3a08cc]
- Updated dependencies [28e2913]
- Updated dependencies [54d30f7]
  - @lowdefy/blocks-antd-x@5.3.0
  - @lowdefy/api@5.3.0
  - @lowdefy/build@5.3.0
  - @lowdefy/blocks-aggrid@5.3.0
  - @lowdefy/blocks-markdown@5.3.0
  - @lowdefy/blocks-antd@5.3.0
  - @lowdefy/engine@5.3.0
  - @lowdefy/blocks-tiptap@5.3.0
  - @lowdefy/client@5.3.0
  - @lowdefy/layout@5.3.0
  - @lowdefy/actions-core@5.3.0
  - @lowdefy/blocks-basic@5.3.0
  - @lowdefy/blocks-echarts@5.3.0
  - @lowdefy/blocks-loaders@5.3.0
  - @lowdefy/connection-axios-http@5.3.0
  - @lowdefy/operators-change-case@5.3.0
  - @lowdefy/operators-dayjs@5.3.0
  - @lowdefy/operators-diff@5.3.0
  - @lowdefy/operators-js@5.3.0
  - @lowdefy/operators-mql@5.3.0
  - @lowdefy/operators-nunjucks@5.3.0
  - @lowdefy/operators-uuid@5.3.0
  - @lowdefy/operators-yaml@5.3.0
  - @lowdefy/plugin-next-auth@5.3.0
  - @lowdefy/block-utils@5.3.0
  - @lowdefy/errors@5.3.0
  - @lowdefy/helpers@5.3.0
  - @lowdefy/logger@5.3.0
  - @lowdefy/node-utils@5.3.0

## 5.2.0

### Minor Changes

- 0f38c9f: feat: First-class module system for reusable config packages

  Modules are reusable bundles of Lowdefy config — pages, connections, API endpoints, menus, and exposed components — hosted in GitHub repositories or local directories. Apps install modules in `lowdefy.yaml` and configure them through `vars`, replacing the copy-paste-between-projects pattern with a declarative dependency.

  **Module entries (`@lowdefy/build`)**

  - Apps declare entries in the `modules` array of `lowdefy.yaml` with `id`, `source`, and optional `vars`, `connections`, and `dependencies`.
  - The entry `id` namespaces the module's content and forms the URL prefix for its pages (e.g. `/team-users/users-list`).
  - Multi-instance: the same module source can be installed multiple times under different entry IDs, each with its own vars and namespace.
  - GitHub sources (`github:owner/repo[/path]@ref`) are fetched as tarballs and locally cached. Private repos use `GITHUB_TOKEN`, the `gh` CLI, or git credential helpers.
  - Local sources (`file:./relative/path`) resolve relative to the project root.

  **Module manifest (`module.lowdefy.yaml`)**

  - Declares the module's interface: `name`, `description`, `vars`, `connections`, `pages`, `api`, `components`, `menus`, `dependencies`, `exports`, `plugins`, and `secrets`.
  - `vars` declarations validate consumer values with `type`, `required`, `default`, and `description`. Consumer values override manifest defaults; omitted values fall back to the declared default.
  - `exports` declares the module's public interface — the IDs other modules and apps may reference. The build validates cross-module references against exports.
  - `plugins` declarations are validated against the app's installed plugins with semver compatibility checks.
  - `secrets` is an allowlist of secrets the module may access; undeclared `_secret` references fail the build. Remapped connections skip the module's secret references for that connection.

  **Module operators**

  - `_module.var` — read manifest-validated vars, including consumer overrides and declared defaults.
  - `_module.pageId`, `_module.connectionId`, `_module.endpointId` — produce scoped IDs from a module-author's unscoped ID.
  - `_module.id` — the entry ID of the current module.

  **Auto-scoped IDs**

  Page, connection, API endpoint, and menu item IDs are auto-prefixed with the entry ID. Block and request IDs inherit page scope and are not rewritten.

  **Consuming module resources**

  - Pages and APIs are auto-included and auto-scoped — they appear in the app under the entry-ID prefix.
  - Components are reusable config fragments included with `_ref: { module, component, vars }`. They can export any config — UI blocks, enum maps, config templates, schema fragments — and accept vars at the call site.
  - Menus are included with `_ref: { module, menu }`, typically wrapped in a `MenuGroup`.

  **Connection remapping**

  Apps can redirect a module connection to an existing app connection via the entry's `connections` map. The module's connection definition and its declared secrets are skipped — the app connection handles them.

  **Cross-module dependencies**

  Modules can reference each other's pages, components, menus, connections, and APIs via abstract dependencies declared in `module.lowdefy.yaml`.

  - Auto-wiring: when a module entry's `id` matches a declared dependency name, the build wires it automatically.
  - Explicit wiring: the entry's `dependencies` map overrides auto-wiring and supports multi-instance topologies where each instance points at a different partner.
  - The build validates every wiring, detects dependency cycles, and reports unmapped or undeclared dependencies with remediation hints.

  **Auth page rules**

  Picomatch glob patterns in auth page rules (e.g. `team-users/*`) for wildcard module page matching.

  **Slashed page IDs (`@lowdefy/server`, `@lowdefy/server-dev`)**

  Server routes support module page IDs containing `/` (e.g. `/team-users/users-list`).

### Patch Changes

- 596fddc: chore(connection-knex): update knex and SQL drivers; replace `sqlite3` with `better-sqlite3`; replace `mysql` with `mysql2`.

  Bumped knex and its dialect drivers, and consolidated onto the actively-maintained drivers — replaced `sqlite3` with `better-sqlite3` and `mysql` with `mysql2`. Subsumes the prior `sqlite3@5.1.7` darwin-arm64 fix.

  `@lowdefy/connection-knex` dependency changes:

  - `knex` `2.5.1` → `3.2.9`. Knex 3.x drops Node < 16; Lowdefy already requires Node 18+. The `knex(config)`, `.raw()`, and dynamic query-builder API surface used by `KnexRaw` / `KnexBuilder` is unchanged.
  - `pg` `8.11.3` → `8.20.0`.
  - **Removed** `mssql`. Knex's `mssql` dialect actually requires `tedious` (not the `mssql` package), and Lowdefy never imported `mssql` directly — it was only ever a vehicle for pulling tedious into the install tree. `client: mssql` in user YAML is unchanged: the knex client name stays the same, only the underlying npm package shipped with `connection-knex` changes.
  - **Added** `tedious` `19.2.1` as the SQL Server driver — the package knex actually loads when `client: mssql` is used.
  - **Removed** `sqlite3`. The driver is in maintenance-only mode upstream (the v6 release marked the repo unmaintained).
  - **Added** `better-sqlite3` `12.9.0` as the SQLite driver. Selectable as `client: better-sqlite3` (or `client: sqlite`, which is now an alias of `better-sqlite3` — see runtime client handling below).
  - **Removed** `mysql`. Unmaintained upstream since 2020.
  - **Added** `mysql2` `3.22.3` as the MySQL / MariaDB driver. Selectable as `client: mysql2` in connection YAML.

  Runtime client handling (in `createKnex`):

  - `client: sqlite` is silently remapped to `client: better-sqlite3`. `sqlite` was historically a knex-level alias of `sqlite3`; this preserves the YAML alias while the underlying driver changes.
  - `client: sqlite3` now throws a `ConfigError` with a migration message: `Knex connection "client: sqlite3" is no longer supported. Use "client: better-sqlite3" or "client: sqlite" instead.` Existing apps using `client: sqlite3` need to update their connection YAML.
  - `client: mysql` now throws a `ConfigError` with a migration message: `Knex connection "client: mysql" is no longer supported. Use "client: mysql2" instead.` Existing apps using `client: mysql` need to update their connection YAML. `mysql` is **not** silently remapped because knex treats `mysql` and `mysql2` as separate dialects with subtly different SQL formatters, not aliases — the migration is a deliberate user choice.

  `pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3`:

  `better-sqlite3` runs a native-binding install script (`prebuild-install` with a `node-gyp rebuild` fallback). pnpm 10 silently suppresses postinstall scripts for unapproved packages, which leaves the binding unbuilt and crashes `KnexRaw` / `KnexBuilder` at runtime.

  - Added `better-sqlite3` to the allowlist on `@lowdefy/server`, `@lowdefy/server-dev`, and `@lowdefy/server-e2e`. These are the install roots in the CLI fetch flow under `.lowdefy/{dev,build}/`, where pnpm honors the per-package `pnpm.onlyBuiltDependencies` field.
  - Also added the same allowlist to the monorepo root `package.json`. The per-package field is ignored at workspace-root install (pnpm 10 only honors it on the install root), so contributors running `pnpm install` at the repo root would otherwise have to `pnpm rebuild better-sqlite3` manually.

- 762755c: feat(blocks-tiptap): Add new default block package with `TiptapInput` and `TiptapMentionInput` rich-text editors.

  `@lowdefy/blocks-tiptap` ships two rich-text editor blocks built on [TipTap](https://tiptap.dev):

  - **`TiptapInput`** — standard rich-text editor with bold/italic/strike-through, multi-color highlight, headings, lists, tables, links, and a bubble menu.
  - **`TiptapMentionInput`** — everything `TiptapInput` does, plus an @-mention dropdown populated from a static options list or a Lowdefy request. Resolved mentions are returned on the block value as `mentions: [...]`.

  Both blocks emit an object value shaped `{ html, text, markdown, fileList, mentions? }` and register `clear`, `setContent`, and `focus` methods.

  **Configurable extensions** — defaults preserve the bundled editor; override any of these to trim the editor down or tune it:

  - `properties.starterKit` — object forwarded to TipTap [StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit), e.g. `{ heading: false, codeBlock: false }`.
  - `properties.image` — `{ enabled, maxWidth, zoom }`
  - `properties.table` — `{ enabled, resizable }`
  - `properties.link` — `{ enabled, autolink, linkOnPaste, openOnClick, defaultProtocol }`
  - `properties.highlight` — `{ enabled, multicolor }`
  - `properties.mentions.char` / `properties.mentions.allowSpaces` — change the trigger char (e.g. `#` for hashtags) or disable spaces inside a mention query (`TiptapMentionInput` only).

  Image drag/drop and paste are supported by pointing `properties.s3PostPolicyRequestId` at a request that returns an S3 presigned POST policy (e.g. `AwsS3PresignedPostPolicy`). The file handler is optional — omit the request id to disable uploads entirely.

  The blocks are registered in the default types map and are available out of the box on `@lowdefy/server-dev`. No private-registry tokens are required: the blocks use the open-source [`@tiptap/extension-file-handler`](https://www.npmjs.com/package/@tiptap/extension-file-handler) instead of `@tiptap-pro/extension-file-handler`, so projects that migrated from a custom TipTap plugin can drop their `TIPTAP_PRO_TOKEN` environment variable and `.npmrc` scoped-registry config.

- Updated dependencies [1d18a13]
- Updated dependencies [01e249b]
- Updated dependencies [762755c]
- Updated dependencies [73fa2b9]
- Updated dependencies [69a59c0]
- Updated dependencies [6ec2cd9]
- Updated dependencies [0d44433]
- Updated dependencies [fd1604f]
- Updated dependencies [186a57d]
- Updated dependencies [a4ecee5]
- Updated dependencies [d105b81]
- Updated dependencies [6ec0dd4]
- Updated dependencies [e3fc007]
- Updated dependencies [cea34ac]
- Updated dependencies [0f38c9f]
- Updated dependencies [c91003d]
- Updated dependencies [72b6159]
  - @lowdefy/actions-core@5.2.0
  - @lowdefy/engine@5.2.0
  - @lowdefy/operators-js@5.2.0
  - @lowdefy/blocks-antd@5.2.0
  - @lowdefy/client@5.2.0
  - @lowdefy/blocks-tiptap@5.2.0
  - @lowdefy/build@5.2.0
  - @lowdefy/api@5.2.0
  - @lowdefy/blocks-aggrid@5.2.0
  - @lowdefy/logger@5.2.0
  - @lowdefy/blocks-loaders@5.2.0
  - @lowdefy/operators-change-case@5.2.0
  - @lowdefy/operators-dayjs@5.2.0
  - @lowdefy/operators-diff@5.2.0
  - @lowdefy/operators-mql@5.2.0
  - @lowdefy/operators-nunjucks@5.2.0
  - @lowdefy/operators-uuid@5.2.0
  - @lowdefy/operators-yaml@5.2.0
  - @lowdefy/layout@5.2.0
  - @lowdefy/blocks-basic@5.2.0
  - @lowdefy/blocks-echarts@5.2.0
  - @lowdefy/blocks-markdown@5.2.0
  - @lowdefy/connection-axios-http@5.2.0
  - @lowdefy/plugin-next-auth@5.2.0
  - @lowdefy/block-utils@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0
  - @lowdefy/node-utils@5.2.0

## 5.1.0

### Patch Changes

- 081d79634: feat(client): Per-mode theme tokens for dark/light customization.

  `theme.antd` now accepts four new sibling keys so apps can soften base surfaces without juggling two theme files. Each is merged on top of the shared equivalent only when the matching mode is active:

  - `lightToken` / `darkToken` — override antd design tokens (e.g. `colorBgLayout`, `colorBgContainer`, `colorBgElevated`) per mode.
  - `lightComponents` / `darkComponents` — override component-level tokens per mode (e.g. `Layout.siderBg`, `Layout.headerBg`, `Menu.darkItemBg`) that aren't reachable via seed tokens.

  The `<html>` pre-hydration inline script now reads `darkToken.colorBgLayout` / `lightToken.colorBgLayout` from the built theme, so the first paint matches your configured surface color with no flash of `#000` or `#fff`.

  ```yaml
  theme:
    antd:
      token:
        colorPrimary: '#6366f1'
      darkToken:
        colorBgLayout: '#131419'
        colorBgContainer: '#1a1b22'
      darkComponents:
        Layout:
          headerBg: '#0e0f13'
          siderBg: '#0e0f13'
        Menu:
          darkItemBg: '#0e0f13'
          darkItemSelectedBg: '#252731'
    darkMode: system
  ```

  Backwards compatible — apps that only use `theme.antd.token` keep antd's default base colors (dark `#000`, light browser-default).

- f56a47d87: fix(server): Prevent white flash on page navigation in dark mode.

  Pages no longer flash white when navigating between pages in dark mode. A synchronous inline script now sets the correct background color before the page paints, matching the user's dark mode preference from config, localStorage, or system settings.

- c6f45a1ac: fix(server): Escape theme values embedded in the pre-hydration inline script.

  `_document.js` interpolates `configColorMode`, `darkToken.colorBgLayout`, and `lightToken.colorBgLayout` from `theme.json` into a synchronous `<script>` block to set the `<html>` background before hydration. Previously the values went through `JSON.stringify` only — enough to escape JS-string-context characters, but not enough to prevent a value containing `</script>` (or U+2028 / U+2029 line separators) from breaking out of the enclosing `<script>` tag.

  Added a `safeScriptJson` helper that additionally escapes `<`, `>`, control chars, and U+2028 / U+2029 to `\uXXXX` sequences after `JSON.stringify`. For every valid color value (`#1e293b`, `rgb(...)`, `slategray`, `oklch(...)`, etc.) the output is byte-identical to the previous behavior; only payloads that would have tripped `<script>` breakout or JS-line-terminator injection are now neutralized.

  Closes the six `js/bad-code-sanitization` CodeQL alerts (89 – 94) opened against the per-mode-theme PR.

- Updated dependencies [b2a2a981d]
- Updated dependencies [72625593e]
- Updated dependencies [95388a581]
- Updated dependencies [573b90369]
- Updated dependencies [be367bebd]
- Updated dependencies [b1e0c9944]
- Updated dependencies [447f8ce57]
- Updated dependencies [36a2d1bca]
- Updated dependencies [081d79634]
- Updated dependencies [72fbd4bab]
- Updated dependencies [a7f2480b4]
- Updated dependencies [797ab5b2d]
- Updated dependencies [f56a47d87]
- Updated dependencies [6c6aab961]
- Updated dependencies [af8ef77cb]
  - @lowdefy/blocks-aggrid@5.1.0
  - @lowdefy/blocks-antd@5.1.0
  - @lowdefy/client@5.1.0
  - @lowdefy/build@5.1.0
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/engine@5.1.0
  - @lowdefy/api@5.1.0
  - @lowdefy/layout@5.1.0
  - @lowdefy/actions-core@5.1.0
  - @lowdefy/blocks-basic@5.1.0
  - @lowdefy/blocks-echarts@5.1.0
  - @lowdefy/blocks-loaders@5.1.0
  - @lowdefy/blocks-markdown@5.1.0
  - @lowdefy/connection-axios-http@5.1.0
  - @lowdefy/operators-change-case@5.1.0
  - @lowdefy/operators-dayjs@5.1.0
  - @lowdefy/operators-diff@5.1.0
  - @lowdefy/operators-mql@5.1.0
  - @lowdefy/operators-nunjucks@5.1.0
  - @lowdefy/operators-uuid@5.1.0
  - @lowdefy/operators-yaml@5.1.0
  - @lowdefy/plugin-next-auth@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/logger@5.1.0
  - @lowdefy/node-utils@5.1.0

## 5.0.0

### Major Changes

- 29eb199c7f: Restructure block metadata from component static properties to dedicated `meta.js` files.

  ### Breaking Changes

  - **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
  - **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
  - **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
  - **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
  - **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.

- f430f02dde: Upgrade Next.js to 16 with Turbopack.

  ### Breaking Changes

  - **Next.js 16**: Both production and development servers run on Next.js 16 with Turbopack as the default bundler.
  - **Less removed**: `next-with-less` wrapper is removed. Styling uses CSS Modules and antd CSS-in-JS.
  - **SWC 1.15.18**: Updated SWC compiler.
  - **Dynamic transpilePackages**: Server resolves block packages for transpilation from a build artifact, supporting custom block plugins with CSS imports.
  - **antd as direct server dependency**: Both server packages list `antd` and `@ant-design/cssinjs` as direct dependencies for pnpm strict mode compatibility.

### Minor Changes

- f430f02dde: Add ErrorBar component to the development server that displays build errors and warnings in a fixed bottom bar. Build warnings now propagate from the build pipeline to the browser for immediate developer feedback.
- c8f4a41063: Add `theme.darkMode` config with system preference support.

  **System Dark Mode (`theme.darkMode`)**

  - New `theme.darkMode` config key accepts `'system'` (default), `'light'`, or `'dark'`
  - When set to `'system'`, the app follows the OS dark mode preference and updates live when it changes
  - When set to `'light'` or `'dark'`, the developer locks the mode — user preferences are stored but not applied

  **SetDarkMode Action**

  - Now accepts string params: `darkMode: 'system' | 'light' | 'dark'`
  - Without params, cycles through light, dark, and system preferences

  **`_media` Operator**

  - New `_media: darkModePreference` returns the user's preference (`'system'`, `'light'`, or `'dark'`)
  - `_media: darkMode` continues to return the effective boolean state

  **Dark Mode Rendering**

  - Notification, Message, and ConfirmModal render with correct dark mode colors via `App.useApp()` hooks
  - Loader blocks (Skeleton, Spinner) use antd design tokens instead of hardcoded colors
  - 404 page and loading states use theme-aware backgrounds
  - Mobile menu drawer background matches the active theme

- f430f02dde: Extract Tailwind utility classes from block properties for CSS generation. All string values in block properties (HTML content, markdown, class names) are scanned at build time and written to per-page content files so Tailwind v4's Oxide engine generates CSS for all used utilities. Content files are regenerated on each JIT rebuild for hot reload.

  Block plugin source files are resolved using `require.resolve` to follow pnpm symlinks correctly. The server package includes `postcss.config.js` so Tailwind compiles in production builds.

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [45964f1506]
- Updated dependencies [52ea769811]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [155c0b9724]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [0fe1bc38dd]
- Updated dependencies [130a569d36]
- Updated dependencies [e3e922538]
- Updated dependencies [c3b5b45ec5]
- Updated dependencies [c8f4a41063]
- Updated dependencies [fd8225b7a1]
- Updated dependencies [43528a8b9]
- Updated dependencies [905d5d406]
- Updated dependencies [c1b5ddb33a]
- Updated dependencies [f430f02dde]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [c570982e0f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/blocks-aggrid@5.0.0
  - @lowdefy/blocks-basic@5.0.0
  - @lowdefy/blocks-antd@5.0.0
  - @lowdefy/build@5.0.0
  - @lowdefy/engine@5.0.0
  - @lowdefy/client@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/blocks-loaders@5.0.0
  - @lowdefy/blocks-echarts@5.0.0
  - @lowdefy/blocks-markdown@5.0.0
  - @lowdefy/operators-dayjs@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/actions-core@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/connection-axios-http@5.0.0
  - @lowdefy/operators-mql@5.0.0
  - @lowdefy/operators-nunjucks@5.0.0
  - @lowdefy/operators-uuid@5.0.0
  - @lowdefy/operators-yaml@5.0.0
  - @lowdefy/operators-change-case@5.0.0
  - @lowdefy/operators-diff@5.0.0
  - @lowdefy/plugin-next-auth@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/api@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- 8779686f9: fix(build,server-dev): Improved accuracy of dev server skeleton rebuild detection.

  The dev server previously used a path-based heuristic to decide which file changes required a skeleton rebuild. This could miss changes to API endpoints referenced from page directories, and unnecessarily rebuild for non-skeleton page templates. Skeleton rebuild classification now uses the build's ref map as the source of truth, ensuring only the correct file changes trigger skeleton rebuilds.

- Updated dependencies [c5ce5b972]
- Updated dependencies [9de3276dc]
- Updated dependencies [8779686f9]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/api@4.7.3
  - @lowdefy/build@4.7.3
  - @lowdefy/engine@4.7.3
  - @lowdefy/client@4.7.3
  - @lowdefy/layout@4.7.3
  - @lowdefy/actions-core@4.7.3
  - @lowdefy/blocks-aggrid@4.7.3
  - @lowdefy/blocks-antd@4.7.3
  - @lowdefy/blocks-basic@4.7.3
  - @lowdefy/blocks-color-selectors@4.7.3
  - @lowdefy/blocks-echarts@4.7.3
  - @lowdefy/blocks-loaders@4.7.3
  - @lowdefy/blocks-markdown@4.7.3
  - @lowdefy/blocks-qr@4.7.3
  - @lowdefy/operators-change-case@4.7.3
  - @lowdefy/operators-diff@4.7.3
  - @lowdefy/operators-moment@4.7.3
  - @lowdefy/operators-mql@4.7.3
  - @lowdefy/operators-nunjucks@4.7.3
  - @lowdefy/operators-uuid@4.7.3
  - @lowdefy/operators-yaml@4.7.3
  - @lowdefy/plugin-next-auth@4.7.3
  - @lowdefy/block-utils@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/logger@4.7.3
  - @lowdefy/node-utils@4.7.3

## 4.7.2

### Patch Changes

- 30616048d: fix: Fix dev server build hang when page files contain top-level \_ref.

  The dev server could hang indefinitely at "Building config..." when a page YAML file's entire content was a `_ref`. This caused a self-referencing parent in the ref map, leading to an infinite loop during page source resolution. Also fixed null `lowdefy.yaml` handling in custom plugin type map generation.

- Updated dependencies [30616048d]
  - @lowdefy/build@4.7.2
  - @lowdefy/engine@4.7.2
  - @lowdefy/api@4.7.2
  - @lowdefy/client@4.7.2
  - @lowdefy/layout@4.7.2
  - @lowdefy/actions-core@4.7.2
  - @lowdefy/blocks-aggrid@4.7.2
  - @lowdefy/blocks-antd@4.7.2
  - @lowdefy/blocks-basic@4.7.2
  - @lowdefy/blocks-color-selectors@4.7.2
  - @lowdefy/blocks-echarts@4.7.2
  - @lowdefy/blocks-loaders@4.7.2
  - @lowdefy/blocks-markdown@4.7.2
  - @lowdefy/blocks-qr@4.7.2
  - @lowdefy/operators-change-case@4.7.2
  - @lowdefy/operators-diff@4.7.2
  - @lowdefy/operators-js@4.7.2
  - @lowdefy/operators-moment@4.7.2
  - @lowdefy/operators-mql@4.7.2
  - @lowdefy/operators-nunjucks@4.7.2
  - @lowdefy/operators-uuid@4.7.2
  - @lowdefy/operators-yaml@4.7.2
  - @lowdefy/plugin-next-auth@4.7.2
  - @lowdefy/block-utils@4.7.2
  - @lowdefy/errors@4.7.2
  - @lowdefy/helpers@4.7.2
  - @lowdefy/logger@4.7.2
  - @lowdefy/node-utils@4.7.2

## 4.7.1

### Patch Changes

- 1ce9f9a56: fix(build): Dev server dynamically loads icons discovered during JIT page builds.

  Icons referenced only inside page blocks (e.g., `icon: FiAperture` on a Button) were not available in the dev server's static bundle, causing a fallback icon to render. The JIT page builder now detects missing icons when a page is compiled, extracts their SVG data from react-icons, and serves it via a dynamic API endpoint. The client fetches and merges these icons at runtime without triggering a Next.js rebuild or server restart.

- Updated dependencies [18d1c3bfa]
- Updated dependencies [fac48c10a]
- Updated dependencies [1ce9f9a56]
- Updated dependencies [ca26d3441]
  - @lowdefy/blocks-antd@4.7.1
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/build@4.7.1
  - @lowdefy/blocks-color-selectors@4.7.1
  - @lowdefy/api@4.7.1
  - @lowdefy/engine@4.7.1
  - @lowdefy/blocks-aggrid@4.7.1
  - @lowdefy/blocks-basic@4.7.1
  - @lowdefy/blocks-echarts@4.7.1
  - @lowdefy/blocks-loaders@4.7.1
  - @lowdefy/blocks-markdown@4.7.1
  - @lowdefy/blocks-qr@4.7.1
  - @lowdefy/client@4.7.1
  - @lowdefy/layout@4.7.1
  - @lowdefy/actions-core@4.7.1
  - @lowdefy/operators-change-case@4.7.1
  - @lowdefy/operators-diff@4.7.1
  - @lowdefy/operators-moment@4.7.1
  - @lowdefy/operators-mql@4.7.1
  - @lowdefy/operators-nunjucks@4.7.1
  - @lowdefy/operators-uuid@4.7.1
  - @lowdefy/operators-yaml@4.7.1
  - @lowdefy/plugin-next-auth@4.7.1
  - @lowdefy/block-utils@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/logger@4.7.1
  - @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

- e2666d58c: fix(cli): Fix port availability check for start command

  The CLI's `checkPortAvailable` was called with `undefined` port when no `--port` flag was passed, causing `net.listen(undefined)` to bind a random port instead of checking port 3000. Added default `port: 3000` in `getOptions`. Removed redundant `checkPortAvailable` from server-dev manager since the CLI now catches port conflicts before the server starts.

- Updated dependencies [4543688f7]
- Updated dependencies [e1274566b]
- Updated dependencies [5716be2c8]
- Updated dependencies [5a556b918]
- Updated dependencies [811f80760]
- Updated dependencies [dea6651a1]
  - @lowdefy/build@4.7.0
  - @lowdefy/helpers@4.7.0
  - @lowdefy/blocks-antd@4.7.0
  - @lowdefy/blocks-basic@4.7.0
  - @lowdefy/engine@4.7.0
  - @lowdefy/api@4.7.0
  - @lowdefy/operators-change-case@4.7.0
  - @lowdefy/operators-diff@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/operators-moment@4.7.0
  - @lowdefy/operators-mql@4.7.0
  - @lowdefy/operators-nunjucks@4.7.0
  - @lowdefy/operators-uuid@4.7.0
  - @lowdefy/operators-yaml@4.7.0
  - @lowdefy/client@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/actions-core@4.7.0
  - @lowdefy/blocks-aggrid@4.7.0
  - @lowdefy/blocks-loaders@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/blocks-color-selectors@4.7.0
  - @lowdefy/blocks-echarts@4.7.0
  - @lowdefy/blocks-markdown@4.7.0
  - @lowdefy/blocks-qr@4.7.0
  - @lowdefy/plugin-next-auth@4.7.0
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

- af61715d5: feat: JIT page building for dev server

  **Shallow Refs and JIT Build (`@lowdefy/build`)**

  - Shallow `_ref` resolution stops at configured JSON paths, leaving `~shallow` markers for on-demand resolution
  - `shallowBuild` produces a page registry with dependency tracking instead of fully built pages
  - `buildPageJit` fully resolves a single page on demand using the shallow build output
  - File dependency map tracks which config files affect which pages for targeted rebuilds
  - Build package reorganized: `jit/` folder for dev-server-only files, `full/` folder for production-only files

  **JIT Page Building (`@lowdefy/server-dev`)**

  - Pages are built on-demand when requested instead of all at once during initial build
  - Page cache with file-watcher invalidation for fast rebuilds
  - `/api/page/[pageId]` endpoint triggers JIT build if page not cached
  - `/api/js/[env]` endpoint serves operator JS maps
  - Build error page component displays errors inline in the browser

  **Operator JS Hash Check (`@lowdefy/operators-js`)**

  - Added hash validation for jsMap to detect stale operator definitions

- f673e3ab3d: feat(logger): Add centralized @lowdefy/logger package and standardize logging

  **New @lowdefy/logger Package**

  - Centralized logging with environment-specific subpaths: `/node`, `/cli`, `/browser`
  - `createNodeLogger` — pino factory with custom error serializer preserving Lowdefy error metadata (source, configKey, isServiceError)
  - `createCliLogger` — wraps `createPrint` (ora spinners, colored output) with standard logger interface
  - `createBrowserLogger` — maps to `console.*` with error formatting
  - `wrapErrorLogger` — formats Lowdefy errors, emits source as separate `{ print: 'link' }` line for blue clickable links

  **Standardized `.ui` Interface**

  All logger variants expose `logger.ui` with consistent methods: `log`, `dim`, `info`, `warn`, `error`, `debug`, `link`, `spin`, `succeed`. This allows any component to emit structured output without knowing the runtime environment.

  - `dim` renders as dimmed text in the CLI — useful for low-priority trace lines (e.g., request logs) that shouldn't compete visually with build output

  **CLI Logger Migration**

  - CLI now uses `createCliLogger` instead of raw `createPrint`
  - `context.print` replaced with `context.logger` / `context.logger.ui`
  - `createPrint` and `createStdOutLineHandler` moved from CLI to `@lowdefy/logger/cli`

  **Server-Dev stdio:inherit**

  - Server process spawned with `stdio: ['ignore', 'inherit', 'pipe']`
  - Server pino JSON flows directly to manager stdout (inherited by CLI) — eliminates dev stdout line handler
  - Only stderr piped for error formatting through manager logger
  - Server `createLogger` includes `print` mixin so CLI can render each line correctly

- 43a5243da: feat(server-dev): Add mock user support for e2e testing

  Set `LOWDEFY_DEV_USER` env var or `auth.dev.mockUser` in config to bypass login in dev server.

### Patch Changes

- 8250d8d3e: fix(errors): Remove redundant try/catch in operator runners, add cause chains to remaining throws
- aa0d6d363e: fix: Add missing uuid dependency to servers
- Add port-in-use check with clear error message before starting server.
- Updated dependencies [fb7910f62]
- Updated dependencies [aeae7f0c83]
- Updated dependencies [c62468b98]
- Updated dependencies [7936ee3fd8]
- Updated dependencies [5e03091ee]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8250d8d3e]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [43a5243da]
- Updated dependencies [cacbb4d189]
- Updated dependencies [338ea04b9f]
- Updated dependencies [f673e3ab3]
  - @lowdefy/blocks-antd@4.6.0
  - @lowdefy/blocks-basic@4.6.0
  - @lowdefy/build@4.6.0
  - @lowdefy/blocks-color-selectors@4.6.0
  - @lowdefy/engine@4.6.0
  - @lowdefy/client@4.6.0
  - @lowdefy/api@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/operators-change-case@4.6.0
  - @lowdefy/operators-diff@4.6.0
  - @lowdefy/operators-moment@4.6.0
  - @lowdefy/operators-mql@4.6.0
  - @lowdefy/operators-nunjucks@4.6.0
  - @lowdefy/operators-uuid@4.6.0
  - @lowdefy/operators-yaml@4.6.0
  - @lowdefy/actions-core@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0
  - @lowdefy/blocks-aggrid@4.6.0
  - @lowdefy/blocks-loaders@4.6.0
  - @lowdefy/blocks-echarts@4.6.0
  - @lowdefy/blocks-markdown@4.6.0
  - @lowdefy/blocks-qr@4.6.0
  - @lowdefy/plugin-next-auth@4.6.0

## 4.5.2

### Patch Changes

- Updated dependencies [d573e8ff8]
  - @lowdefy/client@4.5.2
  - @lowdefy/api@4.5.2
  - @lowdefy/build@4.5.2
  - @lowdefy/engine@4.5.2
  - @lowdefy/layout@4.5.2
  - @lowdefy/actions-core@4.5.2
  - @lowdefy/blocks-aggrid@4.5.2
  - @lowdefy/blocks-antd@4.5.2
  - @lowdefy/blocks-basic@4.5.2
  - @lowdefy/blocks-color-selectors@4.5.2
  - @lowdefy/blocks-echarts@4.5.2
  - @lowdefy/blocks-loaders@4.5.2
  - @lowdefy/blocks-markdown@4.5.2
  - @lowdefy/blocks-qr@4.5.2
  - @lowdefy/connection-axios-http@4.5.2
  - @lowdefy/operators-change-case@4.5.2
  - @lowdefy/operators-diff@4.5.2
  - @lowdefy/operators-js@4.5.2
  - @lowdefy/operators-moment@4.5.2
  - @lowdefy/operators-mql@4.5.2
  - @lowdefy/operators-nunjucks@4.5.2
  - @lowdefy/operators-uuid@4.5.2
  - @lowdefy/operators-yaml@4.5.2
  - @lowdefy/plugin-next-auth@4.5.2
  - @lowdefy/block-utils@4.5.2
  - @lowdefy/helpers@4.5.2
  - @lowdefy/node-utils@4.5.2

## 4.5.1

### Patch Changes

- 51f7f9dbe: Use uuid instead of crypto.randomUUID(), update uuid to v13.
- Updated dependencies [51f7f9dbe]
  - @lowdefy/operators-uuid@4.5.1
  - @lowdefy/build@4.5.1
  - @lowdefy/api@4.5.1
  - @lowdefy/client@4.5.1
  - @lowdefy/engine@4.5.1
  - @lowdefy/layout@4.5.1
  - @lowdefy/actions-core@4.5.1
  - @lowdefy/blocks-aggrid@4.5.1
  - @lowdefy/blocks-antd@4.5.1
  - @lowdefy/blocks-basic@4.5.1
  - @lowdefy/blocks-color-selectors@4.5.1
  - @lowdefy/blocks-echarts@4.5.1
  - @lowdefy/blocks-loaders@4.5.1
  - @lowdefy/blocks-markdown@4.5.1
  - @lowdefy/blocks-qr@4.5.1
  - @lowdefy/connection-axios-http@4.5.1
  - @lowdefy/operators-change-case@4.5.1
  - @lowdefy/operators-diff@4.5.1
  - @lowdefy/operators-js@4.5.1
  - @lowdefy/operators-moment@4.5.1
  - @lowdefy/operators-mql@4.5.1
  - @lowdefy/operators-nunjucks@4.5.1
  - @lowdefy/operators-yaml@4.5.1
  - @lowdefy/plugin-next-auth@4.5.1
  - @lowdefy/block-utils@4.5.1
  - @lowdefy/helpers@4.5.1
  - @lowdefy/node-utils@4.5.1

## 4.5.0

### Minor Changes

- d9512d9be: - Refactor build to create individual block instances.
  - Add hybrid block type to extend block functionality.
- 16084c1bd: Adds Lowdefy APIs. Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. See https://docs.lowdefy.com/lowdefy-api for more info.

### Patch Changes

- Updated dependencies [abc90f3f7]
- Updated dependencies [d9512d9be]
- Updated dependencies [4f610de5c]
- Updated dependencies [d6c58fe97]
- Updated dependencies [09ae496d8]
- Updated dependencies [b3a2e6662]
  - @lowdefy/build@4.5.0
  - @lowdefy/client@4.5.0
  - @lowdefy/engine@4.5.0
  - @lowdefy/blocks-antd@4.5.0
  - @lowdefy/blocks-color-selectors@4.5.0
  - @lowdefy/api@4.5.0
  - @lowdefy/operators-change-case@4.5.0
  - @lowdefy/operators-diff@4.5.0
  - @lowdefy/operators-js@4.5.0
  - @lowdefy/operators-moment@4.5.0
  - @lowdefy/operators-mql@4.5.0
  - @lowdefy/operators-nunjucks@4.5.0
  - @lowdefy/operators-uuid@4.5.0
  - @lowdefy/operators-yaml@4.5.0
  - @lowdefy/layout@4.5.0
  - @lowdefy/actions-core@4.5.0
  - @lowdefy/blocks-aggrid@4.5.0
  - @lowdefy/blocks-basic@4.5.0
  - @lowdefy/blocks-echarts@4.5.0
  - @lowdefy/blocks-loaders@4.5.0
  - @lowdefy/blocks-markdown@4.5.0
  - @lowdefy/blocks-qr@4.5.0
  - @lowdefy/connection-axios-http@4.5.0
  - @lowdefy/plugin-next-auth@4.5.0
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0
  - @lowdefy/node-utils@4.5.0

## 4.4.0

### Patch Changes

- a491106b7: Fix spawnProcess options on Windows
- Updated dependencies [bcfbb1a9b]
- Updated dependencies [1a81e100e]
  - @lowdefy/blocks-antd@4.4.0
  - @lowdefy/blocks-echarts@4.4.0
  - @lowdefy/api@4.4.0
  - @lowdefy/build@4.4.0
  - @lowdefy/operators-nunjucks@4.4.0
  - @lowdefy/blocks-color-selectors@4.4.0
  - @lowdefy/engine@4.4.0
  - @lowdefy/connection-axios-http@4.4.0
  - @lowdefy/client@4.4.0
  - @lowdefy/layout@4.4.0
  - @lowdefy/actions-core@4.4.0
  - @lowdefy/blocks-aggrid@4.4.0
  - @lowdefy/blocks-basic@4.4.0
  - @lowdefy/blocks-loaders@4.4.0
  - @lowdefy/blocks-markdown@4.4.0
  - @lowdefy/blocks-qr@4.4.0
  - @lowdefy/operators-change-case@4.4.0
  - @lowdefy/operators-diff@4.4.0
  - @lowdefy/operators-js@4.4.0
  - @lowdefy/operators-moment@4.4.0
  - @lowdefy/operators-mql@4.4.0
  - @lowdefy/operators-uuid@4.4.0
  - @lowdefy/operators-yaml@4.4.0
  - @lowdefy/plugin-next-auth@4.4.0
  - @lowdefy/block-utils@4.4.0
  - @lowdefy/helpers@4.4.0
  - @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- Updated dependencies [efefb8ca0]
  - @lowdefy/blocks-antd@4.3.2
  - @lowdefy/build@4.3.2
  - @lowdefy/blocks-color-selectors@4.3.2
  - @lowdefy/api@4.3.2
  - @lowdefy/client@4.3.2
  - @lowdefy/engine@4.3.2
  - @lowdefy/layout@4.3.2
  - @lowdefy/actions-core@4.3.2
  - @lowdefy/blocks-aggrid@4.3.2
  - @lowdefy/blocks-basic@4.3.2
  - @lowdefy/blocks-echarts@4.3.2
  - @lowdefy/blocks-loaders@4.3.2
  - @lowdefy/blocks-markdown@4.3.2
  - @lowdefy/blocks-qr@4.3.2
  - @lowdefy/connection-axios-http@4.3.2
  - @lowdefy/operators-change-case@4.3.2
  - @lowdefy/operators-diff@4.3.2
  - @lowdefy/operators-js@4.3.2
  - @lowdefy/operators-moment@4.3.2
  - @lowdefy/operators-mql@4.3.2
  - @lowdefy/operators-nunjucks@4.3.2
  - @lowdefy/operators-uuid@4.3.2
  - @lowdefy/operators-yaml@4.3.2
  - @lowdefy/plugin-next-auth@4.3.2
  - @lowdefy/block-utils@4.3.2
  - @lowdefy/helpers@4.3.2
  - @lowdefy/node-utils@4.3.2

## 4.3.1

### Patch Changes

- Updated dependencies [3e574857c]
  - @lowdefy/blocks-antd@4.3.1
  - @lowdefy/build@4.3.1
  - @lowdefy/blocks-color-selectors@4.3.1
  - @lowdefy/api@4.3.1
  - @lowdefy/client@4.3.1
  - @lowdefy/engine@4.3.1
  - @lowdefy/layout@4.3.1
  - @lowdefy/actions-core@4.3.1
  - @lowdefy/blocks-aggrid@4.3.1
  - @lowdefy/blocks-basic@4.3.1
  - @lowdefy/blocks-echarts@4.3.1
  - @lowdefy/blocks-loaders@4.3.1
  - @lowdefy/blocks-markdown@4.3.1
  - @lowdefy/blocks-qr@4.3.1
  - @lowdefy/connection-axios-http@4.3.1
  - @lowdefy/operators-change-case@4.3.1
  - @lowdefy/operators-diff@4.3.1
  - @lowdefy/operators-js@4.3.1
  - @lowdefy/operators-moment@4.3.1
  - @lowdefy/operators-mql@4.3.1
  - @lowdefy/operators-nunjucks@4.3.1
  - @lowdefy/operators-uuid@4.3.1
  - @lowdefy/operators-yaml@4.3.1
  - @lowdefy/plugin-next-auth@4.3.1
  - @lowdefy/block-utils@4.3.1
  - @lowdefy/helpers@4.3.1
  - @lowdefy/node-utils@4.3.1

## 4.3.0

### Patch Changes

- fe1347f6d: VSCode extention to read activeAppRoot from local dev server for clickable \_ref links.
  - @lowdefy/api@4.3.0
  - @lowdefy/build@4.3.0
  - @lowdefy/client@4.3.0
  - @lowdefy/engine@4.3.0
  - @lowdefy/layout@4.3.0
  - @lowdefy/actions-core@4.3.0
  - @lowdefy/blocks-aggrid@4.3.0
  - @lowdefy/blocks-antd@4.3.0
  - @lowdefy/blocks-basic@4.3.0
  - @lowdefy/blocks-color-selectors@4.3.0
  - @lowdefy/blocks-echarts@4.3.0
  - @lowdefy/blocks-loaders@4.3.0
  - @lowdefy/blocks-markdown@4.3.0
  - @lowdefy/blocks-qr@4.3.0
  - @lowdefy/connection-axios-http@4.3.0
  - @lowdefy/operators-change-case@4.3.0
  - @lowdefy/operators-diff@4.3.0
  - @lowdefy/operators-js@4.3.0
  - @lowdefy/operators-moment@4.3.0
  - @lowdefy/operators-mql@4.3.0
  - @lowdefy/operators-nunjucks@4.3.0
  - @lowdefy/operators-uuid@4.3.0
  - @lowdefy/operators-yaml@4.3.0
  - @lowdefy/plugin-next-auth@4.3.0
  - @lowdefy/block-utils@4.3.0
  - @lowdefy/helpers@4.3.0
  - @lowdefy/node-utils@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies [e4ec43505]
  - @lowdefy/blocks-antd@4.2.2
  - @lowdefy/build@4.2.2
  - @lowdefy/blocks-color-selectors@4.2.2
  - @lowdefy/api@4.2.2
  - @lowdefy/client@4.2.2
  - @lowdefy/engine@4.2.2
  - @lowdefy/layout@4.2.2
  - @lowdefy/actions-core@4.2.2
  - @lowdefy/blocks-aggrid@4.2.2
  - @lowdefy/blocks-basic@4.2.2
  - @lowdefy/blocks-echarts@4.2.2
  - @lowdefy/blocks-loaders@4.2.2
  - @lowdefy/blocks-markdown@4.2.2
  - @lowdefy/blocks-qr@4.2.2
  - @lowdefy/connection-axios-http@4.2.2
  - @lowdefy/operators-change-case@4.2.2
  - @lowdefy/operators-diff@4.2.2
  - @lowdefy/operators-js@4.2.2
  - @lowdefy/operators-moment@4.2.2
  - @lowdefy/operators-mql@4.2.2
  - @lowdefy/operators-nunjucks@4.2.2
  - @lowdefy/operators-uuid@4.2.2
  - @lowdefy/operators-yaml@4.2.2
  - @lowdefy/plugin-next-auth@4.2.2
  - @lowdefy/block-utils@4.2.2
  - @lowdefy/helpers@4.2.2
  - @lowdefy/node-utils@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/blocks-aggrid@4.2.1
  - @lowdefy/client@4.2.1
  - @lowdefy/layout@4.2.1
  - @lowdefy/api@4.2.1
  - @lowdefy/build@4.2.1
  - @lowdefy/engine@4.2.1
  - @lowdefy/actions-core@4.2.1
  - @lowdefy/blocks-antd@4.2.1
  - @lowdefy/blocks-basic@4.2.1
  - @lowdefy/blocks-color-selectors@4.2.1
  - @lowdefy/blocks-echarts@4.2.1
  - @lowdefy/blocks-loaders@4.2.1
  - @lowdefy/blocks-markdown@4.2.1
  - @lowdefy/blocks-qr@4.2.1
  - @lowdefy/connection-axios-http@4.2.1
  - @lowdefy/operators-change-case@4.2.1
  - @lowdefy/operators-diff@4.2.1
  - @lowdefy/operators-js@4.2.1
  - @lowdefy/operators-moment@4.2.1
  - @lowdefy/operators-mql@4.2.1
  - @lowdefy/operators-nunjucks@4.2.1
  - @lowdefy/operators-uuid@4.2.1
  - @lowdefy/operators-yaml@4.2.1
  - @lowdefy/plugin-next-auth@4.2.1
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1
  - @lowdefy/node-utils@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies [47d855918]
- Updated dependencies [47d855918]
  - @lowdefy/client@4.2.0
  - @lowdefy/layout@4.2.0
  - @lowdefy/api@4.2.0
  - @lowdefy/build@4.2.0
  - @lowdefy/operators-nunjucks@4.2.0
  - @lowdefy/engine@4.2.0
  - @lowdefy/connection-axios-http@4.2.0
  - @lowdefy/actions-core@4.2.0
  - @lowdefy/blocks-aggrid@4.2.0
  - @lowdefy/blocks-antd@4.2.0
  - @lowdefy/blocks-basic@4.2.0
  - @lowdefy/blocks-color-selectors@4.2.0
  - @lowdefy/blocks-echarts@4.2.0
  - @lowdefy/blocks-loaders@4.2.0
  - @lowdefy/blocks-markdown@4.2.0
  - @lowdefy/blocks-qr@4.2.0
  - @lowdefy/operators-change-case@4.2.0
  - @lowdefy/operators-diff@4.2.0
  - @lowdefy/operators-js@4.2.0
  - @lowdefy/operators-moment@4.2.0
  - @lowdefy/operators-mql@4.2.0
  - @lowdefy/operators-uuid@4.2.0
  - @lowdefy/operators-yaml@4.2.0
  - @lowdefy/plugin-next-auth@4.2.0
  - @lowdefy/block-utils@4.2.0
  - @lowdefy/helpers@4.2.0
  - @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [221ba93c9]
- Updated dependencies [d040e3005]
- Updated dependencies [f14270465]
- Updated dependencies [f571e90da]
- Updated dependencies [f9d00b4d3]
- Updated dependencies [5b3ccc958]
  - @lowdefy/actions-core@4.1.0
  - @lowdefy/engine@4.1.0
  - @lowdefy/blocks-antd@4.1.0
  - @lowdefy/build@4.1.0
  - @lowdefy/client@4.1.0
  - @lowdefy/blocks-color-selectors@4.1.0
  - @lowdefy/api@4.1.0
  - @lowdefy/layout@4.1.0
  - @lowdefy/blocks-aggrid@4.1.0
  - @lowdefy/blocks-basic@4.1.0
  - @lowdefy/blocks-echarts@4.1.0
  - @lowdefy/blocks-loaders@4.1.0
  - @lowdefy/blocks-markdown@4.1.0
  - @lowdefy/blocks-qr@4.1.0
  - @lowdefy/connection-axios-http@4.1.0
  - @lowdefy/operators-change-case@4.1.0
  - @lowdefy/operators-diff@4.1.0
  - @lowdefy/operators-js@4.1.0
  - @lowdefy/operators-moment@4.1.0
  - @lowdefy/operators-mql@4.1.0
  - @lowdefy/operators-nunjucks@4.1.0
  - @lowdefy/operators-uuid@4.1.0
  - @lowdefy/operators-yaml@4.1.0
  - @lowdefy/plugin-next-auth@4.1.0
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0
  - @lowdefy/node-utils@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies [628c6e2f6]
- Updated dependencies [126a61267]
- Updated dependencies [126a61267]
- Updated dependencies [7fa709f19]
- Updated dependencies [126a61267]
- Updated dependencies [bbcf07a27]
  - @lowdefy/blocks-antd@4.0.2
  - @lowdefy/blocks-basic@4.0.2
  - @lowdefy/build@4.0.2
  - @lowdefy/blocks-color-selectors@4.0.2
  - @lowdefy/engine@4.0.2
  - @lowdefy/api@4.0.2
  - @lowdefy/client@4.0.2
  - @lowdefy/layout@4.0.2
  - @lowdefy/actions-core@4.0.2
  - @lowdefy/blocks-aggrid@4.0.2
  - @lowdefy/blocks-echarts@4.0.2
  - @lowdefy/blocks-loaders@4.0.2
  - @lowdefy/blocks-markdown@4.0.2
  - @lowdefy/blocks-qr@4.0.2
  - @lowdefy/connection-axios-http@4.0.2
  - @lowdefy/operators-change-case@4.0.2
  - @lowdefy/operators-diff@4.0.2
  - @lowdefy/operators-js@4.0.2
  - @lowdefy/operators-moment@4.0.2
  - @lowdefy/operators-mql@4.0.2
  - @lowdefy/operators-nunjucks@4.0.2
  - @lowdefy/operators-uuid@4.0.2
  - @lowdefy/operators-yaml@4.0.2
  - @lowdefy/plugin-next-auth@4.0.2
  - @lowdefy/block-utils@4.0.2
  - @lowdefy/helpers@4.0.2
  - @lowdefy/node-utils@4.0.2

## 4.0.1

### Patch Changes

- Fix build issue on release.
  - @lowdefy/api@4.0.1
  - @lowdefy/build@4.0.1
  - @lowdefy/client@4.0.1
  - @lowdefy/engine@4.0.1
  - @lowdefy/layout@4.0.1
  - @lowdefy/actions-core@4.0.1
  - @lowdefy/blocks-aggrid@4.0.1
  - @lowdefy/blocks-antd@4.0.1
  - @lowdefy/blocks-basic@4.0.1
  - @lowdefy/blocks-color-selectors@4.0.1
  - @lowdefy/blocks-echarts@4.0.1
  - @lowdefy/blocks-loaders@4.0.1
  - @lowdefy/blocks-markdown@4.0.1
  - @lowdefy/blocks-qr@4.0.1
  - @lowdefy/connection-axios-http@4.0.1
  - @lowdefy/operators-change-case@4.0.1
  - @lowdefy/operators-diff@4.0.1
  - @lowdefy/operators-js@4.0.1
  - @lowdefy/operators-moment@4.0.1
  - @lowdefy/operators-mql@4.0.1
  - @lowdefy/operators-nunjucks@4.0.1
  - @lowdefy/operators-uuid@4.0.1
  - @lowdefy/operators-yaml@4.0.1
  - @lowdefy/plugin-next-auth@4.0.1
  - @lowdefy/block-utils@4.0.1
  - @lowdefy/helpers@4.0.1
  - @lowdefy/node-utils@4.0.1

## 4.0.0

### Minor Changes

- f44cfa0cb: Add built with lowdefy branding to servers.

### Patch Changes

- 0750bf7bc: add NextJs telemetry disabling when Lowdefy telemetry is disabled
- Updated dependencies [a30801983]
- Updated dependencies [925b92f09]
- Updated dependencies [5cfe04a68]
- Updated dependencies [f44cfa0cb]
- Updated dependencies [e694f72ee]
- Updated dependencies [84e479d11]
  - @lowdefy/build@4.0.0
  - @lowdefy/operators-change-case@4.0.0
  - @lowdefy/client@4.0.0
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/engine@4.0.0
  - @lowdefy/api@4.0.0
  - @lowdefy/blocks-antd@4.0.0
  - @lowdefy/layout@4.0.0
  - @lowdefy/actions-core@4.0.0
  - @lowdefy/blocks-aggrid@4.0.0
  - @lowdefy/blocks-basic@4.0.0
  - @lowdefy/blocks-color-selectors@4.0.0
  - @lowdefy/blocks-echarts@4.0.0
  - @lowdefy/blocks-loaders@4.0.0
  - @lowdefy/blocks-markdown@4.0.0
  - @lowdefy/blocks-qr@4.0.0
  - @lowdefy/connection-axios-http@4.0.0
  - @lowdefy/operators-diff@4.0.0
  - @lowdefy/operators-js@4.0.0
  - @lowdefy/operators-moment@4.0.0
  - @lowdefy/operators-mql@4.0.0
  - @lowdefy/operators-nunjucks@4.0.0
  - @lowdefy/operators-uuid@4.0.0
  - @lowdefy/operators-yaml@4.0.0
  - @lowdefy/plugin-next-auth@4.0.0
  - @lowdefy/block-utils@4.0.0
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))
- Fix server dev plugin dependencies. ([3f14ba0](https://github.com/lowdefy/lowdefy/commit/3f14ba07e121d127bc94462b15b2cae01a911e9d))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency dotenv to v16.3.1 ([82c1f7a](https://github.com/lowdefy/lowdefy/commit/82c1f7aa168cacab4197326c4f000a00e22761fb))
- **deps:** Update dependency next to v13.5.4. ([230a687](https://github.com/lowdefy/lowdefy/commit/230a6876993a0802190a7f33d823fe5630062da9))
- **deps:** Update dependency next-auth to v4.23.1 ([48f9780](https://github.com/lowdefy/lowdefy/commit/48f97809e825fb9afdd169120371184b3e2a98c8))
- **deps:** Update dependency pino to v8.15.0 ([d380b3c](https://github.com/lowdefy/lowdefy/commit/d380b3cfa51387f1602689e353f82c59dc1cd9ed))
- **deps:** Update dependency react-icons to v4.11.0 ([21f23d4](https://github.com/lowdefy/lowdefy/commit/21f23d40cf0a7c4ed1931b55ebf854b2bc239948))
- **deps:** Update dependency swr to v2.2.2 ([017e865](https://github.com/lowdefy/lowdefy/commit/017e865023edafeb52428466d8fa7e0c2b96b9f2))
- **deps:** Update dependency yaml to 2.3.2 ([cbcdc7d](https://github.com/lowdefy/lowdefy/commit/cbcdc7d3e313fca96fa52bc4724344a061d9f444))
- **deps:** Update development dependencies. ([b7d7cca](https://github.com/lowdefy/lowdefy/commit/b7d7cca10e676949957cf6650ec706ab1a08f68a))
- **server-dev:** Update stdOutLineHandler for pino logs ([2cef6d7](https://github.com/lowdefy/lowdefy/commit/2cef6d7e66d8ef7a34d9dec5eb1d6aea2fdb4f3f))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))

### Features

- **blocks-algolia:** Add DocSearch block. ([701ee87](https://github.com/lowdefy/lowdefy/commit/701ee87ec7f3e5f2b28568e43c14948548b90d9e))
- Update minimum node version to 18 ([0b64fd1](https://github.com/lowdefy/lowdefy/commit/0b64fd1347fc807d79819cc9c2022671088c8921))

### BREAKING CHANGES

- Update minimum node version to 18

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Logging cleanup. ([30a495c](https://github.com/lowdefy/lowdefy/commit/30a495c3e40fe566af306b54d7c8ece3c79de1b9))

### Features

- **server-dev:** Log errors in dev server. ([cacdc12](https://github.com/lowdefy/lowdefy/commit/cacdc12a3b3773603d61487089ae7061cb483af3))
- Update dev server to work with logger. ([f036a62](https://github.com/lowdefy/lowdefy/commit/f036a623067bdcc225d37137511baacd4f317535))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- Update serializer util to not clash with \_date operator ([b8cdcb3](https://github.com/lowdefy/lowdefy/commit/b8cdcb3e44a0b1157c111bc7679ac428138c6f97))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- Add 200 response on auth API head requests ([d51e28f](https://github.com/lowdefy/lowdefy/commit/d51e28f99e9051ca7aba90c05fc325074b08469c))
- **deps:** update dependency yaml to v2.2.2 [security] ([8e015fe](https://github.com/lowdefy/lowdefy/commit/8e015fec47a40bc5233f23d8da345720475d1232))
- Fix initialisation of lowdefy context object. ([2ed4398](https://github.com/lowdefy/lowdefy/commit/2ed4398d59be5b037e7a4d17f7e5a14398e73973))
- Fix next auth session provider base path ([715cdf2](https://github.com/lowdefy/lowdefy/commit/715cdf2cc48da88a55055c4af28435aa789f67ea))
- Fix web manifest and icons with base path. ([9620a2c](https://github.com/lowdefy/lowdefy/commit/9620a2c80133ebcbaedbe08d66fb1387a3fb38f1))
- Reload page if auth session expires ([6223783](https://github.com/lowdefy/lowdefy/commit/6223783b84892f8c9469ee740417ccca1004a16b))
- Server session not passed to session provider ([36f8d5a](https://github.com/lowdefy/lowdefy/commit/36f8d5ae15b0a6aae58fd6b4cab955f91a2d93e7))

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))
- Remove support for setting base path using an environment variable ([ec7052d](https://github.com/lowdefy/lowdefy/commit/ec7052dab152645b4a5ed9098320e46488041034))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **deps:** update dependency next-auth to v4.20.1 [security] ([bcf12a3](https://github.com/lowdefy/lowdefy/commit/bcf12a37ae4fa921abcd6f943e14ace2fd0c5eb8))
- **deps:** update dependency next-auth to v4.20.1 [security] ([7e408a2](https://github.com/lowdefy/lowdefy/commit/7e408a2095e73dca79b9777217aec37e11d4cba3))
- Rename depreciated unstable_getServerSession. ([7dcb0c6](https://github.com/lowdefy/lowdefy/commit/7dcb0c665969bafdf03e082389c9101d00146636))
- **server-dev:** Update reinstall dependencies warning message ([86f4b9f](https://github.com/lowdefy/lowdefy/commit/86f4b9fa0dadac468a97b9aa4169a7ae62a71fc9))

### Features

- **server-dev:** Add building config spinner. ([45fd3f3](https://github.com/lowdefy/lowdefy/commit/45fd3f39ef7d46163b16618a2712c33b1f78c8ac))
- **server-dev:** Ignore _k_ on rebuild check. ([32d89b1](https://github.com/lowdefy/lowdefy/commit/32d89b14755400b1858d8d1d8a1da2e5f32d9658))
- **server-dev:** Only watch package.json. ([cbb1bc6](https://github.com/lowdefy/lowdefy/commit/cbb1bc6ce930c8c1de9e7e5790c46e2d21ff21c7))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

### Bug Fixes

- Add public_default folder to server npm files ([2f1db67](https://github.com/lowdefy/lowdefy/commit/2f1db674f477026d2292d643140dc39b77809753))

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **deps:** Update react-icon and add support for new icon packs ([ae9cbf2](https://github.com/lowdefy/lowdefy/commit/ae9cbf23a331ce2945d9e2ff34a53210121c9134))
- **deps:** Update swr to v2.0.0 (major version). ([e16a39a](https://github.com/lowdefy/lowdefy/commit/e16a39a581034e1108ad45d39e26f73c43db7574))
- Reset server package.json to original version on CLI start. ([6fac2aa](https://github.com/lowdefy/lowdefy/commit/6fac2aabc8a8e4d95e6ad0922ff3b82f73427a30))
- **server-dev:** Rename public folder to public_default. ([4bb4285](https://github.com/lowdefy/lowdefy/commit/4bb4285bc5c66fbf19c083618b73871278894253))

### Features

- Update dependency next-auth and add new providers. ([ca72d8c](https://github.com/lowdefy/lowdefy/commit/ca72d8c87b50651c701ea619a5e061210adf3e53))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

### Bug Fixes

- Fix watch path CLI config for relative paths. ([54a5440](https://github.com/lowdefy/lowdefy/commit/54a54409dc5e123c5d1d875770873c72826eec90))

### Features

- Add support for user defined style files ([d33049b](https://github.com/lowdefy/lowdefy/commit/d33049b1b95f6bc84c9b91c2d15b92601210615e))
- Remove support for config.theme.lessVariables ([53a6931](https://github.com/lowdefy/lowdefy/commit/53a693146d1299cff45c81dcefa1315d530b7d98))

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

### Bug Fixes

- Cache API file reads across all requests. ([2b90efb](https://github.com/lowdefy/lowdefy/commit/2b90efb041cf43e5344c5f2f5a8630ae06c8aad6))

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

### Bug Fixes

- **api:** Fix "too many files open" error in api. ([b2d0b63](https://github.com/lowdefy/lowdefy/commit/b2d0b63cceac0b2b3dc870a8b435c6f187ff7a5a))

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Bug Fixes

- Fix server pnpm installs. ([c7be221](https://github.com/lowdefy/lowdefy/commit/c7be22150ed14afcb8b6508bd771112a542e0a26))

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

### Features

- Change CLI to use pnpm as package manager. ([e9d7d73](https://github.com/lowdefy/lowdefy/commit/e9d7d73aed2fc9d40699210f2f8846df0170d481))

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

### Bug Fixes

- **server:** Move viewport setting to the \_document. ([4471e49](https://github.com/lowdefy/lowdefy/commit/4471e499cd384491df493c0be6095e27af3a003b))
- **server:** Set page viewport. ([9c05a6d](https://github.com/lowdefy/lowdefy/commit/9c05a6d8d7cc16c723089c6499005945fc2a5aaa))

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

### Features

- **blocks-qr:** Add QRScanner block. ([5778234](https://github.com/lowdefy/lowdefy/commit/5778234f366a030d055f0e1a604cfa27f47617ac))

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

### Bug Fixes

- **server-dev:** Fix server dev file watchers. ([7e3fedd](https://github.com/lowdefy/lowdefy/commit/7e3feddffe017edefcc325a8a146918318a8b329))

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

### Bug Fixes

- **cli:** Improve CLI options specification. ([6d550fd](https://github.com/lowdefy/lowdefy/commit/6d550fd4620cde2ded905c3946ed86500c3efed5))
- Fix dev server auth api route. ([a51af68](https://github.com/lowdefy/lowdefy/commit/a51af68e6291eea9185f65425e480ace6a269103))
- **server-dev:** Remove build retries. ([c27ff36](https://github.com/lowdefy/lowdefy/commit/c27ff36e174f085d00bc0c76f2e2c3d8d2ad9bd2))
- **server-dev:** Simplify server-dev manager code. ([e4101d0](https://github.com/lowdefy/lowdefy/commit/e4101d019b47d8cf1d5065116f003bcdf8a38fdf))

### Features

- Cleanup dev server logs. ([27a22c8](https://github.com/lowdefy/lowdefy/commit/27a22c8d34b822268a834704fe9c022397180386))
- CLI output improvements. ([f00bb9b](https://github.com/lowdefy/lowdefy/commit/f00bb9b32e03e77ef1ef19c69055da4b05880cd8))
- **cli:** Add log level option. ([5903c8e](https://github.com/lowdefy/lowdefy/commit/5903c8e4165334eb31f80580c3816a34ac36592d))
- Improved logging WIP. ([0bbf19d](https://github.com/lowdefy/lowdefy/commit/0bbf19d69926440930995d457514544608ec5b5b))
- **server-dev:** Do not stop process if initial build fails. ([506cbeb](https://github.com/lowdefy/lowdefy/commit/506cbeb090b130cacbbb923aa0fa8d0e3a48ad5a))

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- Fix next-auth getServerSession. ([c5ee6ae](https://github.com/lowdefy/lowdefy/commit/c5ee6aef6227b68786b955d83de2a4f733569225))

### Features

- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))
- Implement appendHead and appendBody in v4. ([ba7ef7d](https://github.com/lowdefy/lowdefy/commit/ba7ef7d4000bb0ba757092114a90979387daba8a)), closes [#1047](https://github.com/lowdefy/lowdefy/issues/1047)
- Implement appendHead and appendBody. ([d9ae2ee](https://github.com/lowdefy/lowdefy/commit/d9ae2eef8ef848f335901dd1332b8d995c03bdb0))
- Update next-auth. ([972d5f3](https://github.com/lowdefy/lowdefy/commit/972d5f30ce57886419bc26fd5f19e386418e3dbb))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Features

- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))
- Implement appendHead and appendBody in v4. ([ba7ef7d](https://github.com/lowdefy/lowdefy/commit/ba7ef7d4000bb0ba757092114a90979387daba8a)), closes [#1047](https://github.com/lowdefy/lowdefy/issues/1047)
- Implement appendHead and appendBody. ([d9ae2ee](https://github.com/lowdefy/lowdefy/commit/d9ae2eef8ef848f335901dd1332b8d995c03bdb0))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- **server-dev:** BatchChanges.newChange to only revolve for strings. ([30a78fb](https://github.com/lowdefy/lowdefy/commit/30a78fbf77b483cb3b039f4ead11004b604346bc))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

### Bug Fixes

- **deps:** update dependency next-auth to v4.9.0 [security] ([7d07007](https://github.com/lowdefy/lowdefy/commit/7d070078ef171f308359f7cfd534d8a207f76956))

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **deps:** Update dependency next-auth to v4.5.0. ([49dd43a](https://github.com/lowdefy/lowdefy/commit/49dd43ae4249129d029fbd8d1135d00fb26a5b7a))
- Fix userFields in production server. ([614d7c9](https://github.com/lowdefy/lowdefy/commit/614d7c915d20c12ad285336a8d6fd0c942c11c48))
- **server-dev:** Add max count in waitForRestartedServer ping. ([d7d8a0b](https://github.com/lowdefy/lowdefy/commit/d7d8a0b221322171096929954376b87d7c8ce838))
- **server-dev:** Should not be minified. ([d61e9e0](https://github.com/lowdefy/lowdefy/commit/d61e9e0db4de869390e3f1992cc30f826a40ec93))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **deps:** Update dependency next-auth to v4.5.0. ([49dd43a](https://github.com/lowdefy/lowdefy/commit/49dd43ae4249129d029fbd8d1135d00fb26a5b7a))
- Fix userFields in production server. ([614d7c9](https://github.com/lowdefy/lowdefy/commit/614d7c915d20c12ad285336a8d6fd0c942c11c48))
- **server-dev:** Add max count in waitForRestartedServer ping. ([d7d8a0b](https://github.com/lowdefy/lowdefy/commit/d7d8a0b221322171096929954376b87d7c8ce838))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/server-dev

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- **server-dev:** Load .env using dotenv. ([85d7827](https://github.com/lowdefy/lowdefy/commit/85d78277b29e12986a5886e986bd46070c7b28ac))

### Features

- **cli:** Add —no-open option to cli dev command. ([bc5b12f](https://github.com/lowdefy/lowdefy/commit/bc5b12fce379352e6cbf73503154e88b980918e6))
- **engine:** Add payload and blockId to context.requests[requestId]. ([e29d88b](https://github.com/lowdefy/lowdefy/commit/e29d88b326338fdec22db325dcda31ee4f73cf51))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Bug Fixes

- **server-dev:** Fix react hooks used incorrectly. ([0b36cc2](https://github.com/lowdefy/lowdefy/commit/0b36cc20984f48fc53993c51cbaef3bf05133c9d))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Adapt createAuthMethods for client package. ([4675297](https://github.com/lowdefy/lowdefy/commit/467529780bc1c90a089f6b157e264e5fbe10ca63))
- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- **deps:** Update dependency next to v12.1.6 ([490ea8f](https://github.com/lowdefy/lowdefy/commit/490ea8fda5bc1892eb44ad371b2d95c99ea618fd))
- Fix auth callback import in dev server. ([557669e](https://github.com/lowdefy/lowdefy/commit/557669e79838521f719c64d5addee8c7c4d1547a))
- Remove console logs. ([42ab05b](https://github.com/lowdefy/lowdefy/commit/42ab05bb649c4a9fc8d020ea1591fe6b37c8304b))
- **server-dev:** Fix dev server not running next build. ([27efcdf](https://github.com/lowdefy/lowdefy/commit/27efcdf8c5bc6a0f7c6a0b33ceb8e56ea2114a5a))
- Update operator plugin import locations. ([b65aa48](https://github.com/lowdefy/lowdefy/commit/b65aa482a3de39a6406b2a0948b6b502c84e0498))
- Windows compatibility fixes. ([8ecdfc4](https://github.com/lowdefy/lowdefy/commit/8ecdfc4e377648761e9035e355c7ec777fd63888))

### Features

- Add support for auth callback plugins. ([a16e074](https://github.com/lowdefy/lowdefy/commit/a16e074ca801a5e9e05424fc09cb8c1e1da81cee))
- Create auth plugins types maps. ([6df0010](https://github.com/lowdefy/lowdefy/commit/6df00102032648a3b8d958828a4b5e853cd38da3))
- Import all types exported by plugins in dev server. ([b6e05fb](https://github.com/lowdefy/lowdefy/commit/b6e05fba4479417d9bc8019782b93f8c83515066))
- Include auth event plugins in build. ([4c6d108](https://github.com/lowdefy/lowdefy/commit/4c6d108dffc98a90b9ec0268fe91fb8102cb15de))
- Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
- Pass user session to api context from server. ([55f2438](https://github.com/lowdefy/lowdefy/commit/55f2438258bf8bad4b9f03647a00b8f730cacb79))
- **server-dev:** Next auth working in dev server. ([44fbca9](https://github.com/lowdefy/lowdefy/commit/44fbca96e28e4d72f1a406ea122b101016baa3b9))
- Updates to auth configuration. ([8f7abf7](https://github.com/lowdefy/lowdefy/commit/8f7abf7fdb1cbe0dbaabe209787a128854680f7b))

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

### Bug Fixes

- Fix server npm publish files. ([3f5589e](https://github.com/lowdefy/lowdefy/commit/3f5589e434817e712624e31c955b0b741e94f075))

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **server-dev:** Add actions.js to build watcher. ([f9f295e](https://github.com/lowdefy/lowdefy/commit/f9f295e37cc627e1f7f2d414d9e42c7c67f45f23))
- **server-dev:** Do not render page before redirect. ([b4431b1](https://github.com/lowdefy/lowdefy/commit/b4431b17b36576cfc8cd30a5d1e2485502fd337e))
- **server-dev:** Render app rebuild page. ([7895b53](https://github.com/lowdefy/lowdefy/commit/7895b53691f83b81629c2f4dfb174c858571c407))
- **server:** Cleanup from review. ([d4dd1ca](https://github.com/lowdefy/lowdefy/commit/d4dd1cadf30ddc1f9b9700bd8c5699675607c117))
- **server:** Remove block.loading. ([0995109](https://github.com/lowdefy/lowdefy/commit/09951094e15371ed9be1b36a093d0463ec0b8d70))

### Features

- **server-dev:** Client working 🏄‍♂️ ([cafca66](https://github.com/lowdefy/lowdefy/commit/cafca662ee00379ba1d7d38acf886e718174d624))
- **server-dev:** Reload to pass resetContext flag. ([f303bc0](https://github.com/lowdefy/lowdefy/commit/f303bc046164c0d0370af66c3f7741eb04d7a93c))
- **server-dev:** Use Client in dev server. ([4089191](https://github.com/lowdefy/lowdefy/commit/4089191bc84b5e8832e358136c491985872d59fc))
- **server:** Context is now sync, use MountEvents for onInit. ([8f0ed25](https://github.com/lowdefy/lowdefy/commit/8f0ed25401f0f4cb2ee342c6511513f182ab65f5))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))
- **server-dev:** Read next cli bin path from package.json. ([0146627](https://github.com/lowdefy/lowdefy/commit/01466276dcfffef1ee6f2d7b50205ddd4e48edad))
- **server:** Add index to keys to resolve react warning. ([0f25b57](https://github.com/lowdefy/lowdefy/commit/0f25b5768f09327f68703b80f63f891b1645b1e3))
- **server:** Disable ssr on \_app. ([1b13e57](https://github.com/lowdefy/lowdefy/commit/1b13e5715c29783b076878ad935626a05f7ba343))

### Features

- Custom plugins on dev server. ([9f65d13](https://github.com/lowdefy/lowdefy/commit/9f65d130d70494ebd74fb0ae3cf6edb4cbf31415))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **deps:** Downgrade dependency swr to v1.1.2. ([80b047f](https://github.com/lowdefy/lowdefy/commit/80b047fb8e5684d032026d9e10b50114a67af89f))
- **deps:** Update dependecy next to v12.0.10 ([c058935](https://github.com/lowdefy/lowdefy/commit/c05893578f8d5f625391b560ec24411d16df902d))
- **deps:** Update dependency chokidar to v3.5.3. ([4513321](https://github.com/lowdefy/lowdefy/commit/45133218d83e9751746e1c71c6f9fa44a5b50ead))
- **deps:** Update dependency dotenv to v15.0.0. ([682620c](https://github.com/lowdefy/lowdefy/commit/682620c99c0e53d31467b6c3d5146f0eba596ab1))
- **deps:** Update dependency next-auth to v4.1.2. ([4b63c87](https://github.com/lowdefy/lowdefy/commit/4b63c8774fab7adbc3e11f92a5e808b38d22f4c9))
- **deps:** Update dependency next-with-less to v2.0.4. ([7c71492](https://github.com/lowdefy/lowdefy/commit/7c714926ee0caeba362af78b594698635f34c70f))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update dependency swr to v1.2.0. ([8c55376](https://github.com/lowdefy/lowdefy/commit/8c55376080ea89f015f208262c097e5201c21d79))
- **deps:** Update dependency yargs to v17.3.1. ([277776c](https://github.com/lowdefy/lowdefy/commit/277776c7294e57a95dfcf86d300bb20ea4742043))
- **node-utils:** Convert writeFile function prototype. ([5371430](https://github.com/lowdefy/lowdefy/commit/53714307123f3477240767a91c5332a70a292d93))
- **server-dev:** Add dev server manager description. ([18cf9c2](https://github.com/lowdefy/lowdefy/commit/18cf9c2941f0001d98eed5c79dac2b111f6c6eee))
- **server-dev:** Do not error if .env file does not exist. ([fa389a1](https://github.com/lowdefy/lowdefy/commit/fa389a17eff8d716e4cc45c1262f4e3d69bdb71d))
- **server-dev:** Fix redirect. ([96ed764](https://github.com/lowdefy/lowdefy/commit/96ed764458ebed076d5bee246622c2fb457d9f33))
- **servr-dev:** Fix 404 redirect so that browser back works. ([9df6579](https://github.com/lowdefy/lowdefy/commit/9df6579198c0dd0aef9092a98c1b455fac41a761))

### Features

- Add start, start:dev and start:server-dev scripts for easy dev ⚡️. ([da813c3](https://github.com/lowdefy/lowdefy/commit/da813c3d13b39fcfdbd50b8d53c3e0b1f5e7e8e2))
- Add watch and ignore paths, default ref resolver to dev server and build. ([c700d9f](https://github.com/lowdefy/lowdefy/commit/c700d9fb0efbdb20dcfe5f8916e256de81acd79e))
- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))
- **cli:** Pass package manager setting to dev server. ([0425f07](https://github.com/lowdefy/lowdefy/commit/0425f07e4ada328e76488e3ec0aa164ff475df5c))
- Link and basePath implementation for dev server. ([d487a1c](https://github.com/lowdefy/lowdefy/commit/d487a1c7fd496d4342a786ec7c96da13bafafc12))
- **operators:** Change dependancy from js-yaml to yaml. ([cbb71d8](https://github.com/lowdefy/lowdefy/commit/cbb71d809b3117dbaf89b23c17a2229a24235308))
- **server-dev:** Add .env and lowdefy version watchers. ([bc52268](https://github.com/lowdefy/lowdefy/commit/bc522684abce8c050873ef20a3da66ca023cfa32))
- **server-dev:** Add port setting to server-dev. ([f5b0e7e](https://github.com/lowdefy/lowdefy/commit/f5b0e7e80f8a6002e6d6c6ea426a2b6fee8953bf))
- **server-dev:** Added import for actions plugins to the lowdefy context. ([20133bb](https://github.com/lowdefy/lowdefy/commit/20133bb0589d35b1494cd3f996ff0ea5421ee560))
- **server-dev:** Clean up server-dev manager. ([ad3511c](https://github.com/lowdefy/lowdefy/commit/ad3511cce781bdcaf4cba634c87ed541e07b0123))
- **server-dev:** Dev server plugin install and next build working. ([cf66a6f](https://github.com/lowdefy/lowdefy/commit/cf66a6f83952016b4282985b44f8eb10e7f72ea4))
- **server-dev:** Optimise dev server next build time. ([34aa84a](https://github.com/lowdefy/lowdefy/commit/34aa84acf92288ecbada387ecf9c7eefc1c0968e))
- **server-dev:** Skip calling next and lowdefy build using npm/yarn start. ([1a8699a](https://github.com/lowdefy/lowdefy/commit/1a8699a0124ba45202cc4d57255d5d0d6ff6abb7))

### BREAKING CHANGES

- **operators:** \_yaml.parse now takes an array or an object data instead of a string.
- **deps:** # marks the beginning of a comment in .env files (UNLESS the value is wrapped in quotes. Please update your .env files to wrap in quotes any values containing #.

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Features

- Add secrets to v4 servers ([9ef2ccd](https://github.com/lowdefy/lowdefy/commit/9ef2ccd131149e72ba87aee20f1720a99dbd9e07))
- Add server manager and file watcher in reload event stream. ([8474aaf](https://github.com/lowdefy/lowdefy/commit/8474aaf63c0475cb19a76ca3df9459c05f263986))
- Add Server Sent Event reload rout and component. ([a556eab](https://github.com/lowdefy/lowdefy/commit/a556eabdbb4da2e98088e810b3cc24cccefacd4f))
- **build:** Move app.style.lessVariables to config.theme.lessVariables. ([cb14f17](https://github.com/lowdefy/lowdefy/commit/cb14f1712f9f064e96d2f71bf12bb3922aff46eb))
- **cli:** Add v4 dev command to CLI. ([02770f5](https://github.com/lowdefy/lowdefy/commit/02770f57096710afc9047403e5e4a616957c3a93))
- Create wait helper function. ([42c09f4](https://github.com/lowdefy/lowdefy/commit/42c09f467b3d4a3b51298a2a67364137def7896d))
- Init @lowdefy/server-dev package. ([e76b40e](https://github.com/lowdefy/lowdefy/commit/e76b40e8399567bda70404dc85f06c6c2db7e837))
- **server-dev:** Add browser opener to dev server. ([ddf9d36](https://github.com/lowdefy/lowdefy/commit/ddf9d36d8689caf30f4d008e1ec2be0c48699a34))
- **server-dev:** Add dev server startup and config file watcher. ([a29576d](https://github.com/lowdefy/lowdefy/commit/a29576d45e58720f02896e5d0523f728fad036a5))
- **server-dev:** Add the abilty to restart the dev server. ([b610a63](https://github.com/lowdefy/lowdefy/commit/b610a63a522afebe66dee8481cf8caf029334201))
- **server-dev:** Dev server soft reload working. ([dd5ee07](https://github.com/lowdefy/lowdefy/commit/dd5ee07b5b39c3c22e702b5b1c8404e7a86ab500))
- **server-dev:** Fetch Lowdefy config client-side using swr. ([ce126df](https://github.com/lowdefy/lowdefy/commit/ce126df4374d74a27a2a40439aa1bf56a63723f5))
- **server-dev:** Reload client window if dev server is restarted. ([b8c1d58](https://github.com/lowdefy/lowdefy/commit/b8c1d58ea8b0056fdd9ce042590f7c7f90bcc439))
- **server-dev:** Updates to dev server manager. ([b4861d0](https://github.com/lowdefy/lowdefy/commit/b4861d0892ee9a91ff49b3bb72498d8c42c02778))
