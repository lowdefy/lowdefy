# Change Log

## 7.2.0

### Patch Changes

- 163905d: fix(operators-js): `_base64` in the browser encodes and decodes UTF-8 text

  `_base64.encode` and `_base64.decode` in the browser now read and write the UTF-8 bytes of a string, like the server and `_build` versions. Before, the browser used Latin-1: text with an accented letter encoded to a different value than on the server, decoding server-encoded text gave garbled characters, and text such as emoji or Chinese threw an `Invalid character` error. `_base64.decode` in the browser also accepts base64url and unpadded input, as the server does. Other characters outside the base64 alphabet still throw in the browser, where the server ignores them.

  ASCII text encodes and decodes as before. Non-ASCII text that an earlier version encoded in the browser is Latin-1, not UTF-8, so `_base64.decode` in the browser now throws an error for it instead of returning the original text. Re-encode stored values like these. Base64 of bytes that are not UTF-8 text, such as binary files, also throws in the browser, where the server replaces the invalid bytes with U+FFFD.

- ba2ab81: fix(operators-js): `_media` works in a tab that has no width yet

  A page that loads in a hidden or background browser tab reports a window width of 0 until the tab is shown. `_media` treated that as having no window and threw "device window width not available for \_media." for every key, `darkMode` included, so an `_if` on `_media: darkMode` (like the auth page cover in modules-mongodb's layout module) logged two errors and fell back to nothing. `_media` now returns its values at width 0, with size `xs`, and blocks that read the width update when the tab is shown. It still throws where there is no browser window at all.

- 3af2019: fix(api, servers, connection-mongodb): Server errors are classified, located and logged the same way everywhere

  Every server site that tells an expected outcome from a fault now asks `isExpectedError`, so an auth refusal or a `UserError` is one warn line on every path: a nested `CallApi`, a websocket frame, a background run, an optional Dynamic block, an MCP tool call and the server error handlers. Faults reach a `handleError` sink instead of a raw `logger.error`: a background, detached or forwarded-cron run that fails, an optional Dynamic block that falls back, an unwalled connection that reaches walled data, an MCP `afterToolCall` hook that fails before its routine runs, an auth email send, and an auth engine error, which goes to a system context's sink. A detached `CallApi` whose dispatch `/api/detached` does not accept is now a fault rather than a completed dispatch. The request context is set before authentication runs, so a fault there is logged with the request id.

  The prod log and Sentry no longer carry `received`, an operator's or control's evaluated input. BetterAuth's own log lines carry an error under `err` and name other values by type only. A connection error that is already typed leaves a request with the step's ids and its cause summarised, and a websocket source's failure is wrapped like a request's, without its evaluated properties. An auth hook that returns a non-object names its type, not the record.

  A MongoDB error that refuses the request (a duplicate key, a malformed pipeline, a missing permission or collection) is now a `RequestError` with the same `code` and `hint`; only a time or memory limit stays a `ServiceError`. A failed unique index build at auth startup names the index and code instead of quoting the duplicate values.

  Config faults carry their config location: endpoint control errors (`:for`, `:while`, `:if`, `:switch`, `:parallel_for`, `:log`) are `ConfigError`s at the control, and the detached `CRON_SECRET` check, cron forwarding, the auth secret, the invitation sender and the auth email connection name theirs. An auth hook's `:throw` now refuses the write with a 400 instead of a 500.

  On the server, `_log` writes an info line through the request's logger instead of `console.log`, so secrets and values marked with `_credential` are removed from it like from every other log line. In the browser it still logs to the console.

- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [bb7c249]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [3af2019]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/operators@7.2.0

## 7.1.0

### Patch Changes

- @lowdefy/operators@7.1.0
- @lowdefy/errors@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Major Changes

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

### Minor Changes

- 08d8938: feat(api): Tool endpoints read the files attached in an agent chat with `_agent: files`

  An `AgentChat` file uploaded through `uploadPolicyRequestId` now keeps its storage key on its message part, as `providerMetadata: { lowdefy: { key } }`, so saved conversations and `onFinish` hooks hold it beside the signed link. `_agent: files` gives a tool endpoint, and the endpoints it calls with `CallApi`, the files of every message the chat request carried, as `[{ key, filename, mediaType }]`; it is `[]` under a `CallAgent` step. The model gets a line naming each file before it (`Attached file: screenshot.png`), so it can pass the name to a tool, and the storage key is not sent to the model. The saved messages are unchanged. The files come from the person's own chat request, so a tool should look a file up by name in `_agent: files` and check that the key is one the caller may read before reading it.

- b3ba6fb: feat: Tool endpoints know the calling agent with the `_agent` operator

  - **`_agent` server operator.** `_agent: id` returns the id of the agent that called the endpoint as a tool or hook, `_agent: conversationId` the chat's conversation id, and `_agent: true` both as `{ id, conversationId }`. On a call that did not come from an agent (a page request, an MCP tool call, a scheduled, webhook or auth hook run), it returns `null`, or the `default` when one is given, and never throws.
  - **Set by the engine, not the model.** The agent runtime puts the running agent on the tool endpoint's routine. Nothing in the tool's payload or the chat request can set or change it, so an app can record agent work apart from a person's.
  - **Inherited by nested calls.** Endpoints a tool endpoint calls through `CallApi` (including `detached: true`) or a connection's `callApi` see the same agent.
  - **Headless agents.** Tools an agent run by a `CallAgent` routine step calls see the agent with `conversationId: null`.

- aad166b: feat(api): `_agent: sharedState` gives an agent's tool endpoint the chat's shared state

  A tool endpoint an agent calls can now read the shared state the `AgentChat` block sent with the message, for example the page or browser details an app puts there, with `_agent: sharedState`. The tool reads it from the chat instead of from its input, which the model writes. It is `null` for an agent run by a `CallAgent` step.

- badaa49: Pages re-evaluate only the blocks whose inputs changed.

  Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

  - Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
  - `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
  - Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.

- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- 856e65d: feat: The `_hmac` server operator signs a string with a key

  `_hmac.sha256: { key, data }` returns the lower-case hex HMAC-SHA256 of `data` under `key`, and `_hmac.sha512` the HMAC-SHA512. Both read `key` and `data` as UTF-8 strings. Like `_hash`, it runs only on the server, so a `_secret` key never reaches the browser. The output of one call works as the `key` of the next, so a routine can derive a per-app secret from one root secret and sign a webhook body with it. A `_hmac` refusal is a config error reported without the operator's params, so a derived `key` is never logged.

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

- 409c918: feat(operators-js): Add push, unshift, pop, shift, at, findLast, findLastIndex, flatMap and from to `_array`

  `_array` gains the array methods that were missing:

  - `_array.push` and `_array.unshift` add items to the end or start of an array.
  - `_array.pop` and `_array.shift` remove the last or first item.
  - `_array.at` returns the item at an index, with negative indices counting back from the end (`-1` is the last item).
  - `_array.findLast`, `_array.findLastIndex` and `_array.flatMap` work like their JavaScript counterparts.
  - `_array.from` creates a new array from an array, a string, or `{ length: n }`, with an optional callback that receives each item and its index. For example `_array.from: { on: { length: 3 }, callback: { _function: { __args: 1 } } }` gives `[0, 1, 2]`, and it can be combined with `_array.fill` to repeat a value.

  Like `_array.splice`, the methods that change an array (`push`, `unshift`, `pop`, `shift`) return the changed array rather than JavaScript's new length or removed item. Closes #1315.

- 5060cdf: feat: `_if` without `test` fails the build

  `@lowdefy/operators-js` ships its first build check rule, `if-test`. An `_if` whose params are an object without a `test` key, such as `_if: { _eq: [1, 1], then: a, else: b }`, now fails the build with the file and line instead of failing at runtime with "\_if takes a boolean type for parameter test". Params that are one operator, such as `_if: { _state: ifParams }`, still pass. Silence it on a node with `~ignoreBuildChecks: [if-test]`.

- 1f58d7f: Pages read their path values with the `_path_params` operator (the same `key` / `all` / `default` arguments as `_url_query`, values always strings), and `_js` functions read them with a `pathParams` accessor. The `Link` action and the auth actions' callback targets (`Login`, `Logout`, `SignUp`, `EmailOtpVerify`, `MagicLinkVerify`, `PhoneNumberVerify`, `TwoFactorVerify`, `SendVerificationEmail`, `PasskeySignIn`) accept `pathParams` next to `urlQuery`.
- 5017abe: feat: `_media` updates when the browser window is resized

  Blocks that use `_media` now re-evaluate when the window is resized, so `_media` can drive responsive `visible` conditions and properties the way CSS breakpoints do. The page keeps one resize listener, shared with the `onResize` event, and waits until the resize settles (150ms) before doing any work. Only blocks that read a `media` value that changed are re-evaluated: a block that reads `_media: size` updates when the window crosses a breakpoint, not on every pixel of a resize, and blocks that do not use `_media` are never touched. Blocks reading `_media` are also no longer re-evaluated on every unrelated page update.

  The `onResize` page event is now debounced by 150ms (was 200ms), and runs after `_media` blocks have been updated for the new size.

  Fixes #799.

- 26d905c: `_type` gains an `empty` test: `{ _type: { type: 'empty', on: value } }` is true for `null`, `undefined`, `''`, `[]` and `{}`.

### Patch Changes

- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- 550be9f: feat(api,client,build): email one-time code sign-in, and the magic-link email carries the code

  Magic-link sign-in fails behind corporate mail security that opens links before the
  person does: the scanner follows the link, the single-use token is spent, and the
  click that follows is rejected. Apps can now offer a one-time code instead. Enable
  `auth.emailOTP` and the app emails a short code the person types into the tab they
  started from, which no link scanner can consume, and which also works when the email
  is read on a different device from the one signing in. Two new actions drive it,
  `EmailOtpSend` and `EmailOtpVerify`.

  With both `auth.magicLink` and `auth.emailOTP` enabled, the magic-link email carries
  the code as well, so one email serves both paths and nothing about the existing
  `Login` flow changes: the person clicks the button, or falls back to typing the code.

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

- 6b4bd99: Runtime errors reach the agent feedback channel with their config source.

  - The dev server now collects server-side failures — request, endpoint, MCP and agent tool errors — into a ring buffer surfaced as `serverErrors` in `GET /lowdefy-docs/build-status` and the `lowdefy_build_status` MCP tool, beside `clientErrors`. Each entry carries the resolved yaml `source` and `config` path, plus `endpointId`, `requestId` and `pageId` where known (page request failures name the request).
  - MCP tool errors carry their config source (` (at file.yaml:line)`) and hint in dev. Unexpected tool-call failures now go through the server's error sink so they are logged with their source. Production keeps returning the bare message.
  - `_js` execution errors report the original JavaScript error (`ReferenceError: x is not defined`) instead of pasting the whole function source into the message.

- b226c43: fix: Classify expected outcomes and faults consistently across the v7 runtime and build.

  A sign-in the auth server rejects - a wrong password, an expired or already-used link, a stale
  OAuth authorization query - was reported as an `ActionError`: logged in the browser, posted to
  `/api/client-error`, and logged again on the server at error level against the action's config
  location, while BetterAuth itself logged every 4xx as `ERROR [Better Auth]`. These are expected
  outcomes of user interaction, not app faults. Auth client methods now throw a `UserError` for a
  4xx (with `metaData.code` / `metaData.status` for `catch` actions to branch on), and the server
  owns BetterAuth's API-error logging so a rejected attempt is one warn line.

  The same rule was applied across the code new in v7:

  - New `AuthorizationError` (403): an authenticated caller refused by a request, endpoint, agent,
    websocket or auth-step gate is one warn line and a 403, not a `ConfigError` logged at error
    level with a 500 and a Sentry event. The agent and websocket gates now also return 401 to an
    unauthenticated caller. All three servers handle `AuthenticationError`,
    `TwoFactorEnrolmentRequiredError` and `AuthorizationError` the same way; `server` no longer
    reports each fault to Sentry twice.
  - A wrong HTTP method on an API route is a 405, not an error-level log and a 500.
  - Routine `:throw`, schema validation failures and a nested `CallApi` that ended in `:throw` are
    `UserError`s logged at warn, not error.
  - Config faults that were plain `Error`s are `ConfigError`s (unconfigured auth, mock user without
    auth, missing `auth.email`, unknown block type, ambiguous link targets, strategy secrets,
    tenant-wall refusals, storage post-policy fields, `_organization` / `_build.authConfig`
    misuse); invariant violations are `LowdefyInternalError`s (write-phase artifact checks, invalid
    routine, auth adapter contract); upstream failures are `ServiceError`s (websocket transport,
    JWKS fetch, BetterAuth 5xx, tenant preflight probes, SMTP only when the network failed).
    `ServiceError.isServiceError` also recognises AWS SDK `$metadata.httpStatusCode` and numeric
    5xx codes.
  - Build: agents, MCP endpoints, notifications, websockets, `CallAgent` / `RenderNotification`
    step references and organization client-action references collect every error instead of
    stopping at the first; `websocket-refs`, `dynamic-endpoint-refs`, `callapi-refs`,
    `callapi-internal-refs` and `icons` are valid `~ignoreBuildChecks` slugs; a plugin module that
    resolves but fails to load is reported instead of surfacing later as an unknown type (a plugin
    without an optional subpath such as `schemas` is not a failure); the deprecated
    `public/styles.less` check runs as a validation step rather than failing the write phase.
  - Errors revived from the wire keep their class for the auth gate errors, and the dev client
    revives serialized Lowdefy errors instead of flattening them to their message.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- Updated dependencies [b3ba6fb]
- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [81a5ad3]
- Updated dependencies [91740e6]
- Updated dependencies [2595439]
- Updated dependencies [badaa49]
- Updated dependencies [f9e483f]
- Updated dependencies [d2c8e01]
- Updated dependencies [f889c26]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [959ec32]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [1f58d7f]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [5017abe]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
  - @lowdefy/operators@7.0.0
  - @lowdefy/helpers@7.0.0
  - @lowdefy/errors@7.0.0

## 6.1.0

### Minor Changes

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

### Patch Changes

- 1bbaab7: fix(operators-js): `_function` bodies in API routines can read routine state again. Since 5.4.0 routine state is passed to each parse call instead of being held on the server parser, but `_function` did not forward it, so `__state` resolved to `null` inside the function body. `_function` now forwards `state`, and also `items`, so `__item` works inside a `_function` within a `:for` loop.
- 5657441: fix: API routine steps now evaluate operators against the full routine frame.

  - `ValidateSchema` step properties can read routine state. `_state` in a `ValidateSchema` step resolved to `null`.
  - Connection properties can read the loop item. `_item` in a connection's properties inside a `:for` or `:parallel_for` loop resolved to `null`.
  - `$` in `_state`, `_step`, `_payload` and `_item` paths inside a `:for` or `:parallel_for` loop now resolves to the current loop index, as it does for list blocks on the client. For example, `_step: fetch.$.id` reads the current iteration's `fetch` result.
  - Operators that evaluate nested config, such as `_function`, now receive a parser bound to the calling frame. `_function` bodies no longer depend on `_function` forwarding each frame field, so a nested `__function` keeps routine state, items and loop indices.

- 2b2b27a: fix(build,server,operators-js): an open tab reloads once after a deploy instead of failing with "\_js function not found"

  Every build now stamps a random `buildId` on the app metadata (readable as
  `_app: buildId`). The production server sends it with each page config fetched
  during in-app navigation, and the client bundle carries the id of the build it
  was made from. When they differ, the tab has a bundle from an earlier deploy
  whose `_js` map and plugin set no longer match the config the server is
  serving, so the client does one full reload of the requested page to pick up
  the current bundle. A tab reloads at most once per server build, so a rolling
  deploy answering from mixed versions cannot loop. The `_js function not found`
  error also now says that the page may be running an older bundle and should be
  reloaded.

- Updated dependencies [6d6f8fa]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
  - @lowdefy/operators@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/errors@6.1.0

## 6.0.0

### Minor Changes

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

- Updated dependencies [60401aa]
- Updated dependencies [37c8c14]
- Updated dependencies [efd1967]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
- Updated dependencies [982a3db]
  - @lowdefy/operators@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 824f4be: fix(helpers): Dot paths resolve own properties only, and prefer a nested match to a literal dotted key.

  A key that contains dots still resolves without escaping, at every depth. `_url_query:
my_object.subfield` against `?my_object.subfield=x` reads as before, and a JWT `claimMapping` of
  `resource_access.com.example.api.roles` against `{ resource_access: { 'com.example.api': { roles:
['admin'] } } }` still returns `['admin']`. **No path needs a `\.` added unless a plain key or a
  shorter dotted key overlaps the dotted key it resolves through; where one does, escaping is now the
  way — see below.**
  What changed is how ties and misses resolve: `get`, `set` and `unset` now walk the path in a single
  forward pass, look only at own properties, and no longer try the whole path as one key ahead of the
  walk. The accepted breaks:

  **A nested match now wins over a literal dotted key.** With both present,
  `get({ a: { b: 2 }, 'a.b': 1 }, 'a.b')` was `1` and is now `2`, and `unset` deletes the nested `b`
  rather than the literal `'a.b'` key. A present segment also blocks the join even when it cannot be
  descended: `get({ a: 1, 'a.b': 2 }, 'a.b')` was `2` and is now the default. Where two dotted keys
  overlap the shorter one wins: `get({ 'a.b': {}, 'a.b.c': 1 }, 'a.b.c')` was `1` and is now the
  default. Escaping (`a\.b`) is the way to address a literal dotted key past a nested match.

  **Reads and writes see own properties only, never anything inherited from a prototype.** A data
  operator whose key was `toString`, `valueOf` or `hasOwnProperty` used to reach the built-in
  `Object.prototype` function and then fail while copying it, raising `SyntaxError: "undefined" is not
valid JSON`; `_state: toString` now returns the operator default instead. Writes were worse off:
  `SetState: { 'toString.x': 1 }` wrote `x` onto `Object.prototype.toString` — making `x` readable on
  every object in the process — and left state untouched. It now writes `{ toString: { x: 1 } }` into
  state, as asked. Own-only applies to every prototype, not just `Object.prototype`, so any value
  reached through an inherited accessor is now unreachable — the realistic case being a class getter.
  Given a `Thing` class whose `derived` getter returns `'g'`, `get({ t: new Thing() }, 't.derived')` was
  `'g'` and is now the default. YAML config holds no class instances, so that shape reaches a path only
  from a custom plugin or connection.

  **A path no longer steps _through_ a function value.** Given an `f` carrying an `f.z` of `3`,
  `get({ f }, 'f.z')` was `3` and is now the default. Config data holds no functions, so this is
  reachable only from a custom plugin.

  **`get` no longer accepts `separator`, `split`, `join` or `isValid`, and paths must be strings.**
  `get({ a: { b: 1 } }, 'a/b', { separator: '/' })` was `1` and is now the default, and `isValid` is
  ignored rather than consulted. Array paths are gone from all three helpers:
  `get({ a: { b: 1 } }, ['a', 'b'])` was `1` and is now the default, `set({}, ['a', 'b'], 1)` wrote
  `{ a: { b: 1 } }` and is now a no-op, and `unset(obj, ['a', 'b'])` threw a `TypeError` and is now a
  no-op. Nothing in Lowdefy passed any of these, so this too is a custom-plugin concern. (`set`'s
  `options` parameter is removed outright — see its own entry.)

  **`unset` no longer skips a delete because the value looks empty, and no longer throws on a dotted
  key at depth.** Hiding a block clears its state field, so both are reachable from config. A hidden
  _nested_ block whose value was an empty string or `undefined` used to keep its field —
  `unset({ parent: { child: '' } }, 'parent.child')` left `child` in place and now removes it — so a
  cleared, hidden input no longer leaves a stale key behind in `_state`. The same applied to an empty
  `Map` or `Set`, an empty-source `RegExp`, and a blank-message `Error`. And a block id written with an
  escaped dot used to crash the delete: `unset({ 'a.b': { c: 1 } }, 'a\.b.c')` threw
  `TypeError: Cannot read properties of undefined` and now deletes `c`.

  **The dot-path escape grammar now covers the backslash itself.** `\.` remains a literal dot and `\\`
  is now a literal backslash, so `joinPath` can escape a segment that ends in a backslash — before, it
  only escaped dots, and `joinPath(['a\\', 'b'])` produced a path `splitPath` read back as the single
  key `a.b`. Any other backslash is still an ordinary character, so a key such as `a\b` needs no
  escaping. The one observable change is a doubled backslash directly before a dot:
  `splitPath('a\\\\.b')` used to yield `['a\\.b']` and now yields `['a\\', 'b']`.

- 3ead269: fix(operators): Read fields inside an error value by dot path.

  Dot-path reads stopped at an error, so a field on it silently returned the operator default even
  though the value was there. Mapping a sign-in failure to a friendly message with `_actions:
login.error.cause.code` always fell through to the default branch; it now reads the code.
  `_actions: login.error.message` was the default and now returns the message.

  Errors are the only kind of value this opens up. `Date`, `URL`, `Map`, `Set`, `RegExp`, `Promise`,
  `Buffer` and typed arrays are still not traversable — a path into one returns the default, exactly
  as before — and a class instance's own fields were already readable, so nothing changed there.

  A lookup on an error reads the error's serializable form, which brings that form's limits with it:

  - An own field holding a class instance or a function arrives as a marker string —
    `'[Object: Socket]'`, `'[Function: handler]'` — not as a live object.
  - The `cause` chain resolves three levels. `_actions: x.error.cause.cause.cause.message` reads; a
    fourth `cause` is the literal string `'[Truncated]'`. Lowdefy's own wrap (`ActionError` →
    `RequestError` → `ServiceError` → driver error) fits inside that.
  - A non-enumerable own property is not readable. `AggregateError`'s `errors` array is
    non-enumerable, so `_actions: x.error.errors` returns the default.

  An error that is the _end_ of the path is unchanged — `_actions: x.error` still hands over the error
  itself, not its extracted form. This entry only adds readable values; for the reads that this
  release does change, see the dot-path resolution entry.

  Also in this release, `@lowdefy/helpers`' `type` utility identifies `Date` and `Error` with
  `instanceof` rather than duck-typing, so a `Date` or `Error` constructed in another JavaScript realm
  (a `vm` context, iframe, or worker) is no longer detected as one; `type.isRegExp` is unchanged and
  still detects a foreign `RegExp`. Lowdefy itself never constructs a value in another realm, so this
  is reachable only from a custom plugin that introduces one. No `type` predicate was removed.
  `type.typeOf` returns coarser answers for four kinds of value: a generator function is now
  `'function'` (was `'generatorfunction'`), a generator object and an `arguments` object are now
  `'object'` (were `'generator'` and `'arguments'`), and the map, set, array and string iterators are
  all now `'iterator'` (were `'mapiterator'`, `'setiterator'`, `'arrayiterator'` and
  `'stringiterator'`). `typeOf(Buffer.from('x'))` still returns `'buffer'`.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/operators@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/operators@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/operators@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Minor Changes

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

- ba1d3bd: feat: Add `_boolean` operator.

  A new operator `_boolean` coerces any value to its boolean truthiness,
  equivalent to the `_not` of `_not` pattern or the JavaScript `!!value`
  expression. It works on the client, server, and at build time, and
  joins the existing type-cast operator family (`_number`, `_string`,
  `_array`, `_object`).

  See the `_boolean` operator reference for examples.

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

- Updated dependencies [60401aa]
- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/operators@5.4.0
  - @lowdefy/helpers@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/operators@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Minor Changes

- 69a59c0: feat(\_js): Pass pre-computed values into `_js` via an `args` object.

  The `_js` operator now accepts an object form `{ fn, args }` alongside the existing string form. Values in `args` are resolved by the parser — using any Lowdefy operator (`_state`, `_request`, `_user`, nested `_js`, etc.) — before the JavaScript function runs, and are injected as the `args` object inside the function body.

  ```yaml
  _js:
    fn: |
      const { products, target } = args;
      return products
        .filter((p) => p.category === target)
        .reduce((a, p) => a + p.price, 0);
    args:
      products:
        _request: get_products.data.products
      target: smartphones
  ```

  This lets you precompute or normalize values in YAML and keep the JavaScript body focused on computation, rather than mixing operator lookups into the function. The string form continues to work unchanged, and identical `fn` bodies still share a single compiled function at build time — only `args` varies per call.

- 0d44433: feat(\_string): Add `_string.format` for template-style string interpolation.

  `_string.format` substitutes placeholders in a template string with values, accepting either a positional array form or a named object form. `null`/`undefined` values render as empty strings, which often makes `_if_none` unnecessary.

  ```yaml
  # Positional placeholders
  _string.format:
    - 'Updates ({0})'
    - _request: get_counts.0.update

  # Named placeholders
  _string.format:
    template: 'Updates ({count}) since {date}'
    on:
      count:
        _request: get_counts.0.update
      date:
        _date.format:
          - YYYY-MM-DD
          - _state: lastSync
  ```

  Use `{{` / `}}` to include literal braces. Prefer `_string.format` over `_string.concat` for label-style interpolation, and use [`_nunjucks`](/_nunjucks) when you need conditionals, loops, or filters.

### Patch Changes

- 1d18a13: feat(actions): `holdValue` flag on `Request` and `CallAPI` actions.

  `Request` and `CallAPI` actions now accept a `holdValue: true` flag that retains the previous response value while a new call is loading. UI bound to `_request: <id>` or `_api: <endpointId>` keeps showing the previous response instead of flashing to `null` during a refetch. The previous response is also retained if the new call errors — the error is still observable via `_request_details` / `_api`.

  ```yaml
  - id: refresh_table
    type: Request
    params:
      requestId: my_table_request
      holdValue: true
  ```

  The `Request` action's object-form params now also support `{ requestId, holdValue }` and `{ requestIds, holdValue }` shapes alongside the existing `{ all }` shape.

- Updated dependencies [73fa2b9]
- Updated dependencies [1e964c4]
  - @lowdefy/operators@5.2.0
  - @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- af8ef77cb: feat(operators-js): Add `_user.hasRole`, `_user.hasSomeRoles`, and `_user.hasAllRoles` methods to check user roles against the `user.roles` array. `hasRole` takes a single role string; `hasSomeRoles` and `hasAllRoles` take an array of role strings. All return a boolean.
  - @lowdefy/operators@5.1.0
  - @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

### Minor Changes

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

- 8b9f926d1: `_menu` operator now returns the `links` array directly instead of the full menu object. Supports dot-path access: `_menu: profile_menu.0.pageId`. `_menu: true` and `{ all: true }` still return the full menus array.
- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- e3e922538: feat(operators-js): Add `_math.mod` modulo operator.

  Added `_math.mod` operator for modulo (remainder) calculations. Supports both array and named argument forms: `_math.mod: [10, 3]` or `_math.mod: { dividend: 10, divisor: 3 }`.

- fd8225b7a1: fix(operators-js): The `_date` operator now accepts Date objects as input, in addition to numbers and strings.
- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/operators@5.0.0

## 4.7.3

### Patch Changes

- c5ce5b972: fix: Prevent \_date, \_intl, and \_number.toLocaleString operators from being evaluated at build time.

  These operators depend on runtime context (current date/time, locale) and were incorrectly marked as static, causing them to be evaluated during the build and freezing their values.

  - @lowdefy/operators@4.7.3
  - @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/operators@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- fac48c10a: Fix `_function` callback template being mutated in-place by `evaluateOperators`, causing `_build.array.map` and similar operators to produce duplicate results from repeated callback invocations.
  - @lowdefy/operators@4.7.1
  - @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/operators@4.7.0
  - @lowdefy/helpers@4.7.0

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

### Patch Changes

- bb3222a5a: fix(errors): Preserve error cause chains in catch-and-rethrow blocks across plugins and CLI
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

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
  - @lowdefy/helpers@4.6.0
  - @lowdefy/operators@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/operators@4.5.2
- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/operators@4.5.1
- @lowdefy/helpers@4.5.1

## 4.5.0

### Patch Changes

- Updated dependencies [09ae496d8]
  - @lowdefy/operators@4.5.0
  - @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/operators@4.4.0
- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/operators@4.3.2
- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/operators@4.3.1
- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/operators@4.3.0
- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/operators@4.2.2
- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/operators@4.2.1
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/operators@4.2.0
- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/operators@4.1.0
- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/operators@4.0.2
- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/operators@4.0.1
- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- @lowdefy/operators@4.0.0
- @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Update switch operator error message. ([909a611](https://github.com/lowdefy/lowdefy/commit/909a611ae649194888173479f5748a52e6b91f7e))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- Update serializer util to not clash with \_date operator ([b8cdcb3](https://github.com/lowdefy/lowdefy/commit/b8cdcb3e44a0b1157c111bc7679ac428138c6f97))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Features

- Rename nodeParser to serverParser and buildParser. ([0b61e5e](https://github.com/lowdefy/lowdefy/commit/0b61e5e5710084cc19bba4eb6de95c3a53beb4b9))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- Fix jest testsfor es modules in operators and utils packages ([e239727](https://github.com/lowdefy/lowdefy/commit/e239727d1e9b74cd8945037cee462f8ec4afcdb3))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

### Bug Fixes

- **operators-js:** Add null as valid type to string operator methods. ([2d9903b](https://github.com/lowdefy/lowdefy/commit/2d9903b97359fe4609d33676f0d3bac3357f06b9))
- **operators-js:** Set operators-js tests to use UTC timezone ([8bc1341](https://github.com/lowdefy/lowdefy/commit/8bc1341cd0318b00143036e54daf5d959e928477))
- **operators-js:** Update \_string tests. ([62890b1](https://github.com/lowdefy/lowdefy/commit/62890b1b96f77913e7b352b65f3b43e48224818e))
- **operators-js:** Updated parse and UTC in date operator ([b890455](https://github.com/lowdefy/lowdefy/commit/b8904559fccd15a1851051a1e3d8284b28f84553))

### Features

- **operators-js:** Updated date operator with more methods and tests ([d19cf2e](https://github.com/lowdefy/lowdefy/commit/d19cf2eccc2d425e5825e88744b3c7359a9fc923))

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- Add additional operator tests. ([ddf8e51](https://github.com/lowdefy/lowdefy/commit/ddf8e51f8b1d9bab1490015021afa2bb0e29c6d8))
- Fix \_intl.relativeTimeFormat operator and add tests. ([627b970](https://github.com/lowdefy/lowdefy/commit/627b9707073d7298c04683d0265d8eaab1bd2ac2))
- Fix handling of null values in \_array and \_object operators. ([1333f43](https://github.com/lowdefy/lowdefy/commit/1333f43315fc7895139e1c981992dac83b1dabf1))
- **operators-js:** Fix intl operator tests. ([841bbe6](https://github.com/lowdefy/lowdefy/commit/841bbe60e507a876c75644422999b2c9a2b48915))

### Features

- Add \_intl operator. ([fbf4b14](https://github.com/lowdefy/lowdefy/commit/fbf4b14960ad176037546fd67bbe0ababf30aa3e))
- Add \_object.entries and \_object.fromEntries operator methods. ([499b726](https://github.com/lowdefy/lowdefy/commit/499b7269f2a91bd079f20a69df7ec7b2823633e4))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- Add additional operator tests. ([ddf8e51](https://github.com/lowdefy/lowdefy/commit/ddf8e51f8b1d9bab1490015021afa2bb0e29c6d8))
- Fix \_intl.relativeTimeFormat operator and add tests. ([627b970](https://github.com/lowdefy/lowdefy/commit/627b9707073d7298c04683d0265d8eaab1bd2ac2))
- Fix handling of null values in \_array and \_object operators. ([1333f43](https://github.com/lowdefy/lowdefy/commit/1333f43315fc7895139e1c981992dac83b1dabf1))
- **operators-js:** Fix intl operator tests. ([841bbe6](https://github.com/lowdefy/lowdefy/commit/841bbe60e507a876c75644422999b2c9a2b48915))

### Features

- Add \_intl operator. ([fbf4b14](https://github.com/lowdefy/lowdefy/commit/fbf4b14960ad176037546fd67bbe0ababf30aa3e))
- Add \_object.entries and \_object.fromEntries operator methods. ([499b726](https://github.com/lowdefy/lowdefy/commit/499b7269f2a91bd079f20a69df7ec7b2823633e4))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- Read urlQuery from location where used, not on lowdefy. ([11541e4](https://github.com/lowdefy/lowdefy/commit/11541e4722359bb57bace8298fc475caf58dbf6e))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Features

- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Features

- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))
- **operators-js:** Fix \_location and \_media tests. ([f47bede](https://github.com/lowdefy/lowdefy/commit/f47bede2f8b6417aebfc02a3fd41f519ca377cb0))
- Update tests to run on node and jsdom. ([be2180a](https://github.com/lowdefy/lowdefy/commit/be2180aea8f7e2ae0bc8d6ba0a716d31c0d76bc7))

### Features

- **engine:** Add payload and blockId to context.requests[requestId]. ([e29d88b](https://github.com/lowdefy/lowdefy/commit/e29d88b326338fdec22db325dcda31ee4f73cf51))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Bug Fixes

- **operators:** Fix operator tests for passing down window. ([562890f](https://github.com/lowdefy/lowdefy/commit/562890f861d13196af5aa75cef4fd5227e257b61))
- **operators:** Use window from lowdefy object. ([8e31d2a](https://github.com/lowdefy/lowdefy/commit/8e31d2a7a5d982e6e747d828cd7fd68488f7ea7f))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Features

- **operators:** Remove init so parser is now sync. ([aabedad](https://github.com/lowdefy/lowdefy/commit/aabedad46c3b27687c8095360f313f5e9e7fe19d))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **operators:** Fix operators failing tests. ([c25b6b6](https://github.com/lowdefy/lowdefy/commit/c25b6b6ea3a6f1100daba2653b263f8aed64a8c4))
- Remove \_user from build operators and rogue console.log ([bc39f77](https://github.com/lowdefy/lowdefy/commit/bc39f77ba9b94ebecdda164a6260caf69cf89c34))
- Remove \_user from build operators. ([a812d71](https://github.com/lowdefy/lowdefy/commit/a812d71491528e6e3fa3a73b3492abdcc6a145c1))

### Features

- Create \_env operator and build operators. ([e7421bd](https://github.com/lowdefy/lowdefy/commit/e7421bd237d77d0cc9c95ab0cffaf38ba96b2035))
- Simplify \_function with new operatorPrefix ([139dae6](https://github.com/lowdefy/lowdefy/commit/139dae657c4ccbd462b59744eaf5f5951f1741b3))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **api:** Fix callRequest tests. ([58655cb](https://github.com/lowdefy/lowdefy/commit/58655cba190a3a2371e301d2bf4779bd13651ad5))
- **cli:** Fix jest es module mocks. ([78480e8](https://github.com/lowdefy/lowdefy/commit/78480e80022f79a0ab449a9a8d804e6213b676c4))
- **operators-js:** Fix array, function, operator, type tests ([4d19d48](https://github.com/lowdefy/lowdefy/commit/4d19d48f5bdc48442820946c18d5d08c000d9c1c))
- **operators-js:** Fix getter operator tests. ([c774f3f](https://github.com/lowdefy/lowdefy/commit/c774f3f31fcbdf16aabd99d1cf76714cfa4b109f))
- **operators-js:** Fix menu and location tests ([3fac862](https://github.com/lowdefy/lowdefy/commit/3fac862c58dea6b293d9556f4e8f17dd169021d8))
- **operators-js:** Update request tests. ([f78405f](https://github.com/lowdefy/lowdefy/commit/f78405f48602f97b6954ceb07bf2e9dfb5bf5e7a))
- **operators-js:** Update shared operators tests. ([1c6cb87](https://github.com/lowdefy/lowdefy/commit/1c6cb87c59116ca02dfe02d7f76450345afa7918))
- **operators-js:** Update test name and license wording. ([708beac](https://github.com/lowdefy/lowdefy/commit/708beacc11f8de1c09c7abef3fae724f74c70d6a))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

**Note:** Version bump only for package @lowdefy/operators-js

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- Remove CHANGELOG file and aws plugin package peer depencies ([21627f7](https://github.com/lowdefy/lowdefy/commit/21627f7f7a53751099764ea444ad4519c6b18b1a))

### Features

- Add client operators to operators-js. ([1453e8e](https://github.com/lowdefy/lowdefy/commit/1453e8e8d6ef2897be1d378488144b179949a7dd))
- Create operators-js plugins. ([fc0dc29](https://github.com/lowdefy/lowdefy/commit/fc0dc29ad8dcf6e7631d2bc77f1b3f8bf348bafd))
- Move server operators to operators-js plugin. ([a864473](https://github.com/lowdefy/lowdefy/commit/a864473d7f68d4921186db8a6abeb681e5fe7f41))
- **operators:** Move common operators to operators-js plugin ([42a8054](https://github.com/lowdefy/lowdefy/commit/42a80549e3c6153ef09ab5d0fd4b31c40a9c92f6))
- Update types.js and update packages ([b6ffbf6](https://github.com/lowdefy/lowdefy/commit/b6ffbf6001c3aa44c260afe7eba89a24d40a51f8))
