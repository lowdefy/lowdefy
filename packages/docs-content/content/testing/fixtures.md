# Fixtures

A **fixture** is a named set of documents your app's collections should hold: the twelve organisations, forty controls and framework catalogue that a page needs before it shows anything. Fixtures live in `fixtures/*.yaml` in your app, and one fixture serves two purposes: any number of [request tests](/config-tests) can load it with `fixtures:` instead of repeating the documents in each `seed:`, and an AI agent (or you) can load it into the dev database with the `lowdefy_seed_fixture` tool while building a page, so the list has rows to render.

## The fixture file

A fixture is a YAML map keyed by **connectionId** — the same key a request test's `seed:` uses, so a block of seed data moves into a fixture by cut and paste. Each key holds the list of documents for that connection's collection:

```yaml
# fixtures/base.yaml
organizations_connection:
  - _id: org_a
    name: Org A
    created_at: { '~d': '2026-01-01T00:00:00.000Z' }
  - _id: org_b
    name: Org B
    created_at: { '~d': '2026-01-02T00:00:00.000Z' }
controls_connection:
  - { _id: c1, title: Access reviews, status: open, organization_id: org_a }
  - { _id: c2, title: Vendor reviews, status: closed, organization_id: org_a }
  - { _id: c3, title: Backups, status: open, organization_id: org_b }
```

```
my-app/
├── fixtures/
│   ├── base.yaml
│   └── org-a.yaml
├── lowdefy.yaml
└── tests/
    └── requests/
```

- The file name is the fixture name: `fixtures/base.yaml` is the fixture `base`. Names are plain file names, never paths.
- Every key must be a `connectionId` from your app, and every value a list of document objects. A key whose value is not a list fails with `Fixture "base" key "controls_connection" must be an array of documents.`; a name with no file fails with `Fixture "org-a" not found. Expected fixtures/org-a.yaml.`
- Dates use the `~d` marker, exactly as Lowdefy serializes them: `created_at: { '~d': '2026-01-01T00:00:00.000Z' }` is inserted as a `Date`.
- Fixtures are inserted **as written**. Nothing stamps a tenant field onto the documents (see below), so a fixture for a multi-tenant app carries its own `organization_id` (or whatever the wall's field is) on every document, as `base.yaml` above does.

The collection a key targets is the connection's `collection` property, read from the build. A connection that resolves its `collection` (or `databaseName`) with an operator cannot be seeded from the test runner; the test fails with `Connection "<id>" resolves its collection with an operator, so a seed cannot target it. Use a literal "collection" property, or seed through a request.`

## Fixtures in request tests

A request test names the fixtures it needs in `fixtures:`, in the order they should be inserted, and may still carry its own `seed:` for the documents specific to that test:

```yaml
# tests/requests/answers.test.yaml
- name: get_answers returns the org's answers
  fixtures: [base, org-a]
  pageId: answers
  requestId: get_answers
  user: admin
  seed:
    answers_connection:
      - { _id: a1, test_id: t1, organization_id: org_a }
  expect:
    - _id: a1
```

Before each test the runner:

1. Resolves every collection named by the fixtures **and** by `seed:`.
2. Drops all of them, once, so nothing from a previous test survives.
3. Inserts each fixture's documents, in the order the `fixtures:` list gives them.
4. Inserts the test's own `seed:` documents last.

A test therefore layers its specifics on a shared base, and two tests that both name `base` never see each other's data. A test may have `fixtures:` with no `seed:`, or `seed:` with no `fixtures:`. Every connection a fixture names is pointed at the runner's in-memory MongoDB for the run, exactly like `seed:` connections — fixtures never reach the database your `.env` names. Seeding needs the same optional packages as `seed:`; see [Seeding data](/config-tests#seeding-data).

## Fixtures in journeys

A [journey](/config-tests) names the fixtures its page needs in the same `fixtures:` key, seeded
before the page is opened:

```yaml
# tests/journeys/controls.yaml
- name: member closes a control
  pageId: controls
  fixtures: [base, org-a]
  user: admin
  steps:
    - click: close_c1
    - expect: { text: { blockId: status_c1, equals: closed } }
```

Journeys and request tests share one seeding session per run: the collections are dropped and
re-inserted before each test of either kind, in run order, so a journey never sees what the test
before it wrote. Like a seeded request test, a journey with `fixtures` needs a server `lowdefy test`
started — it cannot run against `--url` or against a development server you already have up.

The `lowdefy_run_journey` MCP tool takes `fixtures` too, and seeds the **dev** database through the
connection layer with `reset`, exactly as `lowdefy_seed_fixture` does — so it needs the same
`cli.agentTools.allowWriteRequests: true` opt-in, and the fixture's collections are emptied first.

## Seeding the dev database

While an agent builds a list page it cannot see the page work when the collection is empty. The dev server's [docs and MCP endpoint](/ai-agent-docs) exposes `lowdefy_seed_fixture` (and `POST /lowdefy-docs/seed-fixture`) to load a fixture into the **dev database** — the one your connections point at when `lowdefy dev` is running:

```json
{ "name": "base", "reset": true }
```

This writes to your real dev database, so it sits behind the same opt-in as write requests. Without it the tool answers `refused: true` with `reason: "Seeding writes to the dev database."` and how to enable it:

```yaml
cli:
  agentTools:
    allowWriteRequests: true
```

The documents are written **through the connection layer**: each key becomes a `MongoDBInsertMany` on that connection, so a `databaseUri` behind `_secret` or `_env` resolves as it does for any request, a connection without `write: true` refuses with `Connection "<id>" does not allow writes.`, and the request schema still applies.

`reset` defaults to `false`: the fixture's documents are added on top of what is there, so an agent can layer fixtures without wiping your own data (inserting a document whose `_id` already exists fails with the driver's duplicate key error). With `reset: true` every collection the fixture names — only those — is emptied first with a `MongoDBDeleteMany` on `{}`. The result lists what happened per connection:

```json
{
  "refused": false,
  "seeded": [
    {
      "connectionId": "organizations_connection",
      "collection": "organizations",
      "deleted": 2,
      "inserted": 2
    },
    { "connectionId": "controls_connection", "collection": "controls", "deleted": 5, "inserted": 3 }
  ]
}
```

A failure comes back as `{ "refused": false, "error": { "name", "message" }, "seeded": [...] }` with the connections that were seeded before it, never as a thrown error.

Fixtures are seeded **unwalled**: the tenant wall is not applied, because a fixture is raw database content and stamping the calling user's organisation onto every document would make a multi-organisation fixture impossible. Your fixture must carry its own tenant fields. Every seed is logged (`agent_seed_fixture` with the fixture name, `reset` and the connectionIds) and pushed as a `fixture_seeded` event on the dev server's [push channel](/ai-agent-docs#push-events), so a watching agent and the developer both learn that the database changed.

Fixtures are never seeded automatically — not when `lowdefy dev` starts, not by a build. Writing to a developer's database is always an explicit act.
