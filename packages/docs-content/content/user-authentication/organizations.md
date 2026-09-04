# Organizations &amp; Multi-Tenancy

Every Lowdefy app has organizations — always, even a single-team internal tool. A signed-in caller is a **member** of an organization, and it is the membership, not the user record, that carries the caller's app roles and per-organization attributes. This is the unit the whole auth system is built on: `_user.roles` is the active membership's roles, and the [tenant wall](#the-tenant-wall) scopes data to the active organization.

The single knob that decides how organizations behave is `auth.organizations.policy`.

## Two policies: `pinned` and `tenant`

```yaml
auth:
  organizations:
    policy: pinned   # or "tenant"
```

**`pinned`** *(the default)* — one organization for the whole deployment, ensured at startup. This is the shape for an internal app or a single-customer install: there is one workspace, everyone is a member of it, and the active organization is never switched. The organization plugin's per-organization routes (create, switch, self-service org management) are disabled.

**`tenant`** — organizations are created per user, and a caller can belong to several and switch between them. This is the shape for a multi-tenant SaaS: each customer is an organization, members are invited into it, and `SetActiveOrganization` moves the caller between the workspaces they belong to.

An app that sets nothing gets `pinned` with one auto-seeded organization, invite-only. The policy is not something you can leave to a default and change later without thought — it changes what `_user.organization_id` means, whether the tenant wall is active, and whether the MCP flow needs an [organization picker](/mcp-oauth). Choose it up front.

## The `organizations` keys

| Key | Type | Applies to | Default | Meaning |
| --- | ---- | ---------- | ------- | ------- |
| `policy` | `pinned` \| `tenant` | both | `pinned` | The organization model, above. |
| `org` | string | **pinned only** | `default` | The slug the deployment pins as the active organization. Under `pinned` the slug **is** the organization's id. |
| `signup` | `invite-only` \| `open` | both | `pinned` → `invite-only`, `tenant` → `open` | Whether uninvited sign-ups are admitted. `invite-only` refuses a sign-up with no invitation; `open` admits everyone. |
| `create` | `auto` \| `operator` | **tenant only** | `tenant` → `auto` | How a tenant organization comes into being: `auto` mints one for a user at first session; `operator` leaves creation to your own config (the `CreateOrganization` step). |
| `invitationExpiresIn` | integer (seconds, min 60) | both | `172800` (48h) | How long an invitation stays acceptable. Re-sending an invitation refreshes its expiry. |

The build cross-checks these, and the errors are worth knowing before you hit them:

- **`org` is required under `pinned`** and **rejected under `tenant`** — under `tenant` there is no single organization to pin; organizations are created per user.
- **`create` is rejected under `pinned`** — the active organization is ensured at startup, so there is nothing to create on demand.
- **Renaming `org` strands the existing membership.** The startup ensure is by slug, so changing `org` mints a *fresh* organization rather than renaming the old one, and every existing `member` row still points at the old id. Treat the pinned slug as permanent.

Defaults line up with intent: `pinned` defaults to a closed, invite-only internal app; `tenant` defaults to self-serve SaaS (`signup: open`, `create: auto`).

## The `owner` / `admin` / `member` tier vs app roles

A membership carries **two** independent role authorities, and keeping them apart is the whole point:

- **`_user.org_roles`** — the organization tier: `owner`, `admin`, or `member`. This is BetterAuth's administrative fact about the membership, and it is what the [auth-step authority floor](/auth-steps) checks. **No page or API gate reads it.**
- **`_user.roles`** — the app's own role strings, from the membership's `appRoles`. These are what [`auth.pages.roles` and `auth.api.roles`](/roles) match, and the only thing they match.

So an app that wants a page for organization administrators does **not** gate it on the `admin` tier — it gates on one of its own app roles, and lets the write authority answer the administration question separately, at the step. See [Roles](/roles) for page and API gating, and [Auth Steps](/auth-steps) for the administration model.

## Bootstrapping the first administrator

Nothing grants organization authority implicitly — not even to the first user. On a fresh `pinned` + `invite-only` deployment that is a closed loop: nobody can invite (inviting needs authority nobody holds) and nobody can sign up (the gate admits only members and pending invitees). Breaking the loop is a single invitation document inserted by hand into the `user-invitations` collection, seeded with the `owner` tier. The full recipe — the exact document, why the key must be `_id`, why the role must be `owner`, and how to deliver the accept link — is in the [Auth Upgrade guide](/auth-upgrade#bootstrapping-the-first-administrator).

## The tenant wall

Under `policy: tenant`, data must not leak across organizations. The **tenant wall** enforces that mechanically: a scoping-capable connection is filtered to the caller's active organization on every read and stamped with it on every write, without the request author writing a single filter clause. The wall is declared **on the connection**; requests, steps and websockets only declare *exceptions*.

### Declaring scope on a connection

Under `tenant`, a connection whose type implements the scoping contract (MongoDB does) is **scoped by default** — silence means scoped. You only ever declare the two exceptions:

```yaml
connections:
  # Scoped by default under tenant policy — nothing to declare.
  - id: app_data
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: records

  # Data deliberately shared across organizations (reference data,
  # a global catalogue) — opt out of scoping explicitly.
  - id: countries
    type: MongoDBCollection
    tenant: shared
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: countries

  # Scope on a field other than the default organization_id.
  - id: legacy_records
    type: MongoDBCollection
    tenant: tenant_id
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: legacy
```

`tenant` on a connection is either the string `shared` or the bare name of the top-level field that carries the tenant id (a non-empty name with no dots) — the same grammar [`collections.<name>.tenant`](/collections) uses. The default scoping field is `organization_id`. The v7 object form `tenant: { field: <name> }` still builds and warns (check slug `tenant-grammar`); it is removed in v9. There is deliberately **no `tenant: true`** — under `tenant` policy a capable connection is already scoped, so `true` would only restate the default; the build rejects it.

**Under `tenant` policy every connection type must declare its capability.** A connection whose type does not declare tenant support (`connectionMetas.tenant`) fails the build — no connection is ever *silently* unscoped. Connection plugins declare this in their `types.js`; you do not set it.

### Exceptions at the point of use

The wall scopes mechanically, but a few operations need an explicit opt-out or opt-in, declared on the request, step or websocket — never on the connection:

| Surface | Allowed values | Meaning |
| ------- | -------------- | ------- |
| Request | `none` | Opt this request out of scoping entirely. |
| Request | `authored` | The request authors its own tenant clause (audited at runtime). |
| Websocket | `none` | Opt out. `authored` is not allowed — change streams are always scoped mechanically. |

**`tenant: none` on a request or step is deprecated in v8 and is removed in v9.** Every declaration emits a build warning (check slug `tenant-none-deprecated`) naming `runAs` as its replacement. `tenant: none` on a **websocket** is not deprecated: a change stream has no `runAs` form, so it stays the only opt-out there.

**Prefer `runAs` over `tenant: none` for caller-less chains.** A scheduled job, a detached call, a webhook or an auth hook runs with no session, so a walled step fails closed for it. Switching the wall off with `tenant: none` and hand-writing the organization clause into every filter and document is unscoped access by construction. If the routine knows which organization it is processing, declare it with [`runAs`](#running-a-routine-as-an-organization-runas) and keep the wall on.

**`tenant: none` is flagged in dev.** An unscoped read looks exactly like a scoped one, so `lowdefy dev` records every execution of a `tenant: none` request, step or websocket — the browser error bar shows them as `unscoped reads (N)` on an amber bar with the `file:line` of each declaration, and `lowdefy_build_status` (`GET /lowdefy-docs/build-status`) lists them under `devNotices`. They are notices, not errors: the request still runs, and production emits nothing. Review each one before shipping.

An aggregation stage the wall cannot scope mechanically — `$search`, `$searchMeta`, `$vectorSearch`, `$geoNear`, `$graphLookup` — must declare `tenant: authored` and author the organization clause *inside the stage*. The runtime audits that clause against the caller's active organization; it does not trust the declaration alone.

**See what the wall did with `explain: true`.** The rewritten pipeline exists only inside the request resolver, so in dev the agent tools expose it: `lowdefy_run_request` / `lowdefy_run_endpoint` (and `POST /lowdefy-docs/run-request` / `run-endpoint`) with `explain: true` return the caller, the connection's tenant verdict, the properties after operator evaluation, the effective query the driver received, and a `rewritten` list naming every clause the wall injected (`{ at: '$lookup[1].pipeline', injected: { $match: { organization_id: 'org_1' } } }`) or audited (`{ at: '$search[0]', audited: true }`). When a walled request returns `[]` unexpectedly, run it with `explain: true` before changing config. See [AI agent docs](/ai-agent-docs#explaining-a-request-explain-true).

**Joining a shared collection from a scoped pipeline is a build error.** The wall prepends its tenant `$match` into *every* `$lookup` / `$unionWith` sub-pipeline, and a `tenant: shared` collection carries no tenant field, so such a join can only ever return `[]`. The build knows which collection each connection names, so a literal pipeline on a scoped connection whose `$lookup.from`, `$unionWith` or `$graphLookup.from` names a collection belonging to a `tenant: shared` connection fails the build (check slug `tenant-lookup`). Either run the pipeline on the shared connection and pass the organization facts in through the request payload, or declare `tenant: authored` and author the organization clause yourself — `authored` on its own does not exempt `$lookup` sub-pipelines.

```yaml
# A $search aggregation on a scoped connection: author the org filter
# inside the stage and declare it.
id: search_records
type: MongoDBAggregation
connectionId: app_data
tenant: authored
properties:
  pipeline:
    - $search:
        compound:
          filter:
            - equals:
                path: organization_id
                value:
                  _user: organization_id
          must:
            - text:
                query:
                  _payload: q
                path: title
```

### Running a routine as an organization (`runAs`)

`runAs: { organizationId }` on an `Api` endpoint, or on a single request step, makes the wall run **scoped to that organization** instead of to the caller's. Filters are injected and writes are stamped exactly as they are for a signed-in member of that organization — the same code path, nothing switched off.

```yaml
api:
  - id: process_job
    type: Api
    schedules:
      - cron: '*/5 * * * *'
    routine:
      # The job row knows which organization it belongs to. This one
      # read runs outside the wall to find it.
      - id: job
        type: MongoDBFindOne
        connectionId: jobs
        tenant: none
        properties:
          query: { status: pending }
      # Every step from here runs as that organization: reads are
      # filtered to it, and the written row is stamped with it.
      - id: records
        type: MongoDBFind
        connectionId: app_data
        runAs:
          organizationId:
            _step: job.organization_id
        properties:
          query: { archived: false }
      - id: result
        type: MongoDBInsertOne
        connectionId: results
        runAs:
          organizationId:
            _step: job.organization_id
        properties:
          doc:
            jobId:
              _step: job._id
            count:
              _get:
                key: length
                from:
                  _step: records
```

- **Endpoint position** — `runAs` on the endpoint scopes every walled step of the run. It is evaluated once against the fresh routine context, so it can read `_user`, `_secret`, an `_env`-style value or a literal, but not a step result.
- **Step position** — `runAs` on a request step overrides the endpoint's scope for that step, and is evaluated as the routine stands at that step, so `_step` reads the results before it.
- **Every transport** — the endpoint's declaration is honoured when it is called from a page, scheduled, dispatched with `detached: true`, hit as a webhook, or called through `CallApi`. A `CallApi` child runs under *its own* declaration; the parent's scope does not flow into it.
- **`organizationId` may not come from `_payload` or `_state`.** A browser or an API client controls the payload and the page state, so any caller could name another organization and read its rows. The build refuses both, anywhere in the value — inside a `_js` argument or an `_if` branch included. Derive the organization from a previous step (`_step`), from the caller (`_user`), or from a secret or environment value.
- **`runAs` and `tenant: none` on the same step is a build error** — one scopes the step to an organization, the other switches the wall off. A step under an endpoint-level `runAs` may still declare `tenant: none` on its own to opt that one step out (as `job` does above).
- **Only the wall's scope moves.** `runAs` does not change the caller: authorization, roles, `_user` and logging still describe the real caller, so an endpoint cannot use `runAs` to gain access it was refused.
- A `runAs` whose value evaluates to anything but a non-empty string is a `ConfigError` on the step, pointing at the `runAs` line — never the caller-less `AuthenticationError`.

**`runAs` is flagged in dev.** Like `tenant: none`, a scoped run is indistinguishable from a member's request, so `lowdefy dev` records every step that ran under a `runAs` scope: the error bar shows them as `scoped runs (N)` beside the unscoped reads, and `lowdefy_build_status` lists them under `devNotices` with name `RunAsScope`.

### Audits

The wall enforces itself at runtime, and the build reads the config to catch the mistakes it can see coming. Every audit below reports under the check slug `tenant`, names the request or step, the connection, the tenant field and the fix, and points at the line that declared it. F1 fails `lowdefy build`; F2–F4 and the inventory run under [`lowdefy check`](/cli#check) only, so a build stays fast and a CI check reads the full picture.

| Rule | What it catches | Reported by |
| ---- | --------------- | ----------- |
| **F1** authored tenant field | A scoped request or step (no `tenant:` sentinel) that sets the connection's tenant field itself, anywhere in its filter, query, update or document. The wall injects the field and refuses an authored value at runtime, so the clause can only ever break the request. Remove it. | `build` and `check` |
| **F2** `tenant: none` without the field | A `tenant: none` request or step whose properties never mention the tenant field. Nothing scopes it — it reads (or writes) every organization's rows. Scope the endpoint with `runAs: { organizationId: … }`, or author the clause. | `check` |
| **F3** `tenant: none` from the caller | A `tenant: none` request or step whose tenant value comes from `_payload` or `_state`. The caller controls both, so any caller can name any organization. Derive the value from a previous step (`_step`) or the caller's own record (`_user`), or scope with `runAs`. | `check` |
| **F4** `tenant: none` unstamped write | A `tenant: none` insert (`MongoDBInsertOne`, `MongoDBInsertMany`, `MongoDBInsertConsecutiveId`, `MongoDBInsertManyConsecutiveIds`) or upsert (`MongoDBUpdateOne`, `MongoDBUpdateMany`, `MongoDBVersionedUpdateOne` with `options.upsert: true`) whose written document has no tenant field at its top level. The row would belong to no organization and no walled read would ever return it. Add the field, or scope with `runAs`. | `check` |
| **R1** unscoped inventory | One warning for every `tenant: none` request and step — the record of where the wall is off. There is no reason field and no allowlist: `runAs: { organizationId: … }` keeps the wall on and is the preferred fix. | `check` |

The audits read **literal config only**. Request properties are evaluated by operators at runtime, so a filter, value or document composed by an operator (`_if`, `_step`, `_object.assign`, …) is invisible to a static walk; such a site is skipped rather than guessed at, and the runtime wall remains the contract. To silence an audit on a node you have reviewed, add `~ignoreBuildChecks: [tenant]` to that request or step (or to an enclosing node — suppression covers descendants). Prefer fixing the site: the inventory is meant to shrink.

### Why the wall lives on the connection

Putting scope on the connection, and only exceptions at the point of use, means the default is safe: a developer who forgets to think about tenancy gets a scoped read and a stamped write, not a leak. The dangerous states — sharing across organizations, opting a request out, authoring a raw clause — are the ones that have to be typed out, reviewed in a diff, and (for `authored`) audited at runtime. This inverts the usual footgun where the safe path is the verbose one.

Under `policy: pinned` the wall is inert — there is one organization, so scoping to it is a no-op — but declaring `tenant` on connections does no harm, which lets one config serve both a pinned install and a tenant deployment.
