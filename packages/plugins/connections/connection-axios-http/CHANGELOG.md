# Change Log

## 7.0.0

### Minor Changes

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

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

### Patch Changes

- 99a4f35: Update dependencies to releases with published security fixes.

  - `axios` 1.20.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.16 in `block-utils`, `blocks-basic` and `blocks-markdown`.

  **`dompurify` 3.4.16** keeps the SVG `pointer-events` and `vector-effect` attributes, which earlier releases removed. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [81bd4f0]
  - @lowdefy/helpers@7.0.0

## 6.1.0

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

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Patch Changes

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

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
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

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

### Major Changes

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

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

- bb3222a5a: fix(errors): Preserve error cause chains in catch-and-rethrow blocks across plugins and CLI
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

- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1

## 4.2.0

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

- @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update axios to v1.5.0. ([a23099a](https://github.com/lowdefy/lowdefy/commit/a23099af2738faff4a27c55bcf413ca3da5cdbd2))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- Allow axios data property to be an array ([9b83af5](https://github.com/lowdefy/lowdefy/commit/9b83af5e0fa0600ff39b1c317fbce7e5be2a17a0)), closes [#1158](https://github.com/lowdefy/lowdefy/issues/1158)
- **deps:** Update axios to v1.2.2 (major version) ([18d725e](https://github.com/lowdefy/lowdefy/commit/18d725e9ff8b2d049ecd7182c1241553950e8d4f))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Bug Fixes

- Fix axios failing tests. ([ca64872](https://github.com/lowdefy/lowdefy/commit/ca64872a130c2b8f5d0798f7489b39c99143d329))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **deps:** Update dependency axios to v0.25.0. ([ddf13bb](https://github.com/lowdefy/lowdefy/commit/ddf13bb7f891bbb328f1ac6aea3e34894d80c42c))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

### Features

- **connection-axios-http:** Generate type.js from import. ([d6c1cf7](https://github.com/lowdefy/lowdefy/commit/d6c1cf7767f1cc42e1424325df933f12bab65329))

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-axios-http

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- **deps:** Update package axios to v0.24.0. ([ea4f077](https://github.com/lowdefy/lowdefy/commit/ea4f07784f5020eb12c95b3d2885e74044fc3fb9))

### Features

- **build:** Add generateDefaultTypes script. ([18a4863](https://github.com/lowdefy/lowdefy/commit/18a486384d315d661e957e4d23c4efbae47a3ec7))
- **build:** Write plugin imports and types.json during build. ([14247ea](https://github.com/lowdefy/lowdefy/commit/14247eab075cea1ffde8e84f134b0f3b66920cbe))
- Convert connection elasticsearch to plugin structure. ([a277fd0](https://github.com/lowdefy/lowdefy/commit/a277fd0f6b80f39ee21e4673e26c7797afc8ff91))
- Convert knex, sendgrid and stripe connections to plugin structure. ([d0e751a](https://github.com/lowdefy/lowdefy/commit/d0e751af47b6f04ab9ace2256268f96116d8aaa8))
- Fixes fro requests in next server ([e341d8d](https://github.com/lowdefy/lowdefy/commit/e341d8ded222902ce07ea1ea1d18940ac000c4da))
- Requests working on next server ([8d6abe2](https://github.com/lowdefy/lowdefy/commit/8d6abe27f967be6c11d1f4c29e8af73c4734dd68))
- Restructure plugin files. ([f651ed7](https://github.com/lowdefy/lowdefy/commit/f651ed7639181fb0a3db91706cb1c13950bfe654))
- Update aws and axios packages to use new plugin structure. ([f20cfef](https://github.com/lowdefy/lowdefy/commit/f20cfef49d696482ad1678b8dda4be8c85c6b55c))
