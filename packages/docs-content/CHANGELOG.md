# @lowdefy/docs-content

## 7.1.0

### Patch Changes

- d197cb4: fix(server-dev): Build status no longer says ok while a page fails to build

  The dev server builds each page when it is first requested, after the config build. `lowdefy_build_status` and `GET /lowdefy-docs/build-status` took their top-level `build.status` from the config build alone, so it read `ok` while a page failed, and the failure showed only in `pages.failed` further down. Agents that read the top line moved on with a broken page.

  `build.status` now reads `pages_failed` when the config builds but a page failed its latest build and has not changed since, and `build.failedPages` names those pages. A failed page that changed after that build is not counted until it is rebuilt, since its failure may already be fixed. Each page's errors stay under `pages.failed`. `error` still means the config build itself failed and the dev server is serving the previous build; it names no failed pages. `build.configStatus` is the config build's own status, and `lowdefy journeys harden`, which waits for a successful config build after an edit, reads it. `lowdefy_dev_status` reports the number of failed pages as `failedPageCount`.

  - @lowdefy/nunjucks@7.1.0

## 7.0.0

### Minor Changes

- b3ba6fb: feat: Tool endpoints know the calling agent with the `_agent` operator

  - **`_agent` server operator.** `_agent: id` returns the id of the agent that called the endpoint as a tool or hook, `_agent: conversationId` the chat's conversation id, and `_agent: true` both as `{ id, conversationId }`. On a call that did not come from an agent (a page request, an MCP tool call, a scheduled, webhook or auth hook run), it returns `null`, or the `default` when one is given, and never throws.
  - **Set by the engine, not the model.** The agent runtime puts the running agent on the tool endpoint's routine. Nothing in the tool's payload or the chat request can set or change it, so an app can record agent work apart from a person's.
  - **Inherited by nested calls.** Endpoints a tool endpoint calls through `CallApi` (including `detached: true`) or a connection's `callApi` see the same agent.
  - **Headless agents.** Tools an agent run by a `CallAgent` routine step calls see the agent with `conversationId: null`.

- 07a67b5: AI requests take `maxOutputTokens` and `timeout`, and a closed request cancels its model call.

  - `GenerateText`, `GenerateObject` and `Decide` take `timeout`: the milliseconds a model call may take, retries included, before it is cancelled. `Decide` also takes `maxOutputTokens`.
  - The `Anthropic`, `OpenAI`, `Google` and `AIGateway` connections take `maxOutputTokens` and `timeout` as defaults for every request and agent on the connection that does not set its own.
  - Request resolvers receive `signal`, which aborts when the request that started the work closes: when the server's request timeout (`config.requestTimeout`) answers first, or, on the Node server, when the client disconnects. The AI requests pass it to the model call, so a call that nobody is waiting for stops instead of running, and billing, to its end. A call stopped by the request timeout fails with a `ServiceError`. A call stopped because the client left fails with a `UserError`, which is logged as a warning.
  - Work that outlives its request is not cancelled with it: endpoints with `async: true`, detached runs, and agent chat turns, which still run to their end so `onFinish` hooks save the conversation. A `CallAgent` step is cancelled with the routine that runs it.

  A synchronous routine that kept running after its request timed out now has its AI calls cancelled at the timeout. Use `async: true` for work that takes longer than `config.requestTimeout`.

- 6d311c8: feat: AwsS3PutObject copies a file from a URL

  `AwsS3PutObject` takes a `url` in place of `content` and streams what that `https:` link answers into the bucket, so a routine can copy a file it is handed as a presigned link without the bytes passing through the routine as base64.

  - **Limits.** `maxBytes` (required with `url`) caps the copy: a `Content-Length` over it is refused before reading, and a body that passes it is cut off. `contentTypes` (such as `image/*`) limits what the link may answer with, and `timeout` (default 20 seconds) covers the whole fetch and upload.
  - **Refusals name their reason.** A refused copy stores nothing and throws an error whose `code` is `url_not_https`, `url_not_public`, `too_large`, `content_type`, `fetch_failed` or `timeout`, so a `:catch` can answer each its own way.
  - **Public addresses only.** The link, and every link it redirects to, must lead to a public address. Loopback, private, link-local (cloud metadata), unique-local, carrier-grade NAT, unspecified and multicast addresses are refused with `url_not_public`, checked on the address the connection opens to, so a name that resolves differently a second time cannot get past it.
  - **The link stays out of logs.** When the request fails, the error's `received` holds `[REDACTED]` in place of `url`, since a presigned link carries its signature. Request types name such properties in `meta.credentialProperties`, which plugin authors can use for any property derived from a secret.
  - **Return value.** `AwsS3PutObject` returns `{ bucket, key, size, contentType }`, with `content` as well as with `url`.

- 24383b5: Add `lowdefy test`, which runs an app's config tests: the journeys committed in `tests/journeys/*.yaml`. Each journey names a page, an optional inline user object and a list of declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`). The command boots the development server headless on a free port (or targets a running one with `--url`), runs every journey through `POST /lowdefy-docs/journey`, prints `PASS`/`FAIL` per journey with the failing step's index, `expected` and `actual`, and exits `1` when any journey fails. `--filter <name>` narrows the run. Journey files are validated against a schema; an invalid file is reported as a failed journey without aborting the run.

  - **Journeys fail at the step that causes an app error**: an action that fails with an error that is not a user error, an uncaught exception or an error the page reports, a request or endpoint that throws on the server, or a 5xx from one. Errors raised while the first page opens (its `onInit` and `onMount` requests) fail the journey on open. `lowdefy test` prints the step and each error's kind, message and config file and line; the journey route's result carries them as `failure.errors`, each with a stable finding key. Only errors a journey's own browsers cause count, and they are reported in its result, not in the dev server's build status or event stream. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and 401 or 403 refusals. Where an error is the outcome the app means, assert it with `expect: { error: <text> }` straight after the interaction that raises it: it claims that interaction's errors whose message contains the text, and fails when none does.
  - **Every reference is checked before its step runs.** A blockId, request, endpoint or `goto` page the step names that is not in the app's build, or an `as` name that is not a data set user, fails the step naming the unknown id.
  - **`wait: { request }` waits for a fresh call**: one started since the last interaction (or since the page opened, before the first). `wait: 3000` is shorthand for `wait: { ms: 3000 }`.
  - **The step grammar is a JSON schema**: `GET /lowdefy-docs/schema/journey-step/all` returns every step and `/lowdefy-docs/schema/journey-step/wait` one step, the `lowdefy_get_schema` MCP tool takes `kind: "journey-step"`, and `@lowdefy/node-utils` exports it as `journeyStepSchema`.

- 460fdaa: feat(ai): New `Decide` request for typed AI decisions

  `Decide` asks typed questions about a state — pick one of these options (`choice` + `options`),
  is this true (`yesno`), where does this sit on a scale (`score` + `levels`) — and returns each
  answer in its declared shape with a confidence, so a routine can branch on
  `_step: triage.team.choice` and send a low-confidence answer to a person.

  - On the `AIGateway` connection it asks an evaluation model by default, such as TypeSafe's Jev
    (`typesafe-ai/jev`): a probability for every option in one pass, billed on input tokens only.
  - On every AI connection, `backend: structured-output` asks any language model for the same answers
    as schema-checked structured output.
  - An answer outside its question's terms (an option or level the question does not have, a yes/no
    that is not a boolean, or no answer) comes back with every field `null`, confidence and
    probability included, so a review gate on confidence catches it.
  - A `choice` option can be a name or an object with a `description` (other keys are ignored), so
    one intents file can serve as both the `IntentInput` block's `intents` and the question's options.
  - The build checks a routine against the questions it declares: a branch that compares an answer
    with a name that is not one of its options, or a `_step` reference to a question or field the
    step does not have, is a build error instead of a branch that never matches. Questions whose
    `options` or `levels` are built by an operator are not checked.

  The docs gain an AI Gateway connection page.

- 3f5c274: feat(plugin-aws): new `AwsS3DeleteObject` request

  An `AwsS3Bucket` request that deletes objects from the connection's bucket, so a routine can remove
  objects it stored and no longer wants. Takes one `key`, or `keys` (1 to 1000) deleted in one call,
  and returns `{ bucket, deleted, errors }`, with each key S3 could not delete in `errors` as
  `{ key, code, message }`. A key with no object counts as deleted. A failure of the call itself
  throws. The request takes no bucket and refuses one, so it only touches the connection's own
  bucket, and it is gated by the connection's `write` setting.

- 1855a25: feat(plugin-aws): new `AwsS3HeadObject` request

  An `AwsS3Bucket` request that checks on the server whether an object exists and returns its
  metadata without reading its content: `{ exists: true, bucket, key, size, contentType, etag,
lastModified, versionId }`. When S3 answers not found it returns `{ exists: false, bucket, key }`
  instead of throwing, so a routine can act on a missing object as data, for example to confirm a
  browser upload made with `AwsS3PresignedPostPolicy` arrived before recording it, taking its size
  and content type from S3 rather than from the caller. Any other S3 error throws. Takes `key` and
  an optional `versionId`, and is gated by the connection's `read` setting.

- eaa6517: feat(server-dev): Return contextual hazards from the dev MCP with schemas, docs and config lookups.

  `lowdefy_get_schema`, `lowdefy_get_doc` (by kind and type) and `lowdefy_find_config` (per match) now
  include `hazards: [{ id, message, see }]` — behaviours of a type that its schema does not show, such as
  `Html` stripping `<style>`, a closed `Modal` keeping its state, `_state` being `undefined` inside request
  properties, or the tenant wall injecting a `$match` into every `$lookup` of a request over a walled
  connection (`tenant-wall-lookup`, returned only when the request's connection is walled).

  Hazards come from two channels. Plugins declare type-attached hazards through `meta.hazards`: the build
  now carries them into `plugins/blockMetas.json`, request metas already ride along in
  `plugins/requestSchemas.json`, and operator packages can export a `./metas` module which the build
  writes to the new `plugins/operatorMetas.json`. Framework-level hazards ship hand-authored in
  `@lowdefy/docs-content/hazards.json`. Seeds: `Html`, `DangerousHtml`, `Modal` and `_js` carry their
  first hazards; the docs describe hazards and the `meta.hazards` plugin contract.

- 9a92898: feat: `expect: { effect: true }` checks that the interaction before it did something

  A journey step `expect: { effect: true }` fails when the click, open, fill, select, press or back just before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It must directly follow one of those steps, and `true` is its only value. Put it after a click on a control that should do something, so the journey fails while the control does nothing.

- e5b2f83: feat: A journey runs once per user in a `user` list

  A journey's `user` can be a list of data set user names, such as `user: [admin, member]`, on a journey with `data:`. `lowdefy test` and the `lowdefy_run_tests` MCP tool run the journey once as each user, each in a fresh database, and report each run on its own line as `<name> [<user>]`. `--filter` matches that name (`--filter "[member]"` runs one user's run), recordings and coverage see each run apart, and `--repeat` repeats each run. `as:` steps are unchanged: the first actor is the run's user.

  - A list holds distinct data set user names only and needs `data:`; `none` and inline user objects stay single values. Anything else is refused as an invalid journey file before a server starts.
  - `lowdefy test --lint` reads such a journey once, and L5 checks every listed name against the data set.
  - `lowdefy_run_journey` takes the same list and returns `{ passed, runs: [{ user, ... }] }`. `POST /lowdefy-docs/journey` still runs one user per call and refuses a list with a 400.
  - `lowdefy journeys variants` skips the role sets a journey's listed users already have, and a granted role variant's first comment names the user list to set on the original journey. The `journeys-harden` skill keeps a passing granted role variant by adding its user to that list and deleting the variant file, rather than committing a copy of the journey. A refused role stays a journey of its own.

- 9953932: feat(cli): Run journeys by popularity tier with `lowdefy test --tier`

  `lowdefy test --tier <common|wide|edge|full>` runs only the most-used journeys of a selection, ranked by their recent production use, so you can check the happy paths first (`common`) and widen to the edge cases real users still reach (`edge`) before calling a change done. Tiers are cut after paths, `--tag` and `--filter` narrow the suite, over that selection alone, and `--usage-window <n>m` (default `3m`) sets the calendar months the ranking reads. A journey with a list of users is tiered once and runs as each user. Journeys with no counts for their current steps run in every tier. A tiered run never records as the suite's run, and a selection with fewer than 100 journey matches in the window, or no evidence, is refused. `lowdefy_run_tests` takes the same `tier` and `usageWindow`.

  The `PASS` line shows a journey's tier, rank, rate and failures over the usage window: `PASS  member assigns an open ticket  (5 steps, 2100ms)  common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants`, or `unranked` for a journey with no counts for its current steps.

  A journey with `deprecated: true` is skipped in every run, even when named by path or `--filter`, and listed as `SKIP deprecated` with its recent rate. A plain run that skips one still records as the full suite.

  `lowdefy journeys usage` selects journeys the same way as `lowdefy test`, so a persona filter such as `--filter "[admin]"` picks the same journeys in both. The AGENTS.md section and `lowdefy-config` skill that `lowdefy agent-setup` writes tell agents to run `tier: common` first and widen to `tier: edge` before calling a change done.

- 60fb714: feat: Member tokens for MCP scripts

  A script that runs on its own can now call an app's MCP tools with a long-lived **member token** instead of an OAuth grant, which a crashed refresh can sign out with no way back short of a person signing in again. A member creates a token for themselves from a signed-in session with the new `CreateMcpToken` auth step, choosing an expiry in days or none. The script sends it as `Authorization: Bearer ldf_mcp_…` to `/api/mcp` and is served as that member, with their roles and organization, exactly as an OAuth-connected assistant is (`_user.auth_method` is `'mcp'`).

  - Tokens are stored hashed in the new `user-mcp-tokens` auth collection, created only in apps that set `auth.oauthProvider`.
  - `RevokeMcpToken` switches off one of the caller's own tokens; `RevokeOrgMcpToken` lets owners and admins switch off any token in their organization. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.
  - A token stops working when its member leaves, is removed or is banned. A refused token gets a `401` whose `error_description` says why.
  - A banned user's OAuth access tokens are refused on `/api/mcp` too.

  See "Tokens for scripts" on the MCP Server & OAuth docs page.

- 371a4a6: feat(build): Module agents need a signed-in caller by default

  In an app with auth configured, an agent a module ships is protected unless the module lists it under `auth.agents.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module agent stays protected where an app agent would be public, so installing a module never lets signed-out callers run an agent, spend model calls and run its tools unannounced. Roles in `auth.api.roles` apply as before; without app auth nothing changes. A public agent's tool endpoints keep their own access, and an agent listed under a module's `auth.api.public` is refused with a message that names `auth.agents.public`.

- c6b598a: feat(build): Module endpoints need a signed-in caller by default

  In an app with auth configured, an API endpoint a module ships is protected unless the module lists it under `auth.api.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module endpoint stays protected where an app endpoint would be public, so installing a module never adds a public endpoint unannounced. This covers `InternalApi` endpoints and `CallApi` steps too: a public app endpoint, or a webhook without a `verify` gate, that calls a module endpoint is refused when the caller is signed out. Roles in `auth.api.roles` apply as before, and a module webhook endpoint must still be listed in the app's `auth.api.public`.

- aa510ca: feat(build): Modules ship websockets

  A module manifest takes a `websockets:` section with the same items as the app's top-level `websockets:`, so a module ships the change streams its own pages subscribe to and an app that installs it needs no websocket config of its own. Websocket ids are scoped to the module entry (`support/thread-messages`), a websocket's `connectionId` written with `_module.connectionId` resolves to the app's connection when the entry remaps it, and the app's `auth.websockets` rules match the scoped ids (`support/**`). In an app with auth, a module websocket is protected unless the module lists it under `auth.websockets.public` in its manifest or the app makes it public (`auth.websockets.public: true`, or a `public` list that names it), so installing a module never adds a public change stream unannounced. The new `_module.websocketId` operator resolves a module websocket's scoped id for page `subscriptions` and the `Subscribe`, `Unsubscribe` and `Publish` actions, with a `{ id, module }` form for another module's websocket or for app-level config.

- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- 856e65d: feat: The `_hmac` server operator signs a string with a key

  `_hmac.sha256: { key, data }` returns the lower-case hex HMAC-SHA256 of `data` under `key`, and `_hmac.sha512` the HMAC-SHA512. Both read `key` and `data` as UTF-8 strings. Like `_hash`, it runs only on the server, so a `_secret` key never reaches the browser. The output of one call works as the `key` of the next, so a routine can derive a per-app secret from one root secret and sign a webhook body with it. A `_hmac` refusal is a config error reported without the operator's params, so a derived `key` is never logged.

- db99f9f: feat(client,engine): page lifecycle events for the browser tab, network and window

  Pages can now react to the browser instead of polling to notice that something
  changed while the user was away. Five new events can be defined on the first
  blocks of a page: `onVisible` and `onHidden` when the tab is shown or hidden, or
  the window regains or loses focus (coalesced over 300ms so a focus and
  visibility pair only runs the chain once, with `_event` carrying `visible` and
  `reason`); `onOnline` and `onOffline` when the browser reports the network
  connection was regained or lost (`_event` carrying `online`); and `onResize`
  when the window is resized, debounced by 200ms (`_event` carrying `width` and
  `height`).

  The listeners are attached once while the page is mounted and removed when the
  user navigates away, so they never trigger for a page that is no longer open,
  and none of them trigger on the initial page load. The action chains run
  non-blocking, like `onMountAsync`, so they never hold the page in loading.

- fa02e14: feat: Page subscriptions that wait for the Subscribe action

  - **`client.subscribeOnMount`.** A page subscription with `client.subscribeOnMount: false` is declared on the page but does not open when the page mounts. The `Subscribe` action opens it, evaluating its `payload` at that moment, and `Unsubscribe` closes it. A widget on every page can then hold its channel only while it is in use. The default, `true`, keeps subscribing on mount.
  - **`Subscribe` with a changed payload replaces the channel.** Running `Subscribe` on an open subscription evaluates its payload again. When the payload changed, the channel is replaced and its `_websocket` state starts empty, and messages from the old channel are dropped. When it did not change, nothing happens, as before.

- 4f37391: feat: Webhook endpoints answer with the HTTP status their routine sets

  - **`:reject` takes `:status` and `:body`.** In a webhook endpoint, `:status` (400 to 499) sets the HTTP status and `:body` the body, sent as is. A `:reject` without `:status` answers 400 with `{ error: { code: 'rejected', message } }`.
  - **Through `CallApi`.** A `:reject` in an `InternalApi` endpoint the webhook calls sets the answer the same way, so the work can live in the called endpoint.
  - **Clear statuses for the rest.** A failed `ValidateSchema` step answers 400 (`invalid_request`, naming the failing path), a failed verifier 401 (`unauthorized`), and any other error 500 (`internal_error`) with nothing from the error. A successful routine still answers 200 with its return value.
  - **Build check.** `:status` and `:body` on a `:reject` in any endpoint other than a webhook or an `InternalApi` endpoint is a build error.

- 5d951af: feat: Webhook endpoints can answer with plain text

  - **`:return` takes `:content_type: text/plain`.** In a webhook endpoint, the endpoint answers `200` with the returned string as the body, `Content-Type: text/plain; charset=UTF-8` and `X-Content-Type-Options: nosniff`. This completes subscription handshakes that want the token echoed as text, such as Microsoft Graph's `validationToken` check.
  - **Strings only.** The returned value must be a string; any other value fails the run with the `500` answer.
  - **Build check.** `:content_type` on a `:return` outside a webhook endpoint, or with any value other than `text/plain`, is a build error.
  - A `:return` without `:content_type` answers JSON exactly as before.

### Patch Changes

- aad166b: feat(api): `_agent: sharedState` gives an agent's tool endpoint the chat's shared state

  A tool endpoint an agent calls can now read the shared state the `AgentChat` block sent with the message, for example the page or browser details an app puts there, with `_agent: sharedState`. The tool reads it from the chat instead of from its input, which the model writes. It is `null` for an agent run by a `CallAgent` step.

- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- 7636cca: feat: `CallApi` can run its target in one organization, as a named stand-in caller.

  A `CallApi` step in a trusted system run (a scheduled run, an auth hook, a webhook whose `verify` request passed, or a detached run from one) can name `organization` and, optionally, `caller: { id, name }`. The target runs as a system run bound to that organization: under the `tenant` organizations policy every walled request inside it, and in the endpoints it calls, is filtered and stamped with the organization, with the wall on. `_user` inside it is `{ id, name, organization_id, system: true }` when `caller` is named (no roles), or null otherwise, so routines and change logs that stamp writes with the caller run unchanged. A detached call carries the binding.

  The step is refused in a signed-in caller's routine, a strategy caller's, or a webhook with no passing verifier, and a bound run can not name a different organization or caller. A `caller` without `organization`, or a static value of the wrong shape, is a build error.

  Only the stand-in caller carries `_user.system`. A `jwt` auth strategy whose `claimMapping` names `system` is a build error, and the dev server refuses a mock user, headless user or e2e user that sets `system`.

- 575a5ee: feat(blocks-basic)!: `ClickableHtml` fires only the events its `dataEvents` property lists.

  **Breaking:** a `data-event` in a `ClickableHtml` block's HTML now fires its event only when the
  block's new `dataEvents` property lists that event. A block without `dataEvents` fires no events
  from its HTML, and a click on an unlisted `data-event` does nothing and logs a console warning.
  Until now any `data-event` in the HTML fired the block event it named. HTML is often built from
  request or user data, and sanitising keeps `data-*` attributes, so the block now has the author
  say which events its HTML may fire.

  ```yaml
  - id: rows
    type: ClickableHtml
    properties:
      dataEvents:
        - onEdit
        - name: onDelete
          confirm: Delete this row?
      html: ...
  ```

  An entry is an event name, or `{ name, confirm }`. With `confirm`, every click on the event asks
  first whatever the markup says: `confirm: true` uses the element's `data-confirm` message or "Are
  you sure?", and a string is the message. Any `confirm` other than `false` asks, so an empty or
  missing message still asks, with the default message. Unlisted targets are no longer made keyboard
  focusable.

  To migrate, run `lowdefy upgrade`: the `clickable-html-data-events` codemod adds `dataEvents` to
  each `ClickableHtml` block and reports HTML built from data that inserts values without escaping
  them. `ClickableHtml` blocks that `Dynamic` content builds at page load, from config stored outside
  the app's files, need `dataEvents` added where that config lives. The docs now state that HTML
  built from user or request data must escape that data.

  `HtmlComponent` in `@lowdefy/block-utils` takes the list as its `dataEvents` prop, next to
  `onDataEvent`, and applies it inside popover content too.

- 8c68631: feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

  - **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
  - **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
  - **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
  - **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.

- 2ef077f: fix: `lowdefy dev` works with `config.basePath`, dev warns about inline page links, and the agent docs are complete

  - `lowdefy dev` now boots an app that sets `config.basePath`. The dev server used to answer `<basePath>/@vite/client` and the client entry with the page HTML, so the app never loaded. The app, its API and the `/lowdefy-docs` agent tools are all served under the base path (`/app/lowdefy-docs` for `basePath: /app`), and `.lowdefy/instance.json` records the URL with the base path, so `lowdefy mcp`, the hub and `lowdefy test` reach the dev server without extra setup. The dev server also reports itself ready and opens the browser at the base path.
  - `lowdefy dev` now reports the same warnings as `lowdefy build` for pages written directly in `lowdefy.yaml`: a `Link` to a page that does not exist, a `CallAPI` to a missing or `InternalApi` endpoint, websocket and dynamic block references, and `_state`, `_payload` and request state references. Before, only pages in their own `_ref` files were checked in dev.
  - `@lowdefy/docs-content` holds 20 pages it was missing, among them theming, blocks, page and app state, roles, auth configuration, websockets and notifications. The extractor now renders docs pages written as `_nunjucks` templates, and the content is regenerated from the current docs. The docs site's notifications, AxiosHttp and v3-to-v4 migration pages now show their `{{ ... }}` template examples instead of dropping them; the notifications page failed to render before.

- 588344b: feat: Dev tools build status and request runner report the config you just edited

  The dev server builds a page only when it is requested, so agent tools could answer from a page's previous build after an edit. They now tell the truth about pages built on request:

  **Build status (`lowdefy_build_status`, `GET /lowdefy-docs/build-status`)**

  - With `wait: true`, build status builds every page your edit touched before it answers, whether or not anything has opened the page since. A new `pages` section lists the pages it built (`checked`), the pages whose last build failed with their errors and source file (`failed`), pages changed on disk that the dev server has not rebuilt (`changedSinceBuild`), and how many pages nothing has built since the dev server started (`unbuilt`).
  - Browser and server errors carry the build they happened under (`buildId`). Errors reported before the latest config build or page edit are listed apart under `earlierErrors`, so errors that may already be fixed no longer read as live.
  - A build that fails with an internal error now reports the error's message, stack and the config file being resolved, instead of only "Build failed due to internal error. See above for details."

  **Request and endpoint runners (`lowdefy_run_request`, `lowdefy_run_endpoint`)**

  - `lowdefy_run_request` builds the page first when it changed since its last build, so it runs the request in the config now rather than the page's previous build. A page that fails to build is refused with its `buildErrors`, and a result from a page whose edit the dev server has not picked up yet carries a `staleConfig` note.
  - A response over 40,000 serialized characters is no longer cut to a string prefix. It is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile`, `responseChars` and, for an array, `responseItems`. The new `saveResponse: true` option writes any response there. Only the 20 most recent response files are kept.

- abb3f27: feat(server-dev): Every dev tool that acts as someone takes the same `user` option

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint` now take `user` in the forms `lowdefy_run_journey` already took: a user object, `"none"` to act signed out, or the name of a user in a journey data set together with `data`. With a data set the call acts as that user and runs on a fresh database of its own loaded with the data set, as a journey with `data` does, so an agent can check a page, a request or an endpoint as a real user without hand-made cookies or scripts. `lowdefy_run_endpoint` keeps `system: true` as its only other form. Every tool description carries the same sentence explaining the option, and the `/lowdefy-docs` routes take the same `user` and `data` params.

- 73642f1: feat(dev): Screenshot viewport and colour scheme, smaller journey results, and Back, title and segmented-control steps for journeys.

  **Screenshots (`lowdefy_screenshot_page`)**

  - New `width`, `height` and `colorScheme: 'light' | 'dark'` options check a phone layout or dark mode, e.g. `{ "width": 390, "colorScheme": "dark" }`. The REST route takes them as `?viewportWidth=390&viewportHeight=844&colorScheme=dark`, since `width` and `height` there already name the clip.

  **Journeys (`lowdefy_run_journey`, `POST /lowdefy-docs/journey`, `lowdefy test`)**

  - A final page state over 10000 characters is no longer returned whole: the result carries `stateOmitted` with its size and each top-level key's size. A new `state` option picks what comes back: an array of state paths, `true` for the whole state, or `false` for none.
  - New `{ "back": true }` step presses the browser's Back button, and `{ "expect": { "title": { "equals" | "contains" } } }` checks the document title.
  - Segmented controls, radio groups and checkboxes are reached through their labels, so `click` by text and `select` by value work on a `SegmentedSelector`, `RadioSelector` or `ButtonSelector` option; before, the runner found the option's hidden input and timed out.

- 8d1ea50: `index.json` records, for each extracted doc, the docs source files it was built from and their hash, and the docs tests fail naming each doc whose source changed since the last `pnpm docs:content`. Before, only added, removed or moved pages were caught, so edits to an existing page could ship without the extracted docs agents read.
- d2c8e01: feat(api)!: Data read into a Dynamic block's `:return` stays data.

  **Breaking:** a Dynamic block without a dynamic blocks policy no longer renders blocks or actions that its endpoint read as data. In v6, stored operator-free block config returned from a Dynamic endpoint rendered as it was; in v7 the block renders its fallback. Every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, fails resolution. Operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`) may return written config; content that breaks the rule renders the fallback, with an error naming the operator and the path in its result. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` fail: build them inside `:return` with `_array.map`/`_array.concat`, share block config with `_ref`, and write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Data may still fill values inside written blocks, as in the documented `_array.map` pattern, and a block built by config from a stored field renders even when it equals the field. To render stored or generated block config, put the Dynamic block under a dynamic blocks policy and return the content through a `ValidateDynamic` step. See the v6 to v7 migration guide.

  Also:

  - Only operator keys lose their escaping underscore in the returned content (`__state` becomes `_state`); data keys such as `__typename` pass through unchanged.
  - Data read into a Dynamic `:return` may nest at most 200 levels deep, and dynamic blocks policy content likewise (`limits.depth`); deeper data fails resolution with an error saying so.
  - An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
  - Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
  - Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. Every value no schema marks is still judged by its key name; `urlKind: false` opts a URL-named property out (`Search` `result.url`, the Tiptap `image` settings). URLs are read as the browser's URL parser reads them, so surrounding spaces and embedded tabs or newlines do not change the verdict.

- 6b3a9bb: feat!: Replace the NextAuth-shaped auth system with BetterAuth.

  Lowdefy auth now runs on [BetterAuth](https://www.better-auth.com) 1.7.7 through the new `@lowdefy/plugin-better-auth` package; `@lowdefy/plugin-next-auth` and `@lowdefy/plugin-auth0` are removed. Every app with an `auth:` block is affected — follow the migration guide at `/migration/auth-upgrade` in the docs.

  Breaking changes:

  - **`auth.database` is required** for any login method; sessions are database-backed only (`session.maxAge` → `expiresIn`, no JWT strategy). Collections follow the `user-*` convention fixed by the adapter and auth columns are stored in snake_case.
  - **Provider type names change** — `GoogleProvider`, `GitHubProvider`, ... become `Google`, `GitHub`, ...; `OpenIDConnectProvider` → `GenericOAuth`. Provider `id`s and `/api/auth/callback/<id>` URLs are unchanged. Built-in and `GenericOAuth` providers share one id namespace, so the build fails when a `GenericOAuth` `id` is the key of a built-in provider the app also configures. `GenericOAuth` takes `trustEmail: true` to mark its users' emails verified, for an issuer that sends no `email_verified` claim. An invalid provider property fails startup with the provider id and its config location.
  - **`auth.callbacks` / `auth.events` JS plugins are replaced by `auth.hooks`** — bindings to `InternalApi` endpoints fired in a system context. Verification identifiers carry a `magic-link:` or `auth-state:` prefix, which a `verification.create.before` / `after` hook matching on the identifier must allow for.
  - **`NEXTAUTH_SECRET` / `AUTH_SECRET` env vars are replaced by `auth.secret`** (use the `_secret` operator); pin the canonical URL with `BETTER_AUTH_URL`, or the `url` of the current environment in `config.environments`. With `auth.email` configured, a production server refuses to start (`ConfigError`) until one of them is set, since every emailed link is built from it; without `auth.email` it logs a warning. While unpinned, auth trusts only the origin the request arrived on, so behind a proxy that ends TLS and forwards plain `http`, sign-in is refused until the URL is pinned. The dev server uses the request origin.
  - **Built-in auth UI and `auth.theme` are removed** — the app provides its own pages via `authPages` (`signIn`, `signUp`, `error`, `forgotPassword`, `resetPassword`, `verifyEmail`, `twoFactor`, `twoFactorEnrol`, `acceptInvitation`). The emailed verification link from `SignUp` / `SendVerificationEmail` without a `callbackUrl` lands on `verifyEmail` (default `/verify-email`), with `?error=INVALID_TOKEN` or `TOKEN_EXPIRED` when it fails. The reset link from `RequestPasswordReset` without a `redirectTo` lands on `resetPassword` (default `/reset-password`) with `?token=`, or `?error=INVALID_TOKEN`. The build warns when the app sends these emails (`auth.email` with `emailAndPassword`) and the page is missing.
  - **`EmailProvider` becomes `auth.magicLink` + `auth.email`**, with branded auth emails sent over an SMTP connection.
  - **The session user shape changes** — `userFields` is removed; `_user` carries `id`, `name`, `email`, `image`, `email_verified`, `active_organization_id`, `profile`, plus `roles` (app roles from the active membership's `appRoles`), `org_roles` (the `owner`/`admin`/`member` tier), `attributes` (merged global + per-organization bag), `two_factor_enrolled` and `auth_method`. `name` and `image` resolve per organization, from the member row `UpdateUserProfile` writes, falling back to the user row. A caller awaiting an organization carries `has_pending_invitation` and, when there is one, `pending_invitation_id`. `_user.sub` is gone — `_user.id` is the internal id.
  - **Organizations are always on** — roles live on organization memberships; `auth.organizations` configures `pinned` vs `tenant` policy, invitations, the role catalog and the tenant wall that scopes connections by `organization_id`. `invitationExpiresIn` sets how long an invitation stays acceptable (seconds, at least 60, default 48 hours); an expired or cancelled invitation fails with code `INVITATION_EXPIRED`. Accepting an invitation does not switch a session already active in another organization. Organizations have no practical member cap (default 1,000,000); `membershipLimit` sets one, and an unpaged `ListMembers` returns every member.
  - **Retired client actions** — `ImpersonateUser`, `StopImpersonating` (no replacement); `InviteMember`, `CancelInvitation`, `UpdateMemberRole`, `RemoveMember`, `UpdateOrganization` are now auth steps run from routines.
  - **Signed-out requests no longer reveal page or endpoint existence** — protected apps answer sign-in for every URL and `401` for missing or protected requests alike.

  New in this line: two-factor auth (TOTP, backup codes, passkeys, `twoFactor.required` enrolment; id token sign-ins are challenged too unless the provider sets `twoFactorTrusted: true`, and `Login` with an `idToken` then navigates to `authPages.twoFactor`), phone number and captcha sign-in, the app as an OAuth 2.1 authorization server for MCP clients (`auth.oauthProvider`, scoped MCP tools), the `_organization` server operator and the `_build.authConfig` projection, and a self-service auth action catalog (`SignUp`, `PasskeySignIn`, `PasskeyUpdate`, `TwoFactorGenerateBackupCodes`, `SetActiveOrganization`, `AcceptInvitation`, `LeaveOrganization`, ...). Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the client address the server resolves; behind a reverse proxy, list the proxy in `config.trustedProxies`.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

- 1d31a29: feat: Set MCP server instructions with `mcp.instructions`.

  The app's `mcp` block takes an optional `instructions` string, sent to MCP clients in the `initialize` result. Clients such as Claude Code place it in the model's system prompt, so it suits a short note on how the app's tools fit together. Clients may truncate long instructions, so keep it to a few lines.

- 1bb3012: feat(blocks-antd): Sider header slots in `PageSidebarLayout`, and a drawer header slot in `MobileMenu`.

  `PageSidebarLayout` takes two new slots above the sider menu: `siderHeader` while the sider is expanded and `siderHeaderClosed` while it is collapsed. They sit between the collapse toggle and the menu, outside the menu's scroll box, so they stay in place while a long menu scrolls. The `siderHeader` css key styles the box that holds them. A `mobileDrawerHeader` slot puts content above the menu in the mobile drawer, drawn by the new `drawerHeader` slot on `MobileMenu`. A page that sets none of them renders as before.

- 662eaa9: feat: Tenant wall — multi-tenant isolation on MongoDB connections, scoped by default

  `auth.organizations.policy` sets the scoping default for every connection in the app. Under `policy: tenant`, every connection whose type implements the scoping contract is walled to the caller's active organization — enforced mechanically on reads **and** writes, with nothing to declare per connection and no per-request filters to remember. A connection declares only its **exception** to that default: `tenant: shared`, for data deliberately shared across organizations, or `tenant: { field: ... }` to scope on a non-default field. A connection carries no default of its own — the same connection file is scoped in a `tenant` app and unscoped in a `pinned` one, with nothing in the file about tenancy.

  **The wall is policy-conditional.** It engages only when the app declares `auth.organizations.policy: tenant`. Under `pinned` (the default, including apps with no `organizations:` block) no connection is scoped and none can be — the wall applies nothing: no read filter, no write stamp, no selector merge, no change-stream scoping, no authored-clause audit, no fail-closed error for organization-less callers, and no rejection of an authored tenant field. A single-organization deployment therefore adopts scoping-capable connections with no data migration — no backfill, no index changes. One check stays on under both policies: declaring `tenant:` on a connection type that does not implement the scoping contract is a config error, so it surfaces on the current deployment rather than on the day the app flips to `tenant`. `_build.authConfig` projects `organizations.policy`, so config can branch on the policy at build time, including in module entry vars and cross-module components consumed through them. (Reading it inside the `auth:` block itself, or in app metadata, is a build error.)

  **Tenant preflight.** Under `policy: tenant` the server probes every walled collection (lazily, once per process) for documents missing the tenant field or carrying it as `null` — rows no walled read can see. It keeps serving and reports each offending collection once: a `TenantIntegrityError` log line and a Sentry event tagged with collection, connection and endpoint. A probe that cannot reach the database logs a warning and retries on the next request. The probe is a connection-type capability (`tenantPreflight`, implemented by `MongoDBCollection`); the walled set — every scoping-capable connection that does not declare `tenant: shared` — is enumerated from the `tenantConnections.json` build artifact.

  **Tenant wall (`@lowdefy/connection-mongodb`, `@lowdefy/api`)**

  - Every find/findOne/update/delete selector is merged with the caller's organization equality; every insert, replacement, and upsert is stamped server-side with the organization id. Every insert into a walled collection (including upserts, bulk writes, table changes and the version copy of a versioned update) is read back by `_id`; a row missing the tenant field or carrying another organization is deleted and the request fails with `TenantIntegrityError`.
  - Aggregation pipelines: the wall's one pipeline move is prepending the tenant `$match` at every pipeline entry — the root pipeline and every `$lookup` (both forms) / `$unionWith` sub-pipeline entry, recursing through `$facet` branches. The wall never rewrites the inside of a stage. `$out`/`$merge` are rejected on tenant connections, and `$collStats`/`$indexStats` too — collection-level statistics cannot be tenant-scoped.
  - Stages the prepend cannot scope — a pipeline-leading `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear`, and `$graphLookup` at any position — are **refused** unless the request declares `tenant: authored`: the request then authors the tenant clause itself (a `compound.filter` `equals` for `$search`/`$searchMeta`, the `filter` for `$vectorSearch`, the `query` for `$geoNear`, `restrictSearchWithMatch` for `$graphLookup`, typically with `_user: organization_id` as the value), and the wall **audits** it at runtime — clause present, tenant field, value strictly equal to the caller's resolved organization — refusing to run on any miss. The rest of an authored request's pipeline is still walled mechanically, and the caller must still resolve an organization. Atlas index requirements for authored clauses: the tenant field `token`-mapped in the Atlas Search index (and in `storedSource` where `returnStoredSource` is used); indexed as the `filter` type for Atlas Vector Search.
  - Change streams are scoped via a `fullDocument` match with `updateLookup` forced; events that cannot prove they match (deletes) are not delivered, and callers from different organizations never share a change-stream channel.
  - The tenant field may be read but never authored in a write or filter position — authored usage is rejected loudly. In writes this means a top-level key of an insert or replacement document or of an update operator's argument; a nested key of that name inside stored data is ordinary data. (On a `tenant: authored` request the audited stage position is the one place it is instead _required_.)
  - Fail-closed everywhere under `policy: tenant`: system-context and strategy callers carry no organization, so their requests to tenant connections fail. A read fails with an `AuthenticationError` unless the request or step declares `tenant: none`, the only opt-out, authored at the point of use; `tenant: none` reads reach every organization's rows. A write in a run bound to no organization fails with `TenantIntegrityError` (naming the collection, connection and tenant field, logged at error level and sent to Sentry). To write from a caller-less run (a schedule, an auth hook, a verified webhook), call an endpoint with a `CallApi` step that names the `organization`: its requests run with the wall on, filtered and stamped with that organization.
  - **`tenant: none` is read-only.** A request, routine step or webhook verifier with `tenant: none` on a scoped connection whose type writes (`MongoDBInsertOne`, `MongoDBUpdateMany`, `MongoDBBulkWrite`, `MongoDBTableChanges`, the enrichment requests and the rest) fails the build with a `ConfigError` naming the step, request or verifier, its type and its connection, and the same write is refused at runtime. An aggregation with `$out` or `$merge` under `tenant: none` fails the build when the target is a literal collection name and is refused at runtime otherwise.
  - A `tenant: shared` connection over the same collection and database as a scoped connection (compared as authored; a collection name resolved at runtime is not compared) keeps unscoped reads, but every row it inserts, replaces, upserts or updates must keep a non-empty `organization_id`, and each `MongoDBBulkWrite` operation must name exactly one operation kind.
  - `context.user.organization_id` (the caller's active organization id) is exposed and readable as `_user: organization_id` under both organizations policies.

  **Walled MongoDB client for plugins**

  `@lowdefy/connection-mongodb/walled` exports `getWalledCollection`, a client whose `find`, `findOne`, `aggregate`, `countDocuments`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany` and `bulkWrite` apply the wall exactly as the matching MongoDB requests do: scoped reads and writes, stamped and read-back inserts and upserts, change logs kept, `$out` and `$merge` refused, and every write method refused under `tenant: none`. A plugin's request resolver receives `walled(connectionId)` and passes its result to `getWalledCollection`. Under `policy: tenant`, a non-scopable connection (SMTP, a plugin's own connection type) may not reach a walled database: the build fails when such a connection reads the secret behind a walled connection's `databaseUri`, and when one holds a URI to a walled database under another secret or as a literal, the server logs an error at start and refuses that connection's requests with a `ConfigError` while the rest of the app keeps serving. There is no opt-out (`~ignoreBuildChecks` does not suppress it): give the plugin a `mongoConnectionId` and use `getWalledCollection`.

  **Build validation (`@lowdefy/build`)**

  - The connection position accepts only the exception: `tenant: shared`, or `tenant: { field: ... }`. Any `tenant:` declaration on a connection type that does not implement the scoping contract is a build error under both policies.
  - Connection types declare their tenancy capability in `connectionMetas`: `{ tenant: true }` implements the scoping contract (v1: `MongoDBCollection`), `{ tenant: false }` is non-scopable — every first-party connection type declares one or the other. Under `policy: tenant` a connection whose type declares neither is a build error naming the type, so a data-bearing custom type can never be silently unscoped. Connection plugins can also declare `requestMetas` (`{ checkRead, checkWrite }` per request type) in their `types.js`, which the build reads to know which request types write.
  - The request/step-level sentinel accepts `none` and `authored`; websockets accept `none` only (`authored` is aggregation-only). Declaring `none`/`authored` on a connection, or `shared`/`{ field }` on a request, is a build error naming the position the value belongs to.
  - Best-effort entry-stage check: a literal walled pipeline leading with `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear` or containing `$graphLookup` without `tenant: authored` is a build error (operator-composed pipelines are checked at runtime, which is the enforcement gate). The check only runs under `policy: tenant` — under `pinned` the wall never engages, so a missing authored clause is not an error.
  - Shared connections and walled collections: a request or step on a `tenant: shared` connection whose literal aggregation pipeline writes into a scoped connection's collection with `$out` or `$merge` is a build error, and so is a `tenant: shared` connection whose `changeLog.collection` is a collection a scoped connection reads — give shared connections their own change-log collection. Both checks compare literal collection names and database properties as authored; `MongoDBCollection` declares the properties that name its collections in `connectionMetas.tenantTarget`.
  - Remap guard: a connection remap on a module entry swaps the module's whole connection definition for the app's — including its position against the wall. Under `policy: tenant`, remapping a scoped module connection to a target that is not scoped — one that declares `tenant: shared`, or whose type does not implement the scoping contract — is a build error (it would silently run the module's requests outside the wall). Remapping onto a target that declares nothing is safe: both sides are scoped. Under `pinned` remaps stay unrestricted; the flip to `tenant` is a rebuild, so the guard fires there.

  **Signup under `policy: tenant`**

  With `organizations.signup: open` and `create: auto`, a user without a membership gets a fresh organization, as its owner, at their next session — exactly one organization and one owner row even under concurrent sessions, and never an organization the user was a member of before. The server creates unique indexes on the organization `slug` and the member `(user, organization)` pair at startup (an equivalent index created by hand, under any name, is accepted). If they cannot be created — the database user lacks the privilege, or duplicate rows exist — the server logs an error naming the index, and a sign-in that needs a new organization is refused with status 503 and the code `ORGANIZATION_SETUP_UNAVAILABLE`; the server retries at most every 30 seconds, so a fix recovers without a restart.

  **Enabling the wall**

  Under `pinned`, adopting scoping-capable connections changes nothing — no migration, no new requirements, no declaration. Enforcement starts when the app declares `policy: tenant`, and that flip is deliberately breaking, in the fail-closed direction:

  - Documents without the tenant field fall outside every walled read — the tenant preflight names the collections to backfill.
  - Every system-context caller of the connection (webhook verifiers, hook routines, scheduled endpoints) and every strategy caller starts failing until it runs with an organization: reads can declare `tenant: none` at the point of use, writes go through `CallApi` with `organization`. Declaring `tenant: none` on a read is inert under `pinned`, so authoring it ahead of the flip is safe and recommended wherever a caller-less context reads a walled connection.

- cb0acad: feat: Journey data set files and `lowdefy data list`

  Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional seeded `generate` block for background documents. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

  A data set can extend others with a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id`, an index with the same `key` or a user of the same name replaces the earlier one. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused.

  Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.

- 73c5e14: feat: `lowdefy journeys pull posthog` brings production analytics into local journey traces; `journeys evidence` and `journeys coverage` report how much real use backs each journey and what no journey covers yet.

  - `lowdefy journeys pull posthog [--since 30d | --from --to]` reads the app's PostHog project over the HogQL query API with your own personal API key (`POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `POSTHOG_PERSONAL_API_KEY` with the Query Read scope) and writes one day of interaction traces per file to `.lowdefy/traces/production/`. A window is at most 30 days. Final days are fetched once, today and yesterday again on every run, and files older than 400 days are removed. Person and organisation ids are hashed, and each clicked element's text is stored as a token (`target.text_token`), never as text, both with a salt that never leaves your machine; typed values, URL query values and element chains are never stored. Options: `--environment`, `--include-test-accounts`, `--org-property`, `--roles-property`, `--page-size`, `--max-rows` and `--refetch`.
  - Coverage and evidence turn a token back into text only when it is text from the app's config (the built pages, menus, i18n messages, block plugins' default messages and antd's locale strings, collected with one build by the installed dev server and cached until the config changes). A click on any other text (a customer's name in a grid cell) is read as its block, row and column with a `tokenised-text` flag, and a journey clicking a data value is backed exactly as one with no text. A day pulled under another salt, or with different filters (project, `--environment`, `--include-test-accounts`), is not mixed in: coverage and evidence name the days and the `--refetch` pull that makes them one set.
  - `lowdefy journeys evidence [--refresh]` counts, for each journey in `tests/journeys/`, the production sessions that did what it does, with people, organisations and failures. `--refresh` writes them into the journey's `evidence` key and changes nothing else in the file, and a hardening run's `.lowdefy/test/mutation.json` adds `evidence.mutation`. Journeys nothing backs are listed beside their mutation numbers and never removed.
  - `lowdefy journeys coverage --source production [--json]` reports interaction, flow, failure, frustration and role coverage, each with what is uncovered ranked by use, and writes them with a production profile to `.lowdefy/test/coverage.json`, which lists per block the clicks, distinct tokens and most-clicked tokens. Journeys with `deprecated: true` are left out of every measure. Sessions are grouped into flows only when the window holds 100,000 production rows or more; below that the summary points to the session logs (`--group` and `--no-group` force either way).
  - `lowdefy journeys session --source production` lists the pulled production sessions (`--since`, `--from`, `--to`, at most 30 days) and prints any one as a log, as dev sessions print: the controls used and what the app did, without typed values, and with clicked text only when it is config text.
  - With a recorded full test run, `journeys coverage` reports the interaction share that run drove beside the static one, and counts a failure as covered only when a journey that passed produced it (`failure.mode: measured`); without one it reports failures as reached. `lowdefy test` and `lowdefy_run_tests` keep which journeys passed in a recorded run in `.lowdefy/test/run.json`.
  - `lowdefy agent-setup` installs a `journeys-from-production` skill that runs the loop with you: it picks the window, pulls, reads each recorded routine with the app's config and code, takes one uncovered failure or flow at a time into a journey proven by three runs, then refreshes evidence. Running `lowdefy journeys usage --json` before and after the refresh, it reports the deprecated flows users still follow, the journeys whose tier changed and those still unranked. It commits nothing, never deletes a journey, and never reads production text or credentials or queries PostHog directly.
  - Journey files accept a strictly validated `evidence` key, and `lowdefy test` (and the `lowdefy_run_tests` MCP tool) print it after each passing journey: `412 sessions · 9 orgs · 11/12 mutants`.

  `@lowdefy/node-utils` exports `isBackedBy`, the one rule for whether a recorded segment did what a journey does, `profileProduction`, `listFailurePaths` and `failurePathKey`. `compileSegments` segments also carry their entry page, pages, failure path and frustrated clicks.

- 1d547f3: The SMTP and SendGridMail connections now drop every recipient on the reserved `.invalid` domain (the domain `invalid` and any `*.invalid`, which RFC 6761 says never resolve) before the delivery filter runs. Case is ignored. Surrounding spaces and a trailing dot are ignored too. They are removed from `to`, `cc` and `bcc` on every send, in every environment, with no filter and with `filter: false`, and for auth emails too.

  Before, a `replaceAddress` catch-all redirected mail for test users (`user@audit.invalid`, say) into the team's inbox, so apps had to skip email for test users themselves. Now only the `.invalid` addresses are dropped and every other recipient still gets the mail:

  - SMTP checks each address in a comma-separated string on its own and keeps the others. SendGrid reads a string as one address, so it drops a comma-separated string only when every address in it is on `.invalid`.
  - When every `to` recipient is on `.invalid`, the remaining `cc` and `bcc` recipients still get the mail. SMTP sends it without a To header; SendGrid, which needs a `to` recipient, sends each of them their own copy.
  - When no recipient is left, nothing is sent and the send reports `{ messageId: null, to: null, filtered: true }`, as a fully filtered message does. Otherwise `replaceAddress`, `allowlist` and `regex` apply to the remaining recipients as before.

  Use `.invalid` for test users that must never receive mail, and `example.com` or `.test` for journey users whose mail a journey reads from the dev server's SMTP catcher.

- d46ce43: feat(api): The app's MCP server can run an endpoint after every tool call

  The `mcp` block takes an optional `afterToolCall`, the id of an API endpoint the server runs after each tool call that reached its endpoint, once the reply to the client is built. It runs as the tool's caller with the payload `{ tool, endpoint_id, scope, payload, success, response }`, so an app can record what agents do with its tools, refusals included.

  ```yaml
  mcp:
    afterToolCall: record-tool-call
    endpoints:
      - id: search-customers
        scope: mcp:read
  ```

  The hook never changes the reply: a hook that fails is logged as a warning and the client gets its reply as if there were no hook. It does not run for an unknown or hidden tool, a role or scope shortfall, or a payload the tool's `payloadSchema` rejects. The reply waits for the hook, so it is not cut short on serverless platforms. The build checks that the named endpoint exists; it is normally an `InternalApi` endpoint, not listed as a tool.

- f33e96a: `lowdefy mcp` works in every project and worktree you open an agent session in, and one session can run the dev servers of several projects.

  - **Register once for every project.** `lowdefy agent-setup --user` adds the `lowdefy` MCP server to Claude Code's user scope, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app. On Windows it registers `cmd /c npx ...`. A rerun whose add fails keeps your existing registration. Without Claude Code on your `PATH` it prints the entry for your agent client.
  - **Tools in a fresh worktree.** `agent-setup` writes `npx --prefer-offline --yes lowdefy@<version> mcp` into `.mcp.json`, pinned to the version of the CLI running agent-setup, so every app in a repository writes the same entry. A worktree nobody has installed yet still starts the server: npx serves the pinned version from the shared npm cache, offline, in under a second. agent-setup first runs the pinned version through npx and refuses one npm cannot serve, so a committed entry never leaves teammates without tools.
  - **Agents install what is missing.** When an app lists `lowdefy` in its `package.json` but its dependencies are not installed, `lowdefy_dev_start` answers with the install command and where to run it (for example `pnpm install` at the workspace root), instead of running a dev script that cannot start.
  - **Trust a repository once.** Approving an app outside the session's checkout offers **Always allow this repository**, which covers all of its git worktrees in every later session. Trust is per git repository and only comes from you: the question, or `lowdefy hub trust [directory]`, which runs only in an interactive terminal so an agent cannot run it. `lowdefy hub untrust [directory]` and `lowdefy hub trusted` manage the list.
  - **The MCP server is renamed `lowdefy`** (was `lowdefy-docs`), so its tools are `mcp__lowdefy__*`. Rerunning `lowdefy agent-setup` replaces the `lowdefy-docs` entry 6.x wrote in `.mcp.json` (an entry pointing at a `localhost` port; a `lowdefy-docs` entry pointing anywhere else is left as it is) and renames the server in `.claude/settings.json` and `.claude/settings.local.json`: in `enabledMcpjsonServers` and `disabledMcpjsonServers`, and in the `permissions.allow`, `ask` and `deny` tool rules (`mcp__lowdefy-docs__lowdefy_get_schema`, or `mcp__lowdefy-docs` for all its tools, become `mcp__lowdefy__…`), so tool approvals carry over. It also updates the name in the skill and `AGENTS.md` section it wrote, and `agent-setup --user` removes an old `lowdefy-docs` user registration. Update any other place that names `mcp__lowdefy-docs__` tools, such as hooks. The dev server's `/lowdefy-docs` routes are unchanged.
  - **Mixed Lowdefy versions.** When `lowdefy mcp` and the dev server it calls run different Lowdefy versions, a tool call either works or fails with the fix spelled out. `lowdefy mcp` adds the tools it does not know to the session's tool list, and shared tools follow the newest comparable server: a dev server on a newer Lowdefy version replaces their descriptions and schemas. Versions are compared only when both are releases or share a major, so an experimental build is never overridden by an older release line. The client is told to list the tools again. A successful call notes both versions once a session, and every failed call carries the note, with the pinned fix `npx lowdefy@<dev server version> agent-setup` for the agent to pass to the developer rather than run. A dev server `lowdefy mcp` cannot reach is reported with its URL.

- 3a28594: chore!: Node.js 24 is now the minimum supported version.

  **Breaking:** Lowdefy no longer supports Node.js 22. Upgrade to Node.js 24 or newer before
  upgrading Lowdefy.

  - The CLI and the servers declare `"node": ">=24"` in `engines`, and the CLI refuses to start on
    a Node.js version below 24.
  - `lowdefy init-docker` generates a Dockerfile on `node:24-slim`. Apps with a Dockerfile generated
    by an earlier version should change their `FROM node:22-slim` lines to `node:24-slim`.
  - The Vercel build output declares the `nodejs24.x` function runtime, and the README that
    `lowdefy init-vercel` writes lists the Node.js 24 project setting the install and build steps need.

- c1bb9a0: feat(build)!: `_operator` with a name chosen at runtime lists the operators it may call.

  **Breaking:** an `_operator` whose `name` is read at runtime (from state, a request, a payload or `__args`) now fails the build unless it lists the operators it may call in `operators`:

  ```yaml
  _operator:
    name:
      _state: aggregation
    operators:
      - _sum
      - _product
    params:
      _state: values
  ```

  The build bundles exactly the listed operators with the page (or the server), so the call works on a direct page load in production as it does in development, and `_operator` refuses any name not in the list. A listed operator allows all its methods; a listed method (`_number.round`) allows only that method. A literal `name`, and the literal branches an `_if` or `_switch` returns, need no list.

  The `_operator` docs name the property `name`; they showed `operator:` before.

  `_operator` also refuses a name with a method on `_operator` itself (`_operator.anything`), which would call it again with a name read at runtime and no list.

- 5060cdf: feat: `_if` without `test` fails the build

  `@lowdefy/operators-js` ships its first build check rule, `if-test`. An `_if` whose params are an object without a `test` key, such as `_if: { _eq: [1, 1], then: a, else: b }`, now fails the build with the file and line instead of failing at runtime with "\_if takes a boolean type for parameter test". Params that are one operator, such as `_if: { _state: ifParams }`, still pass. Silence it on a node with `~ignoreBuildChecks: [if-test]`.

- b368cfe: docs: page paths and path parameters

  A new Page Paths concept page covers the page `path` field: placeholders, quoting a path that starts with one, module prefixes, the home, auth and `404` page rules, how URLs are matched to pages and when two paths tie, the values other addresses take first, page instances, the security note and the build errors. A new `_path_params` operator page documents reading the values. `pathParams` is documented next to `urlQuery` on the `Link` action, the auth actions' callback targets, menu links, HTML `data-path-params` links, table and grid links, notification links, Dynamic page content payloads, agents and the `_js` and action plugin methods. The agent docs content is regenerated.

- aa6bb38: feat(api)!: A declared `payloadSchema` is now enforced on every caller.

  **Breaking:** a caller that sends a payload outside an endpoint's `payloadSchema` is now refused
  before the routine runs. Until now the schema was only advertised to MCP clients and agents, and
  nothing checked a payload against it. This is a major bump for `@lowdefy/api` and `@lowdefy/build`
  because apps whose callers relied on the schema not being checked will see those calls fail.

  Every payload is validated on every call path, and a non-conforming one is refused. Who built
  the payload decides how the refusal is reported:

  - **An outside caller's payload** is the caller's mistake, a `UserError` logged at warn level and
    never captured to Sentry. REST (`POST /api/endpoints/<endpointId>` without naming a page)
    answers `400` with `{ name: 'UserError', message }`; MCP `tools/call` answers `isError: true`
    carrying the message, and agent tool calls get it as a tool error, so the model can retry.
  - **A payload the app's own config built** (a page's `CallAPI`, a nested or detached `CallApi`
    step, a Dynamic block's endpoint, an auth or agent hook, a scheduled run's `schedule.payload`)
    breaks the endpoint's own contract, so the refusal is a `ConfigError`, logged as a server error
    with its config location. A page's `CallAPI` fails with `_error.name: ConfigError` (outside
    development with the generic server error message), a nested `CallApi` reaches the routine's
    `:catch` as a `ConfigError`, and a detached target or scheduled run fails its run.

  The message names the endpoint, the failing location and what would be accepted, e.g.

  - `Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.`
  - `... at /status: must be equal to one of the allowed values (draft, placed).`
  - `... at (root): must NOT have additional properties (colour).`
  - `... at /slug: must match pattern "^[a-z0-9-]+$".`

  When a location fails both its `type` and one of `enum`, `pattern`, `required` or
  `additionalProperties`, that keyword is reported.

  There is no opt-out: the way to not validate is to not declare a `payloadSchema`. The build now fails
  when an endpoint declares both `webhook` and `payloadSchema`, since a webhook routine receives the
  `{ body, query, headers }` envelope rather than the schema's shape.

  `cleanBuildArtifact` (strips `~k`/`~r`/`~l` markers and unwraps `~arr`) moves into
  `@lowdefy/helpers`, replacing the private copies in `@lowdefy/api` and `@lowdefy/ai-utils`.

- 94fc9e0: feat: `~ignoreBuildChecks` takes plugin rule slugs, and build errors print their slug

  - `~ignoreBuildChecks` accepts any kebab-case slug, so it can name plugin build check rules, and `plugin-checks` silences every plugin rule under a node. A slug that is not kebab-case still fails the build.
  - A build error or warning from a check prints its slug after the error name, for example `[ConfigWarning · state-refs] ...`, so the slug to silence is on screen.
  - The `~ignoreBuildChecks` schema accepts every built-in slug wherever the key is allowed. It listed only 8 of the 15 before.

- 2755501: feat: The build checks block properties, action params and operator params against their plugin schemas

  - After refs resolve, every block's `properties`, action's `params` and operator's params is validated against the schema its plugin ships. A finding is a warning with the type, the field, and the file and line of the field: `[ConfigWarning · plugin-schema] Block "Button" property "colr" is not allowed.`
  - A value an operator gives at runtime is not judged. A missing required key or a misspelt key still reports, even beside operators.
  - `~ignoreBuildChecks: [plugin-schema]` silences the check on a node, and `plugin-checks` and `--skip-plugin-checks` cover it. A plugin makes its schema findings errors with `schemaLevel: 'error'` in its `./checks` export.
  - `@lowdefy/ajv` exports `getConfigSchemaErrors` and `formatSchemaError`. Dynamic pages validate block properties with the same function, so a `oneOf` above an operator no longer reports at runtime.
  - The `Validate` and `ResetValidation` schemas accept `true` and the `{ blockIds, regex }` form the actions already take.

- 99fcb06: Document `:reject` vs `:throw` semantics in API routines: `:reject` is a reply, not an exception; `:try`/`:catch` never catches it, while `:finally` still runs. Use `:throw` for failures a `:catch` should handle. The `:try`, `:reject` and `:throw` docs pages and the API concepts page now state the rule, and the routine control types carry a `description` for tools to quote.
- 06a3a4a: feat(api)!: RenderNotification's landingPage names the page by id

  **Breaking:** `properties.landingPage` is now a page id (or `{ pageId, pathParams }`) instead of a page path. Change `landingPage: /notifications/link` to the landing page's id, for example `landingPage: notifications-link`. A value that names no page, such as a path, fails the step with a `ConfigError` that says to pass the page id.

  The step builds the landing URL path from the route table with `buildPagePath`, like every other notification link, so a landing page with a `path` gets the right URL.

- 588ca93: The build warns when `config.requestTimeout` is not shorter than the Vercel function's `maxDuration`.

  Vercel stops the function at `config.vercel.maxDuration` (60 seconds by default), so a request timeout that is not shorter never answers, and the calls a request left running, such as an AI model call, are not cancelled. The warning applies when the app sets `config.vercel` or the build runs on Vercel.

  The Vercel deployment and AI request docs also note that on Vercel only the request timeout cancels a model call: a client disconnect does not.

- 493a1e6: feat(dev): `lowdefy_screenshot_page` can capture an open dropdown, a date picker's calendar or a modal, and a page opened at a query string.

  - New `steps` option runs interactions after the page settles and before the capture, addressed by block id — the same steps as `lowdefy_run_journey`. A new `{ "open": "blockId" }` step opens the popup of any input (Selector, MultipleSelector, AutoComplete, DateSelector and the other pickers, Cascader, TreeSelector) and waits for it to show. Popups are drawn at the end of the page, so `fullPage` and `clip` captures include them. If a step fails, the screenshot is still returned, showing where it stopped, together with the failure.
  - New `urlQuery` option opens the page with query params, for pages that read `_url_query`.
  - `open` is also a journey step for `lowdefy_run_journey` and `lowdefy test`.

- effdeb3: Journey steps can reach controls that are not blocks. Wherever `click`, `fill`, `select`, `expect.visible` and `expect.text` take a `blockId`, they also take a target object: `{ blockId, row, column }` narrows to a grid row (zero-based, as displayed) or cell (by col-id), `text` names the interactive control with exactly that visible text, and `nth` picks among several matches. `text` on its own searches the page front-most layer first — an open dropdown menu, then an open dialog, then the page — so a confirm dialog's `Delete` is clicked over the grid's `Delete` cell buttons behind its mask. This makes grid cell buttons, confirm dialogs, modal footers and menu items addressable by `lowdefy_run_journey`, `POST /lowdefy-docs/journey` and `lowdefy test`. Unknown target keys are rejected before a browser opens, and a failed step names the target the way it was written (`block "grid" row 1 control "Edit" to be actionable`).

  A `click`, `open`, `fill` or `select` whose `text` or `containing` target has no `nth` must match exactly one visible element, or the step fails and says how to narrow it:

  ```
  Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.
  ```

  Expectations do not need one match: `expect.visible` passes when any match is visible and `expect.hidden` when none is.

- cac0798: A rate-limited request (HTTP 429) is a `ServiceError` on every connection, not a `RequestError`.

  `ServiceError.isServiceError` treats a 429 like a 5xx: an external condition that passes with time, not a config fault. It reads the status where client libraries put it (`statusCode`, `status`, `response.status`, the AWS SDK's `$metadata.httpStatusCode`, or a numeric `code`), follows a retrying client's last error and the `cause` chain, and also counts AWS SDK throttling exceptions and timeouts (`TimeoutError`). The `ServiceError` reports the status as `statusCode` and keeps the service's `Retry-After` as `retryAfter`, which the server log records.

  A `:catch` or a client `catch` that checked for `RequestError` on a 429 now sees `ServiceError`. `_error: statusCode` is `429` in both cases.

- 99c9dac: feat: `lowdefy build` and `lowdefy dev` build again to run newly installed plugins' rules, and `--skip-plugin-checks` skips plugin rules for one run

  - When a build uses a plugin that is not installed yet, its build check rules cannot run. `lowdefy build` and `lowdefy dev` now install the plugin and run the Lowdefy build once more, so its rules run on a fresh checkout or CI run. The second build runs only when a newly installed plugin owns a block, action or operator type or ships `./checks`. The Vite client build still runs once.
  - An unknown `~ignoreBuildChecks` slug is a warning while some plugin's rules are not installed, and an error once every rule is known.
  - `--skip-plugin-checks` on `lowdefy build`, `lowdefy dev` and `lowdefy journeys scope` skips every plugin build check rule for that run, and each build logs a warning that they were skipped. No second build runs for newly installed plugins. Built-in build checks still run. Use it while a fix ships for a plugin rule that is wrong or too strict.

- 7623c86: The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

  - Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
  - On Vercel the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
  - The production request and error logs record the resolved address as `client_address`.
  - `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
  - In `lowdefy test` journeys, each actor keeps its own client address.

- 7ab8964: fix(server): The server imports a Sentry SDK only when `SENTRY_DSN` is set and `logger.sentry.server` is not `false`, which takes about 100 ms off the start of an app that does not use Sentry. The Node server traces requests by default; the new `logger.sentry.serverTracing: false` makes it report errors only.
- 712d6ef: fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

  - **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. On Vercel it reports errors only, with Sentry's light SDK (`@sentry/node-core/light`: no tracing, OpenTelemetry set-up or module loader hooks, which would add about 300 ms and 130 MB to each cold start), and with client reports off. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel. The flush of queued events starts once the response closes and is handed to Vercel's `waitUntil`, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload. Without `SENTRY_DSN` nothing changes.
  - **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

  Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.

- 4b3f5bd: feat: Webhook verifiers get the raw request body as `rawBody`.

  A webhook endpoint's `verify` request now receives `{ body, rawBody, query, headers }`, where `rawBody` is the request body exactly as received, as a string. Senders such as GitHub (`X-Hub-Signature-256`), Stripe and Slack sign the exact bytes they post, which serialising the parsed `body` again does not reproduce, so a signature check reads `_payload: rawBody`. A body that is not JSON reaches the verifier as `rawBody` too. `rawBody` is given only to the verifier: the routine's payload stays `{ body, query, headers }`.

- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

  - @lowdefy/nunjucks@7.0.0

## 6.1.0

### Patch Changes

- 6d6f8fa: feat: add the `_error` operator, which reads the error being handled.

  - **Inside a server `:catch`**, `_error` returns the error that sent the routine there: its `name`, real `message`, `code`, `statusCode` and `cause` chain. Values of the app's secrets in the message are replaced with `[REDACTED]`. It resolves to the innermost `:catch`, a `:finally` reads the error of the `:catch` around its `:try`, and each `:parallel` branch reads its own. A routine can now branch on the failure:

    ```yaml
    - :try:
        - id: get_customer
          type: AxiosHttp
          connectionId: crm
          properties:
            url: /customers
      :catch:
        - :if:
            _eq: [{ _error: statusCode }, 404]
          :then:
            - :reject: Customer not found
        - :throw: Customer lookup failed
    ```

  - **Inside a client `catch` action list**, `_error` returns the error that sent the event there. An error from the server keeps its `code` and `statusCode`, so a page can branch on a failed `Request` without an endpoint.
  - **Outside a catch**, `_error` returns `null`.
  - **`:throw` and `:reject` accept an Error as their message.** `:throw: { _error: true }` rethrows the caught error, keeping its class, `code` and `statusCode`; `:reject: { _error: true }` rejects with its message as the user would see it. Use `{ _error: message }` to send the real message to the user.
  - `code` and `statusCode` are read the same way for every connection: `code` is the error's own `code`, and `statusCode` the first number among its `statusCode`, `status` and `response.status`. A request error now carries both from the error its connection threw, and AxiosHttp sets both on a non-2xx response.

## 6.0.0

### Minor Changes

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

### Patch Changes

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

- 46029df: feat(blocks-antd): Add `presets` to the date picker blocks.

  `DateRangeSelector`, `DateSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector` accept a
  `presets` array that renders quick select shortcuts next to the calendar, like antd's
  [preset ranges](https://ant.design/components/date-picker#date-picker-demo-preset-ranges).

  A preset is a `label` (supports html) and a `value`. `DateRangeSelector` takes a `[from, to]` pair,
  the other blocks take a single date. Values are dates — a date string, a timestamp, or a `_date`
  object — so relative shortcuts are built with the existing operators, and are re-evaluated on every
  render instead of being frozen at page load:

  ```yaml
  - id: report_period
    type: DateRangeSelector
    properties:
      presets:
        - label: Last 7 Days
          value:
            - _dayjs: [now, { subtract: [7, days] }, { format: YYYY-MM-DD }]
            - _dayjs: [now, { format: YYYY-MM-DD }]
        - label: Month to date
          value:
            - _dayjs: [now, { startOf: month }, { format: YYYY-MM-DD }]
            - _dayjs: [now, { format: YYYY-MM-DD }]
        - label: 2026 Q1
          value: ['2026-01-01', '2026-03-31']
  ```

  The date pickers read a preset as UTC, the same as the block value, so a fixed date like
  `2026-01-01` selects the day it names in every timezone. A date relative to now is an instant rather
  than a calendar date, so end a `_dayjs` chain with a `format` step, as above — a chain that resolves
  to an instant can select the day, month or week before or after the current one, depending on the
  browser timezone and the time of day.

  `DateTimeSelector` selects an instant, so `_date: now` and plain `_dayjs` chains are all it needs. It
  follows its `selectUTC` setting: with it the instant is shown on the UTC clock, without it on the
  local clock.

  Presets respect `disabledDates`. A preset is offered on the same terms as the calendar cells: a
  `DateRangeSelector` range that starts or ends on a disabled date is narrowed to the dates it may
  select, so a `Last 7 days` shortcut next to `disabledDates.min: now` selects today rather than
  silently doing nothing. A shortcut with nothing it may select is listed as disabled.

- 16fdeb8: fix(client): Make the `Link` action honour `href`.

  `createLink` routes `href` to `newOriginLink`, but the action's `newOriginLink` in
  `setupLink.js` only ever read `url` — so `{ type: Link, params: { href: '/some/path' } }`
  navigated to the literal string `"undefined"`. The anchor renderer used for `Link` blocks
  (`createLinkComponent.js`) already prefers `href` over `url`; this brings the action to the
  same precedence, and `href` is used verbatim: no protocol added, no `urlQuery` appended.

  That verbatim handling is the point of having the parameter at all. `url` means an external
  address and gains an `https://` prefix when the value has no scheme, which turns a
  root-relative `/reports?id=1` into a request for a host named `reports`. `href` is how you
  link to a same-origin path, a fragment, or any address that must be passed through as
  written — so the fix removes the need to work around `url`'s prefixing.

  `href` was also missing from the `Link` action docs, which is presumably how the gap went
  unnoticed. Documented alongside the fix.
