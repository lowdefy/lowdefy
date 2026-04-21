---
title: 'Seven things that turn a Lowdefy demo into a Lowdefy product'
subtitle: "Notes from building Lowdefy apps for a living — the stuff my production apps consistently do that small ones don't."
authorId: 'machiel'
publishedAt: '2026-04-21'
readTimeMinutes: 8
tags:
  - 'Production'
  - 'Architecture'
  - 'Best Practices'
draft: false
---

Lowdefy docs will get you a working app. They won't get you a production app.

That isn't a knock on the docs. Framework docs cover primitives: pages, blocks, requests, connections, auth. They can't cover the shape of a codebase that's been through a compliance audit, a bad migration at two in the morning, an integration with a rate-limiting ERP, and a year of feature creep. You have to build one to know.

I maintain Lowdefy and I ship Lowdefy apps for clients. What follows is the stuff my production apps consistently do that small ones don't. None of it is secret. You just wouldn't stumble into most of it from the tutorials.

Seven items.

---

## 1. MongoDB isn't just a database you can use, it's a structural fit

Every app I've shipped uses Mongo, and it isn't coincidence. The two tools match each other's grain.

Requests are declarative YAML. Aggregation pipelines are declarative JSON. An aggregation drops into a Lowdefy request with no impedance mismatch. No ORM, no DTO layer, no serializer. Lowdefy payloads are JSON-shaped. Mongo documents are JSON-shaped. You store the form state, you read it back, done. Lowdefy is strong on reading or writing one collection per request; Mongo is strong on reading or writing one collection per operation. You compose complexity with `$lookup` in-line instead of across query boundaries.

That's the structural argument. The production argument is what Mongo hands you for free once you lean into it.

ChangeLog at the connection level. Seven lines of YAML, full audit trail:

```yaml
- id: items
  type: MongoDBCollection
  properties:
    collection: items
    changeLog:
      collection: log-changes
      meta:
        user:
          _user: true
    databaseUri:
      _secret: MONGODB_URI
    write: true
```

Every write to `items` gets a document appended to `log-changes` with the old value, the new value, and the user who made the change. You wrote zero lines of audit code.

Pipeline updates plus reusable fragments give you consistency without copy-paste:

```yaml
id: update_item
type: MongoDBUpdateOne
connectionId: items
payload:
  item:
    _state: item
properties:
  filter:
    _id:
      _payload: item._id
  update:
    - $set:
        _object.assign:
          - _payload: item
          - updated:
              _ref: shared/change_stamp.yaml
    - $project:
        large_field: 0
```

That `shared/change_stamp.yaml` is a one-file fragment referenced from every update in the codebase:

```yaml
# shared/change_stamp.yaml
timestamp:
  _date: now
user:
  name:
    _user: profile.name
  id:
    _user: id
app_name: my-app
version:
  _ref: version.yaml
```

One edit propagates. A new engineer writes their first update, refs the stamp, and can't forget to include it, because every update in the repo already does.

The other Mongo wins worth calling out: Atlas Search indexes for full-text without standing up Elasticsearch, TTL indexes for auto-expiring verification tokens (zero cleanup code), and a two-stage ingestion pattern where raw data lands in a `-origin` collection and an aggregation `$merge`s into the normalized collection. That last one is how you reprocess a bad import without re-uploading the file, and I've used it more times than I'd like to admit.

---

## 2. Three tiers of backend, and you'll want all three

Most "Lowdefy is low-code, not no-code" discussions stop at "write a request in YAML." That's the first tier. There are three.

Tier 1: Lowdefy requests. Default choice. DB reads and writes, aggregation, operator logic. Stays in the app bundle. Most of your app lives here.

Tier 2: Lowdefy API endpoints. When YAML operators run out you write a JS handler that runs in the Lowdefy Next.js backend. Same process, same env, same creds. You just get imperative code. Reach for it when you need a library Lowdefy doesn't expose as an operator, or a response shape the built-in request types don't produce, or control flow that's painful in YAML.

Tier 3: separate services, usually Lambdas. This is the tier tutorials skip, and it's where a lot of production reality lives. You go here when the work can't live inside a request/response cycle at all:

- Not HTTP-triggered. Cron, SQS, S3 events, webhook receivers that need their own auth. A nightly ERP sync has no user and no HTTP caller.
- Longer than a request. Bulk transforms, reports, multi-minute aggregations. Your Next.js host has timeouts you don't want to fight.
- Needs back-pressure and retries. SQS plus a DLQ plus `reservedConcurrency: 1` is the right shape for rate-limited third-party delivery. Not a thing you can express in a Lowdefy request.
- Different blast radius. Your Lowdefy server has one IAM role. Give the S3-exporting Lambda only `s3:PutObject` on one bucket. Least privilege works when you can split the workload.
- Heavy deps. Puppeteer, ffmpeg, pandoc. Don't pull them into your app server bundle.
- Failure isolation. A broken nightly job shouldn't make the UI slower. Separate deploy, separate metrics, separate on-call signal.

The part nobody shows you is how Lowdefy actually calls a Lambda. It's a normal connection.

```yaml
- id: notifications_service
  type: AxiosHttp
  properties:
    method: post
    baseURL:
      _string.concat:
        - _secret: SERVICES_API_URL
        - /api/consume-notifications
    headers:
      x-api-key:
        _secret: SERVICES_API_KEY
```

You use it inside an `Api` routine like any other step:

```yaml
id: insert-comment
type: Api
routine:
  - id: event_insert_comment
    type: MongoDBInsertOne
    connectionId: events
    properties:
      doc:
        _id: { _uuid: true }
        type: insert-comment
        created:
          _ref: shared/change_stamp.yaml

  - id: notify
    type: AxiosHttp
    connectionId: notifications_service
    properties:
      data:
        event_ids:
          - _step: event_insert_comment.insertedId

  - id: touch_parent
    type: MongoDBUpdateOne
    connectionId: parents
    properties:
      filter:
        _id:
          _payload: parent_id
      update:
        $set:
          updated:
            _ref: shared/change_stamp.yaml
```

Three operations, three tiers, one routine. Mongo insert happens inline. Notification work is shipped off to a Lambda that owns template rendering, SQS enqueue, delivery retry. The parent-touch is Mongo again. The routine has no idea the middle step crosses a process boundary, and it shouldn't.

---

## 3. Custom plugins aren't an escape hatch. They're part of the stack.

The single biggest mindset shift: stop trying to make Lowdefy do everything, and start writing plugins.

You will hit gaps. The built-in table won't handle 10k rows smoothly. You'll want a rich-text editor with @-mentions. You'll want a Kanban board fed from a Mongo query. You'll want a block that's half UI and half "call a custom endpoint with the selected rows."

A Lowdefy plugin is a few hundred lines of React and a manifest. It lives in the same monorepo as the app and is versioned with it. You don't "extend" Lowdefy in some framework-y sense. You write a thin React component that Lowdefy mounts, passes props to, and collects events from. That's it.

Declared at the app level:

```yaml
# lowdefy.yaml
plugins:
  - name: '@lowdefy/community-plugin-mongodb'
    version: 2.3.0
  - name: '@lowdefy/community-plugin-aggrid'
    version: 1.0.0
  - name: '@acme/plugin-rich-text'
    version: workspace:*
  - name: '@acme/plugin-local'
    version: workspace:*
  - name: '@acme/plugin-realtime'
    version: workspace:*
```

Three community plugins, three at `workspace:*`. The `workspace:*` entries are the point. Those plugins live in the same monorepo as the app, evolve with it, and never need an npm publish cycle to ship a change. You change a React component in `plugins/plugin-rich-text`, the dev server picks it up, the app rebuilds. No release dance.

Once registered, a custom block is indistinguishable from a built-in:

```yaml
- id: body
  type: RichTextEditor
  properties:
    mentions:
      _request: get_mentionable_users
```

The app YAML doesn't know `RichTextEditor` is custom. It shouldn't.

The plugins I've built, reliably, across multiple client projects: a high-performance data grid, a rich-text editor, a Kanban board, a QR scanner, a places autocomplete, a Socket.IO realtime subscription, and a "call custom backend logic with type-safe method signatures" connection we call LocalApi. Every one of them closed a gap that would otherwise have made me reach for a different framework. None took more than a week to build the first time.

---

## 4. A Lowdefy app past thirty pages is a monorepo

Small apps put everything in one folder. Production apps usually have two Lowdefy apps sharing a user model, or one Lowdefy app plus three Lambdas plus two custom plugins, or a web admin and a customer portal sharing an identity layer. Sooner or later.

You get there by treating the Lowdefy app as one package in a pnpm workspace:

```
repo/
  apps/
    admin/        # lowdefy app
    portal/       # lowdefy app
    shared/       # shared yaml fragments, modules
  plugins/
    plugin-local/
    plugin-realtime/
  lambda/
    internal/
  actions/
    migrations/
```

In each app's `lowdefy.yaml`, point the watcher at the shared directories so edits in `../shared` trigger rebuilds:

```yaml
cli:
  watch:
    - ../shared
    - ../modules
```

The sharing mechanism is `_ref`. For small fragments:

```yaml
updated:
  _ref: shared/change_stamp.yaml
```

For larger units of reuse, like an entire page or a sub-app, use `_ref` with `vars` and a Nunjucks template. One user-admin module can serve both apps, parameterized:

```yaml
_ref:
  path: ../modules/user-admin/pages.yaml.njk
  vars:
    app_name: app-one
    form_profile_fields:
      _ref: components/profile_form.yaml
```

Two apps that share 80% of their pages should not be two copies of those pages. They should be one module refd twice. This is the single pattern that lets a Lowdefy codebase scale past where small apps calcify, and it's mostly absent from the getting-started docs because getting-started doesn't need it.

---

## 5. Schema changes are code, not Compass sessions

The tutorial never mentions this and it's the single clearest demo-vs-product tell. How do you change the schema of a live app?

In a demo you open MongoDB Compass and run an `updateMany`. In production that's a fireable offense. Migrations live in the repo, they get code review, they run in CI, and there's always a dry-run before the real run.

The shape is a timestamped folder of migration YAMLs and a small runner script:

```yaml
# migration/20260211/rename_field.yaml
collection: items
backup: true
pipeline:
  - $match:
      old_key:
        $exists: true
  - $addFields:
      new_key: $old_key
  - $unset: old_key

write_stage:
  $merge:
    into: items
    on: _id
    whenMatched: merge
    whenNotMatched: discard
```

```yaml
# migration/20250225/drop_deprecated_field.yaml
collection: users
backup: true
pipeline:
  - $match:
      legacy_tokens:
        $ne: null
  - $unset: legacy_tokens
  - $merge:
      into: users
      on: _id
      whenMatched: replace
      whenNotMatched: discard
```

This isn't Lowdefy config. It's consumed by a small custom Node runner in `actions/migrations/`. The pattern is: a migration is a MongoDB aggregation pipeline with a `$merge` at the end. No imperative code, no cursor iteration, no "oh god I forgot the where clause."

CI does three things. A PR with a new migration file triggers a dry-run job that runs the pipeline, logs the document count it would touch, and posts a comment on the PR. The merge to `main` triggers a deploy. A successful deploy triggers the migration job for real, with `backup: true` dumping the affected documents before the `$merge`.

The `backup` flag is load-bearing. I've used it. It's worth the disk space.

---

## 6. Invite-only, deny-by-default, roles mapped to page IDs

Basic Lowdefy auth is NextAuth with a provider and an adapter. Production auth is three extra disciplines layered on top.

```yaml
auth:
  authPages:
    signIn: /login
    verifyRequest: /verify-email-request
    error: /login
  adapter:
    id: mdb_adapter
    type: MongoDBAdapter # from @lowdefy/community-plugin-auth-next-mongodb-adapter
    properties:
      databaseUri:
        _secret: MONGODB_URI
  providers:
    - id: email
      type: EmailProvider
      properties:
        maxAge: 1800
        server:
          host: smtp.example.com
          port: 465
          auth:
            user: apikey
            pass:
              _secret: EMAIL_API_KEY
        from: no-reply@example.com
  pages:
    protected: true # deny-by-default
    public:
      - login
      - verify-email-request
    roles:
      editor:
        - items-list
        - items-edit
      admin:
        - items-list
        - items-edit
        - users-admin
        - settings
```

The three things worth noticing:

`protected: true`. Deny by default. A new page the engineer forgets to put in a role list is inaccessible until someone grants it explicitly. The opposite default, where everything is public and you lock down the sensitive pages, is how breaches happen.

Roles map to page IDs, not to capability strings. `admin` isn't a role with the admin capability, it's the set of page IDs a user with this role is allowed to visit. No middleware, no per-handler check, no RBAC library. The config is the enforcement.

EmailProvider with a short `maxAge`. Magic-link auth with 30-minute tokens. No password UX, no password reset flow, no rotation policy. The audit answer to "how are credentials stored" is "they aren't."

One thing the stock adapter doesn't give you: invite-only sign-up, per-app user attributes, or caps on verification token reuse. Both of my reference production apps use a small custom adapter plugin that wraps the community one and adds those. Which points back to section 3. Plugins are how you extend anything, including the auth adapter.

---

## 7. Observability is a deliberate layer you add

Lowdefy doesn't give you observability. None of the frameworks in this stack do. You add it.

What I ship with: Sentry in every Lambda handler and in the Lowdefy server for error tracking, release tagging, source maps. Pino for structured logs, with `pino-mongodb` writing them to a Mongo collection for historical audit and `pino-sentry-transport` tee-ing errors to Sentry. Health checks on any stateful service (the Fly.io `/health` pattern). And structured usage events from the Lowdefy app itself into a dedicated Mongo collection. That last piece is the part that lives in Lowdefy config.

The Lowdefy side is a connection and a shared request:

```yaml
- id: log-usage
  type: MongoDBCollection
  properties:
    collection: log-usage
    databaseUri:
      _secret: MONGODB_URI
    write: true
```

```yaml
# shared/log-usage/log_usage.yaml
id: log_usage
type: MongoDBInsertOne
connectionId: log-usage
properties:
  doc:
    _id: { _uuid: true }
    timestamp: { _date: now }
    user_id: { _user: id }
    page_id: { _payload: page_id }
    params: { _payload: params }
```

Wired into a page's `onEnter`:

```yaml
events:
  onEnter:
    - id: log
      type: Request
      params:
        request: log_usage
        payload:
          page_id: items-list
          params:
            status:
              _url_query: status
```

Now you can answer questions you couldn't before. Which pages actually get used? Which filters do admins hit most? Did the feature we shipped last week get any traffic at all? Without this layer your "production" app is a black box in production, and you're guessing about what to build next.

---

## Closing thought

None of this is exotic. It's what you'd do for any production codebase. Monorepo, migrations, audit, observability, CI, plugins for the things the framework doesn't cover.

The thing Lowdefy buys you is that the surface area of "treat it like a normal codebase" is a lot smaller. UI is YAML. Data layer is YAML. Auth is YAML. Business logic is YAML, or a small JS handler, or, for the hard 10%, a Lambda.

That hard 10% is where most "low-code doesn't scale" stories come from. It scales fine. You just have to be willing to write the 10%.
