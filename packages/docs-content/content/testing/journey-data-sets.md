# Journey Data Sets

A **data set** gives [config test journeys](/config-tests) a database of their own. You declare test data, and the people journeys act as, in `tests/data/<name>.yaml`. A journey that names the data set with `data:` runs against a fresh in-memory MongoDB database loaded with that data. Journeys on a data set may write freely: every run starts from the same data, and the developer's own database is never touched.

```yaml
- name: member assigns an open ticket to a teammate
  pageId: tickets
  data: staging-sample
  user: member
  steps:
    - click: { blockId: tickets_grid, containing: t-empty-title, column: assignee }
    - select: { blockId: assignee, value: Grace Hopper }
    - as: outsider
    - goto: tickets
    - expect: { text: { blockId: tickets_grid, contains: No tickets } }
```

Without `data:`, a journey runs exactly as before, against whatever database the app's connections point at.

## Data set files

A data set is a plain YAML file in `tests/data/` under the config directory. The file name is the data set's name: lowercase letters, digits, `-` and `_`.

```yaml
# tests/data/staging-sample.yaml
snapshot: # optional; filled by `lowdefy data pull staging-sample`
  from: staging # a config.environments name
  connections: # exactly the connections to copy
    - tickets
    - companies
    - { id: frameworks, scope: false, limit: 20000 }
    - { id: connections, sort: { created_at: -1 }, omit: [auth.encrypted] }
  scope: # applied to each collection that has the field
    field: organizationId
    values: [org_b, org_c]
  limit: 5000 # per collection; default 5000
fixtures: # committed documents, keyed by connection id
  tickets:
    - { _id: t-empty-title, organizationId: org_a, title: '', status: open }
  organizations:
    - { _id: org_a, name: Acme Test Co }
indexes: # optional, keyed by connection id, in the listIndexes() shape
  tickets:
    - { key: { organizationId: 1, number: 1 }, unique: true }
users: # the people journeys act as
  owner: { id: u_1, roles: [admin], organizationId: org_a }
  member: { id: u_2, roles: [member], organizationId: org_a }
  outsider: { id: u_9, roles: [admin], organizationId: org_b }
```

A fixtures-only data set needs no snapshot, and is fully committed and hermetic:

```yaml
# tests/data/empty-org.yaml
fixtures:
  organizations: [{ _id: org_new, name: New Co }]
users:
  owner: { id: u_new, roles: [admin], organizationId: org_new }
```

| Key        | Description                                                                                                                                                                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixtures` | Documents to load, keyed by connection id. Dates use the serializer's `{ "~d": "2026-01-02T00:00:00.000Z" }` marker and ObjectIds use `{ _oid: '<hex>' }`. A fixture with an `_id` replaces any snapshot document with that `_id`; one without is inserted.                                                                                               |
| `users`    | The people journeys act as, keyed by name. Each is an inline user object, the shape a journey's inline `user:` takes. They are injected callers and carry no credentials: `password` is refused.                                                                                                                                                          |
| `indexes`  | Indexes to create, keyed by connection id, in the shape MongoDB's `listIndexes()` returns: `key`, an optional `name`, and any other option (`unique`, `sparse`, `partialFilterExpression`, `collation`, `weights`, …), passed to `createIndexes` as given. `v` and `ns` are refused. An entry whose `key` equals a snapshot's recorded index replaces it. |
| `snapshot` | Where `lowdefy data pull` copies a snapshot from, and what it copies. See [Pulling a snapshot](#pulling-a-snapshot).                                                                                                                                                                                                                                      |

Rules, checked before any browser opens:

- **Plain YAML.** No `_ref` and no operators: a data set is test input, not app config.
- **Connections.** Every connection id in `fixtures`, `indexes` and `snapshot.connections` must be a `MongoDBCollection` connection whose `collection` is a literal string, and whose `databaseName` is a literal string or not set. Two connections that name one collection load into it together.
- **One database.** Under a data set every redirected connection reads one database. Two connections that name the same collection in different databases (a different `databaseName` or `databaseUri` secret) would share one collection. When the data set names either of them, the journey is refused. When it names neither, the result carries a warning. A connection whose `collection` is computed per request cannot be checked.
- **Indexes first.** Each collection's indexes are created before any document is loaded, so a fixture that breaks a unique index fails the load and names the fixture, the index and the duplicate key. A TTL index is loaded as a plain index, so old fixture dates are never deleted mid-run.

## Named users and `as`

`user:` takes two more forms on a data set journey: the name of one of the data set's users, or a list of them.

| `user`           | The journey acts as                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| left out         | the default roleless headless user                                                                       |
| an object        | that inline user                                                                                         |
| `none`           | nobody: the journey signs in through the app (refused on a data set while auth is configured, see below) |
| any other string | that data set user, e.g. `user: member`                                                                  |
| a list of names  | each of those data set users in turn, e.g. `user: [admin, member]` (see below)                           |

`as: <name>` switches to another person with their own browser. When the name is a user of the journey's data set, that actor acts as that user. Any other name opens as the journey's `user`, as before. So a two-person journey (`owner` invites, `outsider` must not see the tenant's rows) needs no sign-in at all.

A user name with no `data:`, or a name the data set does not declare, fails before a browser opens.

## One journey, several users

When several roles are promised the same flow, list their users rather than copying the journey once per role:

```yaml
name: edits a ticket
pageId: ticket
data: tickets
user: [admin, member]
steps:
  - click: edit_button
  # ...
```

`lowdefy test` and `lowdefy_run_tests` run the journey once as each user, each in a fresh database of its own, and report each run on its own line as `<name> [<user>]`:

```
PASS  edits a ticket [admin]  (6 steps, 2310ms)
FAIL  edits a ticket [member]
```

`--filter` matches that name, so `lowdefy test --filter "[member]"` runs only the member's run, and a full-suite recording and coverage see each user's run apart. `--repeat` repeats each run. Lints read the journey once.

- A list holds data set user names only, needs `data:`, and names each user once. `none` and inline user objects stay single values.
- `as:` steps work as before: the journey's first actor, `main`, is the run's user, and any other `as:` name that is a data set user opens as that user.
- A role that must be refused (it lands on `/404`, or the feature is hidden) expects a different outcome, so it is a journey of its own, not another user in the list.

## The fixture rule

A snapshot is pulled by each developer at a different time, from a database others keep editing. A journey that selects a snapshot record by its name passes on one pull and fails on the next. So, on a data set with a snapshot:

- Every value a journey types, selects, clicks by text, puts in `urlQuery` or `pathParams` (the values of a [page path](/page-paths)'s placeholders) or asserts comes from the data set's `fixtures` or `users`, or is UI text from the app's config (labels, titles, options). The snapshot supplies volume, realistic shapes and neighbouring records, never a value a journey depends on.
- Target grid rows with `containing: <fixture value>`, never a bare `row: N`. A state path with an array index, such as `locations.0.path`, has the same problem: assert it only on a list the fixtures own outright, or assert by text.
- Scope the snapshot away from the fixture tenant. Let the fixtures own one organization completely, and let the snapshot bring other organizations plus the shared content the app reads across them.

Fixture records are test data written for the journey: never rows copied with credentials, tokens or external ids intact.

## Pulling a snapshot

```
infisical run --env=staging -- lowdefy data pull staging-sample
```

`lowdefy data pull <name>` builds the app as the `from` environment and copies a scoped, capped snapshot of exactly the connections `snapshot.connections` lists into `.lowdefy/data/<name>/`, with their indexes. Run it with that environment's secrets. `.lowdefy/` is gitignored, so snapshots never reach git. A failed pull leaves the previous snapshot in place.

**The source must opt in.** A pull reads only from an environment that sets `dataPull: true`, and refuses every other environment before it reads any secret. The refusal names the line to add. Set it only on pre-production environments: nothing else marks an environment as production, so the opt-in is what keeps production rows off developer machines. See [Deployment environments](/deployment-environments).

```yaml
config:
  environments:
    staging:
      dataPull: true
      guards:
        secrets:
          MONGODB_URI: 'acme-staging\.a1b2c\.mongodb\.net'
    prod:
      guards:
        secrets:
          MONGODB_URI: 'acme-prod\.a1b2c\.mongodb\.net'
```

**The guard.** The pull then proves which database it reads with the environments' own `guards.secrets` pins. For each listed connection:

- `databaseUri` must be a `_secret`; a literal URI or any other operator is refused.
- The `from` environment must pin a guard for that secret.
- The secret's value must match the `from` environment's pin.
- It must not match any other environment's pin for that secret, when that pin differs from `from`'s.

Messages name the secret and the environment, never the value.

**What is copied.** Only the connections `snapshot.connections` lists: a collection is copied because someone named it. Per collection, `scope` applies only when the collection has the field. Documents are sorted by `_id` descending unless `sort` is set, and capped at `limit`. An entry can override `scope` (`false` to copy across scopes), `limit`, `sort` and `omit`.

- List what journeys need for volume and neighbours.
- Leave out collections that hold only credentials: sessions, OAuth accounts, API keys.
- Use `omit:` for credentials and tokens kept inside documents, such as `omit: [auth.encrypted, tokens]`. Omitted fields are left out by the database query, so they never leave the database.

**Freshness.** `lowdefy test` prints the data set once per run, as `data staging-sample: snapshot 3 days old, 41,212 documents`. Past 14 days it is printed as a warning naming the pull command. It never fails the run. A data set with a `snapshot` block and no pulled snapshot fails every journey that names it, with the pull command. When the `snapshot` block has changed since the pull, the result warns you to pull again.

`lowdefy data list` prints each data set: fixtures only, or the snapshot's source, when it was pulled, its age and document count, and whether the `snapshot` block still matches the pull.

## How a journey reaches its database

A data set journey runs on the running dev server, beside your own browser tabs:

1. The dev server starts one in-memory MongoDB replica set the first time a data set journey runs, on a free port from 49152 up so it never holds a port one of your apps needs. It stops, and its files are removed, when the dev server stops; if it dies, the journey that finds it fails and the next one starts a new store. The first run downloads the MongoDB binary once (`Downloading MongoDB <version> for journey data sets (once).`). Set `MONGOMS_VERSION` to match your cluster's MongoDB version.
2. Each journey run gets a fresh database on it, loaded with the snapshot, then the fixtures. Runs never see each other's writes, so an agent's journey can run alongside `lowdefy test`.
3. Every browser the journey opens carries a cookie that only the dev server's own headless browser can produce. Requests with it read the run's database. Your own tabs carry no such cookie and keep using your real database on the same server.
4. When the journey ends, its browsers close, the dev server waits up to 30 seconds for background work the journey started (detached `CallApi` calls, background endpoint work), and then drops the database.

**What is redirected:** every connection read under a data set journey goes through one check, for requests, endpoint routines, background and detached endpoint calls, websocket change stream sources, and module connections alike. The check reads the connection type's `meta.dataSet` declaration:

- `redirect`: the run's database URI and name are merged over the connection's `properties`, whether or not the data set lists the connection. Core `MongoDBCollection` declares it.
- `external`: the type reaches an outside service, not your app's data, and keeps its real target. Core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, `AIGateway`, `Anthropic`, `OpenAI`, `Google`, `Mcp` and `TregConnection` declare it.
- No declaration: the journey fails with `Connection "<id>" (type <type>) cannot run under data set "<name>": its type does not say how to redirect it.` Core `Knex`, `Redis`, `Elasticsearch`, `GoogleSheet`, `TestConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket` refuse, and so does any plugin type that has not declared.

A `redirect` connection whose whole `properties` is an operator (a top-level key starting with `_`, such as `_if` or `_ref` evaluated at runtime) also refuses, because the check cannot see what it evaluates to. Operators inside the properties are fine: `databaseUri: { _secret: MONGODB_URI }` is replaced by the run's URI before any operator runs.

The browsers a data set journey opens stay on one host of the dev server. A request to the dev server's port on another host (`127.0.0.1` when the journey opened `localhost`, `[::1]`, a LAN address) would carry no data set cookie, so it is stopped in the browser and the step fails with `Journey left its origin <origin> for <url>; a data set journey must stay on one host of the dev server.` Requests to other ports and other sites are untouched.

**What is not redirected:**

- Connection types declared `external` (HTTP APIs, email, payments, AI providers, MCP) keep their real targets.
- Code that reads a database URI from anywhere but its connection's `properties`, such as a secret or environment variable read directly. A plugin type that declares `redirect` and does this breaks its declaration.
- The auth engine. Data set journeys never reach it: their requests carry injected users, and `/api/auth/*` answers 404 for them.
- Atlas Search (`$search`, `$vectorSearch`): pages whose requests use it fail on the in-memory database, which has no search engine.

### Plugin connection types

A plugin connection type runs under a data set journey only when it declares `meta.dataSet` on its connection export:

```js
export default {
  schema,
  meta: { dataSet: 'redirect' },
  requests: { MyStoreFind, MyStoreInsert },
};
```

Declare `redirect` only when the type takes its database from `properties.databaseUri` and `properties.databaseName` and nothing else. It must honour `databaseName`, as `MongoDBCollection` does, and key any client it keeps between requests by the URI it is given, never by connection id alone: a client cached by connection id keeps the database it first opened, which can be your real one. Declare `external` only for a type that reaches an outside service and holds none of your app's data. Leave it undeclared for any other data store: data set journeys that use it are refused rather than run against your real data.

## Auth journeys stay on their harness

Data set users are injected callers. A journey that signs up or signs in through the app's own auth is an auth journey, and stays off data sets: run it against a test database as described under [The database](/config-tests#the-database). Two combinations are refused rather than run silently wrong:

- `user: none` on a data set journey while auth is configured. A signed-out actor's sign-in would write sessions to the app's real auth database while its requests read the data set.
- Any data set journey while `auth.dev.mockUser` (or `LOWDEFY_DEV_USER`) is active. The mock user wins over the injected user, so the journey would act as someone outside the data set.

## Agents

The `lowdefy_run_journey` MCP tool takes `data` and the name and list forms of `user`, the same as the journey file, and returns the data set the journey ran on with its result. With a list it runs once as each user and returns `{ passed, runs: [{ user, ... }] }`, `passed` only when every run passed. `lowdefy_run_tests` and `lowdefy test --url` run data set journeys like any other, because the dev server they target does the loading.
