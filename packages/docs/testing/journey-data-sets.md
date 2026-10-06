A **data set** gives [config test journeys](/config-tests) a database of their own. You declare test data, and the people journeys act as, in `tests/data/<name>.yaml`. Everything a data set loads is committed, so every machine runs a journey on the same data. A journey that names the data set with `data:` runs against a fresh in-memory MongoDB database loaded with that data. Journeys on a data set may write freely: every run starts from the same data, and the developer's own database is never touched.

```yaml
- name: member assigns an open ticket to a teammate
  pageId: tickets
  data: tickets
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
# tests/data/tickets.yaml
fixtures: # committed documents, keyed by connection id
  tickets:
    - { _id: t-empty-title, organizationId: org_a, title: '', status: open }
  organizations:
    - { _id: org_a, name: Acme Test Co }
generate: # optional: seeded background documents, the same on every machine
  seed: 7
  tickets:
    count: 200
    fields:
      organizationId: org_b
      title: { text: { words: [3, 8] } }
      status: { oneOf: [open, pending, closed], weights: [3, 1, 6] }
indexes: # optional, keyed by connection id, in the listIndexes() shape
  tickets:
    - { key: { organizationId: 1, number: 1 }, unique: true }
users: # the people journeys act as
  owner: { id: u_1, roles: [admin], organizationId: org_a }
  member: { id: u_2, roles: [member], organizationId: org_a }
  outsider: { id: u_9, roles: [admin], organizationId: org_b }
```

A data set can be as small as one organization and its owner:

```yaml
# tests/data/empty-org.yaml
fixtures:
  organizations: [{ _id: org_new, name: New Co }]
users:
  owner: { id: u_new, roles: [admin], organizationId: org_new }
```

| Key        | Description                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixtures` | Documents to load, keyed by connection id. Dates use the serializer's `{ "~d": "2026-01-02T00:00:00.000Z" }` marker and ObjectIds use `{ _oid: '<hex>' }`. A fixture with an `_id` replaces any earlier document with that `_id`; one without is inserted.                                                                                         |
| `generate` | Documents made from a small spec with a fixed seed, keyed by connection id like `fixtures`. See [Generated documents](#generated-documents).                                                                                                                                                                                                       |
| `users`    | The people journeys act as, keyed by name. Each is an inline user object, the shape a journey's inline `user:` takes. They are injected callers and carry no credentials: `password` is refused.                                                                                                                                                   |
| `indexes`  | Indexes to create, keyed by connection id, in the shape MongoDB's `listIndexes()` returns: `key`, an optional `name`, and any other option (`unique`, `sparse`, `partialFilterExpression`, `collation`, `weights`, …), passed to `createIndexes` as given. `v` and `ns` are refused. Two connections that load one collection merge their indexes. |

## Generated documents

`generate` gives a data set volume and realistic neighbours without copying a real database: a list page with 400 invoices, a search over many customers, a report over months of dates. A `seed` makes the output identical on every machine and every run; change it to get a different, equally fixed set.

```yaml
generate:
  seed: 7
  customers_db:
    count: 50
    fields:
      name: { company: true }
  invoices_db:
    count: 400
    fields:
      _id: { sequence: { prefix: inv-, start: 1 } }
      status: { oneOf: [draft, sent, paid], weights: [1, 2, 5] }
      amount: { number: { min: 10, max: 5000, decimals: 2 } }
      issued: { date: { from: 2026-01-01, to: 2026-09-30 } }
      note: { text: { words: [3, 12] } }
      contact: { name: true }
      email: { email: true }
      customerId: { ref: customers_db }
      currency: ZAR
```

Each key under `generate` other than `seed` is a connection id, with `count` (how many documents) and `fields` (how to make each field). A field's value is one of these kinds:

| Kind       | Example                                              | Makes                                                                                                                                                                             |
| ---------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a literal  | `currency: ZAR`                                      | The value as written, in every document. A string, number, boolean, `null`, list, or a `~d` date or `_oid` marker. Write any other object as `{ literal: { ... } }`.              |
| `oneOf`    | `{ oneOf: [draft, sent, paid], weights: [1, 2, 5] }` | One of the values. `weights` is optional, one number per value; without it each value is equally likely.                                                                          |
| `number`   | `{ number: { min: 10, max: 5000, decimals: 2 } }`    | A number from `min` to `max`, rounded to `decimals` places (default `0`, whole numbers).                                                                                          |
| `date`     | `{ date: { from: 2026-01-01, to: 2026-09-30 } }`     | A date between `from` and `to`, loaded as a date, as a fixture's `~d` marker is. Each bound is a UTC date (`2026-01-31`) or a date-time with its offset (`2026-01-31T09:00:00Z`). |
| `text`     | `{ text: { words: [3, 12] } }`                       | A sentence of that many words from a small built-in word list.                                                                                                                    |
| `name`     | `{ name: true }`                                     | A person's name, such as `Grace Okafor`, from small built-in lists.                                                                                                               |
| `email`    | `{ email: true }`                                    | An address at a reserved example domain, such as `maya.chen@example.org`, so it can never reach a real inbox.                                                                     |
| `company`  | `{ company: true }`                                  | A made-up company name, such as `Harbor Logistics Ltd`.                                                                                                                           |
| `sequence` | `{ sequence: { prefix: inv-, start: 1 } }`           | `inv-1`, `inv-2`, …, one per document. Without `prefix` it makes numbers; `sequence: true` counts from 1.                                                                         |
| `ref`      | `{ ref: customers_db }`                              | The `_id` of a document of another connection, from its fixtures or its generated documents. Connections are generated in the order their refs need; a cycle is refused.          |

- **`_id`.** A document's `_id` is `<connection id>-1`, `<connection id>-2`, … unless `fields` sets it. A generated `_id` that is also a fixture's `_id`, or that is generated twice, is refused.
- **Stable.** Each field has its own seeded sequence, so adding a field or a connection leaves every other field's values as they were.
- **Size advice.** A connection that loads more than 1,000 documents (fixtures and generated together) gets a warning saying it is not advised. Every journey on the data set loads that many documents, so keep the count to what a page needs. It is never refused.
- **No dependency.** The lists are small and built in; nothing is downloaded.

Rules, checked before any browser opens:

- **Plain YAML.** No `_ref` and no operators: a data set is test input, not app config.
- **Connections.** Every connection id in `fixtures`, `generate` and `indexes` must be a `MongoDBCollection` connection whose `collection` is a literal string, and whose `databaseName` is a literal string or not set. Two connections that name one collection load into it together.
- **One database.** Under a data set every redirected connection reads one database. Two connections that name the same collection in different databases (a different `databaseName` or `databaseUri` secret) would share one collection. When the data set names either of them, the journey is refused. When it names neither, the result carries a warning. A connection whose `collection` is computed per request cannot be checked.
- **Indexes first.** Each collection's indexes are created before any document is loaded, so a fixture or generated document that breaks a unique index fails the load and names the document, the index and the duplicate key. A TTL index is loaded as a plain index, so old fixture dates are never deleted mid-run.

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

Generated documents are background: they give a page volume, realistic shapes and neighbouring records. A journey depends only on values written for it:

- Every value a journey types, selects, clicks by text, puts in `urlQuery` or `pathParams` (the values of a [page path](/page-paths)'s placeholders) or asserts comes from the data set's `fixtures` or `users`, or is UI text from the app's config (labels, titles, options). A generated value is the same on every machine, but it changes when the spec or the seed does, and nobody reading the journey can see where it came from.
- Target grid rows with `containing: <fixture value>`, never a bare `row: N`. A state path with an array index, such as `locations.0.path`, has the same problem: assert it only on a list the fixtures own outright, or assert by text.
- Keep generated documents away from the fixture tenant. Let the fixtures own one organization completely, and generate other organizations' rows around it.

Fixture records are test data written for the journey: never rows copied with credentials, tokens or external ids intact.

## What `lowdefy test` prints

`lowdefy test` prints each data set once per run, as `data tickets: 203 documents`, and the warnings its load returned (size advice, connections that share a collection). `lowdefy data list` prints each data set in `tests/data/` with the documents it loads and the users it names.

## How a journey reaches its database

A data set journey runs on the running dev server, beside your own browser tabs:

1. The dev server starts one in-memory MongoDB replica set the first time a data set journey runs, on a free port from 49152 up so it never holds a port one of your apps needs. It stops, and its files are removed, when the dev server stops; if it dies, the journey that finds it fails and the next one starts a new store. The first run downloads the MongoDB binary once (`Downloading MongoDB <version> for journey data sets (once).`). Set `MONGOMS_VERSION` to match your cluster's MongoDB version.
2. Each journey run gets a fresh database on it, loaded with the indexes, then the generated documents, then the fixtures. Runs never see each other's writes, so an agent's journey can run alongside `lowdefy test`.
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

## Clicks a data set journey refuses

A data set journey refuses two kinds of click, so that it never reaches a real service and never fails for a reason that is not the app's. The step fails before the click acts, naming the block and why:

- A click on a block whose events reach a connection that is not a `MongoDBCollection`, through a `Request` action or a `CallAPI` into an endpoint routine. That connection is not redirected (an `external` HTTP API, email or payment service), so the click would reach it for real: `Block "send_invoice" reaches connection "billing_api" (AxiosHttp), which a journey data set does not redirect, so a data-set journey cannot click it.`
- A click on a block whose events run an action that calls the auth engine (`Logout`, `Login`, `ChangePassword` and the other auth actions). Data set users are injected and have no auth session, so these fail every time.

The block is the one the click lands on: the target's block, or for a `text` or `containing` target, the nearest block around the element it matched. Request and endpoint ids computed by operators are not followed. Journeys without `data:` click anything. Cover such controls with a journey that runs off data sets, against a test database.

## Auth journeys stay on their harness

Data set users are injected callers. A journey that signs up or signs in through the app's own auth is an auth journey, and stays off data sets: run it against a test database as described under [The database](/config-tests#the-database). Two combinations are refused rather than run silently wrong:

- `user: none` on a data set journey while auth is configured. A signed-out actor's sign-in would write sessions to the app's real auth database while its requests read the data set.
- Any data set journey while `auth.dev.mockUser` (or `LOWDEFY_DEV_USER`) is active. The mock user wins over the injected user, so the journey would act as someone outside the data set.

## Agents

The `lowdefy_run_journey` MCP tool takes `data` and the name and list forms of `user`, the same as the journey file, and returns the data set the journey ran on with its result. With a list it runs once as each user and returns `{ passed, runs: [{ user, ... }] }`, `passed` only when every run passed. `lowdefy_run_tests` and `lowdefy test --url` run data set journeys like any other, because the dev server they target does the loading.
