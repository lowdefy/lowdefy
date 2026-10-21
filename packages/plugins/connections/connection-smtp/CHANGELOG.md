# @lowdefy/connection-smtp

## 7.1.0

### Patch Changes

- 7274ca1: fix: Long crafted recipient addresses no longer stall the server in the SMTP and SendGridMail connections.

  Reading recipient addresses used regular expressions that slow down with the square of the input length, so a recipient of a few hundred kilobytes (for example an email address a user typed into a form) could block the server for seconds to minutes. Recipients are now read in linear time, with the same results.

  - @lowdefy/helpers@7.1.0

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

- chore: Update `nodemailer` to 10.0.13 in `connection-smtp` and `markdown-it` to 14.3.1 in `email-templates`.
- 1d547f3: The SMTP and SendGridMail connections now drop every recipient on the reserved `.invalid` domain (the domain `invalid` and any `*.invalid`, which RFC 6761 says never resolve) before the delivery filter runs. Case is ignored. Surrounding spaces and a trailing dot are ignored too. They are removed from `to`, `cc` and `bcc` on every send, in every environment, with no filter and with `filter: false`, and for auth emails too.

  Before, a `replaceAddress` catch-all redirected mail for test users (`user@audit.invalid`, say) into the team's inbox, so apps had to skip email for test users themselves. Now only the `.invalid` addresses are dropped and every other recipient still gets the mail:

  - SMTP checks each address in a comma-separated string on its own and keeps the others. SendGrid reads a string as one address, so it drops a comma-separated string only when every address in it is on `.invalid`.
  - When every `to` recipient is on `.invalid`, the remaining `cc` and `bcc` recipients still get the mail. SMTP sends it without a To header; SendGrid, which needs a `to` recipient, sends each of them their own copy.
  - When no recipient is left, nothing is sent and the send reports `{ messageId: null, to: null, filtered: true }`, as a fully filtered message does. Otherwise `replaceAddress`, `allowlist` and `regex` apply to the remaining recipients as before.

  Use `.invalid` for test users that must never receive mail, and `example.com` or `.test` for journey users whose mail a journey reads from the dev server's SMTP catcher.

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

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Minor Changes

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

- 9214aa3: feat: Mail send requests return per-message send results

  `SendGridMailSend` and `SMTPMailSend` now return a `results` array with one entry per message sent, so routines can record delivery outcomes:

  - Each result includes the post-filter `to` — the address mail was actually delivered to after the connection `filter` (`replaceAddress`, `allowlist`, `regex`) is applied. When a filter redirects mail to a test inbox, routines can now persist both the intended recipient and where the message really went.
  - Messages dropped entirely by the filter return `{ messageId: null, to: null, filtered: true }`.
  - `SendGridMailSend` previously discarded send results and returned only a response string; it now returns `results` with the SendGrid `messageId` per message, matching `SMTPMailSend`.
  - `SMTPMailSend` results keep nodemailer's `accepted` and `rejected` alongside the new `to`.

### Patch Changes

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0
