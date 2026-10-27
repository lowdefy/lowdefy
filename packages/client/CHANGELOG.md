# Change Log

## 7.2.0

### Minor Changes

- 4d72041: refactor(client): Move the platform-free client into @lowdefy/client-core

  The request, API call, error handling, page lifecycle, storage, websocket and auth code the web client and native shells share now lives in the new `@lowdefy/client-core`, which `@lowdefy/client` depends on. Web apps behave as before. A plugin that deep-imported one of these files from `@lowdefy/client` (such as `@lowdefy/client/request.js`, `createCallRequest.js`, `createHandleError.js`, `getContextKey.js`, `storage/*`, `websocket/*` or `auth/*`) imports it from `@lowdefy/client-core` instead.

### Patch Changes

- 029208c: fix(engine): Every mounted copy of a page re-renders when its state changes.

  A page context now keeps a set of React updaters per block (`createUpdaters`) instead of one, and each Block component adds its own while mounted and removes it on unmount. A native shell can show one page instance on two screens (in two tabs' stacks, or pushed again over itself); the copy that mounted last no longer takes the other's re-renders.

- e1cf57e: fix(client): A block render React throws away no longer keeps its updater

  A block registers its updater on render, as the engine can update it before its first commit, but only an unmount removed it. A render React discarded, such as a subtree a parent error boundary throws away, kept its updater until the page context was rebuilt. A render's registration now removes itself when no commit follows within a second, and a first commit later than that re-renders once to catch up. The native renderer's blocks do the same.

- f9cafb7: fix(client): Requests cancelled as the page unloads are no longer reported as errors

  Reloading a page, following a link to another page or closing the tab while a request or endpoint call is still loading made the browser cancel the call, which failed with `Failed to fetch` (or `Load failed` in Safari). The `Request` or `CallAPI` action then ran its catch actions and the failure was reported to the server log and error tracking, although the request had often reached the server and succeeded. A call that fails while the page is leaving is now held: it never finishes if the page goes, and fails as before if the page stays open for 10 seconds (a file download or a `mailto:` link starts leaving but stays) or is shown again with the browser's Back button. Other errors raised while the page is leaving, such as a `Fetch` action the browser cancels, log to the browser console only and are not sent to the server log. A network failure while the page stays open still fails the action and is reported as before.

- c84f275: fix(client): A sign-in that stays on the page renders the signed-in user before the action returns

  A sign-in with `callbackUrl: false`, which stays on the page, now finishes by asking the server who signed in, as `UpdateSession` does, and renders that user before the `Login` action returns. The next action in the chain, such as a request, is answered as the user the page shows. Before, that request could reload the page and lose the page's state. If the page cannot get the signed-in user from the server, it reloads in place rather than failing a sign-in that succeeded.

- 9419d09: Cap the dev tab's event and call histories (dev only), close idle headless browsers after 45 s and keep at most 10 rendered instances per page in the tab list.
- 3cd6d62: fix(client): a read the host fails is sent once more, and a non-JSON error says what happened

  A host can answer a request itself before the app runs, with a plain-text body: a serverless platform's own 500 ("A server error has occurred"), a gateway error or the request timeout's 504. The client parsed every error body as JSON, so the action failed with `Unexpected token 'A', "A server e"... is not valid JSON`.

  Such a response now becomes a `NonJsonResponseError` carrying the status and the start of the body. A 504 says "The request timed out. Try again." and any other status says "The server could not answer (status N). Try again." A page request that only reads is sent once more first, with a console warning: the build marks a request `readOnly` when its plugin's `requestMetas` say its type never writes and any pipeline it has is a literal list without `$out` or `$merge`. Writes, endpoint calls (`CallAPI`) and request types without metadata are never sent again, and a JSON error from the app is never retried.

- Updated dependencies [029208c]
- Updated dependencies [4d72041]
- Updated dependencies [9419d09]
- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [29fd1a6]
- Updated dependencies [10903fd]
- Updated dependencies [7416223]
- Updated dependencies [5b19a85]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [2ce6fa5]
- Updated dependencies [bb7c249]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [a461f7c]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/engine@7.2.0
  - @lowdefy/client-core@7.2.0
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/block-utils@7.2.0
  - @lowdefy/layout@7.2.0

## 7.1.0

### Patch Changes

- Updated dependencies [1e614fc]
- Updated dependencies [a589bb1]
  - @lowdefy/engine@7.1.0
  - @lowdefy/layout@7.1.0
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/errors@7.1.0
  - @lowdefy/helpers@7.1.0
  - @lowdefy/logger@7.1.0

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

- 36f864c: feat!: Lucide icons replace react-icons, with icon settings and icon-set plugins.

  Lowdefy icons are now [Lucide](https://lucide.dev) icons rendered by `lucide-react`. react-icons names such as `AiOutlineUser` no longer resolve. Run `lowdefy upgrade` to rewrite them, or follow the migration guide at `/v6-to-v7` in the docs.

  Breaking changes:

  - **Icon names.** Use a semantic name (`edit`, `delete`, `chevron-down`, …), a Lucide name in PascalCase (`Pencil`, `Trash`), or a set-qualified name (`lucide:Pencil`). An unknown name at an icon property fails the build with a suggestion; old react-icons and Ant Design names get a migration message.
  - **Block and Ant Design icons are Lucide.** Every icon a block chooses (validation marks, date picker calendar, menu and sidebar toggles, dark-mode switch, upload lists, pagination arrows, …) and Ant Design's own close, status, expand and loading icons now render through semantic names, so they follow the app's icon set and `theme.icons.aliases`.
  - **`theme.icons.aliases` targets lose the `Lu` prefix** (`LuPencil` → `Pencil`), and several semantic names now point at Lucide 1.x names (`delete` → `Trash`, `filter` → `Funnel`, `help` → `CircleQuestionMark`, `history` → `RotateCcwClock`).
  - **Icon hover titles** are generated from the new names ("Pencil", "Arrow left right").

  New:

  - **Icon settings.** `theme.icons.size` (default `1em`), `theme.icons.strokeWidth` (default `2`) and `theme.icons.nonScalingStroke` set app-wide defaults; every icon accepts `strokeWidth` and `nonScalingStroke`.
  - **Icon-set plugins.** A plugin declares `iconSets` in `types.js` and exports icon data from `./iconSets`. Sets are layered in plugin order - the last plugin wins per icon name, and a partial set falls through - so a plugin can add a single icon to `lucide` or replace one. `theme.icons.set` picks the default set for PascalCase names and can re-skin semantic names.
  - **`@lowdefy/icons-react-icons`** holds every react-icons 5.6.0 icon under its old name. Install it and set `theme.icons.set: react-icons` to keep old names, for example icon names stored in a database.
  - **`lowdefy upgrade`** gains a `7.0.0` phase that rewrites react-icons names to semantic or Lucide names from a table covering every Ant Design, Lucide and commonly used react-icons name.

  Fixes: the header locale selector and the AgGrid row menu icons now bundle in production builds, and the dev server reports unknown icon names on pages written inline in `lowdefy.yaml`.

### Minor Changes

- f7fa621: feat(agent): agent calls carry the page's path parameters

  `AgentChat` sends the page's `pathParams` with each call next to `urlQuery`, the agent route accepts them, and the page-context option adds a `pathParams` line to the agent's instructions when the page has any. A record id moved from the query into the page path is still known to the agent. Links in agent messages are resolved to their page and path values through the engine's path memory.

- 2dab826: chore: Update antd to 6.6.5 and Ant Design X to 2.9.0.

  antd moves from 6.3.1 to 6.6.5, `@ant-design/x` and `@ant-design/x-markdown` from 2.7.0 to 2.9.0,
  and `@ant-design/icons` from 6.1.0 to 6.3.4. Custom block plugins that import from `antd`
  directly should pin `antd@6.6.5` so the app keeps a single copy of antd.

- 660157b: Add app events. The `events` object at the root of `lowdefy.yaml` takes `onInit` and `onInitAsync` actions that run once each time the app loads in the browser, whichever page opens first, and do not run again on navigation. The app `onInit` runs before the first page's own events and keeps the page in its loading state until it finishes, so a page's `onInit` can read the global values it set. The app `onInitAsync` runs after it without blocking the page, and pages re-render when it sets global values. Use them to set up `global`, for example user settings fetched with `CallAPI`. App events run outside any page, so the build fails if one uses a page-scoped action (`SetState`, `Request`, `Validate`, `Reset`, `CallMethod`, ...) or operator (`_state`, `_input`, `_request`, ...). Errors display and log like page event errors, run the `catch` actions, and do not stop the page from loading.

  Closes #815.

- 1227e62: feat: Table, grid, Anchor and HTML links carry `pathParams`

  Links set as block properties fill a page path's placeholders with `pathParams`, next to `urlQuery`. In TableLight, Table and AgGrid cell and row links the values are row field paths, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { ticket_id: _id } }`. A relation cell defaults `urlQuery` to `{ _id: _id }` only when neither `urlQuery` nor `pathParams` is set. `Anchor` takes `pathParams`, and an HTML link takes `data-path-params` as a JSON object: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>`.

  AgGrid link and avatar link cells now build their href through the Lowdefy Link, so it includes the app's `basePath`. A plain click still emits `onCellLink` without navigating.

- 81a5ad3: Client navigation by path. The production, e2e and dev clients fetch pages by URL path and learn the page id and path values from the server. Each set of path values is its own page instance: `Client` keys the page tree by the instance key, so following a link from one ticket to another remounts the page, and passes `pathParams` to the page context. The engine keeps up to 10 instances per page and gives actions `getPathParams`. The shown page is written to the path memory before its context is built, and auth callbacks write their target before navigating. A navigation to the path the shown page was matched on skips the fetch, unless the page is dynamic. The router's location carries the path instead of a page id. `setUrlQuery` waits for a page refetch only on dynamic pages.
- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

- 239a3a7: feat: dates, numbers, avatars, copy buttons, truncation, text tones and confirmations in HTML.

  - **Dates.** `<time datetime="…" data-time="relative">` shows "3 hours ago" and keeps it current, with the exact time on hover. `date`, `datetime` and `time` use the app's locale, and any other value is a dayjs format. Dates show in the reader's time zone.
  - **Numbers.** `data-format` formats the element's number as `number`, `currency` (with `data-currency="USD"`), `percent`, `compact` or `bytes`, with the same formatting as the ag-grid `number` cells; `data-decimals` fixes the decimals.
  - **Avatars.** `data-avatar="Jane Doe"` renders initials in a theme colour, the same as the ag-grid `avatar` cells, and on an `<img>` replaces a missing or broken image. No image service is called.
  - **Copy.** `data-copy` adds an accessible copy button for the element's text or the attribute's value. The copy and check icons are always bundled, and the labels are the new `client.copy`, `client.copyValue`, `client.copied` and `client.copyFailed` translation keys.
  - **Truncation.** `data-truncate` (or `data-truncate="3"`) clamps text to 1–6 lines with an ellipsis and shows the full text in a tooltip only when it is cut off, the same clamp as the ag-grid `ellipsis` columns.
  - **Text tone.** `data-tone="secondary"` (also `tertiary`, `quaternary`, `success`, `warning`, `error`, `info`) colours text with theme tokens that follow dark mode.
  - **Confirm.** In `ClickableHtml`, `data-confirm="Delete this row?"` on a `data-event` element opens a themed confirmation first; only OK fires the event, once. Focus moves to Cancel and returns afterwards, and Escape cancels. A change to the HTML closes it without firing. A bare `data-confirm` asks the new `client.confirm` message ("Are you sure?").
  - **Keyboard.** Space now activates focusable `data-event` targets and popover triggers on key up, like a native button.

- 49490b6: feat: in-app links and status tags in HTML.

  - **Links.** In any HTML string, `<a data-page-id="contacts" data-url-query="_id=42">` links to an app page: Lowdefy sets the `href` (with the app's `basePath`), and a plain click opens the page without reloading the app, like a `Link` action. `data-link` does the same for an existing app-relative `href="/path"`; a `data-page-id` or `data-link` that does not resolve to a page of the app is left as written. `data-new-tab` opens any link in a new tab (sanitising removes `target`, so `target="_blank"` never worked in HTML). The build warns when a `data-page-id` in page config or in an API endpoint names a page that does not exist, with a suggestion for a likely typo.
  - **Status tags and dots.** `<span data-tag="success">Approved</span>` renders a tinted tag and `data-status="warning"` a status dot, in theme colours that follow dark mode. Values are antd status names and preset colours, CSS colours, or any other value, which picks a stable colour. HTML tags look exactly like the ag-grid `tag` cells: both now use the same formatting code in `@lowdefy/block-utils`.
  - **Docs.** A new HTML attributes page describes every attribute HTML understands, and the Html block's schema, hazards and examples teach agents to use them instead of hard-coded hrefs and inline-styled pills.

- a79fb1d: feat: semantic icon names, and icons, tooltips and popovers in HTML.

  - **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
  - **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. An open popover stays open with its new content when the HTML changes, as long as the new HTML still has its trigger. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
  - **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
  - **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.

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

- e6302c6: fix: Reload when the server answers as another caller

  Page, request and endpoint responses now carry an `x-lowdefy-caller` header naming who the server answered as: `<caller>; session=<hash>; roles=<hash>; memberships=<hash>`. `<caller>` is a short hash of the user id and active organization id, empty when anonymous. `session` hashes the session id, `roles` the caller's app roles and organization role (owner, admin or member) in the active organization, and `memberships` the ids of every organization the person belongs to (under the pinned organization policy, only the app's own organization). A field the server does not know is left out, such as `session` for an API key caller. The browser compares the header with the caller the page renders and reloads the page when the caller or their roles differ, so a page never keeps showing one person's or organization's data after a sign-in as someone else or an organization switch in another tab, and `_user.roles`, `_user.org_roles` and role-gated blocks always match the server. A new session or a changed list of organizations for the same person, organization and roles does not reload the page.

  - A request or endpoint call answered with a 401 while the page shows a signed-in user reloads the page, since the session has ended. A 403 from a page request reloads too; a 403 from an endpoint, and a two-factor enrolment refusal, are thrown as before.
  - When the session names a different user than the page renders, the page reloads instead of keeping the previous user rendered.
  - A kept page instance is rebuilt after `SetActiveOrganization` and `UpdateSession` instead of rendering the state and request results it had under the previous organization.
  - `CallAPI` results read by `_api` are dropped when the organization changes, so a result fetched for one organization is never read under another. Global state is left as it is.
  - A tab reloads at most once every 10 seconds for these reasons; a second difference inside that window fails the call with an `AuthenticationError` instead of reloading again.
  - `@lowdefy/helpers` exports `callerStamp`, `parseCallerStamp` and `rolesHash`.

- 3c2258c: Production pages load only the icons they use.

  Icons used to be one app-wide chunk that every page loaded, which is costly for apps with a long `theme.icons.include` list or the react-icons compatibility set. Each page's plugin chunk now carries its own icons: the names in its config and `_js` functions, the icons its blocks draw, and the icons in `menus` and `global`.

  - An icon name that only arrives at runtime (from state, a request, HTML built from data, `theme.icons.include`, or another page) still renders. The first time a page draws a bundled icon that is not one of its own, it loads the rest of the app's icons once; the icon keeps its space, empty, until they arrive. A `data-icon` name renders nothing until then.
  - A page whose Dynamic content names such an icon loads the app's icons before it first renders, and the HTML preloads them.
  - `Client` takes an optional `loadAllIcons` prop, and `createIcon` now takes `{ icons, loadAllIcons }`.

  No config changes. The dev server still loads every icon.

- 5017abe: feat: `_media` updates when the browser window is resized

  Blocks that use `_media` now re-evaluate when the window is resized, so `_media` can drive responsive `visible` conditions and properties the way CSS breakpoints do. The page keeps one resize listener, shared with the `onResize` event, and waits until the resize settles (150ms) before doing any work. Only blocks that read a `media` value that changed are re-evaluated: a block that reads `_media: size` updates when the window crosses a breakpoint, not on every pixel of a resize, and blocks that do not use `_media` are never touched. Blocks reading `_media` are also no longer re-evaluated on every unrelated page update.

  The `onResize` page event is now debounced by 150ms (was 200ms), and runs after `_media` blocks have been updated for the new size.

  Fixes #799.

### Patch Changes

- 4d08b55: fix: A role or sign-in refusal from a request or endpoint is an expected outcome in the browser

  When an auth gate refused a request or endpoint an action called (a 401 for a signed-out caller, a 403 for a caller without the role or without an enrolled second factor), the browser lost the error's class. The action failed as an `ActionError`, the refusal was posted to `/api/client-error` and logged at error level, and a journey that clicked the action failed with an app error.

  The browser now keeps the class of an expected outcome the server answers itself: `AuthenticationError`, `AuthorizationError`, `TwoFactorEnrolmentRequiredError`, and a `UserError` answered with a 400. The action still stops, its error message still shows and its `catch` actions still run, but the error logs to the browser console only, and journeys pass over it.

  This changes what a `catch` list reads. For a refused `Request` or `CallAPI`, `_error.name` (and `_actions.<id>.error.name`) is now the refusal's class (`AuthorizationError`, `AuthenticationError`, `TwoFactorEnrolmentRequiredError`, or `UserError` for a 400), not `ActionError`, with the same message and no `cause`, so a catch list can branch on the refusal. A page's own `CallAPI` payload that the endpoint's `payloadSchema` refuses is a `ConfigError`, not a `UserError`.

- 6144814: Allow only safe link schemes in block hrefs

  An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

  `@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.

- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- b2cdc5a: fix(client): A `callbackUrl` taken from the page query is only followed when it is a page of the app; otherwise sign-in continues to the home page.
- badaa49: Pages re-evaluate only the blocks whose inputs changed.

  Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

  - Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
  - `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
  - Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.

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

- 18f70ca: fix(client): A websocket connection closed after five idle seconds no longer disrupts the connection that replaces it, and a publish that timed out is not sent later.

  When the last feed on a page was unsubscribed, the idle connection was closed, but its close event could arrive after a new page had already started a new connection. The late event marked the new connection as closed, so the next subscribe or publish opened a second connection, and feeds could be subscribed on both and receive every message twice. A publish made while the connection was down was also sent once a connection opened, even if it had already failed with a timeout, so a retried publish could be delivered twice.

- 705498c: fix(client): Keep websocket subscriptions alive when a feed is subscribed again before its first subscribe is acknowledged.

  Unsubscribing and subscribing to the same websocket feed while the first subscribe was still waiting for the server (for example while the connection was opening) could silently drop the feed about ten seconds later, so it stopped receiving messages and was not resubscribed after a reconnect. The earlier subscribe now settles when it is replaced, and its timeout no longer affects the newer subscription. A subscribe resent after a reconnect now gets a fresh timeout instead of counting time spent reconnecting, and a resubscribe the server never answers now reports a "timed out" error through the subscription's `onError` event instead of leaving the feed disconnected with no error.

- 9c9b3d7: fix(client): Blocks without an onMount event no longer render as loading when they mount.

  Every block started out loading until its onMount event had run, even when it had none, so a Button that appeared after the page's first render (inside a Box whose `visible` turned true, or in a list row) drew disabled for its first frame and faded in from the disabled colour, and a click in that frame was lost. Only blocks with an onMount event now render as loading while it runs, and their children inherit that loading as before. Since such a block is no longer disabled on its first frame, `defaultOpen: true` on an AutoComplete now opens its dropdown when the page loads.

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

- f278706: fix: Websocket subscribes and unsubscribes are handled in the order they are sent, and each reply is matched to the subscribe it answers.

  The server handled a connection's frames concurrently, so an unsubscribe sent while a subscribe was still being set up ran first and removed nothing. The subscription and its source then kept running for a page that had left, until the connection closed. The server now handles each feed's frames in the order they arrive, while different feeds on a connection still run side by side, and a subscribe that finishes after its connection closed is removed.

  Subscribe frames now carry a `requestId` that the server echoes in its reply, so a late reply to a subscribe that a newer one replaced no longer settles or fails the newer subscribe. A server that does not echo the id is still matched by websocket id.

  The browser client also keeps an idle connection open until its publishes are answered, closes a connection that finishes opening after its last feed was unsubscribed, and resets its reconnect backoff only after a connection has stayed open for ten seconds, so a server that drops connections straight after accepting them is not retried every half second.

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

- 5634e63: fix(client): The page title follows state changes after the page has loaded

  The page's `title` was rendered beside the page block, so it kept the value it had at first render: a title read from state that an `onMount` request or a later action set stayed at its fallback until something else re-rendered the page, such as a navigation. The title now renders with the page block, so it changes whenever the page block's properties do, and each page instance shows its own title.

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

- 3eb3691: Tag colours are fixed and readable.

  - **Preset tag colours render as themselves.** purple, cyan, geekblue, gold, lime, magenta and volcano pointed at CSS variables antd doesn't define, so they fell back to blue, orange, red or green. `pink` is added.
  - **Tag text is readable.** Tags (Table, TableLight, ag-grid tag and progress cells, HTML `data-tag`/`data-status`) use antd Tag's fill, border and text shade, with the text mixed toward the base text colour. Every preset, status name and custom colour reaches at least 4.5:1 contrast in light and dark themes; gold text on its tint went from 1.75:1 to 6.4:1. red, orange, yellow, green and blue now take their base colour from antd's palette, as antd's Tag does, so status dots and rule colours shift slightly.
  - **An input-container's slots can render with their own loading state** (`content[slot](style, { loading })`). By default they still inherit the block's loading, so existing blocks are unchanged. The Table uses this so its toolbar and bulk-bar buttons stay usable while the page loads.

- 3aa6f39: fix(client): Clicking a container or list block shown as a loading skeleton no longer throws

  A container skeleton (for example `skeleton: { type: Card }`) and a list skeleton were rendered with no block methods, so a block that calls `methods.triggerEvent` on click, like `Card`, threw `TypeError: triggerEvent is not a function`. Every skeleton block now gets the same no-op methods.

- 44e8f29: fix(client,server): a tab left open across a deploy reloads instead of calling the new build with old config

  A tab that loaded before a deploy, or that the browser restored from its cache,
  kept sending its old page's requests, endpoint calls and auth calls to the new
  server. A request or endpoint the new build renamed or removed failed, and one
  whose payload changed shape could run with the wrong data. Each request and
  endpoint call now names the build its page came from, and the production
  server refuses a call from another build before running it; the tab reloads
  once onto the current build. An auth call that fails against a newer build
  reloads the tab the same way. Calls that name no build, such as third-party
  webhooks, run as before.

- 088b117: fix(client): A websocket subscribe that times out or is refused leaves nothing open

  A subscribe whose acknowledgement times out on an open connection now sends an unsubscribe, so a server that handles the frame late does not open a feed nobody reads. A subscribe that times out or is refused also lets an otherwise idle connection close.

- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [660157b]
- Updated dependencies [4d08b55]
- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [6144814]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [575a5ee]
- Updated dependencies [81a5ad3]
- Updated dependencies [2595439]
- Updated dependencies [badaa49]
- Updated dependencies [f9e483f]
- Updated dependencies [550be9f]
- Updated dependencies [eaf9cf8]
- Updated dependencies [0f56696]
- Updated dependencies [eaf9cf8]
- Updated dependencies [42bc1ac]
- Updated dependencies [b308c78]
- Updated dependencies [3688c5f]
- Updated dependencies [a1367df]
- Updated dependencies [7c20d1b]
- Updated dependencies [6b3a9bb]
- Updated dependencies [4a35ba2]
- Updated dependencies [36f864c]
- Updated dependencies [b56bb7a]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [8c50bfc]
- Updated dependencies [760b660]
- Updated dependencies [4943f2d]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [a79fb1d]
- Updated dependencies [1766343]
- Updated dependencies [c3e0d79]
- Updated dependencies [2c04c5b]
- Updated dependencies [08f76bb]
- Updated dependencies [e5cffa6]
- Updated dependencies [a34939d]
- Updated dependencies [db99f9f]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [3eb3691]
- Updated dependencies [5017abe]
- Updated dependencies [effdeb3]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [fa02e14]
- Updated dependencies [537bf54]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/engine@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/block-utils@7.0.0
  - @lowdefy/layout@7.0.0
  - @lowdefy/logger@7.0.0

## 6.1.0

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

- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/engine@6.1.0
  - @lowdefy/errors@6.1.0
  - @lowdefy/logger@6.1.0
  - @lowdefy/layout@6.1.0

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

- 6446ae6: fix: Fix dynamic page navigation and dev server port detection.

  - **lowdefy (CLI)**: Port availability checks now probe loopback addresses (`127.0.0.1`, `::1`) in addition to the wildcard bind, so `dev`/`start` no longer report a port held by another local process as free.
  - **@lowdefy/client**: Fixed a blank page that could appear when navigating to a page with server-resolved dynamic content — the page config is now memoized correctly and the page tree remounts when new dynamic content is resolved.
  - **@lowdefy/helpers**: Added `getOperatorType`, a small shared utility for detecting operator objects in config.
  - **@lowdefy/node-utils**: Added `findAvailablePort` and `isPortAvailable` utilities (moved from the CLI) for reuse across dev tooling.

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

- 53a36ed: feat(actions): Link action accepts `replace` and `scroll`.

  A same-page `Link` that only reflects state into the `urlQuery` no longer has to jump the page to
  the top or push a history entry per click: `scroll: false` keeps the current scroll position and
  `replace: true` swaps the current history entry instead of pushing one. The router and the `<Link>`
  block component already supported both; the Link action's same-origin path now forwards them too.

- Updated dependencies [da0c62c]
- Updated dependencies [37c8c14]
- Updated dependencies [0dccf40]
- Updated dependencies [e0a06a2]
- Updated dependencies [efd1967]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
- Updated dependencies [ae5f618]
  - @lowdefy/logger@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/engine@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/layout@6.0.0
  - @lowdefy/block-utils@6.0.0

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

- Updated dependencies [0ec9154]
- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [508708d]
- Updated dependencies [bb02f06]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/engine@5.6.0
  - @lowdefy/helpers@5.6.0
  - @lowdefy/layout@5.6.0
  - @lowdefy/logger@5.6.0
  - @lowdefy/block-utils@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/engine@5.5.1
- @lowdefy/layout@5.5.1
- @lowdefy/block-utils@5.5.1
- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1
- @lowdefy/logger@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/engine@5.5.0
- @lowdefy/layout@5.5.0
- @lowdefy/block-utils@5.5.0
- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0
- @lowdefy/logger@5.5.0

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

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/engine@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/layout@5.4.0
  - @lowdefy/logger@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/engine@5.3.0
- @lowdefy/layout@5.3.0
- @lowdefy/block-utils@5.3.0
- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0
- @lowdefy/logger@5.3.0

## 5.2.0

### Patch Changes

- 01e249b: feat(blocks-antd): `ControlledList` now fires `onAdd` / `onRemove` events and defaults the remove icon to the antd error color at a standard size.

  **Events.** Both events fire **after** the list mutation completes. The event payload is `{ index, item }`:

  - `onAdd` — `index` is where the new row was inserted (`0` for `addToFront: true`, else `list.length`). `item` is the newly added value (typically `undefined` for an empty row).
  - `onRemove` — `index` is the removed row's position. `item` is the row value captured before removal, so handlers can reference the deleted data (e.g., `_event: item._id` to delete from a backend).

  ```yaml
  - id: tags
    type: ControlledList
    events:
      onRemove:
        - id: notify
          type: DisplayMessage
          params:
            content:
              _string.concat: ['Removed at index ', { _event: index }]
    blocks:
      - id: tags.$.label
        type: TextInput
  ```

  **Remove icon styling.** The remove icon now defaults to `var(--ant-color-error)` at `var(--ant-font-size-lg)`, with `--ant-color-error-hover` / `--ant-color-error-active` on hover/press — no more hardcoded hex colors, and the size no longer swings with `properties.size`. Override via `class.removeIcon` / `style.removeIcon` (both slots target the icon wrapper). Existing configs that hardcoded `color: '#ff4d4f'` on `removeItemIcon` can drop it — the default is already danger.

  **`@lowdefy/client`** also now passes the list's current state value to list-type block components via a `value` prop, so any list block can read its own array data.

- a4ecee5: fix(client): Skip rendering content slots that have no blocks.

  `Container`, `InputContainer`, and `List` no longer create a `content[slotKey]` function when the slot's blocks array is empty. Blocks that use the `content.X && content.X()` pattern (for optional header, footer, extra, etc.) now correctly render nothing — including no wrapping `Area` element — when the user leaves the slot empty.

- 6ec0dd4: fix(client): Forward `style` prop to all Link variants.

  `createLinkComponent` previously destructured every prop except `style`, so any `<Link style={...}>` passed by a block was silently dropped. Inline style overrides only worked via `className` + CSS. All four link variants (`backLink`, `newOriginLink`, `sameOriginLink` — both newTab and same-origin branches — and `noLink`) now thread `style` through to the rendered `<a>` (or `<span>` for `noLink`).

  Surfaces fixes in three places that were already passing `style` and silently broken: `headerActions.js` notifications/profile/dark-mode rows had `color: 'inherit'` that didn't reach the `<a>` (label rendered as antd link blue); `Anchor.js` disabled state set `color: '#BEBEBE'` that never applied; `buildMenuItems.js` per-link `style:` config was discarded.

- Updated dependencies [1d18a13]
- Updated dependencies [d105b81]
- Updated dependencies [e3fc007]
  - @lowdefy/engine@5.2.0
  - @lowdefy/logger@5.2.0
  - @lowdefy/layout@5.2.0
  - @lowdefy/block-utils@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0

## 5.1.0

### Minor Changes

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

### Patch Changes

- f56a47d87: fix(server): Prevent white flash on page navigation in dark mode.

  Pages no longer flash white when navigating between pages in dark mode. A synchronous inline script now sets the correct background color before the page paints, matching the user's dark mode preference from config, localStorage, or system settings.

  - @lowdefy/engine@5.1.0
  - @lowdefy/layout@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/logger@5.1.0

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

- f430f02dde: Replace antd Row/Col grid with a pure CSS grid layout system.

  ### Breaking Changes

  - **antd Grid dependency removed**: `@lowdefy/layout` no longer imports antd's `Row`, `Col`, or `Grid` components.
  - **CSS Grid implementation**: Layout uses a 24-column CSS grid with CSS custom properties and media queries. Responsive breakpoints align with Tailwind CSS v4.
  - **`span: 0` hides block**: Setting `layout.span: 0` now applies `display: none` instead of making the block full-width.
  - **Responsive `style` breakpoints removed**: `style.sm`, `style.md` etc. no longer work. Use Tailwind classes via `class: "p-16 sm:p-8"` instead.
  - **`_media` operator**: Returns `"2xl"` instead of `"xxl"` for the largest breakpoint (1536px instead of 1600px).

  ### Renamed Layout Properties

  The `content*` prefix is dropped. Build normalizes old names with a deprecation warning.

  | Old                       | New                | Purpose                        |
  | ------------------------- | ------------------ | ------------------------------ |
  | `layout.contentGutter`    | `layout.gap`       | Spacing between child blocks   |
  | `layout.contentAlign`     | `layout.align`     | Vertical alignment of children |
  | `layout.contentJustify`   | `layout.justify`   | Horizontal distribution        |
  | `layout.contentDirection` | `layout.direction` | Flex direction                 |
  | `layout.contentWrap`      | `layout.wrap`      | Flex wrap                      |
  | `layout.contentOverflow`  | `layout.overflow`  | Overflow behavior              |
  | `slots.*.gutter`          | `slots.*.gap`      | Gap within a slot              |
  | `xxl` breakpoint          | `2xl`              | Aligns with Tailwind v4        |

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

- f430f02dde: Add ErrorBar component to the development server that displays build errors and warnings in a fixed bottom bar. Build warnings now propagate from the build pipeline to the browser for immediate developer feedback.
- 130a569d36: Add keyboard shortcut support for block events.

  Blocks can now define keyboard shortcuts on events using the `shortcut` property in the event long-form object. Shortcuts are platform-aware (`mod+K` maps to Cmd+K on Mac, Ctrl+K on Windows), support sequences (`g i`), and can be arrays for multiple bindings.

  - **Build validation** warns on duplicate shortcuts within a page and conflicts with browser defaults (e.g. `mod+N`)
  - **ShortcutManager** registers a single global keydown listener via tinykeys with visibility gating and input field suppression
  - **ShortcutBadge** component renders platform-appropriate key symbols (e.g. `⌘ K`) and is available to all blocks via `components.ShortcutBadge`
  - **ShortcutBadge in blocks**: Button, Anchor, Tag, and Search blocks display a platform-aware keyboard shortcut badge (e.g. `⌘S` / `Ctrl+S`) next to the title when the event has a `shortcut` defined

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

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [130a569d36]
- Updated dependencies [905d5d406]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/engine@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/engine@4.7.3
- @lowdefy/layout@4.7.3
- @lowdefy/block-utils@4.7.3
- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3
- @lowdefy/logger@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/engine@4.7.2
- @lowdefy/layout@4.7.2
- @lowdefy/block-utils@4.7.2
- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2
- @lowdefy/logger@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/engine@4.7.1
- @lowdefy/layout@4.7.1
- @lowdefy/block-utils@4.7.1
- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1
- @lowdefy/logger@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/engine@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- 5e03091ee: Add e2e testing package for Lowdefy apps

  **@lowdefy/e2e-utils** (new package)

  - Locator-first API via `ldf` Playwright fixture: `ldf.block('id').do.*`, `ldf.block('id').expect.*`
  - Request mocking with static YAML files (`mocks.yaml`) and inline per-test overrides
  - Request assertion API: `ldf.request('id').expect.toFinish()`, `.toHaveResponse()`, `.toHavePayload()`
  - State and URL assertions: `ldf.state('key').expect.toBe()`, `ldf.url().expect.toBe()`
  - Manifest generation from build artifacts for block type resolution and helper loading
  - `createConfig()` and `createMultiAppConfig()` for Playwright config with automatic build/server management
  - Scaffold command (`npx @lowdefy/e2e-utils`) for project setup with templates and dependency management
  - Block helper factory with auto-provided expect methods (visible, hidden, disabled, validation)

  **@lowdefy/cli**

  - Add `--server` option to `lowdefy build` for server variant selection (e.g., `--server e2e`)

  **@lowdefy/client**

  - Expose `window.lowdefy` when `stage="e2e"` for e2e state/validation access

  **@lowdefy/blocks-antd**

  - Flatten e2e helper APIs for polymorphic proxy compatibility
  - Add TextArea e2e helper

  **@lowdefy/block-dev-e2e**

  - Remove unused srcDir variable

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

- Updated dependencies [7936ee3fd8]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [f673e3ab3]
  - @lowdefy/engine@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0

## 4.5.2

### Patch Changes

- d573e8ff8: Add guard to prevent TypeError in icon `formatTitle`.
  - @lowdefy/engine@4.5.2
  - @lowdefy/layout@4.5.2
  - @lowdefy/block-utils@4.5.2
  - @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/engine@4.5.1
- @lowdefy/layout@4.5.1
- @lowdefy/block-utils@4.5.1
- @lowdefy/helpers@4.5.1

## 4.5.0

### Minor Changes

- d9512d9be: - Refactor build to create individual block instances.
  - Add hybrid block type to extend block functionality.

### Patch Changes

- 4f610de5c: Allow custom icon titles and format the icon name if a title is not specified.
- Updated dependencies [d9512d9be]
  - @lowdefy/engine@4.5.0
  - @lowdefy/layout@4.5.0
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/engine@4.4.0
- @lowdefy/layout@4.4.0
- @lowdefy/block-utils@4.4.0
- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/engine@4.3.2
- @lowdefy/layout@4.3.2
- @lowdefy/block-utils@4.3.2
- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/engine@4.3.1
- @lowdefy/layout@4.3.1
- @lowdefy/block-utils@4.3.1
- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/engine@4.3.0
- @lowdefy/layout@4.3.0
- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/engine@4.2.2
- @lowdefy/layout@4.2.2
- @lowdefy/block-utils@4.2.2
- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/layout@4.2.1
  - @lowdefy/engine@4.2.1
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- 47d855918: Move layoutParamsToArea into Area component.
- 47d855918: Remove highlightBorders from layout.
- Updated dependencies [47d855918]
- Updated dependencies [47d855918]
  - @lowdefy/layout@4.2.0
  - @lowdefy/engine@4.2.0
  - @lowdefy/block-utils@4.2.0
  - @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [d040e3005]
  - @lowdefy/engine@4.1.0
  - @lowdefy/layout@4.1.0
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/engine@4.0.2
- @lowdefy/layout@4.0.2
- @lowdefy/block-utils@4.0.2
- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/engine@4.0.1
- @lowdefy/layout@4.0.1
- @lowdefy/block-utils@4.0.1
- @lowdefy/helpers@4.0.1

## 4.0.0

### Minor Changes

- f44cfa0cb: Add built with lowdefy branding to servers.

### Patch Changes

- e694f72ee: Add a message to Link Action to inform when popups are blocked.
- 84e479d11: Fix show branding logic.
  Change invalid license throws to return invalid license objects.
  - @lowdefy/engine@4.0.0
  - @lowdefy/layout@4.0.0
  - @lowdefy/block-utils@4.0.0
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- Auth methods should return signin promises. ([5dcb778](https://github.com/lowdefy/lowdefy/commit/5dcb7788f54c07f6b5e4f3e9cf3d27537a795bb4))
- Fix basePath on requests. ([a2b4aaf](https://github.com/lowdefy/lowdefy/commit/a2b4aaf19ba6a5ccf213e7d08a2df342794d4420)), closes [#1554](https://github.com/lowdefy/lowdefy/issues/1554)
- Fix initialisation of lowdefy context object. ([2ed4398](https://github.com/lowdefy/lowdefy/commit/2ed4398d59be5b037e7a4d17f7e5a14398e73973))

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Features

- deserialize client config. ([1f82002](https://github.com/lowdefy/lowdefy/commit/1f820025445567c5f1f0f146c3a84941a5eece24))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **client:** Allow onClick to be passed down to Link component. ([718a352](https://github.com/lowdefy/lowdefy/commit/718a35259ac111cc385df098c069957095ff1413))
- **client:** Update how Link handles onClick. ([622ec8c](https://github.com/lowdefy/lowdefy/commit/622ec8cf94b111862098325629e69fbc3cd28123))
- **deps:** Update dependency @ant-design/icons ([497ff67](https://github.com/lowdefy/lowdefy/commit/497ff672a3f90c3fa00fa1d0839168a71702f456))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **engine:** Update Link to allow use of href. ([d00344a](https://github.com/lowdefy/lowdefy/commit/d00344adf2c36291878abb87b725893327853012))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))
- **tests:** Fix jest tests for es modules. ([0dc3bed](https://github.com/lowdefy/lowdefy/commit/0dc3bede2f7f3e4bb9096fcfe43da7c43fd4f7b5))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- Read urlQuery from location where used, not on lowdefy. ([11541e4](https://github.com/lowdefy/lowdefy/commit/11541e4722359bb57bace8298fc475caf58dbf6e))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Features

- Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
- **client:** Remove area and layout default object. ([27a56f1](https://github.com/lowdefy/lowdefy/commit/27a56f18e6e71faa51696d014b41b97744a3ff57))
- **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))

### Features

- Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
- Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
- **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))

### Features

- Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
- Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- **engine:** RootBlocks.map to use blockId. ([d31064f](https://github.com/lowdefy/lowdefy/commit/d31064ff9c685d1ae959ce9142ac11aca55fb6c0))
- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))
- Set login providerId if only one provider is configured. ([8bc34a1](https://github.com/lowdefy/lowdefy/commit/8bc34a1b0533e6231bfdc2655ba48e1df701a772))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Bug Fixes

- **client:** Clean up use effect hook. ([413c697](https://github.com/lowdefy/lowdefy/commit/413c697a08c429c39100f9a23298e591bc194ed4))
- **client:** On mount async method should always be called. ([912e405](https://github.com/lowdefy/lowdefy/commit/912e40522999e8e8b7eb65ec2855f43fab9c759b))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Adapt createAuthMethods for client package. ([4675297](https://github.com/lowdefy/lowdefy/commit/467529780bc1c90a089f6b157e264e5fbe10ca63))
- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- **client:** Fix setupLink - createLink needs lowdefy for input. ([314f131](https://github.com/lowdefy/lowdefy/commit/314f131ceb82bc39cf339dd2e6dfdf56aadb8543))
- Remove user from block properties. ([7cadf63](https://github.com/lowdefy/lowdefy/commit/7cadf6389a3c50fafbb4834f099e6514cad790bd))

### Features

- Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
- **server:** Add read user object from next-auth session. ([fbab7f1](https://github.com/lowdefy/lowdefy/commit/fbab7f14e7a23fcc82f4a7e1903c4aafdda8169d))
- Use next-auth session to authenticate in api. ([462c0ac](https://github.com/lowdefy/lowdefy/commit/462c0ac0d05429514ecd2a2b11a6a21b8915b462))

### BREAKING CHANGES

- Removed user from block properties.

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/client

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **client:** Fix setupLink - createLink needs lowdefy for input. ([f152ac2](https://github.com/lowdefy/lowdefy/commit/f152ac2c5ef0bf3dc085fbe7e89648ac2ca7c550))
- **client:** Render progress bar next to context, and event order fixes. ([fc32c75](https://github.com/lowdefy/lowdefy/commit/fc32c75ea2d8c5c97e21280b09fce5518ec14d37))

### Features

- **client:** Add display message implementation. ([f94ee32](https://github.com/lowdefy/lowdefy/commit/f94ee32a797b61b5f0f2bcc4de429b815f6de864))
- **client:** Apply reset context flag to recreate context on client. ([09f49a2](https://github.com/lowdefy/lowdefy/commit/09f49a2072f2803268b20f69655e03a57ef8f097))
- **client:** Init @lowdefy/client. ([bb7931d](https://github.com/lowdefy/lowdefy/commit/bb7931d0da4ca3614ae4223ca19663a9088d2a45))
