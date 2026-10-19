# @lowdefy/server-enterprise

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

- 3a28594: chore!: Node.js 24 is now the minimum supported version.

  **Breaking:** Lowdefy no longer supports Node.js 22. Upgrade to Node.js 24 or newer before
  upgrading Lowdefy.

  - The CLI and the servers declare `"node": ">=24"` in `engines`, and the CLI refuses to start on
    a Node.js version below 24.
  - `lowdefy init-docker` generates a Dockerfile on `node:24-slim`. Apps with a Dockerfile generated
    by an earlier version should change their `FROM node:22-slim` lines to `node:24-slim`.
  - The Vercel build output declares the `nodejs24.x` function runtime, and the README that
    `lowdefy init-vercel` writes lists the Node.js 24 project setting the install and build steps need.

### Minor Changes

- f7fa621: feat(agent): agent calls carry the page's path parameters

  `AgentChat` sends the page's `pathParams` with each call next to `urlQuery`, the agent route accepts them, and the page-context option adds a `pathParams` line to the agent's instructions when the page has any. A record id moved from the query into the page path is still known to the agent. Links in agent messages are resolved to their page and path values through the engine's path memory.

- 099d412: AgentChat: send `sharedState` as read-only context

  - **`sharedStateReadOnly: boolean`** (default `false`). When `true`, the block still sends `sharedState` with each turn (to `_payload`, and to the agent's context block with `pageContext: true`), but the server does not register the `update-page-state` tool, so the model is never offered a write to page state. Use it to give an agent context such as the current time or the record on screen when some of those values are also bound to inputs the agent should not change. Without it, an app that wanted context but no writes had to list every other tool in the agent's `activeTools`.

- 07a67b5: AI requests take `maxOutputTokens` and `timeout`, and a closed request cancels its model call.

  - `GenerateText`, `GenerateObject` and `Decide` take `timeout`: the milliseconds a model call may take, retries included, before it is cancelled. `Decide` also takes `maxOutputTokens`.
  - The `Anthropic`, `OpenAI`, `Google` and `AIGateway` connections take `maxOutputTokens` and `timeout` as defaults for every request and agent on the connection that does not set its own.
  - Request resolvers receive `signal`, which aborts when the request that started the work closes: when the server's request timeout (`config.requestTimeout`) answers first, or, on the Node server, when the client disconnects. The AI requests pass it to the model call, so a call that nobody is waiting for stops instead of running, and billing, to its end. A call stopped by the request timeout fails with a `ServiceError`. A call stopped because the client left fails with a `UserError`, which is logged as a warning.
  - Work that outlives its request is not cancelled with it: endpoints with `async: true`, detached runs, and agent chat turns, which still run to their end so `onFinish` hooks save the conversation. A `CallAgent` step is cancelled with the routine that runs it.

  A synchronous routine that kept running after its request timed out now has its AI calls cancelled at the timeout. Use `async: true` for work that takes longer than `config.requestTimeout`.

- 2dab826: chore: Update antd to 6.6.5 and Ant Design X to 2.9.0.

  antd moves from 6.3.1 to 6.6.5, `@ant-design/x` and `@ant-design/x-markdown` from 2.7.0 to 2.9.0,
  and `@ant-design/icons` from 6.1.0 to 6.3.4. Custom block plugins that import from `antd`
  directly should pin `antd@6.6.5` so the app keeps a single copy of antd.

- 81a5ad3: Client navigation by path. The production, e2e and dev clients fetch pages by URL path and learn the page id and path values from the server. Each set of path values is its own page instance: `Client` keys the page tree by the instance key, so following a link from one ticket to another remounts the page, and passes `pathParams` to the page context. The engine keeps up to 10 instances per page and gives actions `getPathParams`. The shown page is written to the path memory before its context is built, and auth callbacks write their target before navigating. A navigation to the path the shown page was matched on skips the fetch, unless the page is dynamic. The router's location carries the path instead of a page id. `setUrlQuery` waits for a page refetch only on dynamic pages.
- 8c68631: feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

  - **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
  - **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
  - **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
  - **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

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

- 60fb714: feat: Member tokens for MCP scripts

  A script that runs on its own can now call an app's MCP tools with a long-lived **member token** instead of an OAuth grant, which a crashed refresh can sign out with no way back short of a person signing in again. A member creates a token for themselves from a signed-in session with the new `CreateMcpToken` auth step, choosing an expiry in days or none. The script sends it as `Authorization: Bearer ldf_mcp_…` to `/api/mcp` and is served as that member, with their roles and organization, exactly as an OAuth-connected assistant is (`_user.auth_method` is `'mcp'`).

  - Tokens are stored hashed in the new `user-mcp-tokens` auth collection, created only in apps that set `auth.oauthProvider`.
  - `RevokeMcpToken` switches off one of the caller's own tokens; `RevokeOrgMcpToken` lets owners and admins switch off any token in their organization. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.
  - A token stops working when its member leaves, is removed or is banned. A refused token gets a `401` whose `error_description` says why.
  - A banned user's OAuth access tokens are refused on `/api/mcp` too.

  See "Tokens for scripts" on the MCP Server & OAuth docs page.

- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- e6302c6: fix: Reload when the server answers as another caller

  Page, request and endpoint responses now carry an `x-lowdefy-caller` header naming who the server answered as: `<caller>; session=<hash>; roles=<hash>; memberships=<hash>`. `<caller>` is a short hash of the user id and active organization id, empty when anonymous. `session` hashes the session id, `roles` the caller's app roles and organization role (owner, admin or member) in the active organization, and `memberships` the ids of every organization the person belongs to (under the pinned organization policy, only the app's own organization). A field the server does not know is left out, such as `session` for an API key caller. The browser compares the header with the caller the page renders and reloads the page when the caller or their roles differ, so a page never keeps showing one person's or organization's data after a sign-in as someone else or an organization switch in another tab, and `_user.roles`, `_user.org_roles` and role-gated blocks always match the server. A new session or a changed list of organizations for the same person, organization and roles does not reload the page.

  - A request or endpoint call answered with a 401 while the page shows a signed-in user reloads the page, since the session has ended. A 403 from a page request reloads too; a 403 from an endpoint, and a two-factor enrolment refusal, are thrown as before.
  - When the session names a different user than the page renders, the page reloads instead of keeping the previous user rendered.
  - A kept page instance is rebuilt after `SetActiveOrganization` and `UpdateSession` instead of rendering the state and request results it had under the previous organization.
  - `CallAPI` results read by `_api` are dropped when the organization changes, so a result fetched for one organization is never read under another. Global state is left as it is.
  - A tab reloads at most once every 10 seconds for these reasons; a second difference inside that window fails the call with an `AuthenticationError` instead of reloading again.
  - `@lowdefy/helpers` exports `callerStamp`, `parseCallerStamp` and `rolesHash`.

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

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- 3c2258c: Production pages load only the icons they use.

  Icons used to be one app-wide chunk that every page loaded, which is costly for apps with a long `theme.icons.include` list or the react-icons compatibility set. Each page's plugin chunk now carries its own icons: the names in its config and `_js` functions, the icons its blocks draw, and the icons in `menus` and `global`.

  - An icon name that only arrives at runtime (from state, a request, HTML built from data, `theme.icons.include`, or another page) still renders. The first time a page draws a bundled icon that is not one of its own, it loads the rest of the app's icons once; the icon keeps its space, empty, until they arrive. A `data-icon` name renders nothing until then.
  - A page whose Dynamic content names such an icon loads the app's icons before it first renders, and the HTML preloads them.
  - `Client` takes an optional `loadAllIcons` prop, and `createIcon` now takes `{ icons, loadAllIcons }`.

  No config changes. The dev server still loads every icon.

- 6dc9114: feat: Page routes match request paths to pages

  - The HTML page route and `/api/page/*` take the request path and match it to a page, so a page with a `path` pattern such as `{space}/tickets/{ticket_id}` is served at `/support/tickets/1234`. A page without `path` is still served at its id, so `/api/page/{pageId}` keeps working.
  - `/` (home) and `/404` stay fixed routes ahead of the matcher. When `homePageId` is unset, `/` redirects to the first menu link's URL built with its `pathParams`; a configured home page with a fixed `path` is served at `/`.
  - The first-load payload and the `/api/page/*` response carry `pageId`, `pathParams` and `matchedPath` (the matched path without `basePath` or one trailing `/`) next to `pageConfig`.
  - The sign-in and two-factor enrolment `callbackUrl` is the requested path plus query on every route; the `/api/page/*` sign-in redirect used to drop the query.
  - The dev server matches the path against the route table, JIT-builds the matched page, and returns `{ pageId, pathParams, matchedPath, pageConfig }`.
  - In `@lowdefy/e2e-utils`, `goto` and `waitForPage` take `{ pageId, path, pathParams, urlQuery }` and build the URL under the app's `basePath`; a string target is used as written. The ready check and the state, request, validation and `setUrlQuery` helpers read the page instance on screen, so a patterned page's instances are told apart.

- ae3541c: feat: Lowdefy servers stop when whatever started them stops

  A Lowdefy server started by a test runner, a script or a coding agent's command could outlive it when that process was killed or timed out, and keep holding a few hundred megabytes of memory for days. Servers now stop with their owner, however it ends.

  - **`lowdefy start`, `lowdefy dev` and `lowdefy test`** start the server with node directly (no `pnpm run start` in between), forward SIGINT, SIGTERM and SIGHUP to it, and hold its stdin, so the server stops even when the CLI is killed outright. The dev server's Vite process stops when the dev manager is killed. A server run directly with `node`, as in a Docker image or on Vercel, behaves as before.
  - **`--exit-with-pid <pid>`** on `lowdefy start` and `lowdefy dev`, or the `LOWDEFY_EXIT_WITH_PID` environment variable, stops the server when that process exits. The variable passes through wrappers such as `pnpm exec`, `npx` or a secrets manager.
  - **Test tools set it for you.** The Playwright configs from `@lowdefy/e2e-utils` and `@lowdefy/block-dev-e2e` tie the server to the Playwright run, so a killed or timed-out run leaves no server behind.
  - **`startServer`** from `@lowdefy/e2e-utils/startServer` builds and starts an app's e2e server for other test runners (a vitest or Jest `globalSetup`) and scripts, tied to the calling process, and returns `stop()`.
  - **`@lowdefy/e2e-utils` no longer reuses a running server by default.** A server left on the port would serve an old build to new tests. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse one (for example after `pnpm e2e:server`), and `LOWDEFY_E2E_PORT` to move a run to another port.
  - **`lowdefy hub ps`** lists the Lowdefy servers running on the machine and the process that owns each. **`lowdefy hub prune`** lists the servers whose owner is gone, and `--kill` stops them. It also finds servers kept running by a `lowdefy` CLI whose own starter was killed (such as a `pnpm exec` wrapper killed outright) and servers left running by older Lowdefy versions (including a dev server's Vite process left behind by a killed dev server), and never stops a server whose owner is alive and still has its own starter, or one run as a launchd or systemd service. Servers record themselves in `~/.lowdefy/servers` (moved by `LOWDEFY_HOME`), and the hub prunes servers whose owner is gone each time it starts. On Windows, servers are identified by their process creation time, so `prune` works there for servers that record themselves.

- 537bf54: New table blocks: `Table`, `TableInput` and `TableLight`

  Three blocks with the antd look, sharing one column model and one set of cell types. The ag-grid blocks are unchanged.

  - **`Table`** (new package `@lowdefy/blocks-table`, installed by default) is built for large datasets and record lists. Rows and columns are virtualised, so 100k rows × 50 columns scroll smoothly. It has:

    - sort, column resize and reorder, pinned columns, a header menu with column filters, and a column manager, all on by default;
    - an optional toolbar with search, quick filters, a nested And/Or filter builder, grouping, density and CSV export (cells that start like a spreadsheet formula, `=`, `+`, `-` or `@`, are exported as text, so an opened file never runs them);
    - saved views, and optional persistence in the browser or the URL (browser persistence,
      `persist.storage: local`, is kept per signed-in user and cleared at sign-out);
    - row selection with a bulk-action bar;
    - grouping with per-group totals, tree rows, expandable detail rows, and a summary footer;
    - keyboard navigation and inline editing;
    - row drag reorder, and server mode.

    Its value is the table's state (`{ view, selected, expanded }`), so `_state: <id>.selected` is always the selection and `_state: <id>.view` the current view.

  - **`TableInput`** edits rows in a form. Its value is a changeset of only what changed (`{ updated, added, removed, moved?, order? }`), never the rows themselves, so page state stays small. Row drag uses fractional positions, so moving a row writes one field.
  - **`TableLight`** (in `@lowdefy/blocks-antd`) is antd's own `Table` for small tables and adds no dependencies. Its config is a strict subset of `Table`'s: to switch, change the `type`.
  - **Columns** declare a `type` that drives display, sorting, filter operators, totals, the editor and export:

    - text, number, currency, percent, date, datetime, boolean;
    - tag, tags, status, avatar, people;
    - link, email, phone, url, relation;
    - progress, rating, image, html (nunjucks templates), json;
    - buttons, menu.

    An `avatar` column takes `descriptionField`, a row path shown as a second line under the name,
    such as a person's email; the table then needs `size: default` or `size: comfortable`.
    `options` give enum values a label and colour in one place. `rules` and `rowRules` add conditional formatting with the same condition language as filters, with no `_function` needed. `rowLink` makes rows real links.

  - `@lowdefy/block-utils` exports `getHtmlEnhancements`, so blocks can navigate the same way the `Link` action does, and it reuses `Intl.NumberFormat` instances when formatting.

- 7623c86: The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

  - Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
  - On Vercel the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
  - The production request and error logs record the resolved address as `client_address`.
  - `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
  - In `lowdefy test` journeys, each actor keeps its own client address.

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

- 4b3f5bd: feat: Webhook verifiers get the raw request body as `rawBody`.

  A webhook endpoint's `verify` request now receives `{ body, rawBody, query, headers }`, where `rawBody` is the request body exactly as received, as a string. Senders such as GitHub (`X-Hub-Signature-256`), Stripe and Slack sign the exact bytes they post, which serialising the parsed `body` again does not reproduce, so a signature check reads `_payload: rawBody`. A body that is not JSON reaches the verifier as `rawBody` too. `rawBody` is given only to the verifier: the routine's payload stays `{ body, query, headers }`.

### Patch Changes

- 88eaee5: fix: `<basePath>/` serves the app, and the screenshot viewport is capped

  - With `config.basePath` set, `<basePath>/` (with a trailing slash) serves the app root in `lowdefy dev`, in production and in the e2e server. It answered 404 before.
  - The screenshot tool's viewport `width` and `height` are at most 4096.

- 5ad581d: fix(build,server-dev): auth.dev alone is not an auth stack, and the dev mock user reaches \_user in the browser

  An `auth` block whose only key is `dev` declares no login method, no session store
  and no adapter, so it is no longer treated as an auth configuration: it demands no
  mechanism, no secret and no database, and the app builds and runs signed out in
  production. The block is still schema-checked, and adding any other `auth` key
  declares a real auth stack that is validated as before. In the dev server the mock
  user is now also passed to the client, so `_user` reads the same identity in the
  browser as on the server.

- d7b2029: chore: Update the MCP SDK to 1.31.0 and `@hono/mcp` to 0.3.2.
- e3e74d5: Browser-only POST routes (`/api/client-error`, and `/api/feedback` in the dev server) now share one cross-site defence instead of copies of the same check, and additionally refuse a request the browser itself marks as cross-site via `Sec-Fetch-Site`, so a page on another site can no longer post to your log sink with the user's cookies attached.
- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- dda12e3: fix(api,servers): detached calls release the dispatcher at once. The `/api/detached` route awaited the target's whole routine before replying, and the dispatching invocation keeps itself alive (`waitUntil`) until that reply arrives — so every parent stayed in flight for as long as its detached children ran (a cron tick that answers in milliseconds was held open by its slowest dispatched job, keeping its instance's memory billed), and a chain of detached hops was a chain of nested in-flight requests. The route now answers `202` as soon as the call is authorized and runs the target after the response under its own `waitUntil` (new `acceptDetachedEndpoint` in `@lowdefy/api`); the outcome is logged as `detached_run_done` / `detached_run_failed`.
- 2fa700e: fix: Lowdefy apps no longer install Next.js.

  The production server still listed `@sentry/nextjs`, and the MongoDB connection still listed `@next-auth/mongodb-adapter`. Neither was used: Sentry already runs on `@sentry/node`, `@sentry/browser` and `@sentry/vite-plugin`, and the MongoDB auth adapter is built on BetterAuth. `@sentry/nextjs` requires Next.js as a peer, and `@next-auth/mongodb-adapter` requires `next-auth`, which requires Next.js, so every app installed Next.js (and `next-auth` with the MongoDB connection) for nothing. They are removed, along with the unused Next.js lint plugin. Sentry setup and configuration are unchanged.

  The production and development servers also no longer list `webpack` as a dev dependency. Nothing used it since the move to Vite, but the CLI installs a server's dev dependencies along with it, so every app installed webpack too.

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

- 6bf0d56: fix(server): A page whose `title` is an operator no longer loads with "[object Object]" as its title

  The server writes the page's `title` into the first-load HTML. A title written as an operator, such as `_state`, is only evaluated in the browser, so the server wrote the operator object, which showed as "[object Object]" in the browser tab until the page loaded. The server now writes the page id in that case, and the browser replaces it with the evaluated title.

- 8398345: fix(api,build,servers): Model caller-less system contexts on a single `context.system` trust property, and correct the per-runner trust scope for cron, webhook, and detached endpoint runs.

  Scheduled (cron), webhook, and detached endpoint runs execute with no user session. Nested
  `CallApi` steps in those routines were re-authorized against that session-less context, so any
  call to a protected (`auth.public: false`) endpoint failed — silently breaking runs that compose
  other endpoints. This replaces the previous blanket `system` flag with one run-level trust
  marker, `context.system`, read by every authorization layer, and scopes trust correctly per
  runner:

  - **Cron** is trusted at the transport (`CRON_SECRET`) and holds a system context from
    construction — nested `CallApi` steps blanket-pass (endpoint role-authorization is undefined
    without a caller, so it is skipped, not denied). Unchanged in behaviour.
  - **Webhook** now starts caller-less **and untrusted**: its public transport proves nothing, so a
    nested protected `CallApi` fails closed until the run earns trust. An endpoint declares trust
    through a `webhook.verify` request plugin that runs as a gate against the raw request before the
    routine body; on success the run becomes trusted, on failure the route returns 401 and the
    routine never runs. A webhook with no verifier runs untrusted throughout. The build now requires
    a webhook endpoint to be declared explicitly public (listed in `auth.api.public`) — an implicit
    or protected webhook is a build error.
  - **Detached** now carries the dispatching run's identity across the loopback hop instead of
    forcing a system context. A user-dispatched detached run authorizes nested calls against the
    user's roles exactly as a synchronous call would; a cron-, hook-, or verified-webhook-dispatched
    run inherits the system context and blanket-passes.

  User-session behaviour is unchanged: a user-initiated `CallApi` chain still re-authorizes each
  target against the user's roles.

- ba80023: fix: Send a route's own HTTP answer (hono `HTTPException`) instead of a 500.

  The MCP transport refuses an unsupported `MCP-Protocol-Version` header with a 404 carrying a JSON-RPC body that the client SDK falls back on to negotiate a version both sides know — Claude Code probes with a newer protocol revision than the server's SDK supports and then downgrades. The error handler turned that into a logged internal error and a 500 on every connection. It now sends the exception's own response with one warning line, no structured error log and no Sentry capture.

- aa1736d: fix: Accept a repeated `MCP-Protocol-Version` header on `/api/mcp`.

  Claude Code sends the negotiated protocol version under two spellings of the header, which the Fetch Headers constructor folds into one comma-joined value (`2025-11-25, 2025-11-25`). The MCP transport compared that raw string against its supported list and answered 404 "Unsupported protocol version" — shown by Claude Code as "MCP endpoint not found". The route now collapses a repeated value to the single version it names before the transport reads it; a header naming two different versions is still refused.

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

- 2640121: fix(servers): Answer unserved /.well-known/\* paths with 404 instead of the app shell

  Well-known URIs are machine-facing, but any path outside the deployment's own OAuth
  discovery documents fell through to the page catch-all and answered 200 text/html.
  Clients probing discovery documents - an MCP client's OAuth probe, for example -
  failed with "Failed to parse JSON" instead of learning there is nothing to discover.
  Unserved well-known paths now answer 404 JSON; the real discovery documents are
  unchanged.

- 07ecdf5: Update `hono` to 4.13.7 in the servers, a release with published security fixes.
- 6b988e6: Keep the CSS of `.module.css` files that blocks import only for their side effects

  Vite 8 tree-shakes a `.module.css` imported as `import './style.module.css'`, and drops its CSS with it, so `:global(...)` rules in block and plugin stylesheets never reached the built client. Webpack kept them in v5. Affected styles included the `Menu` flyout height cap, the `UploadDragger` drop-zone height, and every custom plugin block styled this way. The production build now marks CSS modules as side-effectful, so their CSS is kept whatever the import style. The dev server was not affected.

- 08f76bb: Heavy blocks load their code when they first mount.

  - `createLazyBlock` in `@lowdefy/block-utils` lets any plugin block load its implementation on first mount. A hidden block, or one in a closed panel, unopened tab or modal, never downloads it. The block's methods (declared in `meta.methods`) can be called from mount: calls made before the code arrives run in order once it loads, or fail with the usual error. Implementation modules are named `*.lazy.js`, and the production server prefetches them at low priority.
  - `AgentChat` is lazy. Its drawer launcher paints immediately, and a click before load opens the drawer when the chat arrives. Mermaid diagrams, code highlighting and LaTeX load only when a message uses them. `setInput` is now listed in the block's methods, and `renderLatex` works in the browser build.
  - `EChart` loads the charting library inside its own sized box, so pages paint without it and the layout does not move.
  - `HtmlComponent` no longer re-sanitizes and re-renders HTML that has not changed.

  No config changes.

- 5355d30: fix: A POST whose body is not a JSON object is answered with 400 and logged as a warning, instead of a 500 logged as a server error. This covers `/api/endpoints/*`, `/api/request/*`, `/api/agent/*`, `/api/detached/*`, `/api/usage` and `/api/client-error` on every server, plus the dev server's `/api/dev-inspect`, `/lowdefy-feedback` and `/lowdefy-docs/state-checkpoints/{load,snapshot}`. The dev tool routes that already treat a missing or unreadable body as empty keep doing so.
- a323395: fix: When a page navigation fails on the network, the full-page load it falls back to keeps the URL query string.
- ce0efc7: fix(server-dev): A Link that only changes the query on a static page no longer flashes the Building page screen

  In the dev server, a Link to the page that is already open with only the query changed hid the whole page behind the "Building page..." screen for a moment, which looked like a page reload. A static page's config does not depend on the query, so it now stays cached across query changes and the address updates in place. Pages with Dynamic blocks still re-resolve on every navigation, and the first navigation to one now fetches its config once instead of twice.

  The production server no longer fetches `/api/page/<pageId>` for a Link that stays on the open static page. The page re-renders so it sees the new URL.

- a241843: fix(server): Colours written with `light-dark()` in `public/styles.css` survive the production build. Vite minifies client CSS with Lightning CSS, which rewrote every `light-dark()` into variables that only a CSS `color-scheme` declaration defines. Lowdefy sets `color-scheme` from JavaScript, so those variables were never set and every such colour was dropped in production while the dev server, which does not minify, showed it. The client build now leaves `light-dark()` as written.
- cfc8f71: chore(servers): Remove dependencies the servers do not import

  `@lowdefy/server-dev` no longer depends on `process`, `@lowdefy/engine` and `postcss`, and
  `@lowdefy/server` and `@lowdefy/server-e2e` no longer depend on `pino` directly (it still
  comes with `@lowdefy/logger`, and `postcss` with `vite`). This trims the install in every
  app's server directory.

- 6d6fa5f: A linked workspace plugin pinned to another Lowdefy release no longer brings its own copies of the Lowdefy libraries into the client. The dev server could load the plugin's older `@lowdefy/helpers` or `@lowdefy/block-utils` for the whole client and fail with "does not provide an export named ...", and a production build bundled both copies, so the plugin's blocks missed the HTML enhancements the client registers. Every `@lowdefy` package the server depends on now resolves from the server.
- ccff0a3: fix(servers): Update `tailwindcss` and `@tailwindcss/postcss` to 4.3.3.

  `@tailwindcss/postcss` 4.3.1 pinned `postcss` 8.5.15, which has a published advisory for reading source map files named in CSS comments. 4.3.3 allows a patched `postcss`. The 4.3.2 and 4.3.3 releases also fix a number of small class generation issues, and Preflight now names explicit platform fonts so CJK text renders correctly on Windows.

- cac0798: A rate-limited request (HTTP 429) is a `ServiceError` on every connection, not a `RequestError`.

  `ServiceError.isServiceError` treats a 429 like a 5xx: an external condition that passes with time, not a config fault. It reads the status where client libraries put it (`statusCode`, `status`, `response.status`, the AWS SDK's `$metadata.httpStatusCode`, or a numeric `code`), follows a retrying client's last error and the `cause` chain, and also counts AWS SDK throttling exceptions and timeouts (`TimeoutError`). The `ServiceError` reports the status as `statusCode` and keeps the service's `Retry-After` as `retryAfter`, which the server log records.

  A `:catch` or a client `catch` that checked for `RequestError` on a 429 now sees `ServiceError`. `_error: statusCode` is `429` in both cases.

- 99c9dac: feat: `lowdefy build` and `lowdefy dev` build again to run newly installed plugins' rules, and `--skip-plugin-checks` skips plugin rules for one run

  - When a build uses a plugin that is not installed yet, its build check rules cannot run. `lowdefy build` and `lowdefy dev` now install the plugin and run the Lowdefy build once more, so its rules run on a fresh checkout or CI run. The second build runs only when a newly installed plugin owns a block, action or operator type or ships `./checks`. The Vite client build still runs once.
  - An unknown `~ignoreBuildChecks` slug is a warning while some plugin's rules are not installed, and an error once every rule is known.
  - `--skip-plugin-checks` on `lowdefy build`, `lowdefy dev` and `lowdefy journeys scope` skips every plugin build check rule for that run, and each build logs a warning that they were skipped. No second build runs for newly installed plugins. Built-in build checks still run. Use it while a fix ships for a plugin rule that is wrong or too strict.

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

- 98cf3dc: fix(server): The client's usage ping posts to `<basePath>/api/usage`. It posted to `/api/usage`, which is outside the app when `config.basePath` is set, so it got a plain-text 404 back and every page threw an unhandled `Unexpected non-whitespace character after JSON` error on its first event. The ping now also drops a non-JSON or error response, a failed telemetry post, and disabled browser storage instead of throwing.
- 7ab8964: fix(server): The server imports a Sentry SDK only when `SENTRY_DSN` is set and `logger.sentry.server` is not `false`, which takes about 100 ms off the start of an app that does not use Sentry. The Node server traces requests by default; the new `logger.sentry.serverTracing: false` makes it report errors only.
- 712d6ef: fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

  - **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. On Vercel it reports errors only, with Sentry's light SDK (`@sentry/node-core/light`: no tracing, OpenTelemetry set-up or module loader hooks, which would add about 300 ms and 130 MB to each cold start), and with client reports off. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel. The flush of queued events starts once the response closes and is handed to Vercel's `waitUntil`, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload. Without `SENTRY_DSN` nothing changes.
  - **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

  Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.

- 6d71d20: fix(server): The client build shares one copy of `antd`, `@ant-design/x`, `@ant-design/cssinjs` and `dayjs` with linked plugin packages (pnpm `link:` or workspace plugins), as it already did for React. A linked block package resolved its own `antd`, so its components never saw the server's `App`, `ConfigProvider` and `StyleProvider`. For example, action messages failed with `message.error is not a function`. A linked `dayjs` also missed the locale the client sets.
- b8beaa3: Websocket upgrades from another origin are refused. `/api/websocket` accepts an upgrade whose `Origin` matches the `Host` it arrived on, the first `X-Forwarded-Host`, or the app's configured public URL (`BETTER_AUTH_URL`, the current environment's `url`, or an auth trusted origin), and one that sends no `Origin` (a server or script). Any other upgrade gets a 403, and the server logs a warning with its `Origin` and `Host`. Behind a proxy or CDN, pass the original `Host` or set `X-Forwarded-Host`. Hosts compare without case and without default ports. In `lowdefy dev`, the upgrade's `Host` must also be `localhost`, a `*.localhost` name or an IP address, as for every other dev request. The rule lives in `@lowdefy/api` (`isSameOriginRequest`, `isWebSocketOriginAllowed`), shared by every server.
- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

- Updated dependencies [81bd4f0]
- Updated dependencies [cf25c09]
- Updated dependencies [08d8938]
- Updated dependencies [d3e1ee1]
- Updated dependencies [14c4764]
- Updated dependencies [b3ba6fb]
- Updated dependencies [f7fa621]
- Updated dependencies [aad166b]
- Updated dependencies [9cd5a44]
- Updated dependencies [099d412]
- Updated dependencies [0a1f07a]
- Updated dependencies [d216f8b]
- Updated dependencies [07a67b5]
- Updated dependencies [ac9db75]
- Updated dependencies [d12c7cc]
- Updated dependencies [2dab826]
- Updated dependencies [f0162f4]
- Updated dependencies [2735310]
- Updated dependencies [80b5cbf]
- Updated dependencies [26a1894]
- Updated dependencies [6f20e75]
- Updated dependencies [7c4879b]
- Updated dependencies [7836aa2]
- Updated dependencies [2bdb855]
- Updated dependencies [80c0ad2]
- Updated dependencies [cad92af]
- Updated dependencies [660157b]
- Updated dependencies [4d08b55]
- Updated dependencies [6d311c8]
- Updated dependencies [99a4f35]
- Updated dependencies [d7b2029]
- Updated dependencies [ce95773]
- Updated dependencies [1227e62]
- Updated dependencies [ae6afbf]
- Updated dependencies [6144814]
- Updated dependencies [c377065]
- Updated dependencies [cfc8f71]
- Updated dependencies [81bd4f0]
- Updated dependencies [10bee50]
- Updated dependencies [81bd4f0]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [7636cca]
- Updated dependencies [ebf95f8]
- Updated dependencies [24383b5]
- Updated dependencies [575a5ee]
- Updated dependencies [b2cdc5a]
- Updated dependencies [81a5ad3]
- Updated dependencies [2595439]
- Updated dependencies [8c68631]
- Updated dependencies [71fef2d]
- Updated dependencies [26d905c]
- Updated dependencies [460fdaa]
- Updated dependencies [badaa49]
- Updated dependencies [dda12e3]
- Updated dependencies [a6e7e42]
- Updated dependencies [f9e483f]
- Updated dependencies [5852b65]
- Updated dependencies [d2c8e01]
- Updated dependencies [f889c26]
- Updated dependencies [550be9f]
- Updated dependencies [238cba5]
- Updated dependencies [7c20d1b]
- Updated dependencies [6b3a9bb]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [b56bb7a]
- Updated dependencies [1d31a29]
- Updated dependencies [09717e8]
- Updated dependencies [1bb3012]
- Updated dependencies [2baefc1]
- Updated dependencies [6b4bd99]
- Updated dependencies [662eaa9]
- Updated dependencies [2ffac21]
- Updated dependencies [8398345]
- Updated dependencies [a2b5466]
- Updated dependencies [f30e559]
- Updated dependencies [18f70ca]
- Updated dependencies [705498c]
- Updated dependencies [9c9b3d7]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [f278706]
- Updated dependencies [c744e40]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [a79fb1d]
- Updated dependencies [7bd38cb]
- Updated dependencies [4fa189f]
- Updated dependencies [4cc0f36]
- Updated dependencies [ef64856]
- Updated dependencies [cb0acad]
- Updated dependencies [9a92898]
- Updated dependencies [0205b5a]
- Updated dependencies [316f5be]
- Updated dependencies [ba86509]
- Updated dependencies [f9d8520]
- Updated dependencies [e5b2f83]
- Updated dependencies [69c31e8]
- Updated dependencies [da76905]
- Updated dependencies [1766343]
- Updated dependencies [9ed1386]
- Updated dependencies [73c5e14]
- Updated dependencies [c3e0d79]
- Updated dependencies [2c04c5b]
- Updated dependencies [08f76bb]
- Updated dependencies [e5cffa6]
- Updated dependencies [5355d30]
- Updated dependencies [d46ce43]
- Updated dependencies [60fb714]
- Updated dependencies [ee7285c]
- Updated dependencies [31605fb]
- Updated dependencies [959ec32]
- Updated dependencies [856e65d]
- Updated dependencies [c1bb9a0]
- Updated dependencies [409c918]
- Updated dependencies [5060cdf]
- Updated dependencies [a34939d]
- Updated dependencies [cda22c0]
- Updated dependencies [5634e63]
- Updated dependencies [db99f9f]
- Updated dependencies [e6302c6]
- Updated dependencies [43e5dc4]
- Updated dependencies [1f58d7f]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [3eb3691]
- Updated dependencies [5017abe]
- Updated dependencies [06a3a4a]
- Updated dependencies [ae3541c]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [3aa6f39]
- Updated dependencies [99c9dac]
- Updated dependencies [44e8f29]
- Updated dependencies [537bf54]
- Updated dependencies [9de3cf9]
- Updated dependencies [3f3a320]
- Updated dependencies [ecdfb65]
- Updated dependencies [4a69885]
- Updated dependencies [7623c86]
- Updated dependencies [26d905c]
- Updated dependencies [56dfd8e]
- Updated dependencies [2486253]
- Updated dependencies [afd1fa2]
- Updated dependencies [4f37391]
- Updated dependencies [5d951af]
- Updated dependencies [4b3f5bd]
- Updated dependencies [b8beaa3]
- Updated dependencies [36c9d6a]
- Updated dependencies [088b117]
- Updated dependencies [f160307]
- Updated dependencies [31911e7]
  - @lowdefy/actions-core@7.0.0
  - @lowdefy/api@7.0.0
  - @lowdefy/blocks-antd-x@7.0.0
  - @lowdefy/operators-js@7.0.0
  - @lowdefy/node-utils@7.0.0
  - @lowdefy/helpers@7.0.0
  - @lowdefy/client@7.0.0
  - @lowdefy/connection-anthropic@7.0.0
  - @lowdefy/blocks-aggrid@7.0.0
  - @lowdefy/blocks-antd@7.0.0
  - @lowdefy/blocks-files@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/blocks-basic@7.0.0
  - @lowdefy/blocks-markdown@7.0.0
  - @lowdefy/block-utils@7.0.0
  - @lowdefy/plugin-better-auth@7.0.0
  - @lowdefy/blocks-table@7.0.0
  - @lowdefy/blocks-tiptap@7.0.0
  - @lowdefy/operators-nunjucks@7.0.0
  - @lowdefy/blocks-echarts@7.0.0
  - @lowdefy/blocks-loaders@7.0.0
  - @lowdefy/layout@7.0.0
  - @lowdefy/blocks-captcha@7.0.0
  - @lowdefy/websockets-core@7.0.0
  - @lowdefy/logger@7.0.0

## 6.1.0

### Minor Changes

- d1bd356: feat: Deployment environments declared once under `config.environments`.

  Everything that differs between an app's deployments — its URL, cron forwarding, the email delivery filter, the Sentry environment — is now declared in one place, and each deployment names the environment it is with the `LOWDEFY_ENVIRONMENT` variable (read at build time):

  ```yaml
  config:
    environments:
      prod:
        url: https://app.example.com
      staging:
        url: https://staging.example.com
        cron:
          secret: STAGING_CRON_SECRET # staging's CRON_SECRET, set on prod
        email:
          filter:
            replaceAddress: team+staging@example.com
  ```

  The current environment supplies the defaults:

  - **`url`** — the `RenderNotification` `serverUrl` (email links and logos) and the auth base URL (`AUTH_URL`) default to it; an explicit value still wins. The dev server always uses the request origin, even with a `LOWDEFY_ENVIRONMENT` that names a deployed environment.
  - **`cron`** — the current environment registers its own schedules. The environment Vercel fires crons on (one without a `cron.secret`) also registers the schedules of every environment with a `cron.secret` and forwards them to that environment's `url`. `cron.enabled: false` registers nothing for an environment. Endpoint `schedules` keyed by environment work as before; the dev server with no current environment runs the `default` schedules.
  - **`email.filter`** — applied to every `SMTPMailSend` and `SendGridMailSend` request unless the connection sets a `filter` of its own with at least one field; an unset connection filter, or one whose fields all resolve to `null`, falls back to it, and the new `filter: false` turns filtering off for a connection, the environment's too (for mail such as invites that must reach the real recipient). Connection resolvers now receive the current environment as `environment`. Auth emails are not filtered.
  - **Logs** — every server log line carries `environment`; the app metadata gains `environment` (`_app: environment`); `logger.sentry.environment` defaults to the environment name.
  - **Switches** — `cron.enabled`, `email.enabled` and `sentry.enabled` set to `false` turn that feature off in one environment: no crons registered or forwarded, no email sent by `SMTPMailSend`/`SendGridMailSend` (each message reports `disabled: true`; auth emails still send), no Sentry on server or client. The switched-off features are listed in the app metadata as `disabled` (`_app: disabled`). Logging has no switch.
  - **Guards** — `guards.secrets` (Lowdefy secret names) and `guards.env` (environment variable names) map to a regular expression the value must match in that environment; the build fails before deploy when a guarded value is unset or does not match, and the production server checks again at startup, so changing it (the prod database URI, say) also takes a config change. Unknown guard kinds fail the build. Values are never printed, and only the current environment's guards are kept, in the server-only `config.json`.

  `cron.secret` is the **name** of a Lowdefy secret, a plain string — not a `_secret` operator.

  - **Browser exposure** — environment settings stay on the server. The client learns only the current environment's name and switched-off features (`_app: environment`, `_app: disabled`); `build/config.json` is no longer bundled into the client (the auth client reads the base path from Vite's `BASE_URL`), and a test allowlists the build artifacts client code may import.

  The new [Deployment environments](https://docs.lowdefy.com/deployment-environments) docs page covers every setting.

  `config.environment` can name the current environment in config for a deployment that sets no `LOWDEFY_ENVIRONMENT`; the variable always wins. With environments declared, the current environment must be one of them, and a production build without one fails (the dev server warns). An `email.filter.regex` that is not a valid regular expression fails the build.

  **Replaces `config.cron.environments` (6.0):** a build with `config.cron` fails with the migration — move the environments to `config.environments`, each `secret` to `cron.secret` and `enabled` to `cron.enabled`, give production its `url`, and set `LOWDEFY_ENVIRONMENT` on each deployment.

### Patch Changes

- 1d3a0b8: Update dependencies to releases with published security fixes.

  - `hono` 4.13.5 and `@hono/node-server` 2.0.10 in the servers.
  - `ws` 8.21.0 in the servers; `postcss` 8.5.23 in the dev server.
  - The servers drop leftover Next.js-era dependencies they no longer use: `@sentry/nextjs` from `@lowdefy/server`, and the `webpack` and `@next/eslint-plugin-next` devDependencies.
  - `axios` 1.18.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.13 in `block-utils`, `blocks-basic` and `blocks-markdown`.
  - `echarts` 6.1.0, `mysql2` 3.23.1, `nodemailer` 9.1.1, `uuid` 13.0.1 and `@auth/mongodb-adapter` 3.11.3 in their plugins.
  - `tar` 7.5.21 and `picomatch` 4.0.4 in the build, `js-yaml` 4.3.2 in `e2e-utils`, and `@babel/core` 7.29.6 in `block-utils`.
  - `@auth/core` 0.41.3 in the servers and `plugin-next-auth`, whose peer range is now `>=0.41.3`. `@auth/mongodb-adapter` 3.11.3 depends on the same release.

  Two of these change output an app can see:

  - **`echarts` 6.1.0** changes chart defaults. Bar, pictorialBar, candlestick and boxplot series no longer draw past the grid edge; set `containShape: false` on the axis to restore the previous look. `axis.startValue` no longer sets `min`. The second argument of a `tooltip.valueFormatter` function is now `rawDataIndex`.
  - **`dompurify` 3.4.13** keeps a few attributes and elements that earlier releases removed: `command` / `commandfor`, `<selectedcontent>`, and some SVG attributes. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- 6d6f8fa: Improved error handling: each reader of a server error now gets its own view of it.

  - **Users and app config see the author's message or one generic message.** A server error the app author did not write now reaches the browser as "Something went wrong.", with its `name`, `code`, `statusCode`, `configKey` and a `requestId`. Messages written with `:throw` or `:reject`, failed `ValidateSchema` steps, a plugin's `UserError`, and authentication refusals, are shown as before. This applies to the error toast, `_actions`, `_request_details`, websocket errors, MCP tool results and the AgentChat stream, the same way in development and production. An action whose error toast showed a connection's own message now shows the generic one.
    - The generic message is the built-in `server.genericError` i18n string. Override it per locale under `config.i18n.messages`, for example `server.genericError: 'Etwas ist schiefgelaufen.'`.
    - To show different text for one action, set `messages.error` on the action.
    - To show the real message, read it with the new `_error` operator in the endpoint's `:catch` and send it on, for example `:throw: { _error: message }`.
  - **The dev server shows the full error.** In `lowdefy dev`, the error bar, the browser console and the dev MCP tools show the full server error, with its config location, while app config sees the same generic error as in production. Different failures of the same action are now each shown, instead of only the first.
  - **The browser console prints the request id** under a server error, to find the matching server log line and Sentry event.
  - **Production logs and Sentry keep a fixed set of error fields.** Each logged error keeps its name, message, stack, `code`, `statusCode` and cause, plus Lowdefy's own fields (`configKey`, `source`, `received`, ...) on Lowdefy errors. Fields a library attaches, such as an HTTP client's request config and response, are no longer logged. Values of the app's secrets (`LOWDEFY_SECRET_*`, `CRON_SECRET`, `AUTH_SECRET`) are replaced with `[REDACTED]` in production log lines and Sentry events, and credential-named keys in `received` are masked. Sentry events now carry the error's fields under `extra.error` and a `requestId` tag, and no longer attach incoming request bodies.
  - **An AxiosHttp request that gets a 5xx response now fails with a `ServiceError`**, where it used to fail with a `RequestError`. AxiosHttp now sets `statusCode` on its error, and a 5xx status marks an error as a service failure, like a network error or timeout. Config that checks `name` for `RequestError` on these failures, for example `_eq: [{ _error: name }, 'RequestError']`, should also accept `ServiceError`, or check `statusCode` instead. The server log event for these failures is now `service_error`.

- c0c3695: The server's `request completed` access log now redacts credential parameters in the `referer` header. A browser sends the page's full URL as the Referer of every request that page makes, so a page whose URL carried a magic-link sign-in token or a signed OAuth query (the consent and organisation-picker pages) was writing that value into the log store on each fetch. The query string is kept, since it often identifies the page view, but the value of any parameter named like a credential (`token`, `code`, `state`, `sig`, `otp`, `*_token`, `*secret*`, `*signature*`, `*credential*`, `*password*`, and similar) is replaced with `[redacted]`. The request `url` field was already path-only.
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

- Updated dependencies [f92aa11]
- Updated dependencies [ae9803e]
- Updated dependencies [ea69869]
- Updated dependencies [08e05f9]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [9592255]
- Updated dependencies [d1bd356]
- Updated dependencies [5ad2b62]
- Updated dependencies [08cbf21]
- Updated dependencies [1bbaab7]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
- Updated dependencies [2b2b27a]
  - @lowdefy/blocks-antd-x@6.1.0
  - @lowdefy/blocks-aggrid@6.1.0
  - @lowdefy/blocks-antd@6.1.0
  - @lowdefy/blocks-basic@6.1.0
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/blocks-tiptap@6.1.0
  - @lowdefy/operators-js@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/api@6.1.0
  - @lowdefy/blocks-echarts@6.1.0
  - @lowdefy/blocks-markdown@6.1.0
  - @lowdefy/plugin-next-auth@6.1.0
  - @lowdefy/node-utils@6.1.0
  - @lowdefy/client@6.1.0
  - @lowdefy/errors@6.1.0
  - @lowdefy/logger@6.1.0
  - @lowdefy/blocks-files@6.1.0
  - @lowdefy/layout@6.1.0
  - @lowdefy/blocks-loaders@6.1.0
  - @lowdefy/actions-core@6.1.0
  - @lowdefy/websockets-core@6.1.0

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

- 15956e0: feat: Production-grade Docker deployment.

  **Health endpoint (`@lowdefy/server`)**

  - The server now serves `GET /api/lowdefy-health` for container health checks and orchestrator probes. The endpoint skips auth, session lookup, request logging, and Sentry, so frequent probes stay out of logs.

  **Container-friendly startup and shutdown (`@lowdefy/server`)**

  - Startup and Sentry-enabled messages now log as structured JSON through pino instead of plain text, keeping stdout a uniform NDJSON stream for log collectors.
  - On SIGTERM/SIGINT the server closes websocket clients (code 1001, clients reconnect automatically), finishes in-flight requests, flushes pending Sentry events, and exits well within Docker's 10 second stop grace period.

  **New `docker-output` CLI command (`lowdefy` CLI)**

  - Assembles a minimal production runtime at `.lowdefy/docker` from a built app by tracing the server's runtime dependency graph (via `@vercel/nft`) and copying only the files the server imports. This drops the client-side block packages (already compiled into `dist/client`) and other unused dependencies from the image, cutting the shipped runtime to a fraction of the installed `node_modules`. Preserves pnpm workspace links so it works in monorepos.

  **Rewritten `init-docker` Dockerfile (`lowdefy` CLI)**

  - Pins the Lowdefy CLI to the app's `lowdefy:` version from `lowdefy.yaml`, so image builds are reproducible.
  - Runs `docker-output` after the build and copies the traced runtime into the image, so build tooling (Vite, `@lowdefy/build`, webpack) and unused runtime dependencies no longer ship in production.
  - Uses a BuildKit cache mount for the pnpm store, installs pnpm without corepack (removed from Node.js 25+), runs as the built-in non-root `node` user on `node:22-slim`, and adds a `HEALTHCHECK` against `/api/lowdefy-health`.
  - Fixed `init-docker` failing to write `.dockerignore` from the published package.

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

- 596212a: feat: `lowdefy init-vercel` instruments an app for Vercel, plus a configurable request timeout.

  **`init-vercel`** now scaffolds a complete Vercel setup into `<config-directory>/deploy/`, so a v6
  Lowdefy app (Hono server + Vite client) deploys to Vercel as static assets on the CDN plus one
  Serverless Function:

  - `vercel.json` — serves the built client (`dist/client`, which includes the app's `public/` files
    via Vite's `publicDir`) from the CDN, sets the build command (`pnpm run build:client`) and output
    directory, rewrites all other requests to the function, bundles the runtime-read build artifacts
    via `includeFiles`, and caps the function with `maxDuration`.
  - `api/index.js` — a Node Serverless Function that `chdir`s to the deploy directory, builds a Web
    `Request` from the buffered Node request body, and runs the Hono app. (Vercel's Node runtime does
    not drain a lazily-read body stream, so a streaming adapter hangs on every request with a body.)
  - `vercel.install.sh` + `README.md`.

  **Request timeout.** `@lowdefy/server`'s `createApp` now bounds request duration with a `timeout`
  middleware, configured by a new **`config.requestTimeout`** (milliseconds) in `lowdefy.yaml`
  (default `30000`, `0` disables). This protects against requests that hang on an upstream call
  (database, SMTP, external API) running to the host's function limit — important on serverless
  platforms billed by duration. Agent streaming routes are exempt. `@lowdefy/build` adds
  `config.requestTimeout` to the schema.

  `createApp` also gains a `{ serveStaticAssets }` option (default `true`); the Vercel function passes
  `false` so the CDN owns static files and the function only handles dynamic routes. Docs updated
  (deployment/Vercel and the config reference).

- a858f8f: feat: MCP server exposing API endpoints as tools.

  - New root `mcp` config block (`name`, `version`, `endpoints`) — listed `Api` endpoints are served as MCP tools at `POST /api/mcp` over streamable HTTP.
  - Endpoint `description` and `payloadSchema` become the tool description and inputSchema; both are required for exposed endpoints, and `InternalApi` endpoints cannot be exposed.
  - Tool listing and calls are authorized per request with the caller's session; the build always writes an `mcp.json` artifact (`configured: false` when no endpoints are listed).

- 89a4c53: feat(server): Log response status and duration on every request.

  The server's per-request log line now fires after the response is finalized and includes `status` and `duration_ms`, turning it into a standard access log for production observability. Errored requests log their final status alongside the existing error detail line.

  Every log line now also carries the app's deploy identity — `app_name`, `app_version`, and `git_sha` (each omitted when not set) — so errors and access logs can be correlated to a specific build across replicas and rolling deploys. The Lowdefy version logs once on the startup line.

  The request id (`rid`) now honors an `x-request-id` header set by an upstream proxy or load balancer (validated, falling back to a generated UUID) and is echoed on the response `x-request-id` header, so one id correlates client, proxy, and server logs. Also fixed the access and error logs reading the misspelled `x-forward-for` header — client IPs behind proxies are now captured under `x-forwarded-for`.

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

- Updated dependencies [11662bc]
- Updated dependencies [0201358]
- Updated dependencies [da0c62c]
- Updated dependencies [2da4907]
- Updated dependencies [e7a9270]
- Updated dependencies [c188656]
- Updated dependencies [b496a77]
- Updated dependencies [60401aa]
- Updated dependencies [37c8c14]
- Updated dependencies [ef707bd]
- Updated dependencies [7ce6e36]
- Updated dependencies [46029df]
- Updated dependencies [28cb944]
- Updated dependencies [082acec]
- Updated dependencies [e0a06a2]
- Updated dependencies [58ae85e]
- Updated dependencies [742a900]
- Updated dependencies [51c3008]
- Updated dependencies [6730996]
- Updated dependencies [a858f8f]
- Updated dependencies [c97b1da]
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
- Updated dependencies [629837d]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
- Updated dependencies [ae5f618]
- Updated dependencies [16fdeb8]
- Updated dependencies [fb80e0a]
- Updated dependencies [0e71ebd]
- Updated dependencies [c2e0823]
- Updated dependencies [6d7cd8e]
- Updated dependencies [53a36ed]
  - @lowdefy/blocks-antd-x@6.0.0
  - @lowdefy/logger@6.0.0
  - @lowdefy/blocks-aggrid@6.0.0
  - @lowdefy/api@6.0.0
  - @lowdefy/client@6.0.0
  - @lowdefy/operators-js@6.0.0
  - @lowdefy/plugin-next-auth@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/blocks-antd@6.0.0
  - @lowdefy/blocks-basic@6.0.0
  - @lowdefy/blocks-echarts@6.0.0
  - @lowdefy/blocks-files@6.0.0
  - @lowdefy/blocks-loaders@6.0.0
  - @lowdefy/blocks-markdown@6.0.0
  - @lowdefy/blocks-tiptap@6.0.0
  - @lowdefy/node-utils@6.0.0
  - @lowdefy/actions-core@6.0.0
  - @lowdefy/websockets-core@6.0.0
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

- Updated dependencies [3d59f5f]
- Updated dependencies [3d59f5f]
- Updated dependencies [5b590c7]
- Updated dependencies [8306262]
- Updated dependencies [3ead269]
- Updated dependencies [9399e4e]
- Updated dependencies [9e19a21]
- Updated dependencies [7d97d03]
- Updated dependencies [79bbd84]
- Updated dependencies [508708d]
- Updated dependencies [bb02f06]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
- Updated dependencies [5b4c305]
  - @lowdefy/blocks-antd-x@5.6.0
  - @lowdefy/client@5.6.0
  - @lowdefy/helpers@5.6.0
  - @lowdefy/api@5.6.0
  - @lowdefy/node-utils@5.6.0
  - @lowdefy/blocks-antd@5.6.0
  - @lowdefy/layout@5.6.0
  - @lowdefy/operators-js@5.6.0
  - @lowdefy/logger@5.6.0
  - @lowdefy/blocks-tiptap@5.6.0
  - @lowdefy/actions-core@5.6.0
  - @lowdefy/blocks-basic@5.6.0
  - @lowdefy/blocks-loaders@5.6.0
  - @lowdefy/block-utils@5.6.0
  - @lowdefy/plugin-next-auth@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- Updated dependencies [59cae71]
  - @lowdefy/blocks-antd@5.5.1
  - @lowdefy/blocks-tiptap@5.5.1
  - @lowdefy/api@5.5.1
  - @lowdefy/client@5.5.1
  - @lowdefy/layout@5.5.1
  - @lowdefy/actions-core@5.5.1
  - @lowdefy/blocks-antd-x@5.5.1
  - @lowdefy/blocks-basic@5.5.1
  - @lowdefy/blocks-loaders@5.5.1
  - @lowdefy/operators-js@5.5.1
  - @lowdefy/plugin-next-auth@5.5.1
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/errors@5.5.1
  - @lowdefy/helpers@5.5.1
  - @lowdefy/logger@5.5.1
  - @lowdefy/node-utils@5.5.1

## 5.5.0

### Patch Changes

- Updated dependencies [6dcdb6a]
- Updated dependencies [b368e15]
- Updated dependencies [f88fe33]
- Updated dependencies [7ab09d6]
  - @lowdefy/blocks-tiptap@5.5.0
  - @lowdefy/blocks-antd-x@5.5.0
  - @lowdefy/api@5.5.0
  - @lowdefy/client@5.5.0
  - @lowdefy/layout@5.5.0
  - @lowdefy/actions-core@5.5.0
  - @lowdefy/blocks-antd@5.5.0
  - @lowdefy/blocks-basic@5.5.0
  - @lowdefy/blocks-loaders@5.5.0
  - @lowdefy/operators-js@5.5.0
  - @lowdefy/plugin-next-auth@5.5.0
  - @lowdefy/block-utils@5.5.0
  - @lowdefy/errors@5.5.0
  - @lowdefy/helpers@5.5.0
  - @lowdefy/logger@5.5.0
  - @lowdefy/node-utils@5.5.0

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
- Updated dependencies [302e330]
- Updated dependencies [d1fb1d7]
- Updated dependencies [27659ef]
- Updated dependencies [4e189a0]
- Updated dependencies [0027a41]
- Updated dependencies [27659ef]
- Updated dependencies [e324c72]
- Updated dependencies [b6e555f]
- Updated dependencies [f8a5d80]
- Updated dependencies [60c193c]
- Updated dependencies [86919df]
  - @lowdefy/blocks-antd-x@5.4.0
  - @lowdefy/api@5.4.0
  - @lowdefy/client@5.4.0
  - @lowdefy/operators-js@5.4.0
  - @lowdefy/blocks-antd@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/actions-core@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/blocks-tiptap@5.4.0
  - @lowdefy/layout@5.4.0
  - @lowdefy/blocks-basic@5.4.0
  - @lowdefy/blocks-loaders@5.4.0
  - @lowdefy/logger@5.4.0
  - @lowdefy/node-utils@5.4.0
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
- Updated dependencies [54d30f7]
  - @lowdefy/blocks-antd-x@5.3.0
  - @lowdefy/api@5.3.0
  - @lowdefy/blocks-antd@5.3.0
  - @lowdefy/blocks-tiptap@5.3.0
  - @lowdefy/client@5.3.0
  - @lowdefy/layout@5.3.0
  - @lowdefy/actions-core@5.3.0
  - @lowdefy/blocks-basic@5.3.0
  - @lowdefy/blocks-loaders@5.3.0
  - @lowdefy/operators-js@5.3.0
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

- Updated dependencies [1d18a13]
- Updated dependencies [01e249b]
- Updated dependencies [762755c]
- Updated dependencies [73fa2b9]
- Updated dependencies [69a59c0]
- Updated dependencies [6ec2cd9]
- Updated dependencies [0d44433]
- Updated dependencies [fd1604f]
- Updated dependencies [a4ecee5]
- Updated dependencies [6ec0dd4]
- Updated dependencies [e3fc007]
- Updated dependencies [cea34ac]
- Updated dependencies [c91003d]
  - @lowdefy/actions-core@5.2.0
  - @lowdefy/operators-js@5.2.0
  - @lowdefy/blocks-antd@5.2.0
  - @lowdefy/client@5.2.0
  - @lowdefy/blocks-tiptap@5.2.0
  - @lowdefy/api@5.2.0
  - @lowdefy/logger@5.2.0
  - @lowdefy/blocks-loaders@5.2.0
  - @lowdefy/layout@5.2.0
  - @lowdefy/blocks-basic@5.2.0
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

- Updated dependencies [95388a581]
- Updated dependencies [573b90369]
- Updated dependencies [be367bebd]
- Updated dependencies [b1e0c9944]
- Updated dependencies [447f8ce57]
- Updated dependencies [36a2d1bca]
- Updated dependencies [081d79634]
- Updated dependencies [f56a47d87]
- Updated dependencies [6c6aab961]
- Updated dependencies [af8ef77cb]
  - @lowdefy/blocks-antd@5.1.0
  - @lowdefy/client@5.1.0
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/api@5.1.0
  - @lowdefy/layout@5.1.0
  - @lowdefy/actions-core@5.1.0
  - @lowdefy/blocks-basic@5.1.0
  - @lowdefy/blocks-loaders@5.1.0
  - @lowdefy/plugin-next-auth@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/logger@5.1.0
  - @lowdefy/node-utils@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Upgrade Next.js to 16 with Turbopack.

  ### Breaking Changes

  - **Next.js 16**: Both production and development servers run on Next.js 16 with Turbopack as the default bundler.
  - **Less removed**: `next-with-less` wrapper is removed. Styling uses CSS Modules and antd CSS-in-JS.
  - **SWC 1.15.18**: Updated SWC compiler.
  - **Dynamic transpilePackages**: Server resolves block packages for transpilation from a build artifact, supporting custom block plugins with CSS imports.
  - **antd as direct server dependency**: Both server packages list `antd` and `@ant-design/cssinjs` as direct dependencies for pnpm strict mode compatibility.

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

- f430f02dde: Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.

### Patch Changes

- Updated dependencies [52ea769811]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [29eb199c7f]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [155c0b9724]
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
  - @lowdefy/blocks-basic@5.0.0
  - @lowdefy/blocks-antd@5.0.0
  - @lowdefy/client@5.0.0
  - @lowdefy/layout@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/blocks-loaders@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/actions-core@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/plugin-next-auth@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/api@5.0.0
  - @lowdefy/logger@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- Updated dependencies [c5ce5b972]
- Updated dependencies [9de3276dc]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/api@4.7.3
  - @lowdefy/client@4.7.3
  - @lowdefy/layout@4.7.3
  - @lowdefy/actions-core@4.7.3
  - @lowdefy/blocks-antd@4.7.3
  - @lowdefy/blocks-basic@4.7.3
  - @lowdefy/blocks-loaders@4.7.3
  - @lowdefy/blocks-markdown@4.7.3
  - @lowdefy/connection-axios-http@4.7.3
  - @lowdefy/connection-mongodb@4.7.3
  - @lowdefy/operators-nunjucks@4.7.3
  - @lowdefy/operators-uuid@4.7.3
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

  - @lowdefy/api@4.7.2
  - @lowdefy/client@4.7.2
  - @lowdefy/layout@4.7.2
  - @lowdefy/actions-core@4.7.2
  - @lowdefy/blocks-antd@4.7.2
  - @lowdefy/blocks-basic@4.7.2
  - @lowdefy/blocks-loaders@4.7.2
  - @lowdefy/blocks-markdown@4.7.2
  - @lowdefy/connection-axios-http@4.7.2
  - @lowdefy/connection-mongodb@4.7.2
  - @lowdefy/operators-js@4.7.2
  - @lowdefy/operators-nunjucks@4.7.2
  - @lowdefy/operators-uuid@4.7.2
  - @lowdefy/plugin-next-auth@4.7.2
  - @lowdefy/block-utils@4.7.2
  - @lowdefy/errors@4.7.2
  - @lowdefy/helpers@4.7.2
  - @lowdefy/logger@4.7.2
  - @lowdefy/node-utils@4.7.2

## 4.7.1

### Patch Changes

- Updated dependencies [18d1c3bfa]
- Updated dependencies [fac48c10a]
  - @lowdefy/blocks-antd@4.7.1
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/api@4.7.1
  - @lowdefy/blocks-basic@4.7.1
  - @lowdefy/blocks-loaders@4.7.1
  - @lowdefy/blocks-markdown@4.7.1
  - @lowdefy/client@4.7.1
  - @lowdefy/layout@4.7.1
  - @lowdefy/actions-core@4.7.1
  - @lowdefy/connection-axios-http@4.7.1
  - @lowdefy/connection-mongodb@4.7.1
  - @lowdefy/operators-nunjucks@4.7.1
  - @lowdefy/operators-uuid@4.7.1
  - @lowdefy/plugin-next-auth@4.7.1
  - @lowdefy/block-utils@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/logger@4.7.1
  - @lowdefy/node-utils@4.7.1

## 4.7.0

### Patch Changes

- d2baf5fa9: fix(server): Remove unused print mixin from build logger

  Removed the pino `mixin` that added a `print` field to every build log entry. This field was a leftover from a previous CLI display system and caused spurious `print: warn` lines in build output.

- Updated dependencies [4543688f7]
- Updated dependencies [811f80760]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/blocks-antd@4.7.0
  - @lowdefy/blocks-basic@4.7.0
  - @lowdefy/api@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/operators-nunjucks@4.7.0
  - @lowdefy/operators-uuid@4.7.0
  - @lowdefy/client@4.7.0
  - @lowdefy/layout@4.7.0
  - @lowdefy/actions-core@4.7.0
  - @lowdefy/blocks-loaders@4.7.0
  - @lowdefy/connection-axios-http@4.7.0
  - @lowdefy/connection-mongodb@4.7.0
  - @lowdefy/block-utils@4.7.0
  - @lowdefy/logger@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/blocks-markdown@4.7.0
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

### Patch Changes

- aa0d6d363e: fix: Add missing uuid dependency to servers
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

- Updated dependencies [fb7910f62]
- Updated dependencies [c62468b98]
- Updated dependencies [5e03091ee]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8250d8d3e]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3d]
- Updated dependencies [43a5243da]
- Updated dependencies [f673e3ab3]
  - @lowdefy/blocks-antd@4.6.0
  - @lowdefy/blocks-basic@4.6.0
  - @lowdefy/client@4.6.0
  - @lowdefy/api@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/block-utils@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/operators-nunjucks@4.6.0
  - @lowdefy/operators-uuid@4.6.0
  - @lowdefy/actions-core@4.6.0
  - @lowdefy/connection-axios-http@4.6.0
  - @lowdefy/logger@4.6.0
  - @lowdefy/layout@4.6.0
  - @lowdefy/blocks-loaders@4.6.0
  - @lowdefy/connection-mongodb@4.6.0
  - @lowdefy/blocks-markdown@4.6.0
  - @lowdefy/plugin-next-auth@4.6.0

## 4.5.2

### Patch Changes

- Updated dependencies [d573e8ff8]
  - @lowdefy/client@4.5.2
  - @lowdefy/api@4.5.2
  - @lowdefy/layout@4.5.2
  - @lowdefy/actions-core@4.5.2
  - @lowdefy/blocks-antd@4.5.2
  - @lowdefy/blocks-basic@4.5.2
  - @lowdefy/blocks-loaders@4.5.2
  - @lowdefy/blocks-markdown@4.5.2
  - @lowdefy/connection-axios-http@4.5.2
  - @lowdefy/connection-mongodb@4.5.2
  - @lowdefy/operators-js@4.5.2
  - @lowdefy/operators-nunjucks@4.5.2
  - @lowdefy/operators-uuid@4.5.2
  - @lowdefy/plugin-next-auth@4.5.2
  - @lowdefy/block-utils@4.5.2
  - @lowdefy/helpers@4.5.2
  - @lowdefy/node-utils@4.5.2

## 4.5.1

### Patch Changes

- 51f7f9dbe: Use uuid instead of crypto.randomUUID(), update uuid to v13.
- Updated dependencies [51f7f9dbe]
  - @lowdefy/operators-uuid@4.5.1
  - @lowdefy/api@4.5.1
  - @lowdefy/client@4.5.1
  - @lowdefy/layout@4.5.1
  - @lowdefy/actions-core@4.5.1
  - @lowdefy/blocks-antd@4.5.1
  - @lowdefy/blocks-basic@4.5.1
  - @lowdefy/blocks-loaders@4.5.1
  - @lowdefy/blocks-markdown@4.5.1
  - @lowdefy/connection-axios-http@4.5.1
  - @lowdefy/connection-mongodb@4.5.1
  - @lowdefy/operators-js@4.5.1
  - @lowdefy/operators-nunjucks@4.5.1
  - @lowdefy/plugin-next-auth@4.5.1
  - @lowdefy/block-utils@4.5.1
  - @lowdefy/helpers@4.5.1
  - @lowdefy/node-utils@4.5.1

## 4.5.0

### Minor Changes

- abc90f3f7: Change to Apache 2.0 license for all packages. All license checks and restrictions have been removed.
- 16084c1bd: Adds Lowdefy APIs. Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. See https://docs.lowdefy.com/lowdefy-api for more info.

### Patch Changes

- Updated dependencies [d9512d9be]
- Updated dependencies [4f610de5c]
- Updated dependencies [d6c58fe97]
- Updated dependencies [b3a2e6662]
  - @lowdefy/client@4.5.0
  - @lowdefy/blocks-antd@4.5.0
  - @lowdefy/api@4.5.0
  - @lowdefy/operators-js@4.5.0
  - @lowdefy/layout@4.5.0
  - @lowdefy/actions-core@4.5.0
  - @lowdefy/blocks-basic@4.5.0
  - @lowdefy/blocks-loaders@4.5.0
  - @lowdefy/plugin-next-auth@4.5.0
  - @lowdefy/block-utils@4.5.0
  - @lowdefy/helpers@4.5.0
  - @lowdefy/node-utils@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [bcfbb1a9b]
  - @lowdefy/blocks-antd@4.4.0
  - @lowdefy/api@4.4.0
  - @lowdefy/client@4.4.0
  - @lowdefy/layout@4.4.0
  - @lowdefy/actions-core@4.4.0
  - @lowdefy/blocks-basic@4.4.0
  - @lowdefy/blocks-loaders@4.4.0
  - @lowdefy/operators-js@4.4.0
  - @lowdefy/plugin-next-auth@4.4.0
  - @lowdefy/block-utils@4.4.0
  - @lowdefy/helpers@4.4.0
  - @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- Updated dependencies [efefb8ca0]
  - @lowdefy/blocks-antd@4.3.2
  - @lowdefy/api@4.3.2
  - @lowdefy/client@4.3.2
  - @lowdefy/layout@4.3.2
  - @lowdefy/actions-core@4.3.2
  - @lowdefy/blocks-basic@4.3.2
  - @lowdefy/blocks-loaders@4.3.2
  - @lowdefy/operators-js@4.3.2
  - @lowdefy/plugin-next-auth@4.3.2
  - @lowdefy/block-utils@4.3.2
  - @lowdefy/helpers@4.3.2
  - @lowdefy/node-utils@4.3.2

## 4.3.1

### Patch Changes

- Updated dependencies [3e574857c]
  - @lowdefy/blocks-antd@4.3.1
  - @lowdefy/api@4.3.1
  - @lowdefy/client@4.3.1
  - @lowdefy/layout@4.3.1
  - @lowdefy/actions-core@4.3.1
  - @lowdefy/blocks-basic@4.3.1
  - @lowdefy/blocks-loaders@4.3.1
  - @lowdefy/operators-js@4.3.1
  - @lowdefy/plugin-next-auth@4.3.1
  - @lowdefy/block-utils@4.3.1
  - @lowdefy/helpers@4.3.1
  - @lowdefy/node-utils@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/api@4.3.0
- @lowdefy/client@4.3.0
- @lowdefy/layout@4.3.0
- @lowdefy/actions-core@4.3.0
- @lowdefy/blocks-antd@4.3.0
- @lowdefy/blocks-basic@4.3.0
- @lowdefy/blocks-loaders@4.3.0
- @lowdefy/operators-js@4.3.0
- @lowdefy/plugin-next-auth@4.3.0
- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0
- @lowdefy/node-utils@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies [e4ec43505]
  - @lowdefy/blocks-antd@4.2.2
  - @lowdefy/api@4.2.2
  - @lowdefy/client@4.2.2
  - @lowdefy/layout@4.2.2
  - @lowdefy/actions-core@4.2.2
  - @lowdefy/blocks-basic@4.2.2
  - @lowdefy/blocks-loaders@4.2.2
  - @lowdefy/operators-js@4.2.2
  - @lowdefy/plugin-next-auth@4.2.2
  - @lowdefy/block-utils@4.2.2
  - @lowdefy/helpers@4.2.2
  - @lowdefy/node-utils@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/client@4.2.1
  - @lowdefy/layout@4.2.1
  - @lowdefy/api@4.2.1
  - @lowdefy/actions-core@4.2.1
  - @lowdefy/blocks-antd@4.2.1
  - @lowdefy/blocks-basic@4.2.1
  - @lowdefy/blocks-loaders@4.2.1
  - @lowdefy/operators-js@4.2.1
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
  - @lowdefy/actions-core@4.2.0
  - @lowdefy/blocks-antd@4.2.0
  - @lowdefy/blocks-basic@4.2.0
  - @lowdefy/blocks-loaders@4.2.0
  - @lowdefy/operators-js@4.2.0
  - @lowdefy/plugin-next-auth@4.2.0
  - @lowdefy/block-utils@4.2.0
  - @lowdefy/helpers@4.2.0
  - @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [221ba93c9]
- Updated dependencies [f14270465]
- Updated dependencies [f571e90da]
- Updated dependencies [f9d00b4d3]
- Updated dependencies [5b3ccc958]
  - @lowdefy/actions-core@4.1.0
  - @lowdefy/blocks-antd@4.1.0
  - @lowdefy/client@4.1.0
  - @lowdefy/api@4.1.0
  - @lowdefy/layout@4.1.0
  - @lowdefy/blocks-basic@4.1.0
  - @lowdefy/blocks-loaders@4.1.0
  - @lowdefy/operators-js@4.1.0
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
  - @lowdefy/api@4.0.2
  - @lowdefy/client@4.0.2
  - @lowdefy/layout@4.0.2
  - @lowdefy/actions-core@4.0.2
  - @lowdefy/blocks-loaders@4.0.2
  - @lowdefy/operators-js@4.0.2
  - @lowdefy/plugin-next-auth@4.0.2
  - @lowdefy/block-utils@4.0.2
  - @lowdefy/helpers@4.0.2
  - @lowdefy/node-utils@4.0.2

## 4.0.1

### Patch Changes

- Fix build issue on release.
  - @lowdefy/api@4.0.1
  - @lowdefy/client@4.0.1
  - @lowdefy/layout@4.0.1
  - @lowdefy/actions-core@4.0.1
  - @lowdefy/blocks-antd@4.0.1
  - @lowdefy/blocks-basic@4.0.1
  - @lowdefy/blocks-loaders@4.0.1
  - @lowdefy/operators-js@4.0.1
  - @lowdefy/plugin-next-auth@4.0.1
  - @lowdefy/block-utils@4.0.1
  - @lowdefy/helpers@4.0.1
  - @lowdefy/node-utils@4.0.1

## 4.0.0

### Minor Changes

- f44cfa0cb: Add built with lowdefy branding to servers.

### Patch Changes

- Updated dependencies [f44cfa0cb]
- Updated dependencies [e694f72ee]
- Updated dependencies [84e479d11]
  - @lowdefy/client@4.0.0
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/api@4.0.0
  - @lowdefy/blocks-antd@4.0.0
  - @lowdefy/layout@4.0.0
  - @lowdefy/actions-core@4.0.0
  - @lowdefy/blocks-basic@4.0.0
  - @lowdefy/blocks-loaders@4.0.0
  - @lowdefy/operators-js@4.0.0
  - @lowdefy/plugin-next-auth@4.0.0
  - @lowdefy/block-utils@4.0.0
  - @lowdefy/helpers@4.0.0
