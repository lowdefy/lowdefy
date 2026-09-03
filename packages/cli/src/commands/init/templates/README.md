# __APP_NAME__

A Lowdefy app. The config in this directory is the whole app: pages, an API
endpoint, a database connection, a collection contract, dev users and tests.

```
lowdefy.yaml                     the app: collections, connections, auth, menus
pages/items.yaml                 a ListPage archetype over the items collection
pages/welcome.yaml               a plain page
api/add-item.yaml                an Api endpoint that inserts an item
fixtures/items.yaml              documents a request test can seed
tests/journeys/items-list.yaml   a browser journey
tests/requests/add-item.test.yaml  request tests for the endpoint and the list
.env                             MONGODB_URI and BETTER_AUTH_SECRET (gitignored)
```

## A database

`lowdefy dev` needs a real MongoDB: `.env` points `MONGODB_URI` at
`mongodb://localhost:27017/__APP_NAME__`. Two ways to have one:

- **Run MongoDB locally.** `docker run -d -p 27017:27017 --name mongo mongo:7`,
  or install MongoDB Community Edition. Nothing else to change.
- **Point at a cluster you already have.** Replace `MONGODB_URI` in `.env` with
  its connection string.

`lowdefy test`'s request tests do not need either: a test that names a fixture
runs against an in-memory MongoDB the runner starts for it. Install the two
optional packages once to enable that:

```
npm install --save-dev mongodb mongodb-memory-server
```

The browser journeys do run against `lowdefy dev`, so they need the database
above.

## Run it

```
lowdefy dev      # http://localhost:3000
lowdefy test     # journeys and request tests
lowdefy check    # config checks
```

## Where to go next

- `pages/items.yaml` is a `ListPage` archetype: about twenty lines that expand
  into a filter row, a search box, a list, an empty state and a load-error
  state. Run `lowdefy expand items` to turn it into ordinary block config you
  own outright.
- `collections:` in `lowdefy.yaml` declares what a document holds. The archetype
  reads it for column types and filter widgets, and every MongoDB write is
  checked against it.
- `auth.dev.users` names callers that journeys and request tests use as `user:`.
  They exist in the dev server only.

Docs: https://docs.lowdefy.com
