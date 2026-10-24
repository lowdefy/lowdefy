# Change Log

## 7.1.0

### Patch Changes

- 3408010: fix: `lowdefy build` no longer warns `Plugin checks for <package> did not run: package not installed.` for plugins that have nothing to check.

  A clean build warned for every plugin the server had not installed yet, including connection plugins like `@lowdefy/connection-mongodb` that ship no build check rules. The warning now names only plugins that own a block, action or operator type, and `lowdefy build` gives it only from the build after it installs the app's plugins, so it shows a plugin that is still missing rather than one it was about to install. `lowdefy dev` does the same when it starts. Journeys and dev page builds still warn for a missing block, action or operator plugin. `--skip-plugin-checks` no longer gives this warning.

  - @lowdefy/codemods@7.1.0
  - @lowdefy/operators@7.1.0
  - @lowdefy/blocks-basic@7.1.0
  - @lowdefy/blocks-loaders@7.1.0
  - @lowdefy/operators-js@7.1.0
  - @lowdefy/ai-utils@7.1.0
  - @lowdefy/ajv@7.1.0
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/errors@7.1.0
  - @lowdefy/helpers@7.1.0
  - @lowdefy/node-utils@7.1.0
  - @lowdefy/nunjucks@7.1.0

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

### Minor Changes

- cf25c09: feat(api): `CallAgent` routine steps take `files` beside their prompt

  A `CallAgent` step can now hand the model images and documents: `files: [{ url, mediaType }]` sends the prompt and one part per file as a single user message, an image part for `image/*` and a document part otherwise. The link goes to the provider as a URL, which a provider that takes that media type as a link fetches itself; otherwise the server downloads the file first, within the agent's `fileDownload` limits. Pass a presigned link to a private file. A `files` that is not an array, or an entry without a `url` and a `mediaType`, fails the step with a `ConfigError`. Without `files` a step runs as before.

- 660157b: Add app events. The `events` object at the root of `lowdefy.yaml` takes `onInit` and `onInitAsync` actions that run once each time the app loads in the browser, whichever page opens first, and do not run again on navigation. The app `onInit` runs before the first page's own events and keeps the page in its loading state until it finishes, so a page's `onInit` can read the global values it set. The app `onInitAsync` runs after it without blocking the page, and pages re-render when it sets global values. Use them to set up `global`, for example user settings fetched with `CallAPI`. App events run outside any page, so the build fails if one uses a page-scoped action (`SetState`, `Request`, `Validate`, `Reset`, `CallMethod`, ...) or operator (`_state`, `_input`, `_request`, ...). Errors display and log like page event errors, run the `catch` actions, and do not stop the page from loading.

  Closes #815.

- 7636cca: feat: `CallApi` can run its target in one organization, as a named stand-in caller.

  A `CallApi` step in a trusted system run (a scheduled run, an auth hook, a webhook whose `verify` request passed, or a detached run from one) can name `organization` and, optionally, `caller: { id, name }`. The target runs as a system run bound to that organization: under the `tenant` organizations policy every walled request inside it, and in the endpoints it calls, is filtered and stamped with the organization, with the wall on. `_user` inside it is `{ id, name, organization_id, system: true }` when `caller` is named (no roles), or null otherwise, so routines and change logs that stamp writes with the caller run unchanged. A detached call carries the binding.

  The step is refused in a signed-in caller's routine, a strategy caller's, or a webhook with no passing verifier, and a bound run can not name a different organization or caller. A `caller` without `organization`, or a static value of the wrong shape, is a build error.

  Only the stand-in caller carries `_user.system`. A `jwt` auth strategy whose `claimMapping` names `system` is a build error, and the dev server refuses a mock user, headless user or e2e user that sets `system`.

- 8c68631: feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

  - **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
  - **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
  - **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
  - **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.

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

- badaa49: Pages re-evaluate only the blocks whose inputs changed.

  Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

  - Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
  - `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
  - Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.

- f889c26: feat: dynamic blocks policies. Declare `policies.dynamicBlocks` in `lowdefy.yaml` to render block config stored as data — generated forms, model output — through a `Dynamic` block within limits the app sets. A policy lists the blocks, actions, operators, endpoints, requests, pages and origins content may use, an optional state path it must write under, whether HTML is allowed, and size, depth and actions-per-event limits. It requires literal values wherever content names a target.

  - `Dynamic` blocks take `properties.policy`. The policy's types are bundled into the page, and the resolved content is checked against the policy on every page get; a violation renders the fallback and logs each rule broken.
  - New built-in routine step `ValidateDynamic` runs the same check and returns `{ valid, errors, blocks }`, with a content path, rule and message per error, for a generator to correct and retry. In a Dynamic block's endpoint, `_step: <stepId>.blocks` of a passing step with the block's policy is returned as config; all other data stays literal.
  - New built-in routine step `DescribeDynamicPolicy` returns what a policy allows, with the schemas of its blocks, actions and operators, to build a model's prompt from.
  - The build validates policies (installed types, exact origins, no `Dynamic` or `_operator`), checks their pages, endpoints and requests on every page that hosts them, and warns when a policy without HTML lists operators that build strings.

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

- 4a35ba2: An operator at a block's `class` is now evaluated at runtime instead of being silently dropped. Previously `class: { _if: [...] }` was read as a CSS slot map with a slot named `_if`, so the classes were applied to a slot nothing renders. The operator is now kept under the block slot, and its result may be a string, an array of strings, or an object of `{ class: boolean }`. A result that is a map of CSS keys is reported as a config error at the block's location.
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

- 2baefc1: feat: Mark build warnings that fail the production build as "fails in prod" in dev.

  Some build checks (`_state` in request properties, `_payload`/`_step`/request/`Link`/`CallAPI`/
  websocket/`Dynamic` endpoint references) are warnings under `lowdefy dev` but errors under
  `lowdefy build`. They now say so wherever a developer or agent reads them:

  - `buildStatus.json` entries (served by `GET /lowdefy-docs/build-status` and `lowdefy_build_status`)
    and `BuildError.warnings` carry `prodError: true`.
  - The dev terminal prints `[ConfigWarning · fails in prod] …`.
  - The dev error bar badges the entry `fails in prod`, turns dark orange instead of yellow, and says
    `(fails in prod)` in the copy-all text.

  The messages of these checks now all say what to do about the problem, not only what is wrong. No
  gating change: a prod-gated warning still does not fail the dev build.

- de6a268: GitHub module sources in private repositories can now be fetched with an SSH key instead of a token. Set `GITHUB_SSH_KEY` to a private key, such as a read-only deploy key on the module's repository. When the GitHub API returns 401, 403 or 404 for a repository, the build fetches it with `git` over SSH using that key and GitHub's pinned host keys. Public repositories are still downloaded through the API, so apps that mix public and private modules work with a deploy key. Over SSH, the `ref` must be a tag, a branch or a full commit SHA, and the build machine needs `git` and `ssh`.
- 49490b6: feat: in-app links and status tags in HTML.

  - **Links.** In any HTML string, `<a data-page-id="contacts" data-url-query="_id=42">` links to an app page: Lowdefy sets the `href` (with the app's `basePath`), and a plain click opens the page without reloading the app, like a `Link` action. `data-link` does the same for an existing app-relative `href="/path"`; a `data-page-id` or `data-link` that does not resolve to a page of the app is left as written. `data-new-tab` opens any link in a new tab (sanitising removes `target`, so `target="_blank"` never worked in HTML). The build warns when a `data-page-id` in page config or in an API endpoint names a page that does not exist, with a suggestion for a likely typo.
  - **Status tags and dots.** `<span data-tag="success">Approved</span>` renders a tinted tag and `data-status="warning"` a status dot, in theme colours that follow dark mode. Values are antd status names and preset colours, CSS colours, or any other value, which picks a stable colour. HTML tags look exactly like the ag-grid `tag` cells: both now use the same formatting code in `@lowdefy/block-utils`.
  - **Docs.** A new HTML attributes page describes every attribute HTML understands, and the Html block's schema, hazards and examples teach agents to use them instead of hard-coded hrefs and inline-styled pills.

- a79fb1d: feat: semantic icon names, and icons, tooltips and popovers in HTML.

  - **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
  - **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. An open popover stays open with its new content when the HTML changes, as long as the new HTML still has its trigger. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
  - **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
  - **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

- ef64856: feat: Seeded `generate` for journey data sets

  A journey data set can generate documents from a small spec beside its fixtures, the same on every machine:

  ```yaml
  generate:
    seed: 7
    invoices_db:
      count: 400
      fields:
        _id: { sequence: { prefix: inv-, start: 1 } }
        status: { oneOf: [draft, sent, paid], weights: [1, 2, 5] }
        amount: { number: { min: 10, max: 5000, decimals: 2 } }
        issued: { date: { from: 2026-01-01, to: 2026-09-30 } }
        customerId: { ref: customers_db }
  ```

  Field kinds are a literal, `oneOf` with optional weights, `number`, `date`, `text`, `name`, `email` (at reserved example domains), `company`, `sequence` and `ref` (an `_id` from another connection's fixtures or generated documents). A generated `_id` that a fixture or another connection naming the same collection also holds is refused. A connection that loads more than 1,000 documents gets a warning, never a refusal. `lowdefy test`, `lowdefy data list` and the `lowdefy_run_journey` result report the documents a data set loads. The format is in the dev server's docs endpoint, so a coding agent can write a generator from a short description.

- cb0acad: feat: Journey data set files and `lowdefy data list`

  Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional seeded `generate` block for background documents. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

  A data set can extend others with a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id`, an index with the same `key` or a user of the same name replaces the earlier one. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused.

  Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.

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

- 5e6bed8: New dev MCP tool `lowdefy_check`: validates the whole app the way `lowdefy build` would, without building it — every page, including ones not yet opened in dev, and the checks `lowdefy dev` only warns about but a production build rejects (they come back as errors with `prodError: true`). Returns `ok` plus located errors and warnings. It runs in a separate process so it never disturbs the running dev server, and it writes nothing. Agents call it before saying a change is done, so "works in dev, fails the deploy" is caught in the session.

  `@lowdefy/build` gains the `validateOnly` build option (every validation runs, nothing is written) and a `check()` entry on `@lowdefy/build/dev`. It adds no new build rules: `lowdefy_check` reports exactly what `lowdefy build` already rejects.

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

- 371a4a6: feat(build): Module agents need a signed-in caller by default

  In an app with auth configured, an agent a module ships is protected unless the module lists it under `auth.agents.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module agent stays protected where an app agent would be public, so installing a module never lets signed-out callers run an agent, spend model calls and run its tools unannounced. Roles in `auth.api.roles` apply as before; without app auth nothing changes. A public agent's tool endpoints keep their own access, and an agent listed under a module's `auth.api.public` is refused with a message that names `auth.agents.public`.

- c6b598a: feat(build): Module endpoints need a signed-in caller by default

  In an app with auth configured, an API endpoint a module ships is protected unless the module lists it under `auth.api.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module endpoint stays protected where an app endpoint would be public, so installing a module never adds a public endpoint unannounced. This covers `InternalApi` endpoints and `CallApi` steps too: a public app endpoint, or a webhook without a `verify` gate, that calls a module endpoint is refused when the caller is signed out. Roles in `auth.api.roles` apply as before, and a module webhook endpoint must still be listed in the app's `auth.api.public`.

- aa510ca: feat(build): Modules ship websockets

  A module manifest takes a `websockets:` section with the same items as the app's top-level `websockets:`, so a module ships the change streams its own pages subscribe to and an app that installs it needs no websocket config of its own. Websocket ids are scoped to the module entry (`support/thread-messages`), a websocket's `connectionId` written with `_module.connectionId` resolves to the app's connection when the entry remaps it, and the app's `auth.websockets` rules match the scoped ids (`support/**`). In an app with auth, a module websocket is protected unless the module lists it under `auth.websockets.public` in its manifest or the app makes it public (`auth.websockets.public: true`, or a `public` list that names it), so installing a module never adds a public change stream unannounced. The new `_module.websocketId` operator resolves a module websocket's scoped id for page `subscriptions` and the `Subscribe`, `Unsubscribe` and `Publish` actions, with a `{ id, module }` form for another module's websocket or for app-level config.

- cda22c0: feat: Pages carry the paths of the pages they link to, and static links to pages with placeholders are checked

  - Each page artifact carries `linkPaths`, `{ [pageId]: path }` for every page that declares a `path` and that the page's collected links target: Link actions with a static `pageId`, HTML `data-page-id` links and Dynamic block link policies. It is `{}` when there are none.
  - A Link action with a static `pageId`, or an HTML `data-page-id` link, to a page with placeholders must give every placeholder a value, in `pathParams` or `data-path-params` (a JSON object). Values an operator computes are checked at runtime.
  - `MenuLink` takes `pathParams`. A menu link to a page with placeholders must give every placeholder a static value, and the default menu leaves such pages out. When `homePageId` is unset, the root config's `home` carries the chosen menu link's `pathParams`.
  - A module auth page is contributed at its `path` when it declares one, and auth page URLs are mapped to pages through the route table.

- 366ed1e: feat: Pages can declare a `path` URL pattern, and the build writes the route table

  - A page may declare `path`, a URL pattern with `{name}` placeholder segments, such as `path: tickets/{space}/{ticket_id}`. The page id stays the page's identity. A module page's `path` is prefixed with its entry id, as its id is. A pattern that starts with a placeholder must be quoted in YAML, and the build says so when it is not.
  - The build writes `routes.json`, every page's pattern (its id for a page without `path`) with its page id and auth. The JIT skeleton build writes it in dev, resolving `path` behind `_ref`, `_var`, `_build.*` and `_module.var`.
  - The build refuses two patterns that match the same URLs (same segments, placeholders in the same positions, fixed segments equal ignoring case), placeholders on the home page or an auth page, and any `path` on the `404` page.
  - An auth page URL maps to the page served at that path. A URL that names a page by its id while the page is served at a path of its own fails the build with the path to use.
  - The dev server rebuilds the config when a page file edit adds, changes or removes the page's `path`.

- 43e5dc4: `:parallel_for` takes `:concurrency`, and expected errors a `:catch` handles log at debug

  - **`:concurrency`** on `:parallel_for` runs at most that many iterations at once (a positive integer; operators allowed), for routines that call a rate-limited service for every item. Every item still runs, and the result is the same as without it.
  - **Caught errors.** A request, service or user error inside a `:try` that has a `:catch` was logged as an error before the `:catch` handled it, so a routine that expects failures (a provider waterfall's 404s) filled the log. Those expected outcomes are now logged at debug. Config, operator and internal errors still go through full error handling (config location, the dev error feed, Sentry) even when caught. Errors with no `:catch`, and errors in `:catch` or `:finally`, are logged as before.
  - A request's schema errors in an endpoint step now name the step instead of `Request "undefined"`.
  - `createPlaywrightConfig` (`@lowdefy/block-dev-e2e`) takes optional `appDir`, `name`, `testMatch`, `services`, `env`, `fullyParallel` and `workers`, for suites that need their own app and services.

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

- fa02e14: feat: Page subscriptions that wait for the Subscribe action

  - **`client.subscribeOnMount`.** A page subscription with `client.subscribeOnMount: false` is declared on the page but does not open when the page mounts. The `Subscribe` action opens it, evaluating its `payload` at that moment, and `Unsubscribe` closes it. A widget on every page can then hold its channel only while it is in use. The default, `true`, keeps subscribing on mount.
  - **`Subscribe` with a changed payload replaces the channel.** Running `Subscribe` on an open subscription evaluates its payload again. When the payload changed, the channel is replaced and its `_websocket` state starts empty, and messages from the old channel are dropped. When it did not change, nothing happens, as before.

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

### Patch Changes

- 5ad581d: fix(build,server-dev): auth.dev alone is not an auth stack, and the dev mock user reaches \_user in the browser

  An `auth` block whose only key is `dev` declares no login method, no session store
  and no adapter, so it is no longer treated as an auth configuration: it demands no
  mechanism, no secret and no database, and the app builds and runs signed out in
  production. The block is still schema-checked, and adding any other `auth` key
  declares a real auth stack that is validated as before. In the dev server the mock
  user is now also passed to the client, so `_user` reads the same identity in the
  browser as on the server.

- 04077d9: fix(build): Check that CallMethod actions target a block on the page

  A CallMethod whose `blockId` did not exist on the page failed at runtime with `Cannot read properties of undefined (reading 'methods')`. The build now warns when a static CallMethod `blockId` names no block on the page (an error in production builds), pointing at the action's config location. A concrete list row such as `list.0.input` matches the configured `list.$.input` block, and pages with Dynamic blocks are not checked because their blocks are only known at runtime. The check can be suppressed with `~ignoreBuildChecks: [callmethod-refs]`. At runtime, a `blockId` produced by an operator that names no block now fails with `block "<id>" does not exist on this page`. Fixes #1176.

- baf6576: The dev server now warns about an unknown block key, such as a misspelt `propertys`, and other block schema mismatches, as `lowdefy build` does. Each page's content is checked when the dev server builds the page. It is a warning, not an error, and `~ignoreBuildChecks: [schema]` silences it.
- d42f420: A `_build.env` read of a variable the build environment does not set, with no `default`, now warns on every build. The value is inlined into the artifact at build time, so an unset variable was silently frozen as `null`; each unset variable gets one warning, located at its first read with a `file:line` location and listing every place it is read. The warning carries the `secrets` check slug, so it can be suppressed with `~ignoreBuildChecks`.
- e024e63: fix: The build checks an endpoint's `payloadSchema`. A schema that is not valid JSON Schema, or a `schedules` entry whose `payload` does not match it, is now a build error instead of a failure on every call or every scheduled run.
- 3be51e0: fix(build): `_var` and `_module.var` errors name the line that holds them

  A `_var` with a reserved key or an invalid argument, and a `_module.var` whose argument is not a string, failed the build with the file name only. These errors now give `file:line`, at the key that holds the operator, in the terminal and in the dev server's build status.

- ebf95f8: fix(server-dev): Cheaper rebuilds and restarts in the dev server

  - **Restarts no longer fail with "Port in use".** A restart now waits for the old server process to exit before it starts the new one (up to 10 s, then a forced stop and up to 5 s more), so the new process never finds the port still taken and the server no longer stays down until the next restart.
  - **No more endless rebuild loop.** An app whose own local plugin package is its config directory (its plugin lives next to `lowdefy.yaml`) rebuilt itself every few seconds when its ref resolvers wrote into `public/`. The local plugin watcher now reacts only to code files (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`) and ignores `public/`, `node_modules` and the build directories. YAML and Markdown edits stay with the config watcher, so a page edit no longer runs a full build as well.
  - **Page builds no longer rewrite the whole key maps.** Every page the dev server built rewrote `keyMap.json` and `refMap.json` twice, and the files only grew (tens of MB on large apps, with a full parse after each edit). They now hold only what the config build wrote; each page build writes the keys it added to a small file under `build/jitMaps/`. Error locations, `/lowdefy-docs/find` and the file watcher read those files. A key from a page built before the last two page edits may resolve without a location.
  - **Unchanged build files are left alone.** After a config build, artifacts whose bytes did not change are no longer replaced, so Vite does not reload modules that did not change.
  - **Agents restart less.** The MCP tools and agent guidance now say to restart the dev server only when it seems stuck or build status looks stale, or after secrets a wrapper injects have changed. `.env` edits and local plugin code are picked up without a restart.

- 2595439: `@lowdefy/connection-treg`: call treg's catalog of external API endpoints from server routines

  [treg](https://treg.to) puts thousands of external API endpoints (enrichment, SEO and SERP data, social data, scraping, generation) behind one token. The new `TregConnection` connection is a default type, so apps use it without installing a plugin.

  - **`TregCall`** calls a catalog or routed endpoint by id, such as `treg.people.email.find`. It takes `query`, `body`, an `idempotencyKey` (a retry gets the stored answer and is not charged again), a `maxCost` ceiling in USD, cache and routing options, and `meta` tags for per-customer usage. It returns `output`, `raw`, the charged `cost` in micro-USD and USD, the `callId`, the provider that served it and those tried. With `await`, it polls an async task until it is done. Upstream URLs are never accepted as endpoints, and the team's own registered tools need `allowCustomTools: true` on the connection.
  - **`TregCatalogSearch`**, **`TregCatalogGet`** (with `access: true`, the team's price) and **`TregBalance`** for admin pages and provider catalogues.
  - A balance that is too low or a call over `maxCost` is a final error. A rate limit, a busy or out-of-capacity treg and a network failure are a `ServiceError` with `retryAfter`, the seconds treg asked to wait. A treg 422 is a `ConfigError`. Error messages never contain the token, a provider's response body or the top-up link.

  A `:catch` can now read a `ServiceError`'s wait as `_error: retryAfter`.

  `MongoDBEnrichmentComplete` results take a `cost` in micro-USD, stored as the cell's `cost`, and the `Table` cell details panel shows it. An enrichment provider backed by treg returns `TregCall`'s `cost.micro` there. A retried error result can also take `retryAfterMs`, which replaces the exponential backoff (at most a day), so a worker waits as long as treg's `retry_after` asks.

- 2ef077f: fix: `lowdefy dev` works with `config.basePath`, dev warns about inline page links, and the agent docs are complete

  - `lowdefy dev` now boots an app that sets `config.basePath`. The dev server used to answer `<basePath>/@vite/client` and the client entry with the page HTML, so the app never loaded. The app, its API and the `/lowdefy-docs` agent tools are all served under the base path (`/app/lowdefy-docs` for `basePath: /app`), and `.lowdefy/instance.json` records the URL with the base path, so `lowdefy mcp`, the hub and `lowdefy test` reach the dev server without extra setup. The dev server also reports itself ready and opens the browser at the base path.
  - `lowdefy dev` now reports the same warnings as `lowdefy build` for pages written directly in `lowdefy.yaml`: a `Link` to a page that does not exist, a `CallAPI` to a missing or `InternalApi` endpoint, websocket and dynamic block references, and `_state`, `_payload` and request state references. Before, only pages in their own `_ref` files were checked in dev.
  - `@lowdefy/docs-content` holds 20 pages it was missing, among them theming, blocks, page and app state, roles, auth configuration, websockets and notifications. The extractor now renders docs pages written as `_nunjucks` templates, and the content is regenerated from the current docs. The docs site's notifications, AxiosHttp and v3-to-v4 migration pages now show their `{{ ... }}` template examples instead of dropping them; the notifications page failed to render before.

- fc8a168: fix(server-dev): Keep error locations right across config rebuilds in dev

  The dev server rebuilds config without restarting. A page loaded, or a request started,
  before a rebuild reported errors with the earlier build's config keys, and since every
  build numbered its keys from 1, such an error could name a different block, action or
  endpoint of the new build. Each dev build now gives its keys a fresh prefix, so a key from
  an earlier build never matches a node of the current one. A page build that was still
  running when the config rebuilt no longer writes its key and ref maps over the new ones.

- 8348aa9: fix(build): Collect connection schemas in a worker thread so the dev server does not keep database drivers loaded

  The dev server's config build read each connection package's schemas by importing the package into its own long-lived process, which loaded its database drivers there for the rest of the session. The schemas are now read in a worker thread that exits once it has sent them back as plain JSON, and the result is cached for the session per package name, version and directory, so installed packages are read once per session instead of on every build. Local and linked plugin packages are read fresh on every build. The written schema files are unchanged.

- a354a1f: fix(server-dev): Dev server rebuilds no longer break requests, websockets or plugin types, and the file watch covers every file the build reads

  - **Requests during a rebuild.** A config rebuild emptied the build folder and wrote the new build back file by file, so a request that arrived in that window failed with `API Endpoint "x" does not exist.` or `Connection "x" does not exist.`. The dev server now builds into a separate folder and moves each file over the live build, so every request finds a complete build, old or new. A failed build leaves the running build in place. On Windows, moving a file another process holds open is retried for a few seconds; a move that still fails is reported in build status, and the next change rebuilds.
  - **Websocket upgrades.** The request context of a websocket upgrade is now passed along with the upgrade request instead of through a module shared between the upgrade handler and the websocket route, which could stop live connections from connecting after a rebuild. A refused upgrade now answers with the route's status and logs why.
  - **Adding a page to the pages list rebuilds.** The file that holds the pages list (`pages: { _ref: pages.yaml }`, or a module's pages list) is now treated as app config, so adding a page to it rebuilds and the page is served.
  - **Files outside the app folder are watched.** Files the build reads outside the config folder and local module folders, such as a file a local module refs with `../`, now trigger a rebuild or page reload when edited. Local modules outside the config folder are watched by the same watcher.
  - **Apps inside a dot-folder are watched.** Dotfiles are now ignored relative to the watched folder, so an app in a git worktree under a folder such as `.claude/worktrees/` sees its edits.
  - **New plugin types after a restart.** Plugin type lists are read fresh on every build, and a restart from the dev tools (`lowdefy_restart`, or `lowdefy_dev_start` with `restart: true` on a terminal-started server) rebuilds the config first, so a block, request or operator type added to a local plugin is defined without stopping the dev server.

- 588344b: feat: Dev tools build status and request runner report the config you just edited

  The dev server builds a page only when it is requested, so agent tools could answer from a page's previous build after an edit. They now tell the truth about pages built on request:

  **Build status (`lowdefy_build_status`, `GET /lowdefy-docs/build-status`)**

  - With `wait: true`, build status builds every page your edit touched before it answers, whether or not anything has opened the page since. A new `pages` section lists the pages it built (`checked`), the pages whose last build failed with their errors and source file (`failed`), pages changed on disk that the dev server has not rebuilt (`changedSinceBuild`), and how many pages nothing has built since the dev server started (`unbuilt`).
  - Browser and server errors carry the build they happened under (`buildId`). Errors reported before the latest config build or page edit are listed apart under `earlierErrors`, so errors that may already be fixed no longer read as live.
  - A build that fails with an internal error now reports the error's message, stack and the config file being resolved, instead of only "Build failed due to internal error. See above for details."

  **Request and endpoint runners (`lowdefy_run_request`, `lowdefy_run_endpoint`)**

  - `lowdefy_run_request` builds the page first when it changed since its last build, so it runs the request in the config now rather than the page's previous build. A page that fails to build is refused with its `buildErrors`, and a result from a page whose edit the dev server has not picked up yet carries a `staleConfig` note.
  - A response over 40,000 serialized characters is no longer cut to a string prefix. It is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile`, `responseChars` and, for an array, `responseItems`. The new `saveResponse: true` option writes any response there. Only the 20 most recent response files are kept.

- d2c8e01: feat(api)!: Data read into a Dynamic block's `:return` stays data.

  **Breaking:** a Dynamic block without a dynamic blocks policy no longer renders blocks or actions that its endpoint read as data. In v6, stored operator-free block config returned from a Dynamic endpoint rendered as it was; in v7 the block renders its fallback. Every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, fails resolution. Operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`) may return written config; content that breaks the rule renders the fallback, with an error naming the operator and the path in its result. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` fail: build them inside `:return` with `_array.map`/`_array.concat`, share block config with `_ref`, and write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Data may still fill values inside written blocks, as in the documented `_array.map` pattern, and a block built by config from a stored field renders even when it equals the field. To render stored or generated block config, put the Dynamic block under a dynamic blocks policy and return the content through a `ValidateDynamic` step. See the v6 to v7 migration guide.

  Also:

  - Only operator keys lose their escaping underscore in the returned content (`__state` becomes `_state`); data keys such as `__typename` pass through unchanged.
  - Data read into a Dynamic `:return` may nest at most 200 levels deep, and dynamic blocks policy content likewise (`limits.depth`); deeper data fails resolution with an error saying so.
  - An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
  - Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
  - Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. Every value no schema marks is still judged by its key name; `urlKind: false` opts a URL-named property out (`Search` `result.url`, the Tiptap `image` settings). URLs are read as the browser's URL parser reads them, so surrounding spaces and embedded tabs or newlines do not change the verdict.

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

- 8c50bfc: fix: Operators in `class` no longer give schema warnings, and a page's own `class` reaches the page

  - **Operators in `class` pass the build's schema check (`@lowdefy/build`).** `class: { _if: ... }`, operators as slot values (`class: { .element: { _if: ... } }`) and operators inside a class array printed false `"_if" must be string` or `".element" must be string` warnings, although the operators were evaluated at runtime as expected. An operator is now accepted anywhere a class string is. A `class` of the wrong type now gets the `Block "class" should be ...` message instead of a bare type error.
  - **Page-level `class` is applied (`@lowdefy/engine`).** A `class` set on the page block (for example `class: { .menu: ... }` on `PageSiderMenu`) was dropped before the page rendered, while `style` on the page worked. It now reaches the page block the same way `style` does.

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

- c744e40: fix(cli): Generated servers install as their own pnpm workspace inside a parent workspace

  An app inside a pnpm workspace had to list its `.lowdefy/*` server directories as workspace members, so the servers picked up workspace plugins and the root's overrides and patches. Those directories are gitignored, so the committed root `pnpm-lock.yaml` depended on which servers happened to exist, and churned by thousands of lines between `lowdefy dev`, `lowdefy build` and a fresh clone.

  `lowdefy dev`, `lowdefy build`, `lowdefy emails` and `lowdefy test` now give the server its own `pnpm-workspace.yaml`, with a lockfile inside the gitignored server directory, even when the app sits in a parent workspace:

  - Every setting in the parent's `pnpm-workspace.yaml` except `packages` is carried over (`overrides`, `patchedDependencies`, `supportedArchitectures`, `minimumReleaseAge`, `nodeLinker` and the rest). When pnpm 10 installs the server (the parent's `devEngines.packageManager` or `packageManager` pin, or the `pnpm` on the path), the root `package.json` `pnpm` field and `resolutions` are carried too, over the yaml as pnpm 10 applies them; pnpm 11 ignores them, so they are left out. Paths are rebased so they point at the same files: patches, `link:` and `file:` specs in `overrides`, catalogs and `packageExtensions`, `pnpmfile` (a `.pnpmfile.cjs` or `.pnpmfile.mjs` at the parent root is used too, unless pnpm 10 takes `pnpmfile` from the parent's `.npmrc`), `onlyBuiltDependenciesFile`, and `storeDir`, `cacheDir`, `stateDir`, `globalDir`, `globalBinDir` and `globalPnpmfile`, so a parent `storeDir: .pnpm-store` keeps one store. `$name` overrides are resolved against the parent's root `package.json`: a `workspace:` version becomes a `link:` to the workspace package and a `catalog:` version takes the catalog entry. The file is rewritten on every run, keeping the `minimumReleaseAgeExclude` entries pnpm 11 adds when it installs a release younger than its default `minimumReleaseAge` (so a second `lowdefy build` or `lowdefy dev` on a new Lowdefy release no longer fails with "The lockfile contains entries that the active policies reject"), so build allowlists for plugin dependencies belong in the parent's `pnpm-workspace.yaml`.
  - The parent's `.npmrc` (scoped registries, auth) is copied into the server's `.npmrc`, ahead of the server package's own lines, with relative paths (`store-dir`, `pnpmfile`, `cafile`, `certfile`, `keyfile` and the like) rebased. Credentials that reference an environment variable (`${NPM_TOKEN}`) stay references; a credential written out in the file is not copied, and the CLI warns which key it left out.
  - Plugins with a `workspace:` version are installed as `link:` paths to their package in the parent workspace, including plugins a `lowdefy dev` rebuild adds while the server runs.
  - The parent's pnpm pin (`packageManager` and `devEngines.packageManager`) is set on the server's `package.json`, and removed from it when the parent drops it.
  - The server reinstalls when its `pnpm-workspace.yaml` or `.npmrc` changes, not only its `package.json`.
  - `lowdefy docker-output` and `lowdefy vercel-output` still trace from the parent workspace root, so linked plugins are included.

  Server installs no longer fail on pnpm 11 with `ERR_PNPM_IGNORED_BUILDS` for `@sentry/cli`, in standalone apps too: the generated `pnpm-workspace.yaml` skips its install script, which only downloads a binary the platform optional dependency already provides.

  To stop the lockfile churn, remove the `.lowdefy/*` globs from the parent's `pnpm-workspace.yaml` `packages`. If the parent's patches only apply to the servers, set `allowUnusedPatches: true` in the parent too.

- 239a3a7: feat: dates, numbers, avatars, copy buttons, truncation, text tones and confirmations in HTML.

  - **Dates.** `<time datetime="…" data-time="relative">` shows "3 hours ago" and keeps it current, with the exact time on hover. `date`, `datetime` and `time` use the app's locale, and any other value is a dayjs format. Dates show in the reader's time zone.
  - **Numbers.** `data-format` formats the element's number as `number`, `currency` (with `data-currency="USD"`), `percent`, `compact` or `bytes`, with the same formatting as the ag-grid `number` cells; `data-decimals` fixes the decimals.
  - **Avatars.** `data-avatar="Jane Doe"` renders initials in a theme colour, the same as the ag-grid `avatar` cells, and on an `<img>` replaces a missing or broken image. No image service is called.
  - **Copy.** `data-copy` adds an accessible copy button for the element's text or the attribute's value. The copy and check icons are always bundled, and the labels are the new `client.copy`, `client.copyValue`, `client.copied` and `client.copyFailed` translation keys.
  - **Truncation.** `data-truncate` (or `data-truncate="3"`) clamps text to 1–6 lines with an ellipsis and shows the full text in a tooltip only when it is cut off, the same clamp as the ag-grid `ellipsis` columns.
  - **Text tone.** `data-tone="secondary"` (also `tertiary`, `quaternary`, `success`, `warning`, `error`, `info`) colours text with theme tokens that follow dark mode.
  - **Confirm.** In `ClickableHtml`, `data-confirm="Delete this row?"` on a `data-event` element opens a themed confirmation first; only OK fires the event, once. Focus moves to Cancel and returns afterwards, and Escape cancels. A change to the HTML closes it without firing. A bare `data-confirm` asks the new `client.confirm` message ("Are you sure?").
  - **Keyboard.** Space now activates focusable `data-event` targets and popover triggers on key up, like a native button.

- ec6d2e7: fix(build): `lowdefy dev` page builds check only their own page, and a `basePath` with a trailing slash works

  - `lowdefy dev` rebuilt each page with the action references of every page built before it in the session, so it re-checked (and re-reported) links and calls on those earlier pages, and kept adding a failing page's references on every request. Each page build now checks only its own references.
  - A `config.basePath` with a trailing slash (`/app/`) is read as `/app`. With the slash, `lowdefy dev` served the page HTML in place of its client scripts.

- d5f7f3f: The dev server's page artifacts no longer carry each request's `properties`, `type`, `connectionId` and `auth`. Pages built on demand, and pages written inline in `lowdefy.yaml`, now keep those keys only in the request artifacts the server reads, as the production build does, so the dev client receives the same page config as production.
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

- d455e25: fix(build): Module var properties that are never set stay out of the var object instead of becoming `null`

  A module var declared with `properties` used to fill every declared property the app did not set, and that had no default, with `null`. Blocks that pass such an object straight through as props then handed `null` to the component library, which applies its own defaults only to `undefined` (for example a layout sider received `collapsedWidth: null`). Those properties are now left out of the object. A property the app sets to `null` explicitly, with no default, still reads as `null`, and `_module.var` on a single unset property still returns `null`.

- 05b66f2: fix(build): Page ids with empty segments are refused

  A page id such as `foo/`, `/foo` or `a//b` passed the build but could not be matched to a URL pattern, which made page requests fail. The build now rejects it with an error naming the id.

- 33f4bba: fix(server-dev): The dev server rebuilds only the pages an edit changed

  - **Built pages survive edits.** Editing a config file no longer makes the dev server throw away every page it has built. It remembers which files each page was built from, and what they contained, and after an edit rebuilds only the pages whose files changed. Open tabs and pages an agent checks after the edit no longer each pay for a rebuild. Pages built with the app's own resolvers, transformers or `.js` refs are still rebuilt after every edit, because the server cannot see what that code reads.
  - **Build status sees edits straight away.** `lowdefy_build_status` and `/lowdefy-docs/build-status` list the pages an edit touched even before anything requests them, and `wait: true` builds exactly the pages a request would rebuild.
  - **A page no longer keeps content from just before an edit.** An edit that landed while the page was building could leave the page built from the old content until the next edit.
  - **One page's unknown block type no longer breaks other pages.** A page with a misspelt block, action or operator type made every page built after it fail with its error until the next edit.
  - **Edits made while the config build fails reach the page.** A page edit made while `lowdefy.yaml` failed to build was not picked up; the page now shows it.
  - A page that is rebuilt lists its warnings again, and warnings are logged again after an edit.
  - **App code is loaded again only when it changes.** The build loaded a resolver, transformer or `.js` ref as a new module on every page build, and each copy stayed in memory. It now loads a file again only when its content changed. When `@lowdefy/build` is linked from a local checkout, an edited resolver or transformer was never loaded again, so pages kept its old output until a restart; they now show the edit.
  - **A transformer on a page's own `_ref` runs in the dev server.** A page listed as `_ref: { path, transformer }` (or with a resolver and a transformer) was built in development without its transformer, so it differed from the production build.
  - **Module var default files are watched.** Editing a file that a module var's default refs (`vars: { greeting: { default: { _ref: defaults/greeting.yaml } } }`) changed nothing in the dev server until it restarted. Now the config is rebuilt when the module's pages use the var, and the pages that use it through a module component are rebuilt.
  - **Pages keep their `_js` when the dev server recreates its build context.** A page requested while another request picked up a config build (or the dev server recreated its build context to free memory) could be served without its `_js` functions and icons, failing with "\_js function not found" until reloaded. A page build that finished on the old context could also overwrite the `_js` maps written by newer page builds. The page now gets its `_js` and icons from the context it was built on, and builds on an old context no longer write the `_js` maps.

- 1f58d7f: Pages read their path values with the `_path_params` operator (the same `key` / `all` / `default` arguments as `_url_query`, values always strings), and `_js` functions read them with a `pathParams` accessor. The `Link` action and the auth actions' callback targets (`Login`, `Logout`, `SignUp`, `EmailOtpVerify`, `MagicLinkVerify`, `PhoneNumberVerify`, `TwoFactorVerify`, `SendVerificationEmail`, `PasskeySignIn`) accept `pathParams` next to `urlQuery`.
- 99fcb06: Document `:reject` vs `:throw` semantics in API routines: `:reject` is a reply, not an exception; `:try`/`:catch` never catches it, while `:finally` still runs. Use `:throw` for failures a `:catch` should handle. The `:try`, `:reject` and `:throw` docs pages and the API concepts page now state the rule, and the routine control types carry a `description` for tools to quote.
- 588ca93: The build warns when `config.requestTimeout` is not shorter than the Vercel function's `maxDuration`.

  Vercel stops the function at `config.vercel.maxDuration` (60 seconds by default), so a request timeout that is not shorter never answers, and the calls a request left running, such as an AI model call, are not cancelled. The warning applies when the app sets `config.vercel` or the build runs on Vercel.

  The Vercel deployment and AI request docs also note that on Vercel only the request timeout cancels a model call: a client disconnect does not.

- 25ce8ba: fix(build): Server config that runs `_js` bundles the operators its accessors call. `payload()`, `step()`, `item()`, `secret()`, `state()`, `user()` and `lowdefyApp()` call `_payload`, `_step`, `_item`, `_secret`, `_state`, `_user` and `_app`, which were bundled only when some other server config named them, so a request or endpoint `_js` such as `return payload('x')` could fail at runtime with `_payload is not a function`.
- 99c9dac: feat: `lowdefy build` and `lowdefy dev` build again to run newly installed plugins' rules, and `--skip-plugin-checks` skips plugin rules for one run

  - When a build uses a plugin that is not installed yet, its build check rules cannot run. `lowdefy build` and `lowdefy dev` now install the plugin and run the Lowdefy build once more, so its rules run on a fresh checkout or CI run. The second build runs only when a newly installed plugin owns a block, action or operator type or ships `./checks`. The Vite client build still runs once.
  - An unknown `~ignoreBuildChecks` slug is a warning while some plugin's rules are not installed, and an error once every rule is known.
  - `--skip-plugin-checks` on `lowdefy build`, `lowdefy dev` and `lowdefy journeys scope` skips every plugin build check rule for that run, and each build logs a warning that they were skipped. No second build runs for newly installed plugins. Built-in build checks still run. Use it while a fix ships for a plugin rule that is wrong or too strict.

- 7ab8964: fix(server): The server imports a Sentry SDK only when `SENTRY_DSN` is set and `logger.sentry.server` is not `false`, which takes about 100 ms off the start of an app that does not use Sentry. The Node server traces requests by default; the new `logger.sentry.serverTracing: false` makes it report errors only.
- 712d6ef: fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

  - **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. On Vercel it reports errors only, with Sentry's light SDK (`@sentry/node-core/light`: no tracing, OpenTelemetry set-up or module loader hooks, which would add about 300 ms and 130 MB to each cold start), and with client reports off. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel. The flush of queued events starts once the response closes and is handed to Vercel's `waitUntil`, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload. Without `SENTRY_DSN` nothing changes.
  - **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

  Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.

- 4b3f5bd: feat: Webhook verifiers get the raw request body as `rawBody`.

  A webhook endpoint's `verify` request now receives `{ body, rawBody, query, headers }`, where `rawBody` is the request body exactly as received, as a string. Senders such as GitHub (`X-Hub-Signature-256`), Stripe and Slack sign the exact bytes they post, which serialising the parsed `body` again does not reproduce, so a signature check reads `_payload: rawBody`. A body that is not JSON reaches the verifier as `rawBody` too. `rawBody` is given only to the verifier: the routine's payload stays `{ body, query, headers }`.

- 242746a: Fixes for apps built and developed on Windows. Apps with local modules now build on Windows: the build used to reject every module `_ref` as escaping the module's package root, because it compared paths using `/` separators. The page scaffold hint and annotated screenshot paths given to agents now use `/` separators on every platform.
- aca0ddf: fix(build): The build loads a custom connection plugin's schemas from the server's own dependencies on Windows. It passed the plugin's absolute path to `import()`, which Node rejects on Windows, so the plugin's schemas were not read.
- Updated dependencies [cf25c09]
- Updated dependencies [08d8938]
- Updated dependencies [14c4764]
- Updated dependencies [df62144]
- Updated dependencies [b3ba6fb]
- Updated dependencies [f7fa621]
- Updated dependencies [aad166b]
- Updated dependencies [6862032]
- Updated dependencies [099d412]
- Updated dependencies [d216f8b]
- Updated dependencies [4cb7ad9]
- Updated dependencies [07a67b5]
- Updated dependencies [ac9db75]
- Updated dependencies [1766343]
- Updated dependencies [d12c7cc]
- Updated dependencies [cad92af]
- Updated dependencies [4d08b55]
- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [6144814]
- Updated dependencies [81bd4f0]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [24383b5]
- Updated dependencies [575a5ee]
- Updated dependencies [81a5ad3]
- Updated dependencies [10c20fc]
- Updated dependencies [91740e6]
- Updated dependencies [2595439]
- Updated dependencies [26d905c]
- Updated dependencies [460fdaa]
- Updated dependencies [badaa49]
- Updated dependencies [f9e483f]
- Updated dependencies [d2c8e01]
- Updated dependencies [f889c26]
- Updated dependencies [550be9f]
- Updated dependencies [7c20d1b]
- Updated dependencies [6b3a9bb]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [6b4bd99]
- Updated dependencies [662eaa9]
- Updated dependencies [a2b5466]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [c744e40]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [a79fb1d]
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
- Updated dependencies [08f76bb]
- Updated dependencies [959ec32]
- Updated dependencies [856e65d]
- Updated dependencies [c1bb9a0]
- Updated dependencies [409c918]
- Updated dependencies [5060cdf]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [1f58d7f]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [3eb3691]
- Updated dependencies [5017abe]
- Updated dependencies [ae3541c]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [99c9dac]
- Updated dependencies [537bf54]
- Updated dependencies [7623c86]
- Updated dependencies [26d905c]
- Updated dependencies [31911e7]
  - @lowdefy/ai-utils@7.0.0
  - @lowdefy/operators-js@7.0.0
  - @lowdefy/node-utils@7.0.0
  - @lowdefy/operators@7.0.0
  - @lowdefy/helpers@7.0.0
  - @lowdefy/ajv@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/blocks-basic@7.0.0
  - @lowdefy/block-utils@7.0.0
  - @lowdefy/codemods@7.0.0
  - @lowdefy/blocks-loaders@7.0.0
  - @lowdefy/nunjucks@7.0.0

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

- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [d1bd356]
- Updated dependencies [1bbaab7]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
- Updated dependencies [2b2b27a]
  - @lowdefy/blocks-basic@6.1.0
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/operators-js@6.1.0
  - @lowdefy/operators@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/nunjucks@6.1.0
  - @lowdefy/node-utils@6.1.0
  - @lowdefy/errors@6.1.0
  - @lowdefy/ai-utils@6.1.0
  - @lowdefy/blocks-loaders@6.1.0
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

- a6daf0b: feat(build): `state-refs` check is now a warning, never a prod-build error.

  The check that flags a `_state` reference whose top-level key has no matching input block on the
  page (`checkSlug: state-refs`) previously warned in dev but **failed production builds**
  (`prodError: true`). State can be created at runtime — a custom action calling `setState`, a
  dynamic `SetState` wrapper — which the build cannot see statically, so the check is a heuristic and
  a miss can be a false positive. Failing a production build on a false positive is worse than the
  missed check, so it now **warns in both dev and prod** and never fails the build.

  Suppress the warning for a known-good reference with `~ignoreBuildChecks: [state-refs]` on the
  reference.

- 0dccf40: feat: Add `:if`, `:switch` and `:return` controls to client event action lists.

  Event action lists now support routine-style control flow, using the same grammar as API routines:

  - `:if` / `:then` / `:else` gates a group of actions on a single condition, instead of repeating the same `skip` expression on every action.
  - `:switch` runs the `:then` list of the first truthy `:case`; later cases are never evaluated, and an optional `:default` runs when no case matches.
  - `:return` ends the whole event successfully — replacing the early-`Throw` workaround — without running the event's `catch` actions.

  Controls can nest and work in both `try` and `catch` lists. Actions not executed for a control-flow reason (untaken branches, unmatched cases, actions after a `:return`) are reported as skipped, so `_actions` lookups and action indices are unchanged for existing configs. The build validates control shape and enforces action id uniqueness across all branches.

  Note: an event action carrying a stray `:if`, `:switch` or `:return` key (previously a schema warning at build and ignored at runtime) is now treated as a control and fails the build with a clear error.

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

- 206d947: feat: Modules can ship notification email templates.

  `module.lowdefy.yaml` now accepts a `notifications:` section, so a module that drives a notification flow (like user invites) can ship its own email templates instead of every app hand-writing them. Template ids scope to `{entry}/{id}` — installing the same module twice never collides — and template properties resolve `_module.var`, so email copy can be configured through the module's vars.

  The new `_module.notificationId` operator resolves scoped ids in module content (`_module.notificationId: invite-user` in a `RenderNotification` step or dispatch payload) and at the app level with the object form (`{ id: invite-user, module: user-admin }`).

  The `lowdefy emails` preview now finds scoped notification artifacts in subdirectories and writes nested preview shims, grouping templates by module entry in the preview sidebar.

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
- da0c62c: chore: Update pino from 8.16.2 to 10.3.1.

  No behavior change — the log output format, levels, and configuration are unchanged. The pino 9 and 10 majors only drop support for Node.js versions below 20, and Lowdefy already requires Node.js 22 or newer.

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

- ae5f618: fix(build): Rebuild dev app-level artifacts when root-referenced files change.

  Files referenced directly from `lowdefy.yaml` that resolve to plain values — like `app.html.appendHead: {_ref: head.html}` — were missing from the dev server's rebuild trigger list, so editing them served stale HTML until a manual restart. They now correctly trigger a skeleton rebuild.

- 7746ce2: fix: Resolve refs at the root of reference vars.

  A `_ref` used directly as the value of `vars` (e.g. `vars: { _ref: config.yaml }`) was not evaluated, so `_var` lookups in the referenced file returned null. Refs at the root of `vars` are now resolved again, restoring pre-v5 behavior.

- 47ba6df: fix(build): Two-stage entry-vars resolution fixes cache poisoning.

  Module entry vars/connections now resolve in two stages (prepare, then
  demand-driven finalize), so resolution order can no longer bake wrong values
  into the per-entry var cache. Includes the demand-driven entry-config
  integration suite.

- 704cf4b: fix(build): Collect Tailwind page content before `_js` extraction.

  Tailwind class candidates were collected from the page tree after `_js` operator source
  had been replaced by hashed function refs, so utilities used only inside `_js` strings
  (e.g. an `Html` block building markup with `properties.html._js`) never reached the
  Tailwind scanner and were missing from the compiled CSS. Both the full build and the
  JIT dev build now collect page content while `_js` source is still present, so classes
  embedded in `_js` code generate CSS like any other page content.

- Updated dependencies [11662bc]
- Updated dependencies [b496a77]
- Updated dependencies [60401aa]
- Updated dependencies [37c8c14]
- Updated dependencies [28cb944]
- Updated dependencies [082acec]
- Updated dependencies [e0a06a2]
- Updated dependencies [742a900]
- Updated dependencies [efd1967]
- Updated dependencies [8396857]
- Updated dependencies [c5f176a]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
- Updated dependencies [982a3db]
  - @lowdefy/ai-utils@6.0.0
  - @lowdefy/operators@6.0.0
  - @lowdefy/operators-js@6.0.0
  - @lowdefy/errors@6.0.0
  - @lowdefy/blocks-basic@6.0.0
  - @lowdefy/blocks-loaders@6.0.0
  - @lowdefy/node-utils@6.0.0
  - @lowdefy/nunjucks@6.0.0
  - @lowdefy/ajv@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/block-utils@6.0.0

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

- 842d71c: fix(build): Reject reserved names as agent ids, locale codes and event shortcuts.

  Each of these author-written identifiers later becomes a key in a plain object — the sub-agent graph
  and agent registry, the i18n message catalogs and the client's shortcut map. A reserved name such as
  `__proto__` or `constructor` resolved through `Object.prototype` instead of adding an entry, so the
  config built clean and misbehaved later: a duplicate id went undetected, or the build crashed with an
  unlocated internal error. None of these sites had a build-time shape check.

  The build now rejects them where the identifier is first accepted, with a located `ConfigError` naming
  the offending value. A shortcut like `Ctrl+__proto__` is still valid.

  Apps using a reserved name for one of these identifiers will now fail the build. Rename the identifier.

- 291b4cf: fix(build): Reject reserved names as page, request, connection, endpoint, step and block ids.

  `validIdPattern` allowed letters and underscores, so `__proto__` and `constructor` passed as ids. The
  engine keys plain-object registries on these ids, so a reserved id re-parented the registry instead of
  adding an entry — a build-clean config that fails at runtime. `validateId` now rejects the
  reserved names with a located `ConfigError`.

  Block ids are dot-paths that nest state, so they don't go through `validateId` and are checked
  separately, per dot-separated segment: `a.constructor.b` is rejected, while `a\.constructor` (an
  escaped literal dot, a single segment named "a.constructor") still builds.

  Apps using a reserved name as an id, or as a block id path segment, will now fail the build. Rename
  the id.

  `buildAuth` reaches page, endpoint and agent ids before `validateId` does, and keys plain-object role
  maps on them, so a reserved id there read through `Object.prototype` — silently marking the entity
  protected with `Object.prototype` as its roles, which then corrupted every plain object in the build.
  Those ids are now gated where `buildAuth` first touches them. Collected build errors are deduplicated
  on resolved source line plus message, so an id rejected by both gates reads as one error.

- 3ead269: fix(helpers): Deep merges replace arrays instead of merging them index-by-index.

  Wherever Lowdefy deep-merges configuration — block property defaults, `AxiosHttp` connection
  and request config, theme tokens, i18n message catalogs — an array value is now treated as a
  single value. A later array replaces an earlier one; it no longer merges element-by-element
  at matching indices.

  This is what most overrides already assumed, and it matches a plain object spread. Two
  places where the old behaviour was visible:

  - `RatingSlider`'s `CheckboxInput.options` — overriding it previously inherited the default
    element's `label: 'N/A'`. It no longer does; specify the full option object.
  - The layout blocks (`PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout`, `MobileMenu`) —
    if you set the same array (`selectedKeys`, `defaultOpenKeys`, `links`) on both `menu` and a
    breakpoint variant such as `menuLg` or `menuMd`, the breakpoint value now replaces the base
    value outright rather than overlaying it index-by-index.

  Two smaller semantic changes come with this. A later `undefined` now replaces an earlier value
  instead of being skipped — `mergeObjects([{ a: 1 }, { a: undefined }])` was `{ a: 1 }` and is now
  `{ a: undefined }`, so a caller that means "no override" must omit the key rather than set it to
  `undefined`. And a single-object merge no longer passes its input through: `mergeObjects([x]) === x`
  was `true` and is now `false`, so memoise at the call site if a stable reference is needed across
  renders. Both are reachable only from code that calls `mergeObjects` — plugin and connection authors
  — not from YAML, which has no `undefined`; a config `null` merges as it always did.

  Also fixed: merging no longer mutates its inputs. `AxiosHttp` previously wrote merged request
  config back into the shared connection config, leaking values such as the HTTP agent between
  requests.

  `lodash.merge`, the last remaining lodash dependency in Lowdefy, has been removed.

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
  - @lowdefy/ai-utils@5.6.0
  - @lowdefy/node-utils@5.6.0
  - @lowdefy/operators-js@5.6.0
  - @lowdefy/nunjucks@5.6.0
  - @lowdefy/blocks-basic@5.6.0
  - @lowdefy/blocks-loaders@5.6.0
  - @lowdefy/block-utils@5.6.0
  - @lowdefy/ajv@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- 33e062f: fix(build): resolve module page resolver/transformer paths against the module root in JIT dev builds.

  A module page backed by a `resolver:` (or `transformer:`) declares its path relative to the module
  (e.g. `resolvers/makeActionPages.js`). The full build rebases this against the module root in the ref
  walker, but the JIT dev path (`buildPageJit`) rebuilt the page refDef directly from the un-rebased
  authored `_ref` and called `getRefContent` without going through the walker — so the relative path was
  resolved against the app config dir, producing a `ConfigError` (`Error importing resolvers/...`) when a
  module page was rebuilt on request. `buildPageJit` now applies the same module-root rebasing to
  `path`/`resolver`/`transformer` before resolving content. File-based module pages were unaffected.

  - @lowdefy/operators@5.5.1
  - @lowdefy/blocks-basic@5.5.1
  - @lowdefy/blocks-loaders@5.5.1
  - @lowdefy/operators-js@5.5.1
  - @lowdefy/ai-utils@5.5.1
  - @lowdefy/ajv@5.5.1
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/errors@5.5.1
  - @lowdefy/helpers@5.5.1
  - @lowdefy/node-utils@5.5.1
  - @lowdefy/nunjucks@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/operators@5.5.0
- @lowdefy/blocks-basic@5.5.0
- @lowdefy/blocks-loaders@5.5.0
- @lowdefy/operators-js@5.5.0
- @lowdefy/ai-utils@5.5.0
- @lowdefy/ajv@5.5.0
- @lowdefy/block-utils@5.5.0
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

- 5f00be7: feat(blocks-antd): Per-item styling and new props for menu items.

  Menu items in `Menu` and `DropdownMenu` now support the same `class` and slot-keyed `style` ergonomics as other Lowdefy blocks, plus the missing antd MenuItem props.

  - **Per-item `class`** (Tailwind / arbitrary CSS) on `MenuLink`, `MenuGroup`, and `MenuDivider`. Flat string/array applies to the item wrapper; objects with dot-prefixed slot keys (`.element`, `.icon`, `.label`, and `.popup` on `MenuGroup` for the floating SubMenu popup) target specific parts.
  - **Slot-keyed `style`** on the same item types using `.element` / `.icon` / `.label`. Flat objects continue to work as a shorthand for `.element`.
  - **New item properties:** `properties.disabled` (greys out the item and blocks clicks), `properties.tooltip` (text shown when the menu is collapsed — maps to antd's `title`), and `properties.extra` (free-form right-aligned label on a `MenuLink`, e.g. `beta`, `soon`).
  - **`shortcut` badge moved to the far right.** The existing `properties.shortcut` already auto-rendered a kbd badge and wired the key handler — the badge is now floated to the far right of the item to match common menu conventions (previously inline next to the title). When `extra` and `shortcut` are both set on the same item, `extra` sits to the left of the shortcut badge.
  - **`extra` rendering note:** rendered inside the `<Link>` via `float: right` rather than antd's `extra` prop. The antd `extra` prop triggers a `display: inline-flex; width: 100%` layout on `.ant-menu-title-content-with-extra` that collapses Lowdefy-wrapped labels, so we bypass it.
  - **Unified internals:** `Menu` and `DropdownMenu` now share one item builder, eliminating the prior divergence in icon CSS keys and which props were plumbed.

  Block-level `properties.theme` on `Menu` is unchanged; pair it with `properties.danger: true` on a `MenuLink` to theme danger items via `dangerItem*` tokens. See the updated theming docs.

- 1db0ef9: feat: Remove static `exports` declaration from modules.

  The `exports:` block in `module.lowdefy.yaml` is no longer required. Modules can now generate page, connection, and API endpoint ids dynamically — via `_build.array.map`, `_module.var`, or resolver functions — without declaring them upfront. Cross-module references are validated against the merged id sets after full resolve, with clearer, page-scoped error messages naming the broken reference and its source page.

  A leftover `exports:` block has no effect on the build and is silently ignored. A codemod (`modules-remove-exports`) is provided to strip the dead field from your manifests.

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

### Patch Changes

- b182517: fix(build): Resolve cross-module refs in module entry vars and connections.

  Cross-module operators (`_ref { module, component }`, `_module.pageId/connectionId/endpointId/id { module }`) inside a module entry's `vars` or `connections` in `lowdefy.yaml` previously failed the build with "no module with that entry id was registered" because the entry subtrees were walked before any module was registered. They now resolve correctly against the app-level module registry — apps can compose components from one module into another's slot without forcing a dependency declaration on the host module.

  **Behavior change:** required-var validation now sees through `_ref` to the resolved value. A required var supplied via a `_ref` that resolves to `null` previously passed validation (the raw `_ref` object was non-none) and now correctly fails.

- 7c97d3b: fix(build): Resolve `_ref` resolver and transformer JS paths against the module root.

  Modules can now ship their own JS resolvers and transformers. Previously, a `_ref: { resolver: resolvers/x.js }` inside a module manifest failed with `Cannot find module` because the build resolved the JS path against the host app's config directory instead of the module root. Absolute paths in `resolver`, `transformer`, and `.js` content refs are also now honored verbatim. The existing package-root escape check that prevents module refs from reading outside their package is extended to cover both new fields.

- 42db297: fix: Correct `secrets` → `secret` in the server `_js` function prototype.

  The generated `serverJsMap.js` previously destructured `{ secrets }`, which
  never matched the binding name (`secret`) passed at runtime by the `_js`
  operator. As a result, any user `_js` function that referenced `secrets` in
  its argument destructuring received `undefined`. The prototype now
  destructures `secret`, matching the runtime binding.

- b6e555f: fix(api,build): Render MenuDivider items in menus.

  MenuDivider items defined in a menu's `links` were silently dropped at request time by `filterMenuList`, which only let `MenuLink` and `MenuGroup` items through. Dividers now pass the filter and render via the existing Antd menu block code. A post-pass removes orphaned dividers (leading, trailing, or adjacent to another divider) so an item left dangling after auth-based filtering does not produce a broken-looking separator. The `menuDivider` shape was also added to the build schema so configs containing dividers no longer trigger a schema warning, and `buildMenu` now assigns `auth: { public: true }` to dividers for consistency with other menu items.

- Updated dependencies [ff7ed66]
- Updated dependencies [5e498dd]
- Updated dependencies [60401aa]
- Updated dependencies [25225ab]
- Updated dependencies [ba1d3bd]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/ai-utils@5.4.0
  - @lowdefy/ajv@5.4.0
  - @lowdefy/operators@5.4.0
  - @lowdefy/operators-js@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0
  - @lowdefy/errors@5.4.0
  - @lowdefy/blocks-basic@5.4.0
  - @lowdefy/blocks-loaders@5.4.0
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

- Updated dependencies [6955341]
  - @lowdefy/ai-utils@5.3.0
  - @lowdefy/operators@5.3.0
  - @lowdefy/blocks-basic@5.3.0
  - @lowdefy/blocks-loaders@5.3.0
  - @lowdefy/operators-js@5.3.0
  - @lowdefy/ajv@5.3.0
  - @lowdefy/block-utils@5.3.0
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

- 72b6159: fix(build): Replace schema validation errors with warnings and add focused validations.

  AJV schema validation now emits warnings instead of blocking the build. Focused validations in each build step (validateBlock, buildConnections, buildEvents, etc.) provide better error messages with full context — page, block, and event names — instead of generic schema messages. Added focused validation for connections and menu items that previously relied on schema checks alone.

- Updated dependencies [1d18a13]
- Updated dependencies [73fa2b9]
- Updated dependencies [69a59c0]
- Updated dependencies [0d44433]
- Updated dependencies [1e964c4]
- Updated dependencies [c91003d]
  - @lowdefy/operators-js@5.2.0
  - @lowdefy/operators@5.2.0
  - @lowdefy/blocks-loaders@5.2.0
  - @lowdefy/blocks-basic@5.2.0
  - @lowdefy/ajv@5.2.0
  - @lowdefy/block-utils@5.2.0
  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0
  - @lowdefy/node-utils@5.2.0
  - @lowdefy/nunjucks@5.2.0

## 5.1.0

### Minor Changes

- 72fbd4bab: feat(build): Themed default scrollbars in generated `globals.css`.

  Every Lowdefy app now ships with themed scrollbars out of the box. Native Windows/Linux scrollbars were rendering as light grey on dark surfaces (Modal, Drawer, overflowing containers), clashing with dark themes — macOS overlay scrollbars hid the problem. The generated `globals.css` now emits a `@layer base` block that:

  - Sets `scrollbar-width: thin` and `scrollbar-color` for Firefox and modern browsers.
  - Styles `::-webkit-scrollbar` (10px, transparent track, subtle thumb with inset border, hover darkens) for Chromium / WebKit.
  - Drives all colors from antd CSS custom properties (`--ant-color-border-secondary`, `--ant-color-text-tertiary`) so they auto-swap on dark / light mode toggle.

  User-provided CSS remains in `@layer components`, so any app-level `::-webkit-scrollbar` overrides in `public/styles.css` still win.

### Patch Changes

- f56a47d87: fix(server): Prevent white flash on page navigation in dark mode.

  Pages no longer flash white when navigating between pages in dark mode. A synchronous inline script now sets the correct background color before the page paints, matching the user's dark mode preference from config, localStorage, or system settings.

- Updated dependencies [af8ef77cb]
  - @lowdefy/operators-js@5.1.0
  - @lowdefy/operators@5.1.0
  - @lowdefy/blocks-basic@5.1.0
  - @lowdefy/blocks-loaders@5.1.0
  - @lowdefy/ajv@5.1.0
  - @lowdefy/block-utils@5.1.0
  - @lowdefy/errors@5.1.0
  - @lowdefy/helpers@5.1.0
  - @lowdefy/node-utils@5.1.0
  - @lowdefy/nunjucks@5.1.0

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

- 155c0b9724: Replace moment.js with day.js across the monorepo.

  ### Breaking Changes

  - **`_moment` operator removed**: Use `_dayjs` instead. The new `@lowdefy/operators-dayjs` package provides the `_dayjs` operator with the same API patterns.
  - **`@lowdefy/operators-moment` package removed**: Apps using `_moment` must migrate to `_dayjs`.
  - **Nunjucks `date` filter**: Now uses day.js internally. Format strings are day.js compatible (mostly identical to moment).
  - **Date picker blocks**: All date/time picker blocks use day.js instead of moment for value parsing and formatting.
  - **Google Sheets connection**: Date serialization uses day.js internally.
  - **`humanizeDuration` thresholds**: The `thresholds` parameter on `_dayjs.humanizeDuration` is silently ignored (day.js does not support it).
  - **AgGrid cell renderers**: Update `__moment` to `__dayjs` in custom AG Grid cell renderer references.
  - **Date selector UTC handling**: Antd v6 bundles its own dayjs without the UTC plugin. Date selector blocks wrap antd's dayjs instances with the extended dayjs before calling `.utc()` — this is handled internally and requires no user action.

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

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

- f430f02dde: Throw `ConfigError` when a block ID collides with its page ID, preventing runtime state conflicts.
- 8b9f926d1: Improve build error messages: schema validation errors include the property name, style/class errors suggest dot-prefixed CSS slot keys, and YAML parse errors surface immediately instead of crashing on null entries.
- c3b5b45ec5: feat(blocks-antd): Add Search command palette block with MiniSearch.

  New `Search` display block provides a full-text search command palette (Cmd+K / Ctrl+K) using MiniSearch (~6KB) and antd Modal.

  - **Pre-built index support**: Load a static JSON index via `indexUrl` for zero-config search on static sites
  - **Runtime indexing**: Pass `documents` array with `fields` and `storeFields` for client-side indexing
  - **Grouped results**: Results auto-grouped by configurable field with section headers
  - **Keyboard navigation**: Arrow keys, Enter to select, Escape to close
  - **Term highlighting**: Matched search terms highlighted in results
  - **Recent searches**: localStorage-backed search history with configurable count
  - **14 CSS slots**: Full style customization via `styles`/`classNames` (trigger, modal, input, results, groups, highlights)
  - **Analytics-friendly events**: `onSelect` passes the result item, search `query`, and `resultCount` for click-through tracking; `onSearch` passes the search term and result count on each query change

  ### Docs app integration

  - New search index transformer (`generateSiteAssets.js`) builds a MiniSearch index at build time from page content
  - Replaces Algolia DocSearch with the self-hosted Search block — removes external CDN dependency

  ### Removed

  - `@lowdefy/blocks-algolia` package has been removed. Use the `Search` block in `@lowdefy/blocks-antd` instead.

- Updated dependencies [52ea769811]
- Updated dependencies [29eb199c7f]
- Updated dependencies [155c0b9724]
- Updated dependencies [130a569d36]
- Updated dependencies [e3e922538]
- Updated dependencies [c8f4a41063]
- Updated dependencies [fd8225b7a1]
- Updated dependencies [905d5d406]
- Updated dependencies [8b9f926d1]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
- Updated dependencies [f430f02dde]
  - @lowdefy/blocks-basic@5.0.0
  - @lowdefy/block-utils@5.0.0
  - @lowdefy/blocks-loaders@5.0.0
  - @lowdefy/nunjucks@5.0.0
  - @lowdefy/operators-js@5.0.0
  - @lowdefy/helpers@5.0.0
  - @lowdefy/node-utils@5.0.0
  - @lowdefy/ajv@5.0.0
  - @lowdefy/operators@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- 8779686f9: fix(build,server-dev): Improved accuracy of dev server skeleton rebuild detection.

  The dev server previously used a path-based heuristic to decide which file changes required a skeleton rebuild. This could miss changes to API endpoints referenced from page directories, and unnecessarily rebuild for non-skeleton page templates. Skeleton rebuild classification now uses the build's ref map as the source of truth, ensuring only the correct file changes trigger skeleton rebuilds.

- Updated dependencies [c5ce5b972]
  - @lowdefy/operators-js@4.7.3
  - @lowdefy/operators@4.7.3
  - @lowdefy/blocks-basic@4.7.3
  - @lowdefy/blocks-loaders@4.7.3
  - @lowdefy/ajv@4.7.3
  - @lowdefy/errors@4.7.3
  - @lowdefy/helpers@4.7.3
  - @lowdefy/node-utils@4.7.3
  - @lowdefy/nunjucks@4.7.3

## 4.7.2

### Patch Changes

- 30616048d: fix: Fix dev server build hang when page files contain top-level \_ref.

  The dev server could hang indefinitely at "Building config..." when a page YAML file's entire content was a `_ref`. This caused a self-referencing parent in the ref map, leading to an infinite loop during page source resolution. Also fixed null `lowdefy.yaml` handling in custom plugin type map generation.

  - @lowdefy/operators@4.7.2
  - @lowdefy/blocks-basic@4.7.2
  - @lowdefy/blocks-loaders@4.7.2
  - @lowdefy/operators-js@4.7.2
  - @lowdefy/ajv@4.7.2
  - @lowdefy/errors@4.7.2
  - @lowdefy/helpers@4.7.2
  - @lowdefy/node-utils@4.7.2
  - @lowdefy/nunjucks@4.7.2

## 4.7.1

### Patch Changes

- 1ce9f9a56: fix(build): Dev server dynamically loads icons discovered during JIT page builds.

  Icons referenced only inside page blocks (e.g., `icon: FiAperture` on a Button) were not available in the dev server's static bundle, causing a fallback icon to render. The JIT page builder now detects missing icons when a page is compiled, extracts their SVG data from react-icons, and serves it via a dynamic API endpoint. The client fetches and merges these icons at runtime without triggering a Next.js rebuild or server restart.

- ca26d3441: Resolve sibling refs in parallel using Promise.all to interleave CPU and I/O during build.
- Updated dependencies [fac48c10a]
  - @lowdefy/operators-js@4.7.1
  - @lowdefy/blocks-basic@4.7.1
  - @lowdefy/blocks-loaders@4.7.1
  - @lowdefy/operators@4.7.1
  - @lowdefy/ajv@4.7.1
  - @lowdefy/errors@4.7.1
  - @lowdefy/helpers@4.7.1
  - @lowdefy/node-utils@4.7.1
  - @lowdefy/nunjucks@4.7.1

## 4.7.0

### Minor Changes

- 4543688f7: feat: Single-pass async walker for ref resolution

  **Single-Pass Walker (`@lowdefy/build`)**

  - New `walker` module replaces the multi-pass JSON round-trip architecture in `buildRefs` with a single async tree walk
  - Resolves `_ref` markers, evaluates `_build.*` operators, and tags `~r` provenance in one pass instead of 5+ `serializer.copy` calls per ref
  - Wired into both `buildRefs` (production) and `buildPageJit` (dev server)
  - Added `isPageContentPath` for semantic shallow build matching, replacing brittle path-index checks
  - Deleted redundant code replaced by walker: `getRefsFromFile`, `populateRefs`, `createRefReviver`, and the `evaluateStaticOperators` wrapper

  **In-Place Operator Evaluation (`@lowdefy/operators`)**

  - New `evaluateOperators` function walks a tree in-place and evaluates operator nodes, avoiding JSON serialization round-trips
  - Used by the walker module to evaluate `_build.*` operators inline during ref resolution

  **Serializer Fix (`@lowdefy/helpers`)**

  - Added `skipMarkers` option to `serializer.serializeToString` to exclude internal markers (`~k`, `~r`, `~l`, `~arr`) from serialized output

### Patch Changes

- e1274566b: fix(build): Report all ref errors at once instead of stopping on the first one.

  When multiple referenced files have errors (missing files, YAML parse errors, invalid refs), the build now collects and reports all errors at once instead of stopping on the first failure. This reduces the fix-rebuild-fix cycle when multiple config files have issues.

- 5716be2c8: fix(build): Preserve inline page content in JIT builds

  Pages declared inline in `lowdefy.yaml` (not via `_ref`) had their content stripped during shallow builds with no way to recover at JIT time, resulting in empty page shells. Detect inline pages by checking refId matches root ref with no sourceRef, and skip stripping. Set refId to null for inline pages in `createPageRegistry` so `buildPageJit` reads the pre-built artifact instead of attempting JIT resolution.

- 5a556b918: fix(build): Improve error message for YAML errors in njk templates

  When a .yaml.njk nunjucks template produces invalid YAML, the error now says "Nunjucks template produced invalid YAML" instead of showing a misleading line number from the generated output.

- Updated dependencies [4543688f7]
- Updated dependencies [811f80760]
- Updated dependencies [dea6651a1]
  - @lowdefy/operators@4.7.0
  - @lowdefy/helpers@4.7.0
  - @lowdefy/blocks-basic@4.7.0
  - @lowdefy/operators-js@4.7.0
  - @lowdefy/blocks-loaders@4.7.0
  - @lowdefy/node-utils@4.7.0
  - @lowdefy/nunjucks@4.7.0
  - @lowdefy/ajv@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- 8ec5f1be05: Collect all build errors before stopping
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

- 43a5243da: feat(server-dev): Add mock user support for e2e testing

  Set `LOWDEFY_DEV_USER` env var or `auth.dev.mockUser` in config to bypass login in dev server.

- cacbb4d189: Add build-time validation for NEXTAUTH_SECRET environment variable when auth providers are configured
- 338ea04b9f: feat(build): Add ~ignoreBuildChecks property to suppress build validation

  **Build Validation Suppression (#1949, #1963)**

  - New `~ignoreBuildChecks` property suppresses build-time validation errors and warnings
  - Supports `true` (suppress all) or array of specific check slugs (e.g., `['state-refs', 'types']`)
  - Cascades to all descendant config objects - set on a page to suppress for all child blocks
  - Silent suppression - no log output when validation is skipped (visible with `--log-level debug`)

  > **Renamed:** Previously `~ignoreBuildCheck` (singular) - using the old name throws a helpful migration error.

  **Available Check Slugs:**

  - `state-refs`, `payload-refs`, `step-refs` - Reference validation warnings
  - `link-refs`, `request-refs`, `connection-refs` - Action reference validation
  - `types` - All type validation (blocks, operators, actions, etc.)
  - `schema` - JSON schema validation errors

  **Use Cases:**

  - Dynamic state references created at runtime by custom blocks
  - Multi-app monorepos with conditional configurations
  - Work-in-progress features during development
  - Plugin development with custom types not yet registered

  **Example:**

  ```yaml
  # Suppress all checks for this page and descendants
  pages:
    - id: dynamic-page
      type: Box
      ~ignoreBuildChecks: true
      blocks:
        - id: block1
          type: TextInput
          properties:
            value:
              _state: dynamicField # No warning

  # Suppress only specific checks
  blocks:
    - id: custom_block
      type: CustomBlock
      ~ignoreBuildChecks:
        - state-refs
        - types
      properties:
        onClick:
          _state: dynamicState # No warning (state-refs suppressed)
  ```

### Patch Changes

- aeae7f0c83: fix(build): Eliminate false positive warnings for \_state references set by SetState actions

  The validateStateReferences validator now recognizes state keys initialized by SetState actions in page or block events, eliminating false positive warnings when \_state references legitimate state that's set programmatically rather than from input blocks.

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

- ab19b1bb77: fix(helpers): Preserve ~l line numbers on arrays in serializer.copy

  Fixed an issue where line number metadata (`~l`) on arrays was lost during `serializer.copy()`, causing schema validation errors to show incorrect line numbers.

  **Problem:**

  - Schema errors for properties like `requests:` at line 7 were showing `:1` instead of `:7`
  - The `~l` property on arrays was stripped during JSON round-trip in `evaluateBuildOperators`

  **Solution:**

  - Arrays with `~l` are now wrapped in a marker object `{ '~arr': [...], '~l': N }` during serialization
  - The reviver restores the array with `~l` preserved as a non-enumerable property
  - Custom revivers now receive the restored array instead of the wrapper object

  **Result:**

  ```
  Before: lowdefy.yaml:1 at root
  After:  lowdefy.yaml:7 at root
  ```

- 8ec5f1be05: fix: Correct file path tracing for multi-file \_ref imports
- Updated dependencies [fb7910f62]
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [bb3222a5a]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [af61715d5]
- Updated dependencies [f673e3ab3]
  - @lowdefy/blocks-basic@4.6.0
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
  - @lowdefy/node-utils@4.6.0
  - @lowdefy/operators@4.6.0
  - @lowdefy/operators-js@4.6.0
  - @lowdefy/blocks-loaders@4.6.0
  - @lowdefy/nunjucks@4.6.0
  - @lowdefy/ajv@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/operators@4.5.2
- @lowdefy/blocks-basic@4.5.2
- @lowdefy/blocks-loaders@4.5.2
- @lowdefy/operators-js@4.5.2
- @lowdefy/ajv@4.5.2
- @lowdefy/helpers@4.5.2
- @lowdefy/node-utils@4.5.2
- @lowdefy/nunjucks@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/operators@4.5.1
- @lowdefy/blocks-basic@4.5.1
- @lowdefy/blocks-loaders@4.5.1
- @lowdefy/operators-js@4.5.1
- @lowdefy/ajv@4.5.1
- @lowdefy/helpers@4.5.1
- @lowdefy/node-utils@4.5.1
- @lowdefy/nunjucks@4.5.1

## 4.5.0

### Minor Changes

- abc90f3f7: Change to Apache 2.0 license for all packages. All license checks and restrictions have been removed.
- 09ae496d8: Add JSONata operator.

### Patch Changes

- Updated dependencies [09ae496d8]
  - @lowdefy/operators@4.5.0
  - @lowdefy/operators-js@4.5.0
  - @lowdefy/blocks-basic@4.5.0
  - @lowdefy/blocks-loaders@4.5.0
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
  - @lowdefy/blocks-basic@4.4.0
  - @lowdefy/blocks-loaders@4.4.0
  - @lowdefy/operators-js@4.4.0
  - @lowdefy/helpers@4.4.0
  - @lowdefy/node-utils@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/operators@4.3.2
- @lowdefy/blocks-basic@4.3.2
- @lowdefy/blocks-loaders@4.3.2
- @lowdefy/operators-js@4.3.2
- @lowdefy/ajv@4.3.2
- @lowdefy/helpers@4.3.2
- @lowdefy/node-utils@4.3.2
- @lowdefy/nunjucks@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/operators@4.3.1
- @lowdefy/blocks-basic@4.3.1
- @lowdefy/blocks-loaders@4.3.1
- @lowdefy/operators-js@4.3.1
- @lowdefy/ajv@4.3.1
- @lowdefy/helpers@4.3.1
- @lowdefy/node-utils@4.3.1
- @lowdefy/nunjucks@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/operators@4.3.0
- @lowdefy/blocks-basic@4.3.0
- @lowdefy/blocks-loaders@4.3.0
- @lowdefy/operators-js@4.3.0
- @lowdefy/ajv@4.3.0
- @lowdefy/helpers@4.3.0
- @lowdefy/node-utils@4.3.0
- @lowdefy/nunjucks@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/operators@4.2.2
- @lowdefy/blocks-basic@4.2.2
- @lowdefy/blocks-loaders@4.2.2
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
  - @lowdefy/blocks-basic@4.2.1
  - @lowdefy/blocks-loaders@4.2.1
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
  - @lowdefy/blocks-basic@4.2.0
  - @lowdefy/blocks-loaders@4.2.0
  - @lowdefy/operators-js@4.2.0
  - @lowdefy/helpers@4.2.0
  - @lowdefy/node-utils@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/operators@4.1.0
- @lowdefy/blocks-basic@4.1.0
- @lowdefy/blocks-loaders@4.1.0
- @lowdefy/operators-js@4.1.0
- @lowdefy/ajv@4.1.0
- @lowdefy/helpers@4.1.0
- @lowdefy/node-utils@4.1.0
- @lowdefy/nunjucks@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies [7fa709f19]
  - @lowdefy/blocks-basic@4.0.2
  - @lowdefy/operators@4.0.2
  - @lowdefy/blocks-loaders@4.0.2
  - @lowdefy/operators-js@4.0.2
  - @lowdefy/ajv@4.0.2
  - @lowdefy/helpers@4.0.2
  - @lowdefy/node-utils@4.0.2
  - @lowdefy/nunjucks@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/operators@4.0.1
- @lowdefy/blocks-basic@4.0.1
- @lowdefy/blocks-loaders@4.0.1
- @lowdefy/operators-js@4.0.1
- @lowdefy/ajv@4.0.1
- @lowdefy/helpers@4.0.1
- @lowdefy/node-utils@4.0.1
- @lowdefy/nunjucks@4.0.1

## 4.0.0

### Patch Changes

- a30801983: Remove case sensitivity in duplicate page ids check.
- 925b92f09: Remove unnecessary warning message on build "\_id is used but not defined".
- Updated dependencies [84e479d11]
  - @lowdefy/node-utils@4.0.0
  - @lowdefy/operators@4.0.0
  - @lowdefy/blocks-basic@4.0.0
  - @lowdefy/blocks-loaders@4.0.0
  - @lowdefy/operators-js@4.0.0
  - @lowdefy/ajv@4.0.0
  - @lowdefy/helpers@4.0.0
  - @lowdefy/nunjucks@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

### Features

- Support Phosphor icon set. ([82009c6](https://github.com/lowdefy/lowdefy/commit/82009c653d42ce0639b4de786a4adbffb150eb2b))

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- **build:** Fix path keys. ([a6d9bb9](https://github.com/lowdefy/lowdefy/commit/a6d9bb9b376205d1a3ce1ffc5c133a2a8e44b5e1))
- **build:** Handel rec array keys. ([ce429e7](https://github.com/lowdefy/lowdefy/commit/ce429e7fd67c307456b705b4bb23782854be8852))
- **build:** Reduce spaces in build output. ([2e14c4f](https://github.com/lowdefy/lowdefy/commit/2e14c4f38ba8819aefddd1072c69910e6c0b6969))
- **build:** reset id counter. ([a06d15d](https://github.com/lowdefy/lowdefy/commit/a06d15da753ed1026c891a8611df5534d80aae91))
- **build:** Update menuLink in lowdefy schema to include urlQuery and input. ([3d1f6c5](https://github.com/lowdefy/lowdefy/commit/3d1f6c5981f635eeee84e4c7c606867517aa13b5))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency react-icons to v4.11.0 ([21f23d4](https://github.com/lowdefy/lowdefy/commit/21f23d40cf0a7c4ed1931b55ebf854b2bc239948))
- **deps:** Update dependency yaml to 2.3.2 ([cbcdc7d](https://github.com/lowdefy/lowdefy/commit/cbcdc7d3e313fca96fa52bc4724344a061d9f444))

### Features

- **blocks-algolia:** Add DocSearch block. ([701ee87](https://github.com/lowdefy/lowdefy/commit/701ee87ec7f3e5f2b28568e43c14948548b90d9e))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Features

- Add logger to next auth options. ([b30412f](https://github.com/lowdefy/lowdefy/commit/b30412f7cda93be43226728340061465bf6597f4))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- Update serializer util to not clash with \_date operator ([b8cdcb3](https://github.com/lowdefy/lowdefy/commit/b8cdcb3e44a0b1157c111bc7679ac428138c6f97))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- **deps:** update dependency yaml to v2.2.2 [security] ([8e015fe](https://github.com/lowdefy/lowdefy/commit/8e015fec47a40bc5233f23d8da345720475d1232))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **build:** Fix tests. ([68313eb](https://github.com/lowdefy/lowdefy/commit/68313eb489f6fe3d47100c1325c99d90b133065f))

### Features

- **build:** change makeId to incremental counter. ([69ac158](https://github.com/lowdefy/lowdefy/commit/69ac1584d435954e327dfdf6db590af24fad5d4f))
- Make refMap and keyMap. ([6ebcc73](https://github.com/lowdefy/lowdefy/commit/6ebcc73b89c8c7906ab45ad49e9294b0229e2b12))
- Rename nodeParser to serverParser and buildParser. ([0b61e5e](https://github.com/lowdefy/lowdefy/commit/0b61e5e5710084cc19bba4eb6de95c3a53beb4b9))
- **server-dev:** Only watch package.json. ([cbb1bc6](https://github.com/lowdefy/lowdefy/commit/cbb1bc6ce930c8c1de9e7e5790c46e2d21ff21c7))
- Use _k_ and _r_ as non-ennumerables. ([60a83b8](https://github.com/lowdefy/lowdefy/commit/60a83b81111f4f5b01fc2dbd9ded0b2496cee7a7))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **build:** Clean public folder before copying over folders. ([cd84268](https://github.com/lowdefy/lowdefy/commit/cd842683538a023cb83c93f76a36c4cb119240dc))
- **build:** Evaluate build operators before getting key from refDef. ([a9d873c](https://github.com/lowdefy/lowdefy/commit/a9d873c6b2e65ca538489e90bd92b1ed5d7945c4))
- **build:** More generic default 404. ([592a901](https://github.com/lowdefy/lowdefy/commit/592a9019c80e060d5beba9828a655748996ab2d6))
- **deps:** Dependencies minor version updates ([e50ec30](https://github.com/lowdefy/lowdefy/commit/e50ec30a8bf7dcd38d3ca4cbf68907935939f088))
- **deps:** Update dep uuid major version to 9.0.0 ([a88b974](https://github.com/lowdefy/lowdefy/commit/a88b97420098895905a784031673131581731558))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **deps:** Update react-icon and add support for new icon packs ([ae9cbf2](https://github.com/lowdefy/lowdefy/commit/ae9cbf23a331ce2945d9e2ff34a53210121c9134))
- Reset server package.json to original version on CLI start. ([6fac2aa](https://github.com/lowdefy/lowdefy/commit/6fac2aabc8a8e4d95e6ad0922ff3b82f73427a30))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

### Bug Fixes

- **build:** Remove validateConfig theme config default. ([8b0c02b](https://github.com/lowdefy/lowdefy/commit/8b0c02b1dbba05ca8c5a56bc7b5c927a6db5cf0e))

### Features

- Add support for user defined style files ([d33049b](https://github.com/lowdefy/lowdefy/commit/d33049b1b95f6bc84c9b91c2d15b92601210615e))
- **plugin-aws:** Make s3 blocks available for use. ([26c4d15](https://github.com/lowdefy/lowdefy/commit/26c4d15c3cfa0220b2c783592f36ebdb5e32c334))
- Remove support for config.theme.lessVariables ([53a6931](https://github.com/lowdefy/lowdefy/commit/53a693146d1299cff45c81dcefa1315d530b7d98))

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

### Bug Fixes

- **build:** Include operators-moment as default in build. ([633bcf9](https://github.com/lowdefy/lowdefy/commit/633bcf989bafcfd916c97f7b98b8ec654d17b338))

### Features

- **build:** Add operators-moment to generateDefaultTypes ([1e869ad](https://github.com/lowdefy/lowdefy/commit/1e869ad45af7d2e84319a6170c8d0ec735be957e))

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

### Bug Fixes

- Cache API file reads across all requests. ([2b90efb](https://github.com/lowdefy/lowdefy/commit/2b90efb041cf43e5344c5f2f5a8630ae06c8aad6))

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Bug Fixes

- **build:** Fix dynamic import of \_ref resolvers and transformers. ([aaa6f55](https://github.com/lowdefy/lowdefy/commit/aaa6f558029e173d44cbe7b7ac64ecff5d6cc96c))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

### Bug Fixes

- **buiid:** Add authPages to ldf schema. ([814b474](https://github.com/lowdefy/lowdefy/commit/814b4747da03cfe941010d558070f814d0f66a86))

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Features

- Add the abilty to get a key from a reference JSON or YAML file. ([192267e](https://github.com/lowdefy/lowdefy/commit/192267ef716df1997a998a923e8b050aa5b86d35))
- Rename \_var name param to key for consistency ([d5bda68](https://github.com/lowdefy/lowdefy/commit/d5bda6876a52cd97fcdaac62c8aa3b99085bc3d5))

### BREAKING CHANGES

- The \_var operator ‘name’ param has been renamed to ‘key’ to be more consistent with other getter operators.

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

### Bug Fixes

- **build:** Add additional default types. ([9f42115](https://github.com/lowdefy/lowdefy/commit/9f421151fd67d2d0c7985b38343472454bc8332b))

### Features

- **blocks-qr:** Add QRScanner block. ([5778234](https://github.com/lowdefy/lowdefy/commit/5778234f366a030d055f0e1a604cfa27f47617ac))

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- Add buildAuthPlugin tests. ([df77f5d](https://github.com/lowdefy/lowdefy/commit/df77f5d51e4a36c997040c0575cdf66edc0a371f))
- **build:** Add default for catch when try is defined and catch is not. ([b1159e1](https://github.com/lowdefy/lowdefy/commit/b1159e147380e024e66879f4fe2e8061d215cedc))

### Features

- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- Add buildAuthPlugin tests. ([df77f5d](https://github.com/lowdefy/lowdefy/commit/df77f5d51e4a36c997040c0575cdf66edc0a371f))
- **build:** Add default for catch when try is defined and catch is not. ([b1159e1](https://github.com/lowdefy/lowdefy/commit/b1159e147380e024e66879f4fe2e8061d215cedc))

### Features

- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Bug Fixes

- Await content on buildRef to fix ref error message. ([10379b1](https://github.com/lowdefy/lowdefy/commit/10379b15194e8f2f890b1507bb5bdf55beb04aaf))
- **build:** Add test for file not found to buildRefs. ([d45c28e](https://github.com/lowdefy/lowdefy/commit/d45c28e3e44f026073be64ff80335c116aa1488d))

### Features

- Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **build:** Add new plugins as dev dependencies. ([145e598](https://github.com/lowdefy/lowdefy/commit/145e5989139c95acae4029e0a95b1de552457d46))
- **build:** Evaluate build operators in lowdefy.yaml ([49ed3e1](https://github.com/lowdefy/lowdefy/commit/49ed3e14fd7453cd246324d1b791e902dc5a3c8f))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

### Bug Fixes

- **build:** Add default dependancies. ([7d0e03a](https://github.com/lowdefy/lowdefy/commit/7d0e03a87b83991d6bc4d52ae8b524344db07635))
- **build:** Evaluate build operators in lowdefy.yaml root. ([c340b52](https://github.com/lowdefy/lowdefy/commit/c340b5237f15b7673425f086944211238a16904b))

### Features

- **build:** Add aggrid and maps as default block types. ([fbc3818](https://github.com/lowdefy/lowdefy/commit/fbc38185ea385fcfde1f35cfe2d4cfb3d2732388))

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **build:** Add default dependancies. ([7d0e03a](https://github.com/lowdefy/lowdefy/commit/7d0e03a87b83991d6bc4d52ae8b524344db07635))
- **build:** Add new plugins as dev dependencies. ([145e598](https://github.com/lowdefy/lowdefy/commit/145e5989139c95acae4029e0a95b1de552457d46))
- **build:** Evaluate build operators in lowdefy.yaml ([49ed3e1](https://github.com/lowdefy/lowdefy/commit/49ed3e14fd7453cd246324d1b791e902dc5a3c8f))
- **build:** Evaluate build operators in lowdefy.yaml root. ([c340b52](https://github.com/lowdefy/lowdefy/commit/c340b5237f15b7673425f086944211238a16904b))

### Features

- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))
- **build:** Add aggrid and maps as default block types. ([fbc3818](https://github.com/lowdefy/lowdefy/commit/fbc38185ea385fcfde1f35cfe2d4cfb3d2732388))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Build createContext should not be async, create separate file. ([67c03ec](https://github.com/lowdefy/lowdefy/commit/67c03ec345f0ef17cdb4197afe0cc87a532a636b))
- **build:** defaultTypesMap to write a js file to dist. ([331284e](https://github.com/lowdefy/lowdefy/commit/331284e3dfc2e8e12f13991881688c7d1b4d2121))
- **build:** Fix build tests. ([9ea612b](https://github.com/lowdefy/lowdefy/commit/9ea612b4e0ceb9785196cdf1451fb57512e059e4))
- **build:** Fix buildAuth tests. ([0882416](https://github.com/lowdefy/lowdefy/commit/0882416d6fa9a9637ec8870180a022a2bb6dbd21))
- **build:** Fix buildEvents tests. ([0dcb927](https://github.com/lowdefy/lowdefy/commit/0dcb927c0b09de8e376c54a356a6db60660ba0d5))
- **build:** remove unneccesary async await in build. ([6b974e6](https://github.com/lowdefy/lowdefy/commit/6b974e63fc79a3d1b87a478d83269ec8e8121ea0))
- **build:** Restore buildRefs tests after jest update fixes es modules. ([a684273](https://github.com/lowdefy/lowdefy/commit/a6842739f87b6e427a038d41ac5ec87016063e1e))
- **build:** Throw during build if events are not arrays. ([c0c3971](https://github.com/lowdefy/lowdefy/commit/c0c39712687ca7c4c207d46a27c746e1298b2367))
- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))
- Use createRequire to import json files. ([a9c7ec4](https://github.com/lowdefy/lowdefy/commit/a9c7ec4eae0cf65dd42403fb405e65e13b9eca62))

### Features

- Add version property to Lowdefy schema. ([04ff15f](https://github.com/lowdefy/lowdefy/commit/04ff15f89e404c88e204085a7a2552e5cb93b2a5))
- Export buildTestPage, add tests. ([bc9f16c](https://github.com/lowdefy/lowdefy/commit/bc9f16c2efdfc12d047b592a7bbed341d4bd6551))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Features

- Install most fill and outline antd icons for dev server. ([07ef677](https://github.com/lowdefy/lowdefy/commit/07ef6775c78482923f2c93391bfec2cd0e819749))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- **build:** Remove unused configuration from auth schema. ([4922373](https://github.com/lowdefy/lowdefy/commit/4922373d4e8258d6d08fb5adc5af576a83260ea9))
- Fix auth tests. ([c2a8fc7](https://github.com/lowdefy/lowdefy/commit/c2a8fc7206f6a0432a95f1c99749f861a1bf45f5))
- Update lowdefy auth schema. ([60a048e](https://github.com/lowdefy/lowdefy/commit/60a048e98b89b8e6464a5c92553f56774a2c5908))
- Use fileURLToPath when loading json files. ([4885462](https://github.com/lowdefy/lowdefy/commit/488546237b8e5964acc453f05d919f5eb952d8c4))

### Features

- Add support for auth callback plugins. ([a16e074](https://github.com/lowdefy/lowdefy/commit/a16e074ca801a5e9e05424fc09cb8c1e1da81cee))
- Add support for auth event plugins. ([35f28b8](https://github.com/lowdefy/lowdefy/commit/35f28b849d945d14616fc5269bdb980cceb9dee4))
- **build:** Build auth providers and write plugin import file. ([9eb34c8](https://github.com/lowdefy/lowdefy/commit/9eb34c870074c15f7d39202b9eb3c2e21a1ff646))
- **build:** Update build for v4 auth config. ([0120462](https://github.com/lowdefy/lowdefy/commit/01204627d2159b56d7e314d8b8089f4aeccb71d1))
- Create auth plugins types maps. ([6df0010](https://github.com/lowdefy/lowdefy/commit/6df00102032648a3b8d958828a4b5e853cd38da3))
- Import all types exported by plugins in dev server. ([b6e05fb](https://github.com/lowdefy/lowdefy/commit/b6e05fba4479417d9bc8019782b93f8c83515066))
- Include auth event plugins in build. ([4c6d108](https://github.com/lowdefy/lowdefy/commit/4c6d108dffc98a90b9ec0268fe91fb8102cb15de))
- Next auth implementation work in progress. ([bf5692a](https://github.com/lowdefy/lowdefy/commit/bf5692aed26a003e9412b029295a45af489728c4))
- **server:** Add read user object from next-auth session. ([fbab7f1](https://github.com/lowdefy/lowdefy/commit/fbab7f14e7a23fcc82f4a7e1903c4aafdda8169d))
- Updates to auth configuration. ([8f7abf7](https://github.com/lowdefy/lowdefy/commit/8f7abf7fdb1cbe0dbaabe209787a128854680f7b))

### BREAKING CHANGES

- **build:** The “config.auth” object has been moved to the “auth” object at the root of the Lowdefy config.

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/build

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **build:** Fix tests. ([8e7b16e](https://github.com/lowdefy/lowdefy/commit/8e7b16e3ecb7c7c25fd2d4fb48ea42ccad0bb1a8))
- **build:** Skeleton on block only a object in schema. ([98d9c57](https://github.com/lowdefy/lowdefy/commit/98d9c57d6cfb9e24ba0be897ce6812e4765b0d7b))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))
- Fix plugins in build. ([ec8d5ca](https://github.com/lowdefy/lowdefy/commit/ec8d5ca6adc7c482e5a4ab5c2edcc7ae7026f7e8))

### Features

- **build:** Add loading and skeleton to blocks schema. ([1398ca3](https://github.com/lowdefy/lowdefy/commit/1398ca3506a5cd4f116b87feb7feb7f06e3de518))
- **build:** Add mandatory block types. ([2351f10](https://github.com/lowdefy/lowdefy/commit/2351f106304408445edcc91407736c96d7109292))
- **build:** Build changes for skeleton and loading. ([b1d4212](https://github.com/lowdefy/lowdefy/commit/b1d4212ddd934ec67d6e305e7255ea3aa89fdf96))
- **client:** Add display message implementation. ([f94ee32](https://github.com/lowdefy/lowdefy/commit/f94ee32a797b61b5f0f2bcc4de429b815f6de864))
- **client:** Init @lowdefy/client. ([bb7931d](https://github.com/lowdefy/lowdefy/commit/bb7931d0da4ca3614ae4223ca19663a9088d2a45))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **build:** Do not use ref resolver for lowdefy.yml files. ([3c05e57](https://github.com/lowdefy/lowdefy/commit/3c05e57749b2c9315589d77750198c99f4fe3526))
- **operators:** Fix operators failing tests. ([c25b6b6](https://github.com/lowdefy/lowdefy/commit/c25b6b6ea3a6f1100daba2653b263f8aed64a8c4))

### Features

- Add operator-js dependency to build ([83d5b79](https://github.com/lowdefy/lowdefy/commit/83d5b79cec2dc7cdc62c5b51a96dd3d50b1b26c4))
- Add support for typePrefix on custom plugins. ([d66d395](https://github.com/lowdefy/lowdefy/commit/d66d395e01688af917bda0722beba7a8a5886085))
- Create types map for custom plugins. ([5ddf739](https://github.com/lowdefy/lowdefy/commit/5ddf739103b7bdea57bf0a5903433555368c43c3))
- Evaluate build operators in refs. ([f8e2214](https://github.com/lowdefy/lowdefy/commit/f8e22143868b3de69147648f40c17c6d26191b22))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- Add operators used by validation to plugin imports. ([02abd41](https://github.com/lowdefy/lowdefy/commit/02abd41e8eb7e9d1f2637de8f85fbe5dfee350ee))
- **build:** Add writeActionImports to build. ([f0889d2](https://github.com/lowdefy/lowdefy/commit/f0889d238ca2e0558a59913b6f68069b018bc25f))
- **build:** Events with try defined should add default for catch. ([bb36b55](https://github.com/lowdefy/lowdefy/commit/bb36b55d7c3a06dea1a448fb6b588b12547141b4))
- **build:** Fix build tests. ([417f5cb](https://github.com/lowdefy/lowdefy/commit/417f5cb0043ca4e62bcedac192a5965217b0219c))
- **build:** Fix error message when block is not an object. ([5bc113b](https://github.com/lowdefy/lowdefy/commit/5bc113b18cc30090d9862d95dc6d021b0fe9af6b))
- **build:** Fix jest with es modules. ([a4d089a](https://github.com/lowdefy/lowdefy/commit/a4d089afa25363a19cddb0ee62d4e0211f1cfda3))
- **build:** Move page not an object error to addDefaultPages. ([b3c980d](https://github.com/lowdefy/lowdefy/commit/b3c980d2bfc99d1ef4f48a5fb9ef6f99353a4fd6))
- **build:** Throw better error for incorrect user transformer functions. ([d796de3](https://github.com/lowdefy/lowdefy/commit/d796de3cc7e3bf8602d76e5190cfd1d4f71c775a))
- **build:** Throw instead of logging error for build. ([cccaabc](https://github.com/lowdefy/lowdefy/commit/cccaabcdaeb357dc8c1382310166cd96af10b2e0))
- **connection-elasticsearch:** Fix connection-elasticsearch plugin structure to work with version 4. ([f0c55e8](https://github.com/lowdefy/lowdefy/commit/f0c55e8afd69da8581285c9b1805e72e858e4dad))
- **connection-google-sheets:** Fix connection-google-sheets plugin structure to work with version 4. ([2c19747](https://github.com/lowdefy/lowdefy/commit/2c1974748625a2262edb068f3a8317474eaaee50))
- **connection-knex:** Fix connection-knex plugin structure to work with version 4. ([ffc9c35](https://github.com/lowdefy/lowdefy/commit/ffc9c351590921f0008192c4106ba4fab8c82e73))
- **connection-mongodb:** Fix connection-mongodb plugin structure to work with version 4. ([a8b9da9](https://github.com/lowdefy/lowdefy/commit/a8b9da9707fe7aa77e64f042ac36a8efb135329b))
- **connection-sendgrid:** Fix connection-sendgrid plugin structure to work with version 4. ([1baeb0f](https://github.com/lowdefy/lowdefy/commit/1baeb0faaac7a9a008984f7a333e902d8b3be4dc))
- **connection-stripe:** Fix connection-stripe plugin structure to work with version 4. ([3a35829](https://github.com/lowdefy/lowdefy/commit/3a35829edae64dcd5d558698d7bc469fe9d55f0e))
- **deps:** Update dependency ajv to v8.9.0. ([efd18da](https://github.com/lowdefy/lowdefy/commit/efd18da6b146a60db286af00353bac0e12667884))
- **deps:** Update dependency yargs to v17.3.1. ([277776c](https://github.com/lowdefy/lowdefy/commit/277776c7294e57a95dfcf86d300bb20ea4742043))
- Fix import issues for build. ([64a076c](https://github.com/lowdefy/lowdefy/commit/64a076cdc91b77a4b067972f77e99bfc2c571650))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- **node-utils:** Convert writeFile function prototype. ([5371430](https://github.com/lowdefy/lowdefy/commit/53714307123f3477240767a91c5332a70a292d93))

### Features

- Add watch and ignore paths, default ref resolver to dev server and build. ([c700d9f](https://github.com/lowdefy/lowdefy/commit/c700d9fb0efbdb20dcfe5f8916e256de81acd79e))
- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))
- **build:** Add command line args for build, config and server directories. ([1ef213b](https://github.com/lowdefy/lowdefy/commit/1ef213b19d5eea582f7597310200468a787e897c))
- **build:** Added @lowdefy/actions-core plugin to build process. ([a144735](https://github.com/lowdefy/lowdefy/commit/a144735e2cf7647db5e48b434a53c974d907b4f9))
- **build:** Copy files in config public folder to next public folder. ([ceafdc8](https://github.com/lowdefy/lowdefy/commit/ceafdc8cfca0011425e7a2979e50cd2b32d883b9))
- **build:** Use dynamic import for build resolver and transformer functions. ([c9db72a](https://github.com/lowdefy/lowdefy/commit/c9db72ac55109a85cfc821dfbbf87e54b4881d59))
- **operators:** Change dependancy from js-yaml to yaml. ([cbb71d8](https://github.com/lowdefy/lowdefy/commit/cbb71d809b3117dbaf89b23c17a2229a24235308))

### BREAKING CHANGES

- **operators:** \_yaml.parse now takes an array or an object data instead of a string.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v3.23.2) (2021-11-29)

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- Add loading and error icons to icon plugin import. ([3c98732](https://github.com/lowdefy/lowdefy/commit/3c98732584325622c56ebd042b1dab9df0427e02))
- **blocks-markdown:** Upgraded react markdown dependencies. ([9eb7c3a](https://github.com/lowdefy/lowdefy/commit/9eb7c3acbd8ab4088db75637ec8f17e36289787f))
- **blocks:** Updated block meta, types and buildIcons. ([1d774a3](https://github.com/lowdefy/lowdefy/commit/1d774a310a71e125fc7bf7d0d7ef5171632a56a8))
- **build:** Updated write icon imports template. ([425823d](https://github.com/lowdefy/lowdefy/commit/425823de7f64e2e6a688ac9487d13b42bb101eb2))
- Fix antd styles. ([62a752d](https://github.com/lowdefy/lowdefy/commit/62a752d66c9b7cf4ebfd07fcc92d8a195ed43be4))
- Fix blocks-echarts yarn berry packageExtensions. ([a908c1c](https://github.com/lowdefy/lowdefy/commit/a908c1c1f8ccaab37643bf8a043a6cec8f82f243))

### Features

- 404 page working with next server ([270c92e](https://github.com/lowdefy/lowdefy/commit/270c92e16a42a5e9988b890f2abd41b16da6f673))
- Add additional operator plugins to generateDefaultTypes, and fix operaotr packages. ([a1d9c3b](https://github.com/lowdefy/lowdefy/commit/a1d9c3bf7c687603b2f79d0f75b794f703482b17))
- **build:** Move app.style.lessVariables to config.theme.lessVariables. ([cb14f17](https://github.com/lowdefy/lowdefy/commit/cb14f1712f9f064e96d2f71bf12bb3922aff46eb))
- **cli:** Add v4 dev command to CLI. ([02770f5](https://github.com/lowdefy/lowdefy/commit/02770f57096710afc9047403e5e4a616957c3a93))
- Create connection-redis plugin. ([ee2315d](https://github.com/lowdefy/lowdefy/commit/ee2315d69c678f89a8e38de8879c374895f9cb8b))
- Create wait helper function. ([42c09f4](https://github.com/lowdefy/lowdefy/commit/42c09f467b3d4a3b51298a2a67364137def7896d))
- **server-dev:** Dev server soft reload working. ([dd5ee07](https://github.com/lowdefy/lowdefy/commit/dd5ee07b5b39c3c22e702b5b1c8404e7a86ab500))

### BREAKING CHANGES

- The 404 page is now always publically accessible.

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- Fixes for V4. ([41a9a30](https://github.com/lowdefy/lowdefy/commit/41a9a30b308543605a70f7d830a14f8f7221dd01))

### Features

- Add start command to CLI. ([19bf81a](https://github.com/lowdefy/lowdefy/commit/19bf81ad31d9f5f002521e0aed9b1fc1599277dd))
- Allow Less variables to be specified in server. ([bd8ccbd](https://github.com/lowdefy/lowdefy/commit/bd8ccbdaf75fa320e5f6ee6abf3fb7480a3dc180)), closes [#893](https://github.com/lowdefy/lowdefy/issues/893)
- Import operator plugins in server. ([f913e9e](https://github.com/lowdefy/lowdefy/commit/f913e9e261777a0c7f4b0a79995ef18290186b2e))
- Update server package.json if plugin deps change. ([09f7bca](https://github.com/lowdefy/lowdefy/commit/09f7bca3a29ff186783197692e988cb315ff7483)), closes [#943](https://github.com/lowdefy/lowdefy/issues/943)

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

### Features

- **build:** Add build icons.js. ([e3b7eb7](https://github.com/lowdefy/lowdefy/commit/e3b7eb7bf45e3dd237da47a9dfa783cb9e1174e8))

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

### Bug Fixes

- **build:** Fix build default build directory. ([f6efc19](https://github.com/lowdefy/lowdefy/commit/f6efc19f00a78cda46e04762b3ea89f4da1eda25))

### Features

- **build:** Add styles.less in build. ([d014774](https://github.com/lowdefy/lowdefy/commit/d0147743ecca045858331cbec409059386a35e60))

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

### Bug Fixes

- Fixes for CLI build. ([3e58d59](https://github.com/lowdefy/lowdefy/commit/3e58d599829e1393de52e94e6e1e82f6876231ec))

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- **ajv:** Build @lowdefy/ajv with swc and update dep ajv to v8.6.3. ([f231fcb](https://github.com/lowdefy/lowdefy/commit/f231fcb3219d5210f0c7c597323511b706b610dc))
- **api:** JSON web token tests and fixes. ([30f7267](https://github.com/lowdefy/lowdefy/commit/30f7267c3e2435647b1b5f0b4b48137d6c3357d6))
- **build:** Fix build if no lowdefy.yaml file is found. ([86f32a1](https://github.com/lowdefy/lowdefy/commit/86f32a18643924cf29d16ddf4c1903a385d6efb5))
- **build:** Fix build tests. ([509d71a](https://github.com/lowdefy/lowdefy/commit/509d71a9b4f21e1094744dc4fa94732d99dfe351))
- **build:** Remove getMeta from context. ([a982fd8](https://github.com/lowdefy/lowdefy/commit/a982fd8fd00d26f14b82e4a56f9dd2ed4c40293f))
- **build:** Remove nested if statements. ([e4771f9](https://github.com/lowdefy/lowdefy/commit/e4771f9e494b4ef1f313782d7b64a9657b0d6a52))
- **build:** Removed check and test for duplicate block id. ([8fe5cdd](https://github.com/lowdefy/lowdefy/commit/8fe5cdd65f60fd4b87c820aa0eb1b9a106ce077f))
- **build:** Update build tests for payload change. ([43c2507](https://github.com/lowdefy/lowdefy/commit/43c2507b95eb9c87ddb6ed63057e7fb8c42ce840))
- **build:** Update duplicate id tests. ([ed2f983](https://github.com/lowdefy/lowdefy/commit/ed2f983841be4c6e6211fd8e5e06c9283e4fcbd2))
- **build:** Updated formatErrorMessage and testSchema tests. ([751814c](https://github.com/lowdefy/lowdefy/commit/751814cec6950dee06dfb2844e952c7a985c691a))
- **build:** Updated formatErrorMessage function to show descriptive error paths. ([5096554](https://github.com/lowdefy/lowdefy/commit/509655409ea81aed398e67e45829d0c8603fc56f))
- Clean up server configuration. ([dea25de](https://github.com/lowdefy/lowdefy/commit/dea25dec2303f19937253a0d9c699b56b28fb82b))
- Cleanup build script. ([ca0b4b0](https://github.com/lowdefy/lowdefy/commit/ca0b4b0d91bb77098d9295f0a071bb05a19e3781))
- **deps:** Update dependency axios to v0.23.0. ([f04f720](https://github.com/lowdefy/lowdefy/commit/f04f7208d2e00e2f8d9d2418514ecbe2bbab5cbc))
- **deps:** Update package ajv to v8.8.2. ([2ded889](https://github.com/lowdefy/lowdefy/commit/2ded889ef7970554b4028bfbddbe4c754a49fb40))
- ES module and next server fixes. ([83bca45](https://github.com/lowdefy/lowdefy/commit/83bca458e4ba5a5d2f62a23f603b69672bc0418b))
- Fix tests ([80c00f4](https://github.com/lowdefy/lowdefy/commit/80c00f4403067493351347ca91cb953586bb97da))
- Remove block metadata from build. ([06a4fba](https://github.com/lowdefy/lowdefy/commit/06a4fba06ce1f15781a12321d34b7f8e346a0af8))
- Remove nested contexts code review fixes. ([ceb266d](https://github.com/lowdefy/lowdefy/commit/ceb266d5e09afcaacceaef0690d76eeaceb8e5ae))
- Test fixes. ([67bf2d4](https://github.com/lowdefy/lowdefy/commit/67bf2d444884232369eea5f9b9db418b4cf3a25b))

### Features

- Add authentication flows ([15e1be9](https://github.com/lowdefy/lowdefy/commit/15e1be90d063ca4e0b315ed8be1641897b694d5c))
- **api:** Init package @lowdefy/api ([cbe7569](https://github.com/lowdefy/lowdefy/commit/cbe75694f1f348e3e89ac38b45ca075f8ece0241))
- Build html files for each page, and serve from api ([3f53d8b](https://github.com/lowdefy/lowdefy/commit/3f53d8b20f89b2179ffe18a510e8d5415de2be39))
- **build:** Add generateDefaultTypes script. ([18a4863](https://github.com/lowdefy/lowdefy/commit/18a486384d315d661e957e4d23c4efbae47a3ec7))
- **build:** Added createCheckDuplicateId test. ([414eaa1](https://github.com/lowdefy/lowdefy/commit/414eaa15c152a4b1261a5c7a34d3c423279018d3))
- **build:** Build now throws on duplicate ids. ([45fd393](https://github.com/lowdefy/lowdefy/commit/45fd393c4e605964ec8daeb8c8260945952751ab)), closes [#529](https://github.com/lowdefy/lowdefy/issues/529)
- **build:** Count types during build. ([6550f76](https://github.com/lowdefy/lowdefy/commit/6550f76ec0f1e2ce94300911eb605551c9a8738d))
- **build:** Remove support for nested contexts on a page. ([b003b76](https://github.com/lowdefy/lowdefy/commit/b003b76182ad8b8ba4e7f895247ace4881bce230))
- **build:** Write plugin imports and types.json during build. ([14247ea](https://github.com/lowdefy/lowdefy/commit/14247eab075cea1ffde8e84f134b0f3b66920cbe))
- Generate unique block ids at build. ([1503970](https://github.com/lowdefy/lowdefy/commit/1503970896088eb0d6988fbe657e66e477f62c8f)), closes [#920](https://github.com/lowdefy/lowdefy/issues/920)
- Make @lowdefy/build a dev dependency of server. ([fa97eb6](https://github.com/lowdefy/lowdefy/commit/fa97eb6a34ae0ea08ae341959c461d5be4f4ba49))
- Next server fixes. ([9e6518a](https://github.com/lowdefy/lowdefy/commit/9e6518a89e95a894b2c680146e0de15aa6f3513e))
- Next server rendering blocks ([e625e07](https://github.com/lowdefy/lowdefy/commit/e625e07a29b5ae3f09f74c629f35fe52ce73dace))
- Remove @lowdefy/renderer package ([c584778](https://github.com/lowdefy/lowdefy/commit/c58477852d36f101dd38a0e48143b4a483273ee2))
- Render Lowdefy blocks in client package. ([c24bcf1](https://github.com/lowdefy/lowdefy/commit/c24bcf193123bf1b09b886160df4dafd9298d750))
- Replace server side state with payload and \_payload operator. ([1f928d9](https://github.com/lowdefy/lowdefy/commit/1f928d93db4cbe886d322a1a3998a817d769485f))
- **server:** Convert server to fastify. ([0d2c1c3](https://github.com/lowdefy/lowdefy/commit/0d2c1c34d969fab5049fb501f027bea60bce54ed))

### BREAKING CHANGES

- The \_event, \_global, \_input, \_state, and \_url_query operators are no longer evaluated in connections or requests.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v3.23.2) (2021-11-29)

**Note:** Version bump only for package @lowdefy/build

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/build

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

### Features

- **build:** Better error messages on build. ([9934d07](https://github.com/lowdefy/lowdefy/commit/9934d07430aef93d4f992c048b3f7101b4934217))

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/build

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

**Note:** Version bump only for package @lowdefy/build

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **build:** Updated meta location tests to include CheckboxSwitch. ([905f47e](https://github.com/lowdefy/lowdefy/commit/905f47edd3ffa252c688d5959d69320a7a42c7bd))
- **build:** Updated meta locations to include CheckboxSwitch block. ([cd2ab8c](https://github.com/lowdefy/lowdefy/commit/cd2ab8c3a87e76d0b61284c60f5f3cfcad98c24f))
- **deps:** Update dependency axios to v0.21.4 ([81cd2b6](https://github.com/lowdefy/lowdefy/commit/81cd2b6e0ae3dc377b9cee6e3c801c47ddca2f08))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

### Bug Fixes

- **build:** Updated meta locations tests. ([9e20ace](https://github.com/lowdefy/lowdefy/commit/9e20acebaac9ae01fd3974469bddede0e651da19))

### Features

- **build:** Added PasswordInput meta location. ([66abcdd](https://github.com/lowdefy/lowdefy/commit/66abcddafc7d8b1950e96a137d0d336ccf3e145b))

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/build

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

### Bug Fixes

- **build:** Add async to actions schema. ([1276422](https://github.com/lowdefy/lowdefy/commit/127642294ac962ac215303612e16455e395860d4))

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/build

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

### Bug Fixes

- **build:** Add debounce to the build schema. ([2ea31b1](https://github.com/lowdefy/lowdefy/commit/2ea31b1f3e770a1edbcdefa790908f9df7c04997))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

### Bug Fixes

- **build:** Fix user specified type locations. ([0456b00](https://github.com/lowdefy/lowdefy/commit/0456b0073dc13d743ba962d81488088c3794d3da))

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

### Bug Fixes

- **build:** Cache readFile and getMeta promises. ([d1fd3da](https://github.com/lowdefy/lowdefy/commit/d1fd3daa90716e98e3a06022e743df9a3fdd58d0))

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

### Bug Fixes

- **build:** Cache readFile and getMeta promises. ([d1fd3da](https://github.com/lowdefy/lowdefy/commit/d1fd3daa90716e98e3a06022e743df9a3fdd58d0))

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

### Bug Fixes

- **build:** Fix unevaluated being passed to \_ref transformer. ([537a776](https://github.com/lowdefy/lowdefy/commit/537a77651220d7ffab117572c40ff790e296af56))

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **build:** Add tests for readConfigFile. ([809f09a](https://github.com/lowdefy/lowdefy/commit/809f09a51fb46d94c54a35042cd0fb6c58f11fbd))
- **build:** Add writeBuildArtifact test. ([350f25f](https://github.com/lowdefy/lowdefy/commit/350f25faf8171c3ed42a738b39333d289cb1dee8))
- **build:** Fix getMeta memoisation ([7f824b0](https://github.com/lowdefy/lowdefy/commit/7f824b0553358c695c64ffe0fcbf38ca04a075c3))
- **build:** Fix getMeta memoised return. ([a939bd5](https://github.com/lowdefy/lowdefy/commit/a939bd5b3fd68c557e38848993551dff19b5622e))
- **build:** Fix getMeta return value after dataloader has been removed. ([993d398](https://github.com/lowdefy/lowdefy/commit/993d3988be32e46e93619ed2edc5a6380f726510))
- **build:** Refactor build refs. ([dbb7c88](https://github.com/lowdefy/lowdefy/commit/dbb7c88f44719277b2583c3b11a2cd150be841d1))
- **build:** refactor buildRefs function. ([b66cc5a](https://github.com/lowdefy/lowdefy/commit/b66cc5a38db08666a8edc0312045c2b8ea20f66e))
- **build:** Refactor buildRefs. ([8d43e00](https://github.com/lowdefy/lowdefy/commit/8d43e004e52384c143524645f36544d4795affe9))
- **build:** Refactor reading of config files. ([d1591a2](https://github.com/lowdefy/lowdefy/commit/d1591a2a0578a4bda230e35e86fcbd1d4e5dcffa))
- **build:** Refactor writing of build artifact files. ([7162760](https://github.com/lowdefy/lowdefy/commit/7162760b18b62c9b5f25ea1ff024c1c1724132df))
- **build:** Remove dataloader dependency ([4c64bd7](https://github.com/lowdefy/lowdefy/commit/4c64bd7ce290ba7881d6deda3097d0b9fb765203))
- **build:** remove metaloader to remove dataloader dependency ([f6f35a9](https://github.com/lowdefy/lowdefy/commit/f6f35a91342a771a644a350378ef52ab9d80c05d))
- **build:** Remove unsupported eval property on \_ref. ([808f619](https://github.com/lowdefy/lowdefy/commit/808f619d19c6b450133861913ee56e69f783fbc0))
- **build:** Remove unused tests. ([f2db270](https://github.com/lowdefy/lowdefy/commit/f2db270a223e290a58fcd4e2225365692d83e097))
- **build:** Standarise buildPages function signatures. ([65c7e8b](https://github.com/lowdefy/lowdefy/commit/65c7e8ba9b39609c992878d84968a2cbc60b4a16))
- **build:** Test memoisation in getMeta. ([c1f887e](https://github.com/lowdefy/lowdefy/commit/c1f887e4ff3da0122d3d7b5566a1f64f7a6dc0e1))

### Features

- **build:** Add support for app default ref resolver function. ([b23e8c9](https://github.com/lowdefy/lowdefy/commit/b23e8c967ec1c48664a9aef954a0b53497af28d2))
- **build:** Add support for resolver functions in \_ref operator. ([aa7fddc](https://github.com/lowdefy/lowdefy/commit/aa7fddcfc20b3689400bd69d9b865f9306e6991f))
- Make blocks server URL configurable. ([65c9fe7](https://github.com/lowdefy/lowdefy/commit/65c9fe79b254bf5a20b87e0a2ec4fdcd1ecd5427)), closes [#670](https://github.com/lowdefy/lowdefy/issues/670)

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

**Note:** Version bump only for package @lowdefy/build

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package @lowdefy/build

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

### Bug Fixes

- **build:** default 404 page should be copied in build. ([8e0d8ca](https://github.com/lowdefy/lowdefy/commit/8e0d8ca160193728bc14f5dbc43d411a77835ed4)), closes [#647](https://github.com/lowdefy/lowdefy/issues/647)
- **build:** Improve build error messages for missing ids. ([ecd2488](https://github.com/lowdefy/lowdefy/commit/ecd2488ff4a71eee4732cc213eee2308b682410a))
- **build:** Improve error message. ([258d4ad](https://github.com/lowdefy/lowdefy/commit/258d4adc299922b16058c8ba82e937944154d089))
- **build:** Throw an error if request id contains a period. ([933e4fa](https://github.com/lowdefy/lowdefy/commit/933e4fa35a0f5f481c1d426682eca560c51210e6))

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/build

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/build

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/build

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/build

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/build

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/build

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

### Bug Fixes

- **build:** Handle try catch options in actions schema. ([7e05b0e](https://github.com/lowdefy/lowdefy/commit/7e05b0eb75a92613507731e1cbceb71433d86e71))

### Features

- **build:** Add a default 404 page if no page is defined. ([b0abb39](https://github.com/lowdefy/lowdefy/commit/b0abb39e108ab22421cb5bac9248dcef9e209367))

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/build

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/build

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/build

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

### Bug Fixes

- **build:** Add default locations for new blocks. ([544d1e1](https://github.com/lowdefy/lowdefy/commit/544d1e1d8459fb03294eb692f12116fa9f3904a5))

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- **build:** Do not throw on validate app config. ([96904a7](https://github.com/lowdefy/lowdefy/commit/96904a7783695f2b60b20be9488ffcb8dde79930))
- Rename appendHeader to appendHead. ([4e79736](https://github.com/lowdefy/lowdefy/commit/4e797363540bd0f5cfbe65928585012316b05a58))

### Features

- **build:** Build app config. ([6575bc7](https://github.com/lowdefy/lowdefy/commit/6575bc78bc37a1b33f301364a5daee4bab324884))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

### Features

- Remove logoutFromProvider config, and nunjucks template logout url ([111d3da](https://github.com/lowdefy/lowdefy/commit/111d3da83f4d132e4243583dabbdd7cdaae69fe7)), closes [#563](https://github.com/lowdefy/lowdefy/issues/563)

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/build

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

### Bug Fixes

- **build:** Fix build import. ([307d0ce](https://github.com/lowdefy/lowdefy/commit/307d0ce152bae7a5327f0488e8ac23f0b592cc8b))

### Features

- **build:** Build auth objects for role bases authorization. ([5fa6436](https://github.com/lowdefy/lowdefy/commit/5fa643643dc4ef5a04737228c87acf76c23e3135))
- **build:** Build correct auth object for menus ([2145033](https://github.com/lowdefy/lowdefy/commit/21450334159b216b833bc8e8cd6656269b380746))
- **build:** Update lowdefy app schema to include rolesField. ([3f1e06b](https://github.com/lowdefy/lowdefy/commit/3f1e06b38d9f1590a1ed275b138c358d5e252283))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- **build:** Add configDirectory to context for full local builds. ([5a6a36d](https://github.com/lowdefy/lowdefy/commit/5a6a36dc3373b9864896171b2f5d3185d72d6c3b))
- **build:** Add eval option to \_ref operator during build. ([eb62e8a](https://github.com/lowdefy/lowdefy/commit/eb62e8a22b326c16148ae8324d64d89022cf16c6))
- **build:** Add list of operators in context to build. ([88a6f24](https://github.com/lowdefy/lowdefy/commit/88a6f24c8f486ee5370e78c8829cad0fb2d18492))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/build

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/build

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/build

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/build

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/build

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/build

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

### Features

- **blockECharts:** Add EChart block 🎁. ([deff965](https://github.com/lowdefy/lowdefy/commit/deff96504ff1b24152a82458511b0426cec5d8ee))

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/build

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/build

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/build

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/build

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Bug Fixes

- **build:** Add auth config to all menu items. ([cea8982](https://github.com/lowdefy/lowdefy/commit/cea898252dd3f94b89107c15d7aeb889650a9e04))
- **build:** Nested context caused request to be created in wrong context. ([16e2b15](https://github.com/lowdefy/lowdefy/commit/16e2b154d44d3f532fe5be805dabcf0560129dd5))
- **build:** Page auth config fixes. ([601c942](https://github.com/lowdefy/lowdefy/commit/601c942e4fe5f7ed14fc209a5107dd25c65c1afa))
- **build:** Throw when poth protected and public pages are listed. ([5581ac4](https://github.com/lowdefy/lowdefy/commit/5581ac4bb003eb0e0d32320438388ad2af81f9a5))

### Features

- **build:** Add auth to build arifacts. ([c6a2e53](https://github.com/lowdefy/lowdefy/commit/c6a2e53a2fa0611e2a0f0d4b79fba9f26da66d4e))
- **graphql:** Make JWT expiry time configurable. ([30bde0b](https://github.com/lowdefy/lowdefy/commit/30bde0be4eb68f59818fdb3738f82c9b0e2e86a2))
- use setHeader plugin to set auth headers ([6238c6f](https://github.com/lowdefy/lowdefy/commit/6238c6f6ba6c1d24720f4867da7e5e577ff344d4))
- **build:** Add auth field and homePageId to config in app schema. ([a878a31](https://github.com/lowdefy/lowdefy/commit/a878a31160daa9e08b9ace838c3d5eb54b1d805e))
- **build:** Update app OpenID configuration schema ([a6df3c0](https://github.com/lowdefy/lowdefy/commit/a6df3c0f65dc5a048ca303a14743ff46f7b6b35a))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

**Note:** Version bump only for package @lowdefy/build

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

### Bug Fixes

- **build:** Start schema error messages with a new line ([80110c5](https://github.com/lowdefy/lowdefy/commit/80110c5fe4e313447df3399d097e2fac628cb4e3))

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **build:** Add action messages to app schema ([2aff1cb](https://github.com/lowdefy/lowdefy/commit/2aff1cbf3a2216ab4c97a2119a158381b305ca88))
- **deps:** Update dependency json5 to v2.2.0. ([d93df2b](https://github.com/lowdefy/lowdefy/commit/d93df2b82d15585c907f18e2a52c2fda7b23a71a))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **build:** Fix TimelineList block location (renamed from Timeline). ([02c5dea](https://github.com/lowdefy/lowdefy/commit/02c5dea13ff5f87b385a3ac5408efe2e4fa8c3dc))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

**Note:** Version bump only for package @lowdefy/build

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/build

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Bug Fixes

- **build:** Allow \_ref path argument to be a \_var. ([a8bd287](https://github.com/lowdefy/lowdefy/commit/a8bd287176a58eff5df5f79071119cce0fc4e0fa))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- Fix blocks-color-seletors typo. ([b6ccedd](https://github.com/lowdefy/lowdefy/commit/b6ccedd355c53b5910ef398aff49d32968f34c2e))
- **build:** Add 'field' to block schema. ([4aa76e8](https://github.com/lowdefy/lowdefy/commit/4aa76e807743064cca8c5a51ee3d5c7ad536aff8))

### Features

- 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **build:** Add types object to app schema. ([bd40748](https://github.com/lowdefy/lowdefy/commit/bd40748afcbe3c31d83b7c2f169db9ae1285ea5d))
- **build:** Improve error message if \_var receives invalid arguments. ([c52a942](https://github.com/lowdefy/lowdefy/commit/c52a94297aec0f39c88bd5f6ae6d22e6723fe27a))
- **build:** Improve warning message if menu’s page not found ([7df576a](https://github.com/lowdefy/lowdefy/commit/7df576a2689f8eb79b44ca5fa8d2af38126006e7))
- **build:** Update default locations. ([203175d](https://github.com/lowdefy/lowdefy/commit/203175d6a4b8c018c9d65ff7cb7248b10d4e4508))

### Features

- **build:** Do not cache block metas if served from localhost. ([58772af](https://github.com/lowdefy/lowdefy/commit/58772af17886570aa8108ce2f04c554f21f80027))
- Rename blocks “actions” field to “events”. ([8f2e998](https://github.com/lowdefy/lowdefy/commit/8f2e9986e72be368203c0479a28ad7c7a2511f10))
- **docs:** Add TitleInput and ParagraphInput. ([3e5b239](https://github.com/lowdefy/lowdefy/commit/3e5b2393227c579ea957380b78439ff016014385))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

### Bug Fixes

- **build:** Fix app schema test tests. ([86917c0](https://github.com/lowdefy/lowdefy/commit/86917c0f79ca75321af5d89e2f29e9328debec50))
- **build:** Fix lowdefy app schema. ([f33c151](https://github.com/lowdefy/lowdefy/commit/f33c151dfbe1a2ea55ead94c0fc6ef2573f34875))

### Features

- **build:** Add licence field to app schema. ([a6f7c91](https://github.com/lowdefy/lowdefy/commit/a6f7c910f629884942424f0f177614ca8c3c45ae))

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))

### Features

- **build:** Add transformer function option to \_ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
- **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
- Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))

### Features

- **build:** Add transformer function option to \_ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
- **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
- Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))

# [0.1.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/build@0.0.0-alpha.7...@lowdefy/build@0.1.0) (2020-12-15)

### Features

- **build:** Add user defined loading property to blocks. ([bc87408](https://github.com/lowdefy/lowdefy/commit/bc87408edfb12b71286da9c2cf678b101dae9bd3))

# [0.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/build@0.0.0-alpha.7...@lowdefy/build@0.0.0) (2020-12-15)

### Features

- **build:** Add user defined loading property to blocks. ([bc87408](https://github.com/lowdefy/lowdefy/commit/bc87408edfb12b71286da9c2cf678b101dae9bd3))

# 0.0.0-alpha.7 (2020-12-10)

### Bug Fixes

- **ajv:** fix ajv validate parameter name ([5aba723](https://github.com/lowdefy/lowdefy/commit/5aba7230fec264cc12a8dcbd578da098ef3afe0e))
- **build:** add contextId to saved request file path ([81219b5](https://github.com/lowdefy/lowdefy/commit/81219b5c1dd8b26e213da9e4ab72178ac70ba812))
- **build:** add visible to block schema. ([4865208](https://github.com/lowdefy/lowdefy/commit/4865208416b7cccb0719984b1fb10813084dfbc1))
- **build:** app schema fix, add style on block ([a39c1ca](https://github.com/lowdefy/lowdefy/commit/a39c1ca83b8a859e87c764536c042edcce29f110))
- **build:** fix build issues ([0f1bd9c](https://github.com/lowdefy/lowdefy/commit/0f1bd9c5176b3d7472bf41d77e90dde491225564))
- **build:** fix local run script ([c69ee94](https://github.com/lowdefy/lowdefy/commit/c69ee94c057ef1ed1b0a29d88c0a3b475f62dcd1))
- **build:** Fix lowdefy schema, closes [#269](https://github.com/lowdefy/lowdefy/issues/269) ([09105a9](https://github.com/lowdefy/lowdefy/commit/09105a99b33bb358aac17593b4ad29906a461791))
- **build:** Icon block is part of blocks-antd package ([8507556](https://github.com/lowdefy/lowdefy/commit/8507556c10a9e076cf0d769a739d5687f3385482))
- **build:** improve error if block meta can not be found ([03dccb1](https://github.com/lowdefy/lowdefy/commit/03dccb169d71c9bb417d3754615d50937abfb38d)), closes [#121](https://github.com/lowdefy/lowdefy/issues/121)
- **build:** in shcema areas.content.block must be an array ([f53dcb8](https://github.com/lowdefy/lowdefy/commit/f53dcb8fffd18624b5f8b3aee11c5ed785c8d1e7))
- **build:** remove test file from git ignore ([c16ad0b](https://github.com/lowdefy/lowdefy/commit/c16ad0b5b17dc4b093ff5972ab7f27b6d987b749))
- **build:** remove unneccesary cli logs ([1f27b7d](https://github.com/lowdefy/lowdefy/commit/1f27b7d5d2c739fbffa21a04971c674fe9ce26cd))
- **build:** write block metas to meta folder in cache ([d6277a5](https://github.com/lowdefy/lowdefy/commit/d6277a59bb2561ac26d6cb4e292e0888f0da5bb4))
- **build:** write config object to output in build ([46ec66d](https://github.com/lowdefy/lowdefy/commit/46ec66d9e0330fafb323cbea2bdd3118a48eb7c4))
- **deps:** update dependency axios to v0.21.0 ([aee32c0](https://github.com/lowdefy/lowdefy/commit/aee32c0b37646e07bc8d5eeff7947e3af84ceb2c))
- **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
- **deps:** update dependency uuid to v8.3.2 ([abca08f](https://github.com/lowdefy/lowdefy/commit/abca08f599ec689e45ac208670bceb6f4fa2b089))
- move file helpers to new node-utils package ([0a6ef8d](https://github.com/lowdefy/lowdefy/commit/0a6ef8d09b6f1a75c8a8ceb1749f7dfe14c46b5f))

### Features

- **blocksTools:** mockBlockProps to provide schema errors ([6c192d4](https://github.com/lowdefy/lowdefy/commit/6c192d42b0ab9521b9c74a3a1466b03d414864bb))
- **build:** add block meta loader ([2a483ad](https://github.com/lowdefy/lowdefy/commit/2a483ad8e6237771eb485cad11364c85883b6943))
- **build:** add build context ([0f13e41](https://github.com/lowdefy/lowdefy/commit/0f13e4114dc96a9af918452918614cd13d8930a1))
- **build:** add build pages function ([01e892f](https://github.com/lowdefy/lowdefy/commit/01e892fad5d4c6c5c59406501cd936668b244085))
- **build:** add buildRefs function ([3ab2819](https://github.com/lowdefy/lowdefy/commit/3ab2819944fc3f7dd122e18b8e90ac24e832a5c9))
- **build:** add clean directory util ([127eb39](https://github.com/lowdefy/lowdefy/commit/127eb397134811126253d4feb820e421faaa71e5))
- **build:** add cleanOutputDirectory function ([e3a3bf9](https://github.com/lowdefy/lowdefy/commit/e3a3bf9952f7a07e981cd5ef2e38cfd60c68e636))
- **build:** add color selector defaultMetaLocations ([6c28a66](https://github.com/lowdefy/lowdefy/commit/6c28a6683c32062f457991ad7746d1eb321bb223))
- **build:** add defaultMetaLocations ([fe14001](https://github.com/lowdefy/lowdefy/commit/fe140013df9c145c457be2c039747f39c64983bf))
- **build:** add error messages to lowdefy schema ([6fd15f0](https://github.com/lowdefy/lowdefy/commit/6fd15f0bbcd031a79c215321b195a0fe0fae34b4))
- **build:** add getFileExtension util ([46586f0](https://github.com/lowdefy/lowdefy/commit/46586f05f2db9d87493c511a79f9047ee30829b6))
- **build:** add schema test utils ([bb0574f](https://github.com/lowdefy/lowdefy/commit/bb0574fb1da37286fc19ba2bade7b458b4c8fc36))
- **build:** add test schema function, cleanup ([ac216d4](https://github.com/lowdefy/lowdefy/commit/ac216d448396d49e5e08a64244d5c404ad08ef91))
- **build:** add util functions ([8686857](https://github.com/lowdefy/lowdefy/commit/8686857222f52f9939df9c2644e444f96978c3ee))
- **build:** add write functions ([701b583](https://github.com/lowdefy/lowdefy/commit/701b583a6d29a03eedaed5899b48cf94641c3694))
- **build:** build connections and menus ([3f4b486](https://github.com/lowdefy/lowdefy/commit/3f4b486459574e38d9e33c0c9b8b1ac0b918a31f))
- **build:** cleanup, test fixes ([1c1792b](https://github.com/lowdefy/lowdefy/commit/1c1792b6906d1a8d90e3eff811fb978995d8e9b1))
- **build:** init package @lowdefy/build ([6f7f73b](https://github.com/lowdefy/lowdefy/commit/6f7f73bbe021f41b82c347130dfe79a40d5e2273))
- **build:** remove mutations ([1e9801b](https://github.com/lowdefy/lowdefy/commit/1e9801b6ac4be70f1f30635ac450394f0c0db973))
- **build:** update app schema ([fc40948](https://github.com/lowdefy/lowdefy/commit/fc40948b488a2e3a105c8dcb123a4fe26e096aeb))
- **build:** use @lowdefy/ajv for json schema checks ([98eb4be](https://github.com/lowdefy/lowdefy/commit/98eb4be30cf217b9db0dd27e8c68ddadb480b67e))
- **build:** write pages and requests ([fc6176d](https://github.com/lowdefy/lowdefy/commit/fc6176d312dbcaaa9238d2c1990bb8c414596028))
- **cli:** add errorBoundary and getLowdefyVersion utils ([519e604](https://github.com/lowdefy/lowdefy/commit/519e6047714a8e32072eaacaa111eff666b69e71))
- **cli:** improve cli console logs ([7ca7509](https://github.com/lowdefy/lowdefy/commit/7ca7509e2696e2380a02aded5b22d6bd9b1ec62f)), closes [#247](https://github.com/lowdefy/lowdefy/issues/247)
- **cli:** init cli with build command ([92fff8f](https://github.com/lowdefy/lowdefy/commit/92fff8f157ce6ac2d2df09dac7f8f2073e120b63))
- **cli:** init dev server ([7eae1a8](https://github.com/lowdefy/lowdefy/commit/7eae1a80f456f0987c8835a3966ca5a7a6a80018))
- **cli:** init module federation of build script ([34dba01](https://github.com/lowdefy/lowdefy/commit/34dba017246b38b940f6614d66def34844f9e961))
- update webpack configs ([bcce3c8](https://github.com/lowdefy/lowdefy/commit/bcce3c85cea5857e429f1821785ffb939dcaa52a))
- **helpers:** move file utilities to helpers ([1159ac7](https://github.com/lowdefy/lowdefy/commit/1159ac71e7e1029c8c9d94e1826fea2f72d76aa9))
