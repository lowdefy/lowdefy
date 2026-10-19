# Change Log

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

- 660157b: Add app events. The `events` object at the root of `lowdefy.yaml` takes `onInit` and `onInitAsync` actions that run once each time the app loads in the browser, whichever page opens first, and do not run again on navigation. The app `onInit` runs before the first page's own events and keeps the page in its loading state until it finishes, so a page's `onInit` can read the global values it set. The app `onInitAsync` runs after it without blocking the page, and pages re-render when it sets global values. Use them to set up `global`, for example user settings fetched with `CallAPI`. App events run outside any page, so the build fails if one uses a page-scoped action (`SetState`, `Request`, `Validate`, `Reset`, `CallMethod`, ...) or operator (`_state`, `_input`, `_request`, ...). Errors display and log like page event errors, run the `catch` actions, and do not stop the page from loading.

  Closes #815.

- 81a5ad3: Client navigation by path. The production, e2e and dev clients fetch pages by URL path and learn the page id and path values from the server. Each set of path values is its own page instance: `Client` keys the page tree by the instance key, so following a link from one ticket to another remounts the page, and passes `pathParams` to the page context. The engine keeps up to 10 instances per page and gives actions `getPathParams`. The shown page is written to the path memory before its context is built, and auth callbacks write their target before navigating. A navigation to the path the shown page was matched on skips the fetch, unless the page is dynamic. The router's location carries the path instead of a page id. `setUrlQuery` waits for a page refetch only on dynamic pages.
- badaa49: Pages re-evaluate only the blocks whose inputs changed.

  Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

  - Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
  - `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
  - Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.

- 7c20d1b: feat: Events no longer bubble to the blocks around the block that handled them

  A click on a block inside another clickable block used to run the events of both, so a Button in a clickable Card also opened the card, and a Box in a List row also ran the row's `onClick`. Now a browser event runs only the innermost event that handles it: once a block with actions for the event fires, the blocks around it skip that same browser event. A block without an event for the interaction, like a Paragraph in the card, still passes the click on to the card. Only blocks on the browser event's own path skip it: events that blocks fire from effects, events of blocks inside the one that handled it, events from method calls, and events a block runs for its own machinery (a file upload's policy request, a table's row fetch) all still run.

  Set `bubble: true` on an event to also run the events of the blocks around it:

  ```yaml
  events:
    onClick:
      bubble: true
      try:
        - id: select
          type: SetState
          params:
            selected: true
  ```

  Inside AgGrid blocks, clicks on a cell's buttons, links, menus, inputs, selectors, switches or selection checkbox no longer trigger `onRowClick` or `onCellClick`. They only fire the control's own event.

  This changes behaviour for apps that relied on a nested click running both events: add `bubble: true` to the inner event to keep it. The `nested-event-bubbling` codemod in `lowdefy upgrade` adds `bubble: true` only where an outer event reads a value the inner event sets, moves AgGrid row-click state setup into the cell control events that relied on it, and lists the other nested events for review. Closes #1154.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

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

- 81bd4f0: feat(plugin-posthog): new PostHog product analytics plugin

  A default plugin that wraps the `posthog-js` browser SDK, so no script tag or snippet is
  needed. `posthog-js` is loaded lazily by `PostHogInit`, so an app with `enabled: false`
  never downloads it. Run `PostHogInit` from the app's root `events.onInitAsync`, which runs
  once per app load on whichever page opens first; repeat calls with the same `apiKey` do nothing.

  Adds `PostHogInit`, `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`,
  `PostHogIdentify`, `PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`,
  `PostHogReset`, `PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and
  `PostHogReloadFeatureFlags`, each with a params schema.

  With PostHog disabled every other action is a silent no-op, so analytics can never break an
  app, but invalid params still throw and an action that runs before `PostHogInit` logs a
  console warning. `PostHogIdentify` reads the identity `posthog-js` holds and resets before
  identifying a different person on a shared browser.

  - **Lowdefy semantics** — every event gets `lowdefy_page_id` (the page id, also on a page with a
    path pattern) and `lowdefy_path_params` (the page's path values, `{}` without a pattern).
    Autocaptured clicks, rage clicks and dead clicks also get `lowdefy_block_id`,
    `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_option` on a dropdown option, `lowdefy_row`
    and `lowdefy_column` inside a grid, and `lowdefy_text`: the text of the control the click
    reached (a button, menu item, option or label), even when the click lands on its icon, a child
    or a wrapper.
  - **Event failures** — a `lowdefy_event_failed` event is captured when a block or app event fails,
    with ids only, never messages or values, and at most 50 per app load. Failures in the app's
    `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`. Set
    `captureEventFailures: false` on `PostHogInit` to turn it off.
  - **Click text masking** — on by default. Click text (`$el_text`, `lowdefy_text`, `text` entries in
    `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when the
    config of the page it was clicked on, the menus, the i18n messages or the antd locale spell it
    out. Grid and table cell values, options and menu items filled by requests, labels built from
    records and `Dynamic` block output are removed; button, menu, tab, column header and literal
    option labels stay. Element attributes other than structural ones (tag, classes, `class`,
    `role`, `type`, `row-index`, `col-id`, `nth-child`, `nth-of-type`) are removed, including
    `title`, `aria-label` and `data-*`, and `id` is kept only as a block wrapper id. Classes and
    `data-ph-capture-attribute-*` values are not masked, so apps must not build them from data. URLs
    are not masked. Set `maskDataText: false` on `PostHogInit` to send full click text, or
    `options.mask_all_text: true` to send none.
  - **Deployment environments** — `PostHogInit` registers the current environment as the
    `environment` super property on every event, and `posthog.enabled: false` in an environment
    turns PostHog off there (`PostHogInit` behaves as `enabled: false`), alongside the `cron`,
    `email` and `sentry` switches.

  For plugin authors: action plugins receive a `trace` argument for observing completed events and
  the read-only app metadata as `lowdefyApp`; the engine trace gains `isConfigText({ text, pageId })`,
  and `@lowdefy/helpers` exports `filterElementsChain`.

  AutoComplete and PhoneNumberInput render their dropdowns inside the block, like Selector.

- 5017abe: feat: `_media` updates when the browser window is resized

  Blocks that use `_media` now re-evaluate when the window is resized, so `_media` can drive responsive `visible` conditions and properties the way CSS breakpoints do. The page keeps one resize listener, shared with the `onResize` event, and waits until the resize settles (150ms) before doing any work. Only blocks that read a `media` value that changed are re-evaluated: a block that reads `_media: size` updates when the window crosses a breakpoint, not on every pixel of a resize, and blocks that do not use `_media` are never touched. Blocks reading `_media` are also no longer re-evaluated on every unrelated page update.

  The `onResize` page event is now debounced by 150ms (was 200ms), and runs after `_media` blocks have been updated for the new size.

  Fixes #799.

- fa02e14: feat: Page subscriptions that wait for the Subscribe action

  - **`client.subscribeOnMount`.** A page subscription with `client.subscribeOnMount: false` is declared on the page but does not open when the page mounts. The `Subscribe` action opens it, evaluating its `payload` at that moment, and `Unsubscribe` closes it. A widget on every page can then hold its channel only while it is in use. The default, `true`, keeps subscribing on mount.
  - **`Subscribe` with a changed payload replaces the channel.** Running `Subscribe` on an open subscription evaluates its payload again. When the payload changed, the channel is replaced and its `_websocket` state starts empty, and messages from the old channel are dropped. When it did not change, nothing happens, as before.

### Patch Changes

- 6144814: Allow only safe link schemes in block hrefs

  An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

  `@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.

- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- 04077d9: fix(build): Check that CallMethod actions target a block on the page

  A CallMethod whose `blockId` did not exist on the page failed at runtime with `Cannot read properties of undefined (reading 'methods')`. The build now warns when a static CallMethod `blockId` names no block on the page (an error in production builds), pointing at the action's config location. A concrete list row such as `list.0.input` matches the configured `list.$.input` block, and pages with Dynamic blocks are not checked because their blocks are only known at runtime. The check can be suppressed with `~ignoreBuildChecks: [callmethod-refs]`. At runtime, a `blockId` produced by an operator that names no block now fails with `block "<id>" does not exist on this page`. Fixes #1176.

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

- eaf9cf8: fix(engine): list row moves and removals no longer leave stale entries in the page's block map.

  Moving or removing a list row whose nested lists differed in length, or a `SetState` or `Reset`
  that shortened a list, left block map entries that named a moved or removed block, which
  `CallMethod` and keyboard shortcuts could reach. A `Reset` also cloned the frozen page state one
  more time than it needed.

- 0f56696: fix(engine): Hiding a display or container block no longer deletes state at its id

  Only inputs and lists own a state field at their block id. Hiding a Button, Paragraph, Box or any other display or container block used to delete the state field with the same name, so `state.status` disappeared when a Button with id `status` was hidden. Hidden display and container blocks now leave state alone, while hidden inputs and lists (including those nested in a hidden container) are still removed as before. Fixes #1521.

- eaf9cf8: fix(engine): a hidden block no longer deletes the state field of a visible block in another container.

  Hidden blocks' fields are removed from state after each evaluation, but a visible block only kept
  its field from a hidden block with the same id inside the same container. A hidden block with the
  same id in another container, a hidden duplicate of a list, or a hidden container named like the
  parent of a visible field deleted the visible block's field, including a visible list row's field.
  Fields are now collected over the whole page and a field that holds a visible block's value is
  kept.

- 42bc1ac: fix(engine): Event names are looked up as the block's own events. A `ClickableHtml` `data-event` that names no event declared on the block fires nothing.
- b308c78: fix(engine): Links and auth callbacks resolve every `url` shape. A fragment (`#section`) moves within the current page, a bare query (`?tab=2`) or a dot path (`./reports`) is relative to the current page, and `mailto:`, `tel:` and app-scheme urls keep their shape, with `urlQuery` as their query. A url is read the way the browser reads it, and a url the browser cannot parse resolves to no link instead of stopping the block from rendering.
- 3688c5f: fix(engine): A message that fails to display no longer breaks the action that raised it. When the Message block threw while showing an action's loading, success or error message, the raw error replaced the action's result: a failed action lost its error, `catch` actions were skipped, and the page threw an unhandled `Cannot read properties of undefined (reading 'message')`. The display failure is now reported through the error handler on its own, and the action's result stands.
- a1367df: fix(engine): Resolve `$` row indices in Validate and ResetValidation blockIds

  `Validate` and `ResetValidation` matched blockIds literally, so `params: list.$.name` in a list row matched nothing and the validation passed without checking the row. The blockIds are now resolved from the action's array indices, the same way `SetState` and `CallMethod` resolve them, so `list.$.name` validates the `name` input in the row where the action ran. `regex` patterns are not changed, because `$` already means end of string there. The docs also now name the object param `blockIds`, which is the key the actions read. Fixes #927.

- 4a35ba2: An operator at a block's `class` is now evaluated at runtime instead of being silently dropped. Previously `class: { _if: [...] }` was read as a CSS slot map with a slot named `_if`, so the classes were applied to a slot nothing renders. The operator is now kept under the block slot, and its result may be a string, an array of strings, or an object of `{ class: boolean }`. A result that is a map of CSS keys is reported as a config error at the block's location.
- 8c50bfc: fix: Operators in `class` no longer give schema warnings, and a page's own `class` reaches the page

  - **Operators in `class` pass the build's schema check (`@lowdefy/build`).** `class: { _if: ... }`, operators as slot values (`class: { .element: { _if: ... } }`) and operators inside a class array printed false `"_if" must be string` or `".element" must be string` warnings, although the operators were evaluated at runtime as expected. An operator is now accepted anywhere a class string is. A `class` of the wrong type now gets the `Block "class" should be ...` message instead of a bare type error.
  - **Page-level `class` is applied (`@lowdefy/engine`).** A `class` set on the page block (for example `class: { .menu: ... }` on `PageSiderMenu`) was dropped before the page rendered, while `style` on the page worked. It now reaches the page block the same way `style` does.

- 760b660: fix(engine): A page's own `loading` and `skeleton` reach the page.

  `loading` and `skeleton` set on the page block were dropped before the page rendered, the same way a page's `class` was, so a page never showed its loading state or skeleton. They now reach the page block like on any other block.

- 4943f2d: fix(engine): Copy the page state once per SetState, SetGlobal and Reset.

  Every state change resets the block tree, and that reset copied the whole page state again for every container and every list row. On pages with many containers and a large state, each SetState could take seconds. The state is now copied once per reset, so a SetState costs about the same however many containers the page has.

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

- c3e0d79: feat(cli): `lowdefy journeys session` prints a recorded dev session as a log to write journeys from

  `lowdefy journeys session` lists the sessions the development server recorded, newest first, with each one's id, time span, pages, interactions and failures. `lowdefy journeys session <id>` prints that session as a log, one line per interaction with what the app did in response, such as `click save → Validate failed [priority]` and `click save → ran Validate, request createTicket ok`, with a `page <pageId>` line per page view. A failed attempt and its retry both show, typed values and generated ids show as recorded, and nothing is turned into an assertion. Agents connected to the development server read the same list and logs with the new `lowdefy_journey_session` tool.

  The development recorder records which actions an event ran and which API endpoints its `CallAPI` actions called, so a log can say `endpoint syncInvoices ok`.

- e5cffa6: feat(api,client,build,actions-core): magic-link landing page keeps the token unconsumed until a real click

  A magic-link sign-in token can only be used once, and the auth server spends it on
  the first request to the link — including a request nobody made. Corporate email
  security (Microsoft Defender Safe Links, Proofpoint URL Defense, Mimecast) opens
  every link in a message as it is delivered, so by the time the person clicks, the
  link is already used up and they land on the error page.

  Set the new `auth.authPages.magicLink` to a page in your app and the sign-in email
  links there instead, carrying the token and the sign-in destinations along. The
  page just sits there when a scanner fetches it; a button on it runs the new
  `MagicLinkVerify` action, which finishes the sign-in. The token is only spent when
  a person clicks, so scanned mailboxes can sign in again.

  `MagicLinkVerify` needs no configuration — it reads the token and the destinations
  from the page's own address. Bind it to a button click, never to page load: a
  scanner that runs the page's JavaScript would use up the token all the same.

  Leave `auth.authPages.magicLink` unset and magic-link sign-in behaves exactly as
  before. The sign-in email also now shows the link as readable text under the
  button, for mail clients that strip or rewrite buttons.

- e6302c6: fix: Reload when the server answers as another caller

  Page, request and endpoint responses now carry an `x-lowdefy-caller` header naming who the server answered as: `<caller>; session=<hash>; roles=<hash>; memberships=<hash>`. `<caller>` is a short hash of the user id and active organization id, empty when anonymous. `session` hashes the session id, `roles` the caller's app roles and organization role (owner, admin or member) in the active organization, and `memberships` the ids of every organization the person belongs to (under the pinned organization policy, only the app's own organization). A field the server does not know is left out, such as `session` for an API key caller. The browser compares the header with the caller the page renders and reloads the page when the caller or their roles differ, so a page never keeps showing one person's or organization's data after a sign-in as someone else or an organization switch in another tab, and `_user.roles`, `_user.org_roles` and role-gated blocks always match the server. A new session or a changed list of organizations for the same person, organization and roles does not reload the page.

  - A request or endpoint call answered with a 401 while the page shows a signed-in user reloads the page, since the session has ended. A 403 from a page request reloads too; a 403 from an endpoint, and a two-factor enrolment refusal, are thrown as before.
  - When the session names a different user than the page renders, the page reloads instead of keeping the previous user rendered.
  - A kept page instance is rebuilt after `SetActiveOrganization` and `UpdateSession` instead of rendering the state and request results it had under the previous organization.
  - `CallAPI` results read by `_api` are dropped when the organization changes, so a result fetched for one organization is never read under another. Global state is left as it is.
  - A tab reloads at most once every 10 seconds for these reasons; a second difference inside that window fails the call with an `AuthenticationError` instead of reloading again.
  - `@lowdefy/helpers` exports `callerStamp`, `parseCallerStamp` and `rolesHash`.

- effdeb3: Journey steps can reach controls that are not blocks. Wherever `click`, `fill`, `select`, `expect.visible` and `expect.text` take a `blockId`, they also take a target object: `{ blockId, row, column }` narrows to a grid row (zero-based, as displayed) or cell (by col-id), `text` names the interactive control with exactly that visible text, and `nth` picks among several matches. `text` on its own searches the page front-most layer first — an open dropdown menu, then an open dialog, then the page — so a confirm dialog's `Delete` is clicked over the grid's `Delete` cell buttons behind its mask. This makes grid cell buttons, confirm dialogs, modal footers and menu items addressable by `lowdefy_run_journey`, `POST /lowdefy-docs/journey` and `lowdefy test`. Unknown target keys are rejected before a browser opens, and a failed step names the target the way it was written (`block "grid" row 1 control "Edit" to be actionable`).

  A `click`, `open`, `fill` or `select` whose `text` or `containing` target has no `nth` must match exactly one visible element, or the step fails and says how to narrow it:

  ```
  Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.
  ```

  Expectations do not need one match: `expect.visible` passes when any match is visible and `expect.hidden` when none is.

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

- 6d6f8fa: Improved error handling: each reader of a server error now gets its own view of it.

  - **Users and app config see the author's message or one generic message.** A server error the app author did not write now reaches the browser as "Something went wrong.", with its `name`, `code`, `statusCode`, `configKey` and a `requestId`. Messages written with `:throw` or `:reject`, failed `ValidateSchema` steps, a plugin's `UserError`, and authentication refusals, are shown as before. This applies to the error toast, `_actions`, `_request_details`, websocket errors, MCP tool results and the AgentChat stream, the same way in development and production. An action whose error toast showed a connection's own message now shows the generic one.
    - The generic message is the built-in `server.genericError` i18n string. Override it per locale under `config.i18n.messages`, for example `server.genericError: 'Etwas ist schiefgelaufen.'`.
    - To show different text for one action, set `messages.error` on the action.
    - To show the real message, read it with the new `_error` operator in the endpoint's `:catch` and send it on, for example `:throw: { _error: message }`.
  - **The dev server shows the full error.** In `lowdefy dev`, the error bar, the browser console and the dev MCP tools show the full server error, with its config location, while app config sees the same generic error as in production. Different failures of the same action are now each shown, instead of only the first.
  - **The browser console prints the request id** under a server error, to find the matching server log line and Sentry event.
  - **Production logs and Sentry keep a fixed set of error fields.** Each logged error keeps its name, message, stack, `code`, `statusCode` and cause, plus Lowdefy's own fields (`configKey`, `source`, `received`, ...) on Lowdefy errors. Fields a library attaches, such as an HTTP client's request config and response, are no longer logged. Values of the app's secrets (`LOWDEFY_SECRET_*`, `CRON_SECRET`, `AUTH_SECRET`) are replaced with `[REDACTED]` in production log lines and Sentry events, and credential-named keys in `received` are masked. Sentry events now carry the error's fields under `extra.error` and a `requestId` tag, and no longer attach incoming request bodies.
  - **An AxiosHttp request that gets a 5xx response now fails with a `ServiceError`**, where it used to fail with a `RequestError`. AxiosHttp now sets `statusCode` on its error, and a 5xx status marks an error as a service failure, like a network error or timeout. Config that checks `name` for `RequestError` on these failures, for example `_eq: [{ _error: name }, 'RequestError']`, should also accept `ServiceError`, or check `statusCode` instead. The server log event for these failures is now `service_error`.

- Updated dependencies [6d6f8fa]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
  - @lowdefy/operators@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/errors@6.1.0

## 6.0.0

### Minor Changes

- 0dccf40: feat: Add `:if`, `:switch` and `:return` controls to client event action lists.

  Event action lists now support routine-style control flow, using the same grammar as API routines:

  - `:if` / `:then` / `:else` gates a group of actions on a single condition, instead of repeating the same `skip` expression on every action.
  - `:switch` runs the `:then` list of the first truthy `:case`; later cases are never evaluated, and an optional `:default` runs when no case matches.
  - `:return` ends the whole event successfully — replacing the early-`Throw` workaround — without running the event's `catch` actions.

  Controls can nest and work in both `try` and `catch` lists. Actions not executed for a control-flow reason (untaken branches, unmatched cases, actions after a `:return`) are reported as skipped, so `_actions` lookups and action indices are unchanged for existing configs. The build validates control shape and enforces action id uniqueness across all branches.

  Note: an event action carrying a stray `:if`, `:switch` or `:return` key (previously a schema warning at build and ignored at runtime) is now treated as a control and fails the build with a clear error.

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

### Minor Changes

- 0ec9154: feat(engine): Add `resolveTarget`, the single resolver for the `{ home, pageId, url, urlQuery }` navigation grammar, and route `createLink` through it.

  `getHomePathname` is now the one place the home rule lives, so `home: true` in an app whose `home`
  config names no page falls through to `Invalid Link.` instead of pushing `/undefined` into history
  and writing `inputs['page:undefined']` on the way.

  Two behaviour changes come with routing `createLink` through the resolver:

  - A `url` with a leading slash (`/foo`) now navigates to the in-app page `/foo`. It previously
    produced the broken external URL `https:///foo`.
  - A same-origin absolute `url` now becomes a soft client-side navigation rather than a full page
    load. An app relying on the reload will see the difference — the app-correct spelling of a
    same-origin destination is a `pageId`.

  The ambiguity error now comes from the resolver and reads
  `only one of 'home', 'pageId' or 'url' can be defined`. `back` and `href` are handled before the
  resolver — `back` has no pathname to resolve, and `href` is an HTML-attribute passthrough rather
  than a navigation target.

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

- 508708d: fix(engine): Restore a list's items when the list becomes visible again.

  Hiding a list (or a container holding one) removed its array from state, and revealing it again rebuilt the list empty — the items were gone. The engine now keeps an in-memory copy of a list's state value while it is hidden and republishes it when the list becomes visible and the state field is absent. A `SetState` performed while hidden still takes precedence.

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
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/operators@5.5.1
- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/operators@5.5.0
- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Minor Changes

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
  - @lowdefy/errors@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/operators@5.3.0
- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Minor Changes

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

### Patch Changes

- d105b81: fix(engine): Preserve input values across `visible` toggles when set via `SetState`.

  When an input was inside a hidden container and a `SetState` action set its value (e.g. on `onInit` before the container becomes visible), the value was silently reset to the input's `enforceType` default (typically `null`/`""`) on the next `SetState`. The next `SetState` triggered `RootSlots.reset()`, which found the field missing from `context.state` (because `Slots.updateState` correctly deletes invisible blocks' state fields) and overwrote `this.value` with the type default.

  `Block.reset()` now skips the type-default fallback when the block was hidden in the previous eval cycle and has in-memory state to preserve — `this.value` for inputs, or existing `subSlots` for lists (which would otherwise be truncated by the rebuild loop reading an empty `enforceType('array', null)`). The next `updateState` republishes the value to `context.state` if the block becomes visible, or leaves the field absent if it stays hidden.

  This brings `SetState`-driven visibility toggles into parity with `setValue`-driven toggles, which already preserved the value via `Block.evaluate`. Lists with nested inputs also retain per-item values across hide/reveal cycles.

  **Behaviour change:** apps that relied on a hidden input being silently reset to its default by an unrelated `SetState` will now see the previously-set value preserved. To explicitly clear a value, use `SetState({ myInput: null })`. Invisible blocks continue to have no representation in `context.state`, the user-facing `Reset` action still produces `enforceType` defaults, and `List` sub-slot rebuilding on `SetState({ list: [...] })` is unchanged.

- Updated dependencies [73fa2b9]
- Updated dependencies [1e964c4]
  - @lowdefy/operators@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/operators@5.1.0
- @lowdefy/errors@5.1.0
- @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Rename `areas` to `slots` throughout the framework.

  ### Breaking Changes

  - **`areas` renamed to `slots`**: All block area definitions use `slots` instead of `areas`. The build pipeline auto-migrates `areas` to `slots` with a deprecation warning in dev mode (error in production).
  - **Engine internals**: `Areas.js` renamed to `Slots.js`. Block instances expose `.slots` instead of `.areas`.
  - **Layout internals**: `layoutParamsToArea` renamed to `layoutParamsToSlot`.
  - **Custom blocks**: Blocks that render child areas must use `content.slotName()` — the API is unchanged but the terminology in config and docs is now `slots`.

- 29eb199c7f: Restructure block metadata from component static properties to dedicated `meta.js` files.

  ### Breaking Changes

  - **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
  - **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
  - **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
  - **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
  - **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.

- f430f02dde: Replace the Less/Emotion styling system with unified `style` and `class` properties using `.` prefixed CSS slot keys.

  ### Breaking Changes

  - **Less removed**: `.less` files are no longer supported. All styling uses CSS, CSS Modules, or Tailwind utilities.
  - **`makeCssClass` removed**: Blocks no longer call `methods.makeCssClass()`. They receive `classNames` and `styles` objects as props, keyed by CSS slot names (`element`, `icon`, `header`, `body`, etc.).
  - **`mediaToCssObject` removed** from `@lowdefy/block-utils`.
  - **`style` replaces `styles`**: The `style` (singular) property handles all styling. Using `styles` (plural) throws a `ConfigError`.
  - **`class` property added**: New `class` property for CSS classes (Tailwind utilities, custom classes). Supports string, array, or object with `.` slot keys.
  - **`properties.style` moved**: Block-specific `properties.style` maps to `style: { .element }` at build time.
  - **Inline style props removed**: `headerStyle`, `bodyStyle`, `maskStyle`, `contentWrapperStyle`, `contentStyle`, `labelStyle`, `valueStyle`, `tabBarStyle`, `overlayStyle` are replaced by CSS slot keys (e.g., `style: { .header }`, `style: { .body }`).

  ### CSS Slot Keys

  `.` prefixed keys target specific parts of a block:

  | Key                                | Target                                                  |
  | ---------------------------------- | ------------------------------------------------------- |
  | `.block`                           | Layout wrapper (grid column)                            |
  | `.element`                         | Component root element                                  |
  | `.header`, `.body`, `.cover`, etc. | Antd semantic sub-elements (declared in `meta.cssKeys`) |

  Flat shorthand (no `.` keys) maps to `.block`:

  ```yaml
  # These are equivalent:
  style: { marginTop: 20 }
  style:
    .block: { marginTop: 20 }
  ```

### Minor Changes

- 130a569d36: Add keyboard shortcut support for block events.

  Blocks can now define keyboard shortcuts on events using the `shortcut` property in the event long-form object. Shortcuts are platform-aware (`mod+K` maps to Cmd+K on Mac, Ctrl+K on Windows), support sequences (`g i`), and can be arrays for multiple bindings.

  - **Build validation** warns on duplicate shortcuts within a page and conflicts with browser defaults (e.g. `mod+N`)
  - **ShortcutManager** registers a single global keydown listener via tinykeys with visibility gating and input field suppression
  - **ShortcutBadge** component renders platform-appropriate key symbols (e.g. `⌘ K`) and is available to all blocks via `components.ShortcutBadge`
  - **ShortcutBadge in blocks**: Button, Anchor, Tag, and Search blocks display a platform-aware keyboard shortcut badge (e.g. `⌘S` / `Ctrl+S`) next to the title when the event has a `shortcut` defined

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/operators@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/operators@4.7.3
- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/operators@4.7.2
- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/operators@4.7.1
- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/operators@4.7.0
  - @lowdefy/helpers@4.7.0
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

- f673e3ab3: feat(errors): Add UserError class and thread actionId through request pipeline

  **UserError Class**

  - New `UserError` in `@lowdefy/errors` for expected user-facing errors (validation failures, intentional throws)
  - UserError logs to browser console only — never sent to the server terminal
  - `Throw` action now throws `UserError` instead of custom `ThrowActionError`

  **Engine Error Routing**

  - `Actions.logActionError()` routes errors by type: `UserError` → `console.error()`, all others → `logError()` (terminal)
  - Deduplication by error message + action ID prevents repeated logging

  **actionId Threading**

  - `actionId` threaded from `callAction` through `createRequest` to `Requests.callRequests`
  - Server-dev request handler logs request trace via `logger.ui.dim()` for dimmed output
  - Enables request logs to include the triggering action for better debugging context

### Patch Changes

- 7936ee3fd8: Improve build error handling and test infrastructure:
  - Stop build after schema validation errors to prevent cascading failures
  - Convert makeId to class with reset() method for reliable test isolation
  - Add parseTestYaml helper for realistic YAML-based test fixtures
  - Simplify buildConnections by removing duplicate validations handled by schema
  - Fix addKeys to not store undefined values in keyMap
  - Menu link to missing page is warning in dev, error in prod
  - Handle areas with no blocks gracefully - render as empty page instead of crashing
  - Filter out anyOf/oneOf cascade errors in schema validation - only show the specific error
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
- Updated dependencies [8ec5f1be05]
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
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

### Minor Changes

- d9512d9be: - Refactor build to create individual block instances.
  - Add hybrid block type to extend block functionality.

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

- d040e3005: Add a property called responseTime to the request object to measure response times of requests.
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

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))
- Fix engine tests. ([9a826e6](https://github.com/lowdefy/lowdefy/commit/9a826e6667ebcd780dc430addbff5ee65c10fbf6))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- **engine:** Fix setting values of blocks to null using set state. ([58d0cf8](https://github.com/lowdefy/lowdefy/commit/58d0cf8cdebf6536c51ad96ab342be0e681b4298))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **engine:** Fix validation when using a dynamic approach to setting required. ([14ae1db](https://github.com/lowdefy/lowdefy/commit/14ae1db166f4abe972f084f8d9646a925020b8bc))
- **engine:** Remove unnecessary props spreading. ([7ebf2ce](https://github.com/lowdefy/lowdefy/commit/7ebf2ced7cb99c68450cad633c31dd3f4f9032aa))
- **engine:** Update createLink error message test. ([d434d9e](https://github.com/lowdefy/lowdefy/commit/d434d9ee448cc101eab406201986d7ceddce8c76))
- **engine:** Update Link to allow use of href. ([d00344a](https://github.com/lowdefy/lowdefy/commit/d00344adf2c36291878abb87b725893327853012))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- **engine:** Fix createGetUrlQuery tests. ([1c9a500](https://github.com/lowdefy/lowdefy/commit/1c9a500c3bb112e6e06abbb3a642918be0784991))
- Read urlQuery from location where used, not on lowdefy. ([11541e4](https://github.com/lowdefy/lowdefy/commit/11541e4722359bb57bace8298fc475caf58dbf6e))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Features

- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Features

- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- **engine:** Fix createSetGlobal. ([542ed98](https://github.com/lowdefy/lowdefy/commit/542ed983dc869e82a2e06c106377035ad7fbf57e))
- **engine:** Fix engine tests. ([92182a2](https://github.com/lowdefy/lowdefy/commit/92182a2bb53b7b54179f67792bd10e6b53ad2400))
- **engine:** RootBlocks.map to use blockId. ([d31064f](https://github.com/lowdefy/lowdefy/commit/d31064ff9c685d1ae959ce9142ac11aca55fb6c0))
- **engine:** Set request to null and update before calling request. ([bb2b57b](https://github.com/lowdefy/lowdefy/commit/bb2b57b4435d232be50d3971bcdc54354ea3b711))
- **engine:** testContext to build config and use getContext. ([4539d6f](https://github.com/lowdefy/lowdefy/commit/4539d6f939c722a8e804038a9ca04b6cddc18691))
- **engine:** Update benchmark test to pass. ([529f65e](https://github.com/lowdefy/lowdefy/commit/529f65e64738e1b8b211a7c161196dd0ff667756))
- **engine:** Update createResetValidation test ([177b66f](https://github.com/lowdefy/lowdefy/commit/177b66f59ad6c6b90b9532b1d1e6744594c3aa05))
- **engine:** Update test to use built config. ([f4c0f76](https://github.com/lowdefy/lowdefy/commit/f4c0f7676e96c31b7455e6aafb815826ba51d959))
- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- **engine:** 🏄‍♂️Engine tests are passing. ([d737e1c](https://github.com/lowdefy/lowdefy/commit/d737e1cf12ab8bef0a44aee9d3f7765aade4b2e2))
- **engine:** Add payload and blockId to context.requests[requestId]. ([e29d88b](https://github.com/lowdefy/lowdefy/commit/e29d88b326338fdec22db325dcda31ee4f73cf51))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Features

- Next auth implementation work in progress. ([bf5692a](https://github.com/lowdefy/lowdefy/commit/bf5692aed26a003e9412b029295a45af489728c4))

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **client:** Render progress bar next to context, and event order fixes. ([fc32c75](https://github.com/lowdefy/lowdefy/commit/fc32c75ea2d8c5c97e21280b09fce5518ec14d37))
- **engine:** Catch block type not found error. ([7d95728](https://github.com/lowdefy/lowdefy/commit/7d957284ca082b8aa2aa8316b1dc8d7e1ca8a2c6))
- **engine:** Init validate only if none. ([9b5bd70](https://github.com/lowdefy/lowdefy/commit/9b5bd707715ff1d65867957271f7a04298e360c9))
- **engine:** Only init validate if none. ([e0d7dd6](https://github.com/lowdefy/lowdefy/commit/e0d7dd6a21859e090ec627e18548d8274307c5b5))
- **engine:** Remove block.loading. ([31b8190](https://github.com/lowdefy/lowdefy/commit/31b8190b8d34cba8ad62b077864f3da009f0d659))
- Review feedback changes. ([6925625](https://github.com/lowdefy/lowdefy/commit/69256253142813f0b78c353d0698f13386d10929))

### Features

- **client:** Apply reset context flag to recreate context on client. ([09f49a2](https://github.com/lowdefy/lowdefy/commit/09f49a2072f2803268b20f69655e03a57ef8f097))
- **engine:** Add progress callAction — needs tests. ([771961c](https://github.com/lowdefy/lowdefy/commit/771961ca1dc69b197b2d3bb20d1427bb63916c0d))
- **engine:** Add runOnInit method to getContext. ([2339a3a](https://github.com/lowdefy/lowdefy/commit/2339a3a77da875e688115f7111bde1e8d706761d))
- **engine:** Add skeleton and loading eval. ([c3c35d1](https://github.com/lowdefy/lowdefy/commit/c3c35d164265576ecdf2e42bded041ba16b918f1))
- **engine:** Make getContext sync, add skeleton and loading eval. ([a876b6f](https://github.com/lowdefy/lowdefy/commit/a876b6f8cf92d1bbfd3986bb051dc69a6e1d141f))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **blocks-antd:** Icon name corrections. ([7fa29e4](https://github.com/lowdefy/lowdefy/commit/7fa29e4290d533f252390cf48f2059c178ca7c34))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- Convert link to pass pathname and query separately. ([1294914](https://github.com/lowdefy/lowdefy/commit/1294914fae0cafbe9165db230b2cf418a97e71b7))
- **engine:** Changed method action from getRequest to getRequestDetails. ([32c0b7c](https://github.com/lowdefy/lowdefy/commit/32c0b7c96f07e16c5a4b16b8501ea44da3f2ba76))
- **engine:** Fixed validate action method context reference. ([576e3a9](https://github.com/lowdefy/lowdefy/commit/576e3a9fe8234a61ed5f3237ea44cc309e4cb27d))
- **engine:** Reset input when link is followed with no input. ([fab9e2a](https://github.com/lowdefy/lowdefy/commit/fab9e2a3fb1d59ff604bee2b95edf0e8464f0a42))
- **engine:** Reverted index based block id change in callMethod action test. ([46ad3c0](https://github.com/lowdefy/lowdefy/commit/46ad3c07982dacb481b1513750db19b55fe89382))
- **engine:** Update set global action method global object reference. ([91fa543](https://github.com/lowdefy/lowdefy/commit/91fa543969a33e119df23b716d04acca55edcaf0))
- **engine:** Updated callMethod action method to use action & block plugin config. ([ddd849e](https://github.com/lowdefy/lowdefy/commit/ddd849e2de6b9691041d098fe53ace1db5940451))
- **engine:** Updated link action method test to use action & block plugin config. ([1306698](https://github.com/lowdefy/lowdefy/commit/1306698ebbd9fe6b41c77628da70c2b7f95a4e13))
- **engine:** Updated login action method test to use action & block plugin config. ([4cbd863](https://github.com/lowdefy/lowdefy/commit/4cbd863cfe8f2b325dc3e9bea4d54d1f4c1d97b7))
- **engine:** Updated logout action method test to use action & block plugin config. ([e120fe8](https://github.com/lowdefy/lowdefy/commit/e120fe88beb39fb59661151c15429c4d926782be))
- **engine:** Updated message action method test to use action & block plugin config. ([48cd251](https://github.com/lowdefy/lowdefy/commit/48cd2515e51ba769437dd3509f55b68f571a0757))
- **engine:** Updated request action method test to use action & block plugin config. ([d2bd2f5](https://github.com/lowdefy/lowdefy/commit/d2bd2f5fc207eeb15ec86559dc4bec726e037071))
- **engine:** Updated reset action method test to use action & block plugin config. ([d46add8](https://github.com/lowdefy/lowdefy/commit/d46add8f05279253cf99955315e6acda9b42a516))
- **engine:** Updated resetValidation action method test to use new plugin config. ([107a1a5](https://github.com/lowdefy/lowdefy/commit/107a1a50000d9ca731370cc41bca2e5f7d564bad))
- **engine:** Updated setGlobal action method test to use new plugin config. ([ceceec3](https://github.com/lowdefy/lowdefy/commit/ceceec34da9973d054d2138232832b2fd5aeb5aa))
- **engine:** Updated setState action method test to use new plugin config. ([27838bc](https://github.com/lowdefy/lowdefy/commit/27838bcf75bba256d13f7a72b1bfd6e1d41bceeb))
- **engine:** Updated testContext to use rootBlock config. ([c8524c6](https://github.com/lowdefy/lowdefy/commit/c8524c6742d3f45109f15ace6e2d84b6114b92d8))
- **engine:** Updated validate action method test to use new plugin config. ([f8962c6](https://github.com/lowdefy/lowdefy/commit/f8962c6451e92c467ae882c55ac0859e92ca2ba0))
- Update createLink tests. ([2e531b3](https://github.com/lowdefy/lowdefy/commit/2e531b385248361fc6f015e0102838462299af06))

### Features

- **actions-core:** Refactored @lowdefy/engine and added actions-core package to plugins. ([b08ef1d](https://github.com/lowdefy/lowdefy/commit/b08ef1d3944503be83beffb006a284e4460660d9))
- **engine:** Added action methods to Actions class. ([e3a32aa](https://github.com/lowdefy/lowdefy/commit/e3a32aae4079fe85124039c1ac736cffb784bd4a))
- **engine:** Added getActions action method test. ([c79c7ed](https://github.com/lowdefy/lowdefy/commit/c79c7ed11da18923395aa8385fb542b5a41c7f96))
- **engine:** Added getBlockId action method test. ([5802217](https://github.com/lowdefy/lowdefy/commit/5802217d3c6b20af5412af2a491f1b9f7852c175))
- **engine:** Added getEvent action method test. ([031535c](https://github.com/lowdefy/lowdefy/commit/031535c553e1f2c7806e810d8b609f3fb3550de3))
- **engine:** Added getGlobal action method test. ([61d23a2](https://github.com/lowdefy/lowdefy/commit/61d23a282ab98202b0b431f7043e381fad7a87c7))
- **engine:** Added getInput action method test. ([5578f46](https://github.com/lowdefy/lowdefy/commit/5578f46978ae78189b90e0ce39c1133add59499d))
- **engine:** Added getPageId action method test. ([602e114](https://github.com/lowdefy/lowdefy/commit/602e114040dcf51cf9f0c259d84a62ab847c2b0d))
- **engine:** Added getRequestDetails action method test. ([55519c5](https://github.com/lowdefy/lowdefy/commit/55519c5c5945ccb2d754ff38798f8917a49bfb5a))
- **engine:** Added getState action method test. ([384d264](https://github.com/lowdefy/lowdefy/commit/384d2645d7f6b56bc9e17937f6d5e82c2c45adbe))
- **engine:** Added getUrlQuery action method test. ([6665f2e](https://github.com/lowdefy/lowdefy/commit/6665f2eaa06c604fedb4de64d0fb414d153af6b4))
- **engine:** Added getUser action method test. ([f7156f5](https://github.com/lowdefy/lowdefy/commit/f7156f5e6f9ebf1178821b46f73ddeba6e6d134a))
- **engine:** BREAKING CHANGE - The Message action was renamed to DisplayMessage. ([6c3abb7](https://github.com/lowdefy/lowdefy/commit/6c3abb71e8e82612c18148c00add90d6d8e1f36f))
- **engine:** Update link to include noLink and disableLink, fix logic. ([b9633e4](https://github.com/lowdefy/lowdefy/commit/b9633e4f105c07efbf192f09038438a0f61b0390))

### BREAKING CHANGES

- **engine:** The Message action was renamed to DisplayMessage.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v3.23.2) (2021-11-29)

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Features

- Create wait helper function. ([42c09f4](https://github.com/lowdefy/lowdefy/commit/42c09f467b3d4a3b51298a2a67364137def7896d))
- **server-dev:** Dev server soft reload working. ([dd5ee07](https://github.com/lowdefy/lowdefy/commit/dd5ee07b5b39c3c22e702b5b1c8404e7a86ab500))

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Features

- Import operator plugins in server. ([f913e9e](https://github.com/lowdefy/lowdefy/commit/f913e9e261777a0c7f4b0a79995ef18290186b2e))

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v3.23.2) (2021-11-29)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/engine

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- Engine test fixes. ([cf752ec](https://github.com/lowdefy/lowdefy/commit/cf752ec72024b678cb19c070a404d1dadb343281))
- **engine:** Add tests for payload change. ([e8a2141](https://github.com/lowdefy/lowdefy/commit/e8a2141812870ec8ae50e1921f05ad2077ac176f))
- Fix tests ([80c00f4](https://github.com/lowdefy/lowdefy/commit/80c00f4403067493351347ca91cb953586bb97da))
- Remove nested contexts code review fixes. ([ceb266d](https://github.com/lowdefy/lowdefy/commit/ceb266d5e09afcaacceaef0690d76eeaceb8e5ae))
- Render app using blockIds generated at build. ([4e46145](https://github.com/lowdefy/lowdefy/commit/4e46145d8fdbd4f1c49891202f7182a6bb35e6f7))
- Test fixes. ([67bf2d4](https://github.com/lowdefy/lowdefy/commit/67bf2d444884232369eea5f9b9db418b4cf3a25b))

### Features

- Add requests to client and server. ([320c4a1](https://github.com/lowdefy/lowdefy/commit/320c4a10a14b14488f13bb3b98bb100c7e6227af))
- **engine:** Remove support for nested contexts. ([612f783](https://github.com/lowdefy/lowdefy/commit/612f783a0054a05b16ac5424c9052a6af0b8fbff))
- Fixes fro requests in next server ([e341d8d](https://github.com/lowdefy/lowdefy/commit/e341d8ded222902ce07ea1ea1d18940ac000c4da))
- Mount home page on the home route if configured. ([ff23ea8](https://github.com/lowdefy/lowdefy/commit/ff23ea82cf8399ff012ca07a58520cda1b5853ac))
- Next server fixes. ([9e6518a](https://github.com/lowdefy/lowdefy/commit/9e6518a89e95a894b2c680146e0de15aa6f3513e))
- Next server rendering blocks ([e625e07](https://github.com/lowdefy/lowdefy/commit/e625e07a29b5ae3f09f74c629f35fe52ce73dace))
- Replace server side state with payload and \_payload operator. ([1f928d9](https://github.com/lowdefy/lowdefy/commit/1f928d93db4cbe886d322a1a3998a817d769485f))
- Requests working on next server ([8d6abe2](https://github.com/lowdefy/lowdefy/commit/8d6abe27f967be6c11d1f4c29e8af73c4734dd68))
- Root config and link working on next server. ([cf2562b](https://github.com/lowdefy/lowdefy/commit/cf2562b088075290ddf3c354624c3c5c6d89ecf9))

### BREAKING CHANGES

- The \_event, \_global, \_input, \_state, and \_url_query operators are no longer evaluated in connections or requests.

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/engine

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

**Note:** Version bump only for package @lowdefy/engine

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/engine

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

**Note:** Version bump only for package @lowdefy/engine

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

**Note:** Version bump only for package @lowdefy/engine

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

**Note:** Version bump only for package @lowdefy/engine

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/engine

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

**Note:** Version bump only for package @lowdefy/engine

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/engine

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

**Note:** Version bump only for package @lowdefy/engine

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package @lowdefy/engine

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/engine

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/engine

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/engine

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **engine:** Add tests for Blocks.validate. ([0a0a66a](https://github.com/lowdefy/lowdefy/commit/0a0a66aa7639db6fcded6aa5a4937c2b96e6e7c8))
- **engine:** Catch CallMethod method not defined error and add tests for CallMethod. ([96f9cb1](https://github.com/lowdefy/lowdefy/commit/96f9cb1d65c80727a27703497a9c25cf694de11d))
- **engine:** Fixes to event debouncing and tests. ([89266f2](https://github.com/lowdefy/lowdefy/commit/89266f2dbdf860434c94811613a07a385afdc78d))
- **engine:** Refactor Validate to work with getBlockMatcher. ([8c9de14](https://github.com/lowdefy/lowdefy/commit/8c9de14c3f26a64adf2a5dbb93b86105978c62d4))
- **engine:** Remove showValidationErrors from context. ([24e0bbc](https://github.com/lowdefy/lowdefy/commit/24e0bbc3a849a8d3cc2b4b3313a3530dd0369b03))
- **engine:** Update action tests to include debounce. ([b21c440](https://github.com/lowdefy/lowdefy/commit/b21c440eb0144bb5d53a2d3320bc8637de300c90))
- **engine:** Update events test for undefined event. ([05bc928](https://github.com/lowdefy/lowdefy/commit/05bc928e45d07fba5b6a27e505cd3c1128b4216b))

### Features

- **blocksAntd:** Added onclose action chain error detection to ConfirmModal, Drawer, Modal. ([66e0692](https://github.com/lowdefy/lowdefy/commit/66e0692d9c9dc8a25be9115d2522e4cb77075c50))
- **engine:** Add async option to actions ([81036db](https://github.com/lowdefy/lowdefy/commit/81036db446ae64cd023fe198360fa9506e818ca0))
- **engine:** Add async tests and update docs. ([fd967b9](https://github.com/lowdefy/lowdefy/commit/fd967b929b4ab57a787b1e052c74334dfc54e87b))
- **engine:** Add debounce option to events. ([003cb0b](https://github.com/lowdefy/lowdefy/commit/003cb0b1ec13a246aa4848f2c5020a937b97ac3d))
- **engine:** Add ResetValidation action. ([01237e3](https://github.com/lowdefy/lowdefy/commit/01237e3340b3547ae88cc7248eed7daa1ac5e4c5))
- **engine:** Add tests for events debounce. ([2ff29cb](https://github.com/lowdefy/lowdefy/commit/2ff29cb772bc940bb59dc976c31d473771c8da97))
- **engine:** Add Throw action. ([d2a23f0](https://github.com/lowdefy/lowdefy/commit/d2a23f0022aca6d9f0e330ef3652ad2a8f8364b7))
- **engine:** Document Lowdefy action functions in JsAction. ([7634145](https://github.com/lowdefy/lowdefy/commit/7634145286cdb8483bbcd151343bbcb6d5a0a65f))
- **engine:** showValidation on block level and params.regex for Validate. ([6824b07](https://github.com/lowdefy/lowdefy/commit/6824b07127f86ed19d0239ba903f88ddb4287932))
- Add back option to link. ([b6cf705](https://github.com/lowdefy/lowdefy/commit/b6cf705d5c7e0b54a3c22d7a33116fc30dc9e191)), closes [#728](https://github.com/lowdefy/lowdefy/issues/728)
- Add Lowdefy actions to JsAction ([7af4442](https://github.com/lowdefy/lowdefy/commit/7af4442c6f2314ffbf927a413c15649425a93b59))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package @lowdefy/engine

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

### Bug Fixes

- **engine:** Evaluate action error messages after error. closes [#663](https://github.com/lowdefy/lowdefy/issues/663) ([514fd14](https://github.com/lowdefy/lowdefy/commit/514fd14ce234d19bf2661a55be328e992102b546))
- **engine:** Remove error.lowdefyMessage. ([9f8590f](https://github.com/lowdefy/lowdefy/commit/9f8590f0d7a18a77a49235c0bc24798120062c66))
- **engine:** Responses for actions and tests using \_actions in messages. ([38cf7ef](https://github.com/lowdefy/lowdefy/commit/38cf7ef35843ad8494fa2a9829b9ddbed33f0ca6))
- **engine:** Up test covarage in Wait. ([a40ad4f](https://github.com/lowdefy/lowdefy/commit/a40ad4f7246c7ed0584fd3747f7a21e31832af96))

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

### Features

- **engine:** Add wait operator. ([40ead25](https://github.com/lowdefy/lowdefy/commit/40ead255054a731cc70e7bee31c61d2d20ef0caf)), closes [#625](https://github.com/lowdefy/lowdefy/issues/625)

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/engine

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/engine

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/engine

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/engine

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/engine

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/engine

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

### Features

- **engine:** Add catchActions to events, closes [#608](https://github.com/lowdefy/lowdefy/issues/608) ([305b3aa](https://github.com/lowdefy/lowdefy/commit/305b3aa3f9ff51c605384e36902c15d3491a5736))

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update dependency graphql-tag to v2.12.4 ([daf81cf](https://github.com/lowdefy/lowdefy/commit/daf81cf76ddc3f91d37fed7634f5427309142156))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/engine

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/engine

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/engine

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

**Note:** Version bump only for package @lowdefy/engine

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- **engine:** Add tests for JsAction. ([2113ae5](https://github.com/lowdefy/lowdefy/commit/2113ae5c74d1143e1305b858b555cd5ff35faa59))
- **engine:** Modify action response object. ([94db71d](https://github.com/lowdefy/lowdefy/commit/94db71d2ace301c930f775de44d9908eb9c63576))
- **engine:** Update tests for new action responses structure. ([73c84e6](https://github.com/lowdefy/lowdefy/commit/73c84e6fdc75f4aca072f6843fea17eee87b02eb))

### Features

- **engine:** Add JsAction. ([005155a](https://github.com/lowdefy/lowdefy/commit/005155aecf97774b37611eaa18c6aa854d6a92d3))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

**Note:** Version bump only for package @lowdefy/engine

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

### Bug Fixes

- **engine:** Fix required validation broken by dynamic operators. ([6d38dbb](https://github.com/lowdefy/lowdefy/commit/6d38dbbe577a833368b7f4bccfcdadec7e103dc8))

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

**Note:** Version bump only for package @lowdefy/engine

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- Update babel setup for tests. ([1d89de9](https://github.com/lowdefy/lowdefy/commit/1d89de9edb3e64f005bc044ebdc80ef6a8a0eecd))
- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))
- **engine:** Init async operators. ([63f8d14](https://github.com/lowdefy/lowdefy/commit/63f8d143796e928b5a87a8c6e4a90b4e975a83bc))
- **operators:** Update dynamic imports. ([5699118](https://github.com/lowdefy/lowdefy/commit/5699118eda068f0f729223eb9ee3cdf8ed4f9840))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/engine

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

### Bug Fixes

- **engine:** Fix Request action response. ([45aaa18](https://github.com/lowdefy/lowdefy/commit/45aaa1854595da1eb5225198a101895dc959fe54))

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/engine

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/engine

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/engine

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/engine

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/engine

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/engine

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/engine

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/engine

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/engine

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Bug Fixes

- **engine:** Assign rootContext to context, instead of assigning individual fields. ([9461990](https://github.com/lowdefy/lowdefy/commit/9461990863b76d790a55d77fef5278adc4619858))
- **engine:** Rename more root to lowdefy. ([df858c1](https://github.com/lowdefy/lowdefy/commit/df858c16aaeaa6116fd3701cac1bcbdce77e526d))
- **engine:** Rename rootContext to lowdefy, and add pageId to root. ([3ee8807](https://github.com/lowdefy/lowdefy/commit/3ee880702f4edd060b011c1cf22a5015982965c9))
- **engine:** Use context specific pageId in engine. ([e80e461](https://github.com/lowdefy/lowdefy/commit/e80e461ebaa5a6453866f780b0ad4d3e9f2f2237))

### Features

- **renderer:** Finish OpenId callback. ([9997136](https://github.com/lowdefy/lowdefy/commit/9997136f395c1f7fb7d16ef8fdb6f0cd6043a951))
- **renderer:** Switch rootcontext to root lowdefy object ([30919a2](https://github.com/lowdefy/lowdefy/commit/30919a2dd2e2ee9adffbe35f382ba70e78fac25e))
- Init OpenID Connect flow. ([e2e29d0](https://github.com/lowdefy/lowdefy/commit/e2e29d0f165c148bbc27b5073612a6b4d50e1b87))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

### Bug Fixes

- **engine:** Validate was not showing the correct error message. ([4fcbda4](https://github.com/lowdefy/lowdefy/commit/4fcbda45ebafb6b40b93d865a648234ca19f505f))
- **engine:** Validation warnings were shown as errors not warnings. ([84ad6b3](https://github.com/lowdefy/lowdefy/commit/84ad6b3b98fb28e770262898cdc41373f3f919a7))

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

**Note:** Version bump only for package @lowdefy/engine

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **engine:** Fix Link action always errors. ([ec4c0f2](https://github.com/lowdefy/lowdefy/commit/ec4c0f24dcf5715ca8230d20b253a74afcdcccb5))
- **engine:** Fix set block to update on event loading. ([db80390](https://github.com/lowdefy/lowdefy/commit/db8039079ecfb5484f49f0a921e326fda4342050))
- **engine:** Use displayMessage from window. ([a7e50b3](https://github.com/lowdefy/lowdefy/commit/a7e50b39da5a37efc16dc15d2f3e56a4bac820f6))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **actions:** Fix action response, add tests. ([0d16f82](https://github.com/lowdefy/lowdefy/commit/0d16f82a92135e0e895bd2088d4386b0f01b67d7))
- **engine:** Fix Link action with input and urlQuery. ([be6a1e1](https://github.com/lowdefy/lowdefy/commit/be6a1e1e8801458d059fe937d517b777c41fee71))
- **engine:** Fix Validate function name ([795d876](https://github.com/lowdefy/lowdefy/commit/795d8765e18f5c3c5a1e3b44133e9785fad3aad2))
- **engine:** Log action errors to the console. ([38ea5ff](https://github.com/lowdefy/lowdefy/commit/38ea5ff430d766f3b178b3746aeac6c6c8cb78d6))

### Features

- **engine:** Parse params for all actions. Refactor actions and events. ([0d55bd2](https://github.com/lowdefy/lowdefy/commit/0d55bd2624917a8415802db7413ebe4e06e1c111))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

### Bug Fixes

- **engine:** Fix container chlidren visibilty if container vis is null. ([0af48bd](https://github.com/lowdefy/lowdefy/commit/0af48bdc5b9ea201118e76b3479180c15498fbaf))

### Features

- **engine:** Rename Link action newWindow to newTab. ([35b47f6](https://github.com/lowdefy/lowdefy/commit/35b47f6d47338b3f93ae41a0fcd2046b5593db50))

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/engine

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Bug Fixes

- **engine:** Actions should only skip when “skip” is explicitly true ([e34dc05](https://github.com/lowdefy/lowdefy/commit/e34dc056d11709d2d319f36a052f27dea0ec7cc6))
- **engine:** Only update when onInit is done. ([9f21597](https://github.com/lowdefy/lowdefy/commit/9f215976ffd44caa96c75e0ba929f750819b2e36))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- **engine:** Events rename fix. ([ca142ca](https://github.com/lowdefy/lowdefy/commit/ca142ca160a8e3db911ed70f571be31ef5f60d42))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **deps:** Update dependency graphql to v15.5.0 ([90acf72](https://github.com/lowdefy/lowdefy/commit/90acf7289c517f9afe066cd0706c64187a39648b))

### Features

- Rename blocks “actions” field to “events”. ([8f2e998](https://github.com/lowdefy/lowdefy/commit/8f2e9986e72be368203c0479a28ad7c7a2511f10))
- **engine:** Add support for meta.initValue to initialize block value from meta. ([5d5307c](https://github.com/lowdefy/lowdefy/commit/5d5307c82a45d7120870fae1c0abc1ea9caf5005))
- **engine:** Rename block actions to events ([bd4f7a7](https://github.com/lowdefy/lowdefy/commit/bd4f7a79e3039d2dcc9a8e0e5663d560cbc6c8bb))
- **renderer:** Rename actions to events ([134b275](https://github.com/lowdefy/lowdefy/commit/134b2756fd7f544486d9b1f8f5b53fa566fce23f))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/engine

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))

## [0.0.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/engine@0.0.0-alpha.7...@lowdefy/engine@0.0.1) (2020-12-15)

**Note:** Version bump only for package @lowdefy/engine

# [0.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/engine@0.0.0-alpha.7...@lowdefy/engine@0.0.0) (2020-12-15)

**Note:** Version bump only for package @lowdefy/engine

# 0.0.0-alpha.7 (2020-12-10)

### Bug Fixes

- **blockTools:** remove registeredMethods ([b984e6f](https://github.com/lowdefy/lowdefy/commit/b984e6f5554a617d4d8d7e077e91619330d0eb4d))
- **deps:** update dependency graphql to v15.4.0 ([24803a3](https://github.com/lowdefy/lowdefy/commit/24803a30d4fe6fb140c28891691fc1fab6537d5f))
- **engine:** do not recreate actions on call ([58f6e8e](https://github.com/lowdefy/lowdefy/commit/58f6e8ed5698df4bb7f1853c75266d7264b7156a))
- **engine:** minor bug fixes ([8937087](https://github.com/lowdefy/lowdefy/commit/8937087274bfba78d0433cada9a3d28c288fa0b7))
- **engine:** remove defaultValue field ([a380aef](https://github.com/lowdefy/lowdefy/commit/a380aefea5b30077ab662d3abefd412e5b0695b8))
- **engine:** replace graphql-tag dependency in engine ([370f69b](https://github.com/lowdefy/lowdefy/commit/370f69be4e91d0bbbb4a72f50abadbdfe8319e50))
- **engine:** structured params for newBlocks ([1c5bd0c](https://github.com/lowdefy/lowdefy/commit/1c5bd0c4734d11767065a2bb605c59b947db4750))
- **engine:** update tests ([4de3325](https://github.com/lowdefy/lowdefy/commit/4de332549a690c41b31944876dbf15d7f4a76a24))
- **engine:** visible should evaluate only when not equal to false ([76e7f2a](https://github.com/lowdefy/lowdefy/commit/76e7f2a6589593bf0eaa3cecbf01214df9edf727))
- **renderer:** fix useContext, split onEnter and get context ([6af60c6](https://github.com/lowdefy/lowdefy/commit/6af60c6703f0fc119d0b44b6328a2ad1e8278ba6))
- build and test errors ([909b2bf](https://github.com/lowdefy/lowdefy/commit/909b2bf1250d26b1fd944811117770a35f187a09))
- move engine related files from helpers to engine ([3b96ab7](https://github.com/lowdefy/lowdefy/commit/3b96ab7e0e651ca54a4861d90a9fe732a3d1fe21))
- requests fixes ([0e7af60](https://github.com/lowdefy/lowdefy/commit/0e7af6093210a030129200c7abfe330c30cf1574))
- use helpers from helpers ([ebe3738](https://github.com/lowdefy/lowdefy/commit/ebe373827d54f4009f5f246fef8be630e20ba4a7))
- **renderer, engine:** move displayMessage to rootContext, update engine tests ([0f6339f](https://github.com/lowdefy/lowdefy/commit/0f6339f07d0b00aa86cce8c501ebae7fd6157ea7))

### Features

- **engine:** init @lowdefy/engine package ([1604212](https://github.com/lowdefy/lowdefy/commit/160421241933611936321cdc64255a462384646a))
- **engine:** refactor validation messages and only eval visible ([a507cc3](https://github.com/lowdefy/lowdefy/commit/a507cc3ccb3506013bf66a3f14cebeabb374d742))
- **engine:** remove all empty objects from state as an effect of deleted values ([7cb2f2e](https://github.com/lowdefy/lowdefy/commit/7cb2f2e6fa6df1ed1ea4709c8567412602cce33e))
- **engine:** remove mutations ([68f8578](https://github.com/lowdefy/lowdefy/commit/68f85789eba4979d6ee77332250e649482d5127c))
- **engine:** validate action can be null = all, string = one or array = list of field names ([5a64c8b](https://github.com/lowdefy/lowdefy/commit/5a64c8b7b1dbf5594ec9865dd4a183cff8b8f018))
- add Apache-2.0 license ([3e2064e](https://github.com/lowdefy/lowdefy/commit/3e2064eef02dd71bb8987f8e126f9bef6cb7d01b))
- add type package ([d0c60c4](https://github.com/lowdefy/lowdefy/commit/d0c60c4bfab8ec9038f6cab67a87d658f6732dc9))
- remove fetch requests on page load, add async load actions ([1f396d6](https://github.com/lowdefy/lowdefy/commit/1f396d62ef204de1cde5ddeea0abe0bcf0c898c0))
- **engine, renderer:** move apollo cache block update to renderer ([778ff4a](https://github.com/lowdefy/lowdefy/commit/778ff4aa99ce986b4ad43629cec9e3b82bde714f))
