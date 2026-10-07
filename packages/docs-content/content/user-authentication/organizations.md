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
| `membershipLimit` | integer (min 1) | both | `1000000` (effectively open) | The most members one organization may have. Once an organization has this many, accepting an invitation and adding a member are refused (a 403). Set it to cap organization size, for example per tenant. It is also the default page size of `ListMembers` when no `limit` is given. |

The build cross-checks these, and the errors are worth knowing before you hit them:

- **`org` is required under `pinned`** and **rejected under `tenant`** — under `tenant` there is no single organization to pin; organizations are created per user.
- **`create` is rejected under `pinned`** — the active organization is ensured at startup, so there is nothing to create on demand.
- **Renaming `org` strands the existing membership.** The startup ensure is by slug, so changing `org` mints a *fresh* organization rather than renaming the old one, and every existing `member` row still points at the old id. Treat the pinned slug as permanent.

Defaults line up with intent: `pinned` defaults to a closed, invite-only internal app; `tenant` defaults to self-serve SaaS (`signup: open`, `create: auto`).

### The organization `create: auto` mints

Under `tenant` with `create: auto`, the first session of a user who has no membership and no pending invitation mints the user's own organization, with the user as its `owner`, slugged `org-<userId>`. A user who later leaves their last organization gets a fresh one at their next session (`org-<userId>-2`, then `-3` and on). An organization the user was ever a member of is never handed back to them, even after every member has left it, so its data and pending invitations stay with it.

The mint is safe when the same user signs in from two tabs at once or submits twice: exactly one organization and one `owner` membership are written. It relies on two unique indexes in the auth database, which the server creates at startup (and checks again before it mints):

```js
db['user-organizations'].createIndex({ slug: 1 }, { unique: true })
db['user-members'].createIndex({ user_id: 1, organization_id: 1 }, { unique: true })
```

An equivalent unique index you created yourself, under any name, is accepted. If the auth database user may not create indexes, or the collections already hold duplicate rows, the server logs an error naming the index, and a sign-in that needs a new organization is refused with status 503 and the code `ORGANIZATION_SETUP_UNAVAILABLE` (existing members sign in as usual). The server tries again at most every 30 seconds while such sign-ins arrive, so removing the duplicates or creating the indexes by hand recovers without a restart.

### Invitations for existing members

An invitation is how someone joins an organization, never how a membership changes. Accepting an invitation into an organization you already belong to (you joined another way after it was sent) succeeds and marks the invitation accepted, but leaves your membership exactly as it is: the invitation's role, app roles and attributes are not applied, and no second membership is written. If your session had no active organization, the accepted organization becomes active. To change an existing membership, use the [auth steps](/auth-steps) (`UpdateMemberOrgRole`, `UpdateMemberRoles`, `UpdateMemberAttributes`), which check the caller's authority at the time of the change.

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
    tenant:
      field: tenant_id
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: legacy
```

`tenant` on a connection is either the string `shared` or `{ field: <name> }` (a non-empty name with no dots). The default scoping field is `organization_id`. There is deliberately **no `tenant: true`** — under `tenant` policy a capable connection is already scoped, so `true` would only restate the default; the build rejects it.

**A shared connection's change log must not write into a walled collection.** A `tenant: shared` connection's writes belong to no organization, so its `changeLog` records carry no `organization_id`. In a collection a scoped connection reads, those records would be invisible to every walled read and would make the tenant preflight refuse to serve the app, so the build rejects a shared connection whose `changeLog.collection` is the collection of a scoped connection in the same database. Give shared connections their own change-log collection.

**A shared connection over a walled collection has its writes checked.** When a `tenant: shared` connection names the same collection, in the same database, as a scoped connection, the build marks it, and every row it inserts, replaces, upserts or updates must keep a non-empty `organization_id`: inserted and replacement documents must carry it, upserts must author it (`$set` / `$setOnInsert`, or an equality match in the filter), and updates may not null, unset, rename or otherwise overwrite it with a value the wall can not verify. Its reads stay unscoped, which is what `shared` is for. A collection name resolved at runtime (`_secret`, `_payload`) can not be compared at build time, so such a connection is not marked.

**A shared connection's aggregation may not `$out` or `$merge` into a walled collection.** The rows an aggregation writes are not checked, so the build rejects a request or step on a `tenant: shared` connection whose literal pipeline writes, with `$out` or `$merge`, into a collection a scoped connection reads in the same database. Return the documents and write them with `MongoDBInsertMany` or `MongoDBBulkWrite`, which check every row. A target named by an operator, or in another database, is not checked at build time.

**Under `tenant` policy every connection type must declare its capability.** A connection whose type does not declare tenant support (`connectionMetas.tenant`) fails the build — no connection is ever *silently* unscoped. Connection plugins declare this in their `types.js`; you do not set it.

### Exceptions at the point of use

The wall scopes mechanically, but a few operations need an explicit opt-out or opt-in, declared on the request, step or websocket — never on the connection:

| Surface | Allowed values | Meaning |
| ------- | -------------- | ------- |
| Request | `none` | Read rows of every organization. The request may only read (see below). |
| Request | `authored` | The request authors its own tenant clause (audited at runtime). |
| Websocket | `none` | Watch rows of every organization. `authored` is not allowed — change streams are always scoped mechanically. |

An aggregation stage the wall cannot scope mechanically — `$search`, `$searchMeta`, `$vectorSearch`, `$geoNear`, `$graphLookup` — must declare `tenant: authored` and author the organization clause *inside the stage*. The runtime audits that clause against the caller's active organization; it does not trust the declaration alone.

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

### `tenant: none` only reads

`tenant: none` lifts the filter, so a request can read rows of every organization: enumerate the organizations to fan out over, or count across tenants. It never writes. A request or step with `tenant: none` whose type writes (`MongoDBInsertOne`, `MongoDBUpdateMany`, `MongoDBBulkWrite`, the table and enrichment writes, and the rest) fails the build on a scoped connection, and the same write is refused at runtime. An aggregation under `tenant: none` may not contain `$out` or `$merge`, since they write its output into a collection.

To write, do the work as one organization: call an endpoint with a `CallApi` step that names the `organization` (see [Background work in one organization](#background-work-in-one-organization)). Its requests run with the wall on, so every write is filtered and stamped with that organization.

**Rollups across organizations** — group walled rows by organization and save the totals, typically from a scheduled endpoint — read with `tenant: none`, then save each organization's totals as that organization:

```yaml
# The scheduled endpoint: one read across organizations, one call per organization.
routine:
  - id: rollup
    type: MongoDBAggregation
    connectionId: orders
    tenant: none
    properties:
      pipeline:
        - $group:
            _id:
              organization_id: $organization_id
              month:
                $dateToString:
                  format: '%Y-%m'
                  date: $created_at
            total:
              $sum: $amount
        - $group:
            _id: $_id.organization_id
            totals:
              $push:
                month: $_id.month
                total: $total
  - :for: organization
    :in:
      _step: rollup
    :do:
      - id: save
        type: CallApi
        properties:
          endpointId: save_monthly_totals
          organization:
            _item: organization._id
          payload:
            totals:
              _item: organization.totals
```

```yaml
# save_monthly_totals: runs bound to one organization, so the scoped
# monthly_totals connection filters and stamps every write with it.
routine:
  - id: save_totals
    type: MongoDBBulkWrite
    connectionId: monthly_totals
    properties:
      operations:
        _array.map:
          - _payload: totals
          - _function:
              replaceOne:
                filter:
                  month:
                    __args: 0.month
                replacement:
                  __args: 0
                upsert: true
```

Each organization reads its own totals through the scoped `monthly_totals` connection.

### Background work in one organization

A scheduled run, an auth hook or a verified webhook has no caller, so it has no organization, and a walled request in it fails closed. To do one organization's work from such a run, call the endpoint that does it with a `CallApi` step that names the `organization`, and optionally a stand-in `caller`:

```yaml
- id: sweep
  type: CallApi
  properties:
    endpointId: send_reminders
    organization:
      _item: organization_id
    caller:
      id: reminders
      name: Reminders
```

The called endpoint runs bound to that organization: its walled requests are filtered and stamped with it, with the wall on, and `_user` is `{ id, name, organization_id, system: true }` (or null without `caller`), so routines that stamp writes with the caller run unchanged. This is how a caller-less run writes: `tenant: none` only reads. Only a trusted system run may bind; a signed-in caller can not name another organization. See [Running in One Organization](/lowdefy-api#running-in-one-organization).

### Why the wall lives on the connection

Putting scope on the connection, and only exceptions at the point of use, means the default is safe: a developer who forgets to think about tenancy gets a scoped read and a stamped write, not a leak. The dangerous states — sharing across organizations, opting a request out, authoring a raw clause — are the ones that have to be typed out, reviewed in a diff, and (for `authored`) audited at runtime. This inverts the usual footgun where the safe path is the verbose one.

Under `policy: pinned` the wall is inert — there is one organization, so scoping to it is a no-op — but declaring `tenant` on connections does no harm, which lets one config serve both a pinned install and a tenant deployment.
