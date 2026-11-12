# Change Log

## 7.2.0

### Minor Changes

- 344c002: feat(connection-mongodb): MongoDBEnrichmentEnqueue dry run counts a run before it starts

  An app that pays a data provider per enrichment cell had no way to learn how many cells a run would queue without queueing them, so it could not show what a run would cost and ask first. `MongoDBEnrichmentEnqueue` now takes `dryRun: true`: it reads and plans exactly as a run does and returns `{ dryRun: true, queued, missingInputs, skipped, byColumn }`, writing nothing. Over `maxCells` it throws as a run would. A run's response gains the same `byColumn`, each column's queued and missing input counts, so an app can price each column with its own provider cost and compare the estimate with what ran.

- b1d42ca: feat(helpers, blocks-table, connection-mongodb): A Table filter reads as one sentence, on the page and from `MongoDBTableQuery`

  A saved view's filter was readable only by opening the filter builder, and a server routine running the view through `MongoDBTableQuery` had no way to say what it matched. `describeCondition({ condition, fields })`, new in `@lowdefy/helpers`, turns a filter condition into a sentence such as "Stage is any of Lead or Won and Name contains CX": field titles, operator words, option labels, relative dates in words, `$user` values as "me", and brackets for groups past the first level. A key that names no field reads "an unknown field, <key>," rather than being dropped. The Table's Filter button shows the sentence as its tooltip. `MongoDBTableQuery` fields accept `title` and `options` as Table columns do, and the response carries `sentence` when a filter is set, the same sentence the Table shows for the same titles and options.

- 837d529: feat(blocks-table, connection-mongodb): Table `before` and `after` filters take relative dates

  A Table date filter could say "within the last 3 months", but `before` and `after` took only a fixed date, so a saved view such as "not contacted in 3 months" went stale the next day. `before` and `after` now also take the relative value `within` takes, `{ last | next: n, unit: day | week | month | year }`, resolved each time the filter runs: `{ op: before, value: { last: 3, unit: month } }` reads "before 3 months ago". A relative bound compares whole days, in the browser's days in client mode and in the request's `timezone` in `MongoDBTableQuery`. The filter builder offers Date or Relative for `before` and `after`, a date column's filter menu picks `within`, `before` or `after` under Relative, and `MongoDBTableQuery` refuses a bad relative value with the message it gives for `within`.

### Patch Changes

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
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0

## 7.1.0

### Patch Changes

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

### Minor Changes

- 2595439: `@lowdefy/connection-treg`: call treg's catalog of external API endpoints from server routines

  [treg](https://treg.to) puts thousands of external API endpoints (enrichment, SEO and SERP data, social data, scraping, generation) behind one token. The new `TregConnection` connection is a default type, so apps use it without installing a plugin.

  - **`TregCall`** calls a catalog or routed endpoint by id, such as `treg.people.email.find`. It takes `query`, `body`, an `idempotencyKey` (a retry gets the stored answer and is not charged again), a `maxCost` ceiling in USD, cache and routing options, and `meta` tags for per-customer usage. It returns `output`, `raw`, the charged `cost` in micro-USD and USD, the `callId`, the provider that served it and those tried. With `await`, it polls an async task until it is done. Upstream URLs are never accepted as endpoints, and the team's own registered tools need `allowCustomTools: true` on the connection.
  - **`TregCatalogSearch`**, **`TregCatalogGet`** (with `access: true`, the team's price) and **`TregBalance`** for admin pages and provider catalogues.
  - A balance that is too low or a call over `maxCost` is a final error. A rate limit, a busy or out-of-capacity treg and a network failure are a `ServiceError` with `retryAfter`, the seconds treg asked to wait. A treg 422 is a `ConfigError`. Error messages never contain the token, a provider's response body or the top-up link.

  A `:catch` can now read a `ServiceError`'s wait as `_error: retryAfter`.

  `MongoDBEnrichmentComplete` results take a `cost` in micro-USD, stored as the cell's `cost`, and the `Table` cell details panel shows it. An enrichment provider backed by treg returns `TregCall`'s `cost.micro` there. A retried error result can also take `retryAfterMs`, which replaces the exponential backoff (at most a day), so a worker waits as long as treg's `retry_after` asks.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

- 09717e8: MongoDB driver errors become `ServiceError`s with a code and a hint.

  Every MongoDBCollection request now maps a driver failure to a `ServiceError` whose message names the collection and the operation, whose `code` is the MongoDB error code, and whose new `hint` says what to do about it — add `upsert: true` on a duplicate key, index the filter fields on a time limit, grant the database user a role on an authorization failure, and so on.

  The driver's raw message is no longer sent to the browser: it can quote values from the document that triggered the error. A `ServiceError`'s cause is now dropped when the error is serialized to the client, so the raw text stays in the server log, where the dev terminal prints it as `Caused by: MongoServerError: …` under the located error line.

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

- 5400fcf: `MongoDBEnrichmentEnqueue`, `MongoDBEnrichmentClaim` and `MongoDBEnrichmentComplete`: a run queue for enrichment columns

  Enrichment columns compute each row's cell from other columns, with a provider endpoint of your app or an AI prompt. The three requests keep each cell's run state in its row, under `_enrich.<column key>`:

  - **`MongoDBEnrichmentEnqueue`** queues the cells of some columns for the selected rows (row keys, or the `Table` selection `{ all, except, filter, search }`). `mode` picks the cells: `all`, `empty`, `errors` or `stale` (the inputs changed since the value was computed). It never restarts a cell that is queued or running. A row with a missing input gets `status: empty` and `Missing input: <column>` instead. A column can run with the columns it reads: its cells wait for them (`waitingFor`) instead of finding their input missing. It writes nothing when more than `maxCells` (10,000) cells would change.
  - **`MongoDBEnrichmentClaim`** hands a worker the oldest queued cells, each with a lease, a claim token, the row, the resolved inputs and the column config the worker needs (`kind`, `title`, `provider`, `prompt`, `output`). Concurrent workers never get the same cell, and a cell whose worker crashed is claimed again when its lease runs out.
  - **`MongoDBEnrichmentComplete`** writes the results. A result counts only while its claim still holds. A failed attempt is retried with an exponential backoff until `maxAttempts`. Large `raw` responses are stored truncated. It releases the cells waiting for a finished cell and queues the `autoRun` columns an ok cell feeds. `error: null` and `retry: null` mean not given.

  Column inputs can only read fields in the table's `fields` or other enrichment columns, never a formula or extract column (those compute in the browser, so no row stores their value). The requests only write `_enrich` cell state, and every read and write is scoped by the base `filter` and the tenant. The MongoDB docs include the worker endpoint: claim, call the providers with `:parallel_for` and `:concurrency`, complete, on a one-minute schedule. Read the columns on the server in every endpoint, never from the payload.

- 537bf54: `MongoDBTableQuery` and `MongoDBTableChanges` for the Table blocks

  - **`MongoDBTableQuery`** serves `Table` in server mode. It turns the table's view (sort, a nested filter, search, grouping and totals) into one aggregation, checked against a `fields` allowlist. It pages rows as the table scrolls, returns groups one level at a time, and returns totals. The browser never sends MongoDB syntax: unknown fields, operators a field's type doesn't allow, and operator-shaped values are all refused. Your base `pipeline` always runs first, so a filter can only narrow it. Rows return only `_id`, the `fields` paths and any `returnFields`, unless you set `project: false`. `{ $user: path }` values are resolved on the server from `user: { _user: true }`. Date filters compare the days of `timezone` (default UTC), so pass the user's time zone to match the table. The work one view can ask for is bounded (filter size, value length, `maxTimeMS` 10 seconds by default), and rows are sorted before the facet so an index can serve the sort.
  - **`MongoDBTableChanges`** saves a `TableInput` changeset in one `bulkWrite`:

    - `$set` on the changed dot paths only;
    - inserts, deletes, and position writes for dragged rows.

    With `selection` (the `Table` `selected` value, keys or `{ all: true, except, filter, search }`) and `set`, it writes the same values to every selected row in one `updateMany`, for bulk actions such as assigning an owner.

    With `array: { documentId, path }` the rows are items embedded in one document, such as a recipe's items. It then writes with `arrayFilters`, `$push` and `$pull`, and reorders by moving items on the server. Only allowlisted fields can be written, and the base `filter` scopes every operation. The `filter` and `insertDefaults` fields can not be in `fields`, and new rows are stamped with the filter's equality conditions, so a row can never move out of scope or be added to another organization. The response lists the rows that matched nothing (outside the filter, or gone) in `unmatchedKeys`, and a numeric row key matches whether the table sends it as `5` or `"5"`.

  - Bulk write errors (`MongoBulkWriteError`, from `MongoDBBulkWrite`, `MongoDBInsertMany` and the new request) are now mapped like other driver errors, so the failing document's values no longer reach the browser.

### Patch Changes

- 2fa700e: fix: Lowdefy apps no longer install Next.js.

  The production server still listed `@sentry/nextjs`, and the MongoDB connection still listed `@next-auth/mongodb-adapter`. Neither was used: Sentry already runs on `@sentry/node`, `@sentry/browser` and `@sentry/vite-plugin`, and the MongoDB auth adapter is built on BetterAuth. `@sentry/nextjs` requires Next.js as a peer, and `@next-auth/mongodb-adapter` requires `next-auth`, which requires Next.js, so every app installed Next.js (and `next-auth` with the MongoDB connection) for nothing. They are removed, along with the unused Next.js lint plugin. Sentry setup and configuration are unchanged.

  The production and development servers also no longer list `webpack` as a dev dependency. Nothing used it since the move to Vite, but the CLI installs a server's dev dependencies along with it, so every app installed webpack too.

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

- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/errors@7.0.0

## 6.1.0

### Patch Changes

- 10bbe47: fix(connection-mongodb): The MongoDB auth adapters recover from a failed first connect. `MongoDBAdapter` handed Auth.js a single connect promise, which stayed rejected after one failed connect, and `MultiAppMongoDBAdapter` kept reusing a client whose topology the driver had closed. Either way, one timed-out handshake (a serverless instance frozen mid-connect, a network blip) left every sign-in and session call on that process failing until the instance was recycled. Both adapters now get their client from the same process-wide cache as `MongoDBCollection` connections, which drops a client whose connect failed, so only the request that hit the failed connect errors. An auth adapter and `MongoDBCollection` connections with the same URI and client options now share one connection pool.
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

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0

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

- 59190b5: Refresh dependencies and require Node.js 22 or newer.

  Updated a range of libraries across the project to current versions (including the MongoDB driver, the
  MQL/aggregation engine, and various build and CLI tooling) and set the minimum supported Node.js version
  to 22, matching what is tested in CI. Most changes are internal with no effect on your app. One small
  behaviour note: in `_mql` expressions, adding to a missing or null field now returns `null` (matching
  MongoDB) instead of `NaN`.

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/helpers@5.5.1

## 5.5.0

### Minor Changes

- 9c93ab2: feat: Port MongoDB community plugin features into @lowdefy/connection-mongodb.

  All features of `@lowdefy/community-plugin-mongodb` are now part of the core MongoDB connection, so apps can drop the community plugin.

  **Change log auditing**

  - New `changeLog` connection property (`collection`, `meta`). All write requests log a change record — request arguments, request context, timestamp, and either the driver response or before/after document snapshots (`MongoDBUpdateOne`, `MongoDBVersionedUpdateOne`, `MongoDBDeleteOne`) — to the log collection. Response shapes are the same with or without a log collection.

  **MongoDBUpdateOne no-match error (behavior change)**

  - `MongoDBUpdateOne` now throws `No matching record to update.` when no document matches the filter and `upsert` is not set. Set `disableNoMatchError: true` on the request to keep the previous silent behavior. Running `lowdefy upgrade` applies a codemod that adds the flag to existing requests, so upgraded apps behave exactly as before. Apps already using the community plugin are unaffected.

  **New requests**

  - `MongoDBVersionedUpdateOne`: updates a document while preserving the previous version as a copy under a new `_id`.
  - `MongoDBInsertConsecutiveId` and `MongoDBInsertManyConsecutiveIds`: insert documents with sequential human-readable ids (for example `INV0001`), assigned inside a transaction (requires a replica set). Also fixes a community plugin bug where the id lookup ran outside the transaction.

  **New auth adapter**

  - `MultiAppMongoDBAdapter`: next-auth adapter for multiple apps sharing one `user-contacts` collection, with per-app membership, roles, and an invite-required sign up flow.

  `MongoDBInsertMany` now also returns `insertedIds`, matching the community plugin response.

### Patch Changes

- 4c9227b: fix: Reuse the MongoDB client across requests instead of connecting per request.

  MongoDBCollection requests previously created a new MongoDB client, performed a full connection handshake (DNS, TLS, auth), and closed the connection for every request. Requests now share one cached client per unique `databaseUri` and `options` combination, so multi-request pages and routines no longer pay a connection setup per request — an 8-request routine measured against MongoDB Atlas dropped from 4.3s to 0.2s (~95% faster). Connections now stay open between requests; the driver's connection pool can be tuned with standard client options like `maxPoolSize` and `maxIdleTimeMS` on the connection's `options` property.

  - @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
  - @lowdefy/helpers@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/helpers@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0

## 4.6.0

### Patch Changes

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
  - @lowdefy/helpers@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/helpers@4.5.1

## 4.5.0

### Patch Changes

- @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- 50af1e8aa: Add MongoDbBulkWrite to MongoDBCollection requests.
  - @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Minor Changes

- 143c83e7d: Add request type `MongoDBBulkWrite` to the MongoDB connection.

### Patch Changes

- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- 66e3c1bfe: Improve property validation errors in MongoDBCollection connection.
- a8673449b: Update dependency mongodb to v6.3.0.
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))
- **deps:** Update dependency mongodb to v4.17.1 ([35abd12](https://github.com/lowdefy/lowdefy/commit/35abd12336d60ad316905cc19260061af7efc90e))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Patch version updates for various deps. ([64068f3](https://github.com/lowdefy/lowdefy/commit/64068f38573113e9436d638489e9435ac7f45edf))
- **deps:** Update dependency next to v13.5.4. ([230a687](https://github.com/lowdefy/lowdefy/commit/230a6876993a0802190a7f33d823fe5630062da9))
- **deps:** Update dependency next-auth to v4.23.1 ([48f9780](https://github.com/lowdefy/lowdefy/commit/48f97809e825fb9afdd169120371184b3e2a98c8))
- **plugin-mongodb:** Fix schema discription. ([5f5cca1](https://github.com/lowdefy/lowdefy/commit/5f5cca1ca6fcacd6092dd6e56620346926925ad3))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))

### Features

- **plugin-mongodb:** Move log-collection to community plugins. ([d526a10](https://github.com/lowdefy/lowdefy/commit/d526a10da8725e9e50de13e24d29d282a1969899))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Fix next-auth peer dependencies. ([0a251a8](https://github.com/lowdefy/lowdefy/commit/0a251a8ff9d80bdafbe0dc38e6d0394a40699d03))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- **connection-mongodb:** Use Lowdefy serialiser util to serialise object ids. ([b7d5d71](https://github.com/lowdefy/lowdefy/commit/b7d5d718466c44a3c01d94359540e8e5e9def96b))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- **connection-mongodb:** Handle upsert true on MongoDBUpdateOne ([7611bee](https://github.com/lowdefy/lowdefy/commit/7611bee1899332b6ccca03fada7cec1541d6c902))

### Features

- Add helper findLogCollectionRecordTestMongoDb ([bc590c9](https://github.com/lowdefy/lowdefy/commit/bc590c99c241f0fbb046be4e13a710070c96cba5))
- **connection-mongodb:** Add log collection tests MongoDBDeleteMany ([15a8b22](https://github.com/lowdefy/lowdefy/commit/15a8b2226828a80ab83d5cfe11c355bb3f45d576))
- **connection-mongodb:** Add log collection tests MongoDBDeleteOne ([5a1334a](https://github.com/lowdefy/lowdefy/commit/5a1334a291c0c1a2263ab0c53cb727efaf6a8693))
- **connection-mongodb:** Add log collection tests MongoDBInsertMany ([64dc0d2](https://github.com/lowdefy/lowdefy/commit/64dc0d22b8810f2ca23085770cffd61aaacb5c92))
- **connection-mongodb:** Add log collection tests MongoDBInsertOne ([a882513](https://github.com/lowdefy/lowdefy/commit/a882513a81cafcc355d212bbb9331a18dd3cc809))
- **connection-mongodb:** Add log collection tests MongoDBUpdateMany ([1b9c64b](https://github.com/lowdefy/lowdefy/commit/1b9c64bb56b7b780ea87b8bc430503386a1bac72))
- **connection-mongodb:** Add log collection tests MongoDBUpdateOne ([9a66604](https://github.com/lowdefy/lowdefy/commit/9a666042429620ff689ee19cef8b97315a795fc5))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **deps:** update dependency next-auth to v4.20.1 [security] ([7e408a2](https://github.com/lowdefy/lowdefy/commit/7e408a2095e73dca79b9777217aec37e11d4cba3))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- Add MongoDBAdapter docs. ([c609b25](https://github.com/lowdefy/lowdefy/commit/c609b25311af8b5df250fc27b56f2fbbe6e80d49))
- **connection-mongodb:** Fix responses, fix after and update user to meta ([485c0b7](https://github.com/lowdefy/lowdefy/commit/485c0b7c11418544d3f51eceab7e75273a65fb8e))
- **connection-mongodb:** Update MongoDBUpdateOne test ([1de6f7a](https://github.com/lowdefy/lowdefy/commit/1de6f7a0fa6a1fa384d2f85a2f8a90274ff35cac))
- **deps:** Dependencies minor version updates ([e50ec30](https://github.com/lowdefy/lowdefy/commit/e50ec30a8bf7dcd38d3ca4cbf68907935939f088))
- **deps:** Update connection driver minor versions. ([bbd43c1](https://github.com/lowdefy/lowdefy/commit/bbd43c139efbb8559c279c1eea635512dbdc026c))

### Features

- Update dependency next-auth and add new providers. ([ca72d8c](https://github.com/lowdefy/lowdefy/commit/ca72d8c87b50651c701ea619a5e061210adf3e53))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Features

- **connection-mongodb:** Add changeLog to connection and requests. ([8e3a0b9](https://github.com/lowdefy/lowdefy/commit/8e3a0b9bc84a410f6dcf2954ba62d3e231a53672))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Features

- Add Next-Auth MongoDB adapter. ([bdffb86](https://github.com/lowdefy/lowdefy/commit/bdffb86edf578c5ea603f382b237601c42e14044))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Features

- Add Next-Auth MongoDB adapter. ([bdffb86](https://github.com/lowdefy/lowdefy/commit/bdffb86edf578c5ea603f382b237601c42e14044))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **connection-mongodb:** Add license comments in schema files. ([0872590](https://github.com/lowdefy/lowdefy/commit/08725905456a3c00d0c00ae3ed2fc5cdde2bd24e))
- **connection-mongodb:** Fix connection-mongodb plugin structure to work with version 4. ([a8b9da9](https://github.com/lowdefy/lowdefy/commit/a8b9da9707fe7aa77e64f042ac36a8efb135329b))
- **connection-mongodb:** Update dependency mongodb to v4.4.0. ([0655365](https://github.com/lowdefy/lowdefy/commit/065536568199fb5cee12d8108b910b675ac5981d))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Features

- Update google sheets and mongodb connections to plugin structure. ([53278a3](https://github.com/lowdefy/lowdefy/commit/53278a31289a398ea2b09cce8b7ec39b5108548f))
