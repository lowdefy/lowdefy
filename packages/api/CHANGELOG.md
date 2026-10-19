# Change Log

## 7.0.0

### Major Changes

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

- 06a3a4a: feat(api)!: RenderNotification's landingPage names the page by id

  **Breaking:** `properties.landingPage` is now a page id (or `{ pageId, pathParams }`) instead of a page path. Change `landingPage: /notifications/link` to the landing page's id, for example `landingPage: notifications-link`. A value that names no page, such as a path, fails the step with a `ConfigError` that says to pass the page id.

  The step builds the landing URL path from the route table with `buildPagePath`, like every other notification link, so a landing page with a `path` gets the right URL.

### Minor Changes

- cf25c09: feat(api): `CallAgent` routine steps take `files` beside their prompt

  A `CallAgent` step can now hand the model images and documents: `files: [{ url, mediaType }]` sends the prompt and one part per file as a single user message, an image part for `image/*` and a document part otherwise. The link goes to the provider as a URL, which a provider that takes that media type as a link fetches itself; otherwise the server downloads the file first, within the agent's `fileDownload` limits. Pass a presigned link to a private file. A `files` that is not an array, or an entry without a `url` and a `mediaType`, fails the step with a `ConfigError`. Without `files` a step runs as before.

- 08d8938: feat(api): Tool endpoints read the files attached in an agent chat with `_agent: files`

  An `AgentChat` file uploaded through `uploadPolicyRequestId` now keeps its storage key on its message part, as `providerMetadata: { lowdefy: { key } }`, so saved conversations and `onFinish` hooks hold it beside the signed link. `_agent: files` gives a tool endpoint, and the endpoints it calls with `CallApi`, the files of every message the chat request carried, as `[{ key, filename, mediaType }]`; it is `[]` under a `CallAgent` step. The model gets a line naming each file before it (`Attached file: screenshot.png`), so it can pass the name to a tool, and the storage key is not sent to the model. The saved messages are unchanged. The files come from the person's own chat request, so a tool should look a file up by name in `_agent: files` and check that the key is one the caller may read before reading it.

- b3ba6fb: feat: Tool endpoints know the calling agent with the `_agent` operator

  - **`_agent` server operator.** `_agent: id` returns the id of the agent that called the endpoint as a tool or hook, `_agent: conversationId` the chat's conversation id, and `_agent: true` both as `{ id, conversationId }`. On a call that did not come from an agent (a page request, an MCP tool call, a scheduled, webhook or auth hook run), it returns `null`, or the `default` when one is given, and never throws.
  - **Set by the engine, not the model.** The agent runtime puts the running agent on the tool endpoint's routine. Nothing in the tool's payload or the chat request can set or change it, so an app can record agent work apart from a person's.
  - **Inherited by nested calls.** Endpoints a tool endpoint calls through `CallApi` (including `detached: true`) or a connection's `callApi` see the same agent.
  - **Headless agents.** Tools an agent run by a `CallAgent` routine step calls see the agent with `conversationId: null`.

- f7fa621: feat(agent): agent calls carry the page's path parameters

  `AgentChat` sends the page's `pathParams` with each call next to `urlQuery`, the agent route accepts them, and the page-context option adds a `pathParams` line to the agent's instructions when the page has any. A record id moved from the query into the page path is still known to the agent. Links in agent messages are resolved to their page and path values through the engine's path memory.

- aad166b: feat(api): `_agent: sharedState` gives an agent's tool endpoint the chat's shared state

  A tool endpoint an agent calls can now read the shared state the `AgentChat` block sent with the message, for example the page or browser details an app puts there, with `_agent: sharedState`. The tool reads it from the chat instead of from its input, which the model writes. It is `null` for an agent run by a `CallAgent` step.

- 099d412: AgentChat: send `sharedState` as read-only context

  - **`sharedStateReadOnly: boolean`** (default `false`). When `true`, the block still sends `sharedState` with each turn (to `_payload`, and to the agent's context block with `pageContext: true`), but the server does not register the `update-page-state` tool, so the model is never offered a write to page state. Use it to give an agent context such as the current time or the record on screen when some of those values are also bound to inputs the agent should not change. Without it, an app that wanted context but no writes had to list every other tool in the agent's `activeTools`.

- 07a67b5: AI requests take `maxOutputTokens` and `timeout`, and a closed request cancels its model call.

  - `GenerateText`, `GenerateObject` and `Decide` take `timeout`: the milliseconds a model call may take, retries included, before it is cancelled. `Decide` also takes `maxOutputTokens`.
  - The `Anthropic`, `OpenAI`, `Google` and `AIGateway` connections take `maxOutputTokens` and `timeout` as defaults for every request and agent on the connection that does not set its own.
  - Request resolvers receive `signal`, which aborts when the request that started the work closes: when the server's request timeout (`config.requestTimeout`) answers first, or, on the Node server, when the client disconnects. The AI requests pass it to the model call, so a call that nobody is waiting for stops instead of running, and billing, to its end. A call stopped by the request timeout fails with a `ServiceError`. A call stopped because the client left fails with a `UserError`, which is logged as a warning.
  - Work that outlives its request is not cancelled with it: endpoints with `async: true`, detached runs, and agent chat turns, which still run to their end so `onFinish` hooks save the conversation. A `CallAgent` step is cancelled with the routine that runs it.

  A synchronous routine that kept running after its request timed out now has its AI calls cancelled at the timeout. Use `async: true` for work that takes longer than `config.requestTimeout`.

- cad92af: feat: The server matches page paths to pages

  - `matchPagePath({ routes, path })` (exported by `@lowdefy/node-utils`, so the journey tools match paths the way the server does) matches a request path to `{ pageId, pathParams }` against the route table. A fixed segment beats a placeholder at the first position where patterns differ; fixed segments match case-sensitively; each segment is decoded once; an empty segment (other than one trailing `/`), an undecodable segment and a `.` or `..` segment match no page.
  - `getPageConfig` takes the request `path` instead of the page id, loads the matched page and returns its `pageId` and `pathParams` with the status. An unmatched path answers as an unknown page id did.
  - `getRootConfig` returns `pagePaths`, the path of every page with one that the caller may open.
  - Dynamic block endpoints receive `pathParams` in their payload next to `urlQuery`.
  - A same-origin navigation URL in Dynamic content is checked on the page its path matches.

- 660157b: Add app events. The `events` object at the root of `lowdefy.yaml` takes `onInit` and `onInitAsync` actions that run once each time the app loads in the browser, whichever page opens first, and do not run again on navigation. The app `onInit` runs before the first page's own events and keeps the page in its loading state until it finishes, so a page's `onInit` can read the global values it set. The app `onInitAsync` runs after it without blocking the page, and pages re-render when it sets global values. Use them to set up `global`, for example user settings fetched with `CallAPI`. App events run outside any page, so the build fails if one uses a page-scoped action (`SetState`, `Request`, `Validate`, `Reset`, `CallMethod`, ...) or operator (`_state`, `_input`, `_request`, ...). Errors display and log like page event errors, run the `catch` actions, and do not stop the page from loading.

  Closes #815.

- 6d311c8: feat: AwsS3PutObject copies a file from a URL

  `AwsS3PutObject` takes a `url` in place of `content` and streams what that `https:` link answers into the bucket, so a routine can copy a file it is handed as a presigned link without the bytes passing through the routine as base64.

  - **Limits.** `maxBytes` (required with `url`) caps the copy: a `Content-Length` over it is refused before reading, and a body that passes it is cut off. `contentTypes` (such as `image/*`) limits what the link may answer with, and `timeout` (default 20 seconds) covers the whole fetch and upload.
  - **Refusals name their reason.** A refused copy stores nothing and throws an error whose `code` is `url_not_https`, `url_not_public`, `too_large`, `content_type`, `fetch_failed` or `timeout`, so a `:catch` can answer each its own way.
  - **Public addresses only.** The link, and every link it redirects to, must lead to a public address. Loopback, private, link-local (cloud metadata), unique-local, carrier-grade NAT, unspecified and multicast addresses are refused with `url_not_public`, checked on the address the connection opens to, so a name that resolves differently a second time cannot get past it.
  - **The link stays out of logs.** When the request fails, the error's `received` holds `[REDACTED]` in place of `url`, since a presigned link carries its signature. Request types name such properties in `meta.credentialProperties`, which plugin authors can use for any property derived from a secret.
  - **Return value.** `AwsS3PutObject` returns `{ bucket, key, size, contentType }`, with `content` as well as with `url`.

- 7636cca: feat: `CallApi` can run its target in one organization, as a named stand-in caller.

  A `CallApi` step in a trusted system run (a scheduled run, an auth hook, a webhook whose `verify` request passed, or a detached run from one) can name `organization` and, optionally, `caller: { id, name }`. The target runs as a system run bound to that organization: under the `tenant` organizations policy every walled request inside it, and in the endpoints it calls, is filtered and stamped with the organization, with the wall on. `_user` inside it is `{ id, name, organization_id, system: true }` when `caller` is named (no roles), or null otherwise, so routines and change logs that stamp writes with the caller run unchanged. A detached call carries the binding.

  The step is refused in a signed-in caller's routine, a strategy caller's, or a webhook with no passing verifier, and a bound run can not name a different organization or caller. A `caller` without `organization`, or a static value of the wrong shape, is a build error.

  Only the stand-in caller carries `_user.system`. A `jwt` auth strategy whose `claimMapping` names `system` is a build error, and the dev server refuses a mock user, headless user or e2e user that sets `system`.

- f889c26: feat: dynamic blocks policies. Declare `policies.dynamicBlocks` in `lowdefy.yaml` to render block config stored as data — generated forms, model output — through a `Dynamic` block within limits the app sets. A policy lists the blocks, actions, operators, endpoints, requests, pages and origins content may use, an optional state path it must write under, whether HTML is allowed, and size, depth and actions-per-event limits. It requires literal values wherever content names a target.

  - `Dynamic` blocks take `properties.policy`. The policy's types are bundled into the page, and the resolved content is checked against the policy on every page get; a violation renders the fallback and logs each rule broken.
  - New built-in routine step `ValidateDynamic` runs the same check and returns `{ valid, errors, blocks }`, with a content path, rule and message per error, for a generator to correct and retry. In a Dynamic block's endpoint, `_step: <stepId>.blocks` of a passing step with the block's policy is returned as config; all other data stays literal.
  - New built-in routine step `DescribeDynamicPolicy` returns what a policy allows, with the schemas of its blocks, actions and operators, to build a model's prompt from.
  - The build validates policies (installed types, exact origins, no `Dynamic` or `_operator`), checks their pages, endpoints and requests on every page that hosts them, and warns when a policy without HTML lists operators that build strings.

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

- 09717e8: MongoDB driver errors become `ServiceError`s with a code and a hint.

  Every MongoDBCollection request now maps a driver failure to a `ServiceError` whose message names the collection and the operation, whose `code` is the MongoDB error code, and whose new `hint` says what to do about it — add `upsert: true` on a duplicate key, index the filter fields on a time limit, grant the database user a role on an authorization failure, and so on.

  The driver's raw message is no longer sent to the browser: it can quote values from the document that triggered the error. A `ServiceError`'s cause is now dropped when the error is serialized to the client, so the raw text stays in the server log, where the dev terminal prints it as `Caused by: MongoServerError: …` under the located error line.

- 6b4bd99: Runtime errors reach the agent feedback channel with their config source.

  - The dev server now collects server-side failures — request, endpoint, MCP and agent tool errors — into a ring buffer surfaced as `serverErrors` in `GET /lowdefy-docs/build-status` and the `lowdefy_build_status` MCP tool, beside `clientErrors`. Each entry carries the resolved yaml `source` and `config` path, plus `endpointId`, `requestId` and `pageId` where known (page request failures name the request).
  - MCP tool errors carry their config source (` (at file.yaml:line)`) and hint in dev. Unexpected tool-call failures now go through the server's error sink so they are logged with their source. Production keeps returning the bare message.
  - `_js` execution errors report the original JavaScript error (`ReferenceError: x is not defined`) instead of pasting the whole function source into the message.

- 7bd38cb: Implement the `:while` routine control. A routine using `:while` now runs its `:do` routine repeatedly while the condition holds, instead of failing at request time with "Unexpected control" for config that built cleanly.

  The condition is re-evaluated before every iteration against the routine's current `state` and `steps`. Unlike `:for`, a `:while` loop does not index the step results of its body, so each iteration overwrites the previous one and `_step: my_step` reads the latest iteration's value. There is no iteration cap - a condition the body never falsifies loops forever, as it would in JavaScript.

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

- 60fb714: feat: Member tokens for MCP scripts

  A script that runs on its own can now call an app's MCP tools with a long-lived **member token** instead of an OAuth grant, which a crashed refresh can sign out with no way back short of a person signing in again. A member creates a token for themselves from a signed-in session with the new `CreateMcpToken` auth step, choosing an expiry in days or none. The script sends it as `Authorization: Bearer ldf_mcp_…` to `/api/mcp` and is served as that member, with their roles and organization, exactly as an OAuth-connected assistant is (`_user.auth_method` is `'mcp'`).

  - Tokens are stored hashed in the new `user-mcp-tokens` auth collection, created only in apps that set `auth.oauthProvider`.
  - `RevokeMcpToken` switches off one of the caller's own tokens; `RevokeOrgMcpToken` lets owners and admins switch off any token in their organization. `RemoveMember`, `LeaveOrganization` and `DeleteUser` delete the member's tokens too.
  - A token stops working when its member leaves, is removed or is banned. A refused token gets a `401` whose `error_description` says why.
  - A banned user's OAuth access tokens are refused on `/api/mcp` too.

  See "Tokens for scripts" on the MCP Server & OAuth docs page.

- ee7285c: feat(build): MCP tools can declare annotations

  An `mcp.endpoints` entry takes an optional `annotations` object with the MCP tool annotations: `title`, `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. They are validated at build time and sent with the tool in `tools/list`, so clients such as Claude can show a readable tool name and skip the confirmation prompt for read-only tools.

  ```yaml
  mcp:
    endpoints:
      - id: search-customers
        scope: mcp:read
        annotations:
          title: Search customers
          readOnlyHint: true
  ```

  Annotations are declared, never derived from `scope`: an `mcp:read` tool can still write.

- 31605fb: Notification and email links to patterned pages: a `{ pageId, urlQuery, pathParams }` link builds its URL from the page's pattern in `routes.json` with `buildPagePath`, and a missing path value fails with the builder's error. The stored notification record keeps `pathParams` on the link object. `resolveLink` in `@lowdefy/email-templates` now takes `{ link, paths }`, `buildPreviewProps` takes `paths`, and `lowdefy emails` passes the page paths from `routes.json`.
- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- cda22c0: feat: Pages carry the paths of the pages they link to, and static links to pages with placeholders are checked

  - Each page artifact carries `linkPaths`, `{ [pageId]: path }` for every page that declares a `path` and that the page's collected links target: Link actions with a static `pageId`, HTML `data-page-id` links and Dynamic block link policies. It is `{}` when there are none.
  - A Link action with a static `pageId`, or an HTML `data-page-id` link, to a page with placeholders must give every placeholder a value, in `pathParams` or `data-path-params` (a JSON object). Values an operator computes are checked at runtime.
  - `MenuLink` takes `pathParams`. A menu link to a page with placeholders must give every placeholder a static value, and the default menu leaves such pages out. When `homePageId` is unset, the root config's `home` carries the chosen menu link's `pathParams`.
  - A module auth page is contributed at its `path` when it declares one, and auth page URLs are mapped to pages through the route table.

- e6302c6: fix: Reload when the server answers as another caller

  Page, request and endpoint responses now carry an `x-lowdefy-caller` header naming who the server answered as: `<caller>; session=<hash>; roles=<hash>; memberships=<hash>`. `<caller>` is a short hash of the user id and active organization id, empty when anonymous. `session` hashes the session id, `roles` the caller's app roles and organization role (owner, admin or member) in the active organization, and `memberships` the ids of every organization the person belongs to (under the pinned organization policy, only the app's own organization). A field the server does not know is left out, such as `session` for an API key caller. The browser compares the header with the caller the page renders and reloads the page when the caller or their roles differ, so a page never keeps showing one person's or organization's data after a sign-in as someone else or an organization switch in another tab, and `_user.roles`, `_user.org_roles` and role-gated blocks always match the server. A new session or a changed list of organizations for the same person, organization and roles does not reload the page.

  - A request or endpoint call answered with a 401 while the page shows a signed-in user reloads the page, since the session has ended. A 403 from a page request reloads too; a 403 from an endpoint, and a two-factor enrolment refusal, are thrown as before.
  - When the session names a different user than the page renders, the page reloads instead of keeping the previous user rendered.
  - A kept page instance is rebuilt after `SetActiveOrganization` and `UpdateSession` instead of rendering the state and request results it had under the previous organization.
  - `CallAPI` results read by `_api` are dropped when the organization changes, so a result fetched for one organization is never read under another. Global state is left as it is.
  - A tab reloads at most once every 10 seconds for these reasons; a second difference inside that window fails the call with an `AuthenticationError` instead of reloading again.
  - `@lowdefy/helpers` exports `callerStamp`, `parseCallerStamp` and `rolesHash`.

- 43e5dc4: `:parallel_for` takes `:concurrency`, and expected errors a `:catch` handles log at debug

  - **`:concurrency`** on `:parallel_for` runs at most that many iterations at once (a positive integer; operators allowed), for routines that call a rate-limited service for every item. Every item still runs, and the result is the same as without it.
  - **Caught errors.** A request, service or user error inside a `:try` that has a `:catch` was logged as an error before the `:catch` handled it, so a routine that expects failures (a provider waterfall's 404s) filled the log. Those expected outcomes are now logged at debug. Config, operator and internal errors still go through full error handling (config location, the dev error feed, Sentry) even when caught. Errors with no `:catch`, and errors in `:catch` or `:finally`, are logged as before.
  - A request's schema errors in an endpoint step now name the step instead of `Request "undefined"`.
  - `createPlaywrightConfig` (`@lowdefy/block-dev-e2e`) takes optional `appDir`, `name`, `testMatch`, `services`, `env`, `fullyParallel` and `workers`, for suites that need their own app and services.

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

- d12c7cc: fix: Schema validation no longer grows server memory or fails on a schema with an `$id`.

  - The shared ajv instance kept every schema object it compiled. A `ValidateSchema` step compiled a fresh copy of its schema on every call, and an endpoint's `payloadSchema` was compiled again whenever its config file was read again, so the server's memory grew for its whole life.
  - A second copy of a schema with an `$id` failed with `schema with key or id ... already exists`: a `ValidateSchema` step with such a schema worked once and then failed on every call, and so did a `payloadSchema` after a dev rebuild or a config cache eviction.

- d7b2029: chore: Update the MCP SDK to 1.31.0 and `@hono/mcp` to 0.3.2.
- ebf95f8: fix(server-dev): Cheaper rebuilds and restarts in the dev server

  - **Restarts no longer fail with "Port in use".** A restart now waits for the old server process to exit before it starts the new one (up to 10 s, then a forced stop and up to 5 s more), so the new process never finds the port still taken and the server no longer stays down until the next restart.
  - **No more endless rebuild loop.** An app whose own local plugin package is its config directory (its plugin lives next to `lowdefy.yaml`) rebuilt itself every few seconds when its ref resolvers wrote into `public/`. The local plugin watcher now reacts only to code files (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`) and ignores `public/`, `node_modules` and the build directories. YAML and Markdown edits stay with the config watcher, so a page edit no longer runs a full build as well.
  - **Page builds no longer rewrite the whole key maps.** Every page the dev server built rewrote `keyMap.json` and `refMap.json` twice, and the files only grew (tens of MB on large apps, with a full parse after each edit). They now hold only what the config build wrote; each page build writes the keys it added to a small file under `build/jitMaps/`. Error locations, `/lowdefy-docs/find` and the file watcher read those files. A key from a page built before the last two page edits may resolve without a location.
  - **Unchanged build files are left alone.** After a config build, artifacts whose bytes did not change are no longer replaced, so Vite does not reload modules that did not change.
  - **Agents restart less.** The MCP tools and agent guidance now say to restart the dev server only when it seems stuck or build status looks stale, or after secrets a wrapper injects have changed. `.env` edits and local plugin code are picked up without a restart.

- 8c68631: feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

  - **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
  - **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
  - **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
  - **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.

- 71fef2d: fix(api): A forwarded cron pings the target environment's `<basePath>/api/cron/<endpointId>`. It pinged `<url>/api/cron/<endpointId>`, so with `config.basePath` set every forwarded schedule missed the app's cron route.
- dda12e3: fix(api,servers): detached calls release the dispatcher at once. The `/api/detached` route awaited the target's whole routine before replying, and the dispatching invocation keeps itself alive (`waitUntil`) until that reply arrives — so every parent stayed in flight for as long as its detached children ran (a cron tick that answers in milliseconds was held open by its slowest dispatched job, keeping its instance's memory billed), and a chain of detached hops was a chain of nested in-flight requests. The route now answers `202` as soon as the call is authorized and runs the target after the response under its own `waitUntil` (new `acceptDetachedEndpoint` in `@lowdefy/api`); the outcome is logged as `detached_run_done` / `detached_run_failed`.
- a6e7e42: fix(api): A detached `CallApi` checks the target endpoint's `auth` like a synchronous call

  A `CallApi` step with `detached: true` now runs its target only when the dispatching user could call that endpoint synchronously. System dispatchers (cron, hooks, verified webhooks) pass as before.

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

- 238cba5: fix: A page `CallAPI` without a `payload` is checked against the endpoint's `payloadSchema` as an empty object, as a nested `CallApi`, agent tool, MCP call and schedule already were. Before, a schema with `type: object` refused it.
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

- bfc6a00: fix: Endpoint responses no longer carry build markers, and the dev run-endpoint tool reports a failed routine's own error.

  - Endpoint and request responses built from config (a `:return` object, a `:set_state` value read back) no longer include `~k`, `~r` and `~l` keys or wrap arrays as `{ "~arr": [...] }`. A webhook endpoint now sends its `:return` value to the caller in exactly the shape the config gives it.
  - The dev server's run-endpoint and run-request tools (`lowdefy_run_endpoint`, `lowdefy_run_request`) no longer answer with `TypeError: Cannot read properties of undefined (reading 'length')` when a routine fails or ends without `:return`. They return the routine's result, including its error and the error's config source.
  - `serializer.serialize` accepts `skipMarkers`, as `serializeToString` already does.

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

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

- 69c31e8: feat: Replay journeys with `--repeat`, measure what each journey exercised, and run config mutants through journeys

  - **`lowdefy test [paths...] --repeat <n>`.** Run journey files or directories anywhere under the config directory, candidates in `tests/journeys/_candidates/` included; `--filter` still applies on top. `--repeat` (1 to 10) runs each journey n times and classifies it `PASS`, `FLAKY` (some runs failed, each failing run's step printed) or `FAIL` (every run failed: a finding, not a test to fix by retrying). Any `FLAKY` or `FAIL` exits 1. A journey file the runner refuses fails once and is not repeated. Run once, the output is unchanged. `lowdefy_run_tests` takes `paths` and `repeat` with the same meaning, and each result carries `class`.
  - **What a journey exercised.** Every journey result carries `exercised`: the pages, requests (with call counts), endpoints and app events its browsers asked the dev server for, merged across actors, plus the endpoints a routine reached through `CallApi` (`via`) and whether each request and endpoint writes. `lowdefy test` keeps each journey's newest path in `.lowdefy/test/exercised.json`.
  - **Config mutants (dev server).** `POST /lowdefy-docs/mutants` lists the mutants on what a set of journeys exercised (dropped actions, skipped validation, flipped visibility, swapped `_if` branches, dropped payload keys, retargeted links, dropped blocks and routine steps), each with an id that is stable across builds and the source line it changes. A journey POST can carry one `mutant`: the dev server applies it only to the requests of that journey's own browsers, including detached endpoint calls, and reports how often it applied. Your own browser tabs keep seeing the unmutated app.

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

- 5355d30: fix: A POST whose body is not a JSON object is answered with 400 and logged as a warning, instead of a 500 logged as a server error. This covers `/api/endpoints/*`, `/api/request/*`, `/api/agent/*`, `/api/detached/*`, `/api/usage` and `/api/client-error` on every server, plus the dev server's `/api/dev-inspect`, `/lowdefy-feedback` and `/lowdefy-docs/state-checkpoints/{load,snapshot}`. The dev tool routes that already treat a missing or unreadable body as empty keep doing so.
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

- 2755501: feat: The build checks block properties, action params and operator params against their plugin schemas

  - After refs resolve, every block's `properties`, action's `params` and operator's params is validated against the schema its plugin ships. A finding is a warning with the type, the field, and the file and line of the field: `[ConfigWarning · plugin-schema] Block "Button" property "colr" is not allowed.`
  - A value an operator gives at runtime is not judged. A missing required key or a misspelt key still reports, even beside operators.
  - `~ignoreBuildChecks: [plugin-schema]` silences the check on a node, and `plugin-checks` and `--skip-plugin-checks` cover it. A plugin makes its schema findings errors with `schemaLevel: 'error'` in its `./checks` export.
  - `@lowdefy/ajv` exports `getConfigSchemaErrors` and `formatSchemaError`. Dynamic pages validate block properties with the same function, so a `oneOf` above an operator no longer reports at runtime.
  - The `Validate` and `ResetValidation` schemas accept `true` and the `{ blockIds, regex }` form the actions already take.

- 56dfd8e: fix: A Dynamic block whose endpoint routine ends with `:reject` is logged once, as the warning the reject writes. It is no longer logged again at error level when the fallback renders.
- 2486253: fix: A `ValidateSchema` step compiles its schema once and reuses it, instead of compiling it again on every call. Validators are cached by schema content, so a schema built by operators still gets checked as it is on each call.
- afd1fa2: fix: A webhook endpoint sends its response as plain JSON. A date in the `:return` value now arrives as an ISO string instead of `{ "~d": 1767323045000 }`, and an error as its message fields instead of `{ "~e": ... }`.
- b8beaa3: Websocket upgrades from another origin are refused. `/api/websocket` accepts an upgrade whose `Origin` matches the `Host` it arrived on, the first `X-Forwarded-Host`, or the app's configured public URL (`BETTER_AUTH_URL`, the current environment's `url`, or an auth trusted origin), and one that sends no `Origin` (a server or script). Any other upgrade gets a 403, and the server logs a warning with its `Origin` and `Host`. Behind a proxy or CDN, pass the original `Host` or set `X-Forwarded-Host`. Hosts compare without case and without default ports. In `lowdefy dev`, the upgrade's `Host` must also be `localhost`, a `*.localhost` name or an IP address, as for every other dev request. The rule lives in `@lowdefy/api` (`isSameOriginRequest`, `isWebSocketOriginAllowed`), shared by every server.
- 36c9d6a: fix(api): A websocket re-subscribe that fails leaves nothing open

  A re-subscribe to an open websocket (the `Subscribe` action with a changed payload) removes the previous subscription before preparing the new one. A re-subscribe that fails, such as one the caller is not authorized for, no longer leaves the previous channel running for a client that has stopped reading it.

- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

- Updated dependencies [cf25c09]
- Updated dependencies [08d8938]
- Updated dependencies [14c4764]
- Updated dependencies [b3ba6fb]
- Updated dependencies [f7fa621]
- Updated dependencies [aad166b]
- Updated dependencies [099d412]
- Updated dependencies [d12c7cc]
- Updated dependencies [cad92af]
- Updated dependencies [660157b]
- Updated dependencies [5ad581d]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [baf6576]
- Updated dependencies [d42f420]
- Updated dependencies [e024e63]
- Updated dependencies [3be51e0]
- Updated dependencies [7636cca]
- Updated dependencies [ebf95f8]
- Updated dependencies [24383b5]
- Updated dependencies [81a5ad3]
- Updated dependencies [91740e6]
- Updated dependencies [2595439]
- Updated dependencies [8c68631]
- Updated dependencies [460fdaa]
- Updated dependencies [badaa49]
- Updated dependencies
- Updated dependencies [2ef077f]
- Updated dependencies [fc8a168]
- Updated dependencies [8348aa9]
- Updated dependencies [a354a1f]
- Updated dependencies [f9e483f]
- Updated dependencies [588344b]
- Updated dependencies [d2c8e01]
- Updated dependencies [f889c26]
- Updated dependencies [550be9f]
- Updated dependencies [46d28c4]
- Updated dependencies [7c20d1b]
- Updated dependencies [6b3a9bb]
- Updated dependencies [4a35ba2]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [b56bb7a]
- Updated dependencies [1d31a29]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [6b4bd99]
- Updated dependencies [662eaa9]
- Updated dependencies [8398345]
- Updated dependencies [8c50bfc]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [c744e40]
- Updated dependencies [de6a268]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [ec6d2e7]
- Updated dependencies [a79fb1d]
- Updated dependencies [d5f7f3f]
- Updated dependencies [4cc0f36]
- Updated dependencies [ef64856]
- Updated dependencies [cb0acad]
- Updated dependencies [9a92898]
- Updated dependencies [0205b5a]
- Updated dependencies [316f5be]
- Updated dependencies [ba86509]
- Updated dependencies [f9d8520]
- Updated dependencies [e5b2f83]
- Updated dependencies [da76905]
- Updated dependencies [1766343]
- Updated dependencies [9ed1386]
- Updated dependencies [73c5e14]
- Updated dependencies [c3e0d79]
- Updated dependencies [e5cffa6]
- Updated dependencies [1d547f3]
- Updated dependencies [d46ce43]
- Updated dependencies [5e6bed8]
- Updated dependencies [ee7285c]
- Updated dependencies [371a4a6]
- Updated dependencies [c6b598a]
- Updated dependencies [d455e25]
- Updated dependencies [aa510ca]
- Updated dependencies [31605fb]
- Updated dependencies [959ec32]
- Updated dependencies [856e65d]
- Updated dependencies [c1bb9a0]
- Updated dependencies [409c918]
- Updated dependencies [5060cdf]
- Updated dependencies [05b66f2]
- Updated dependencies [a34939d]
- Updated dependencies [cda22c0]
- Updated dependencies [366ed1e]
- Updated dependencies [33f4bba]
- Updated dependencies [e6302c6]
- Updated dependencies [43e5dc4]
- Updated dependencies [1f58d7f]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [5017abe]
- Updated dependencies [99fcb06]
- Updated dependencies [588ca93]
- Updated dependencies [25ce8ba]
- Updated dependencies [ae3541c]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [99c9dac]
- Updated dependencies [fa02e14]
- Updated dependencies [537bf54]
- Updated dependencies [7623c86]
- Updated dependencies [26d905c]
- Updated dependencies [7ab8964]
- Updated dependencies [712d6ef]
- Updated dependencies [4f37391]
- Updated dependencies [5d951af]
- Updated dependencies [4b3f5bd]
- Updated dependencies [31911e7]
- Updated dependencies [242746a]
- Updated dependencies [aca0ddf]
  - @lowdefy/build@7.0.0
  - @lowdefy/operators-js@7.0.0
  - @lowdefy/node-utils@7.0.0
  - @lowdefy/operators@7.0.0
  - @lowdefy/helpers@7.0.0
  - @lowdefy/ajv@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/connection-smtp@7.0.0
  - @lowdefy/email-templates@7.0.0
  - @lowdefy/nunjucks@7.0.0

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

- 5657441: fix: API routine steps now evaluate operators against the full routine frame.

  - `ValidateSchema` step properties can read routine state. `_state` in a `ValidateSchema` step resolved to `null`.
  - Connection properties can read the loop item. `_item` in a connection's properties inside a `:for` or `:parallel_for` loop resolved to `null`.
  - `$` in `_state`, `_step`, `_payload` and `_item` paths inside a `:for` or `:parallel_for` loop now resolves to the current loop index, as it does for list blocks on the client. For example, `_step: fetch.$.id` reads the current iteration's `fetch` result.
  - Operators that evaluate nested config, such as `_function`, now receive a parser bound to the calling frame. `_function` bodies no longer depend on `_function` forwarding each frame field, so a nested `__function` keeps routine state, items and loop indices.

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
- Updated dependencies [1d3a0b8]
- Updated dependencies [d1bd356]
- Updated dependencies [1bbaab7]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
- Updated dependencies [2b2b27a]
  - @lowdefy/operators-js@6.1.0
  - @lowdefy/operators@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/build@6.1.0
  - @lowdefy/nunjucks@6.1.0
  - @lowdefy/node-utils@6.1.0
  - @lowdefy/errors@6.1.0
  - @lowdefy/ajv@6.1.0

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
