---
title: 'Five patterns for production Lowdefy apps'
subtitle: 'Notes from building Lowdefy apps for a living'
authorId: 'machiel'
publishedAt: '2026-04-21'
readTimeMinutes: 6
tags:
  - 'Production'
  - 'Architecture'
  - 'Best Practices'
draft: false
---

Lowdefy docs cover primitives: pages, blocks, requests, connections, auth. They can't cover the shape of a codebase that's been through things like a compliance audit, an integration with a rate-limiting ERP, or a year of feature creep. You have to build one to know.

We maintain Lowdefy, but we also ship Lowdefy apps for clients. What follows are a few patterns our production apps consistently use that small ones don't. None of it is secret. You just wouldn't stumble into most of it from the tutorials.

---

## 1. Parameterized fragments

The most common pattern in a production Lowdefy codebase is "define once, reuse with different values." Lowdefy's [`_ref`](https://docs.lowdefy.com/references-and-templates) takes a path and optionally a `vars` object, and the referenced file reads those vars with `_var`. A `.yaml.njk` extension turns on Nunjucks interpolation inside the file itself, which handles the things `_var` can't.

A parameterized form field is a good example:

```yaml
# components/form_field.yaml.njk
- id: {{ key }}
  type: TextInput
  required:
    _var:
      key: required
      default: false
  properties:
    title:
      _var: title
    {% if span %}
    label:
      span:
        _var: span
      align: right
    {% endif %}
```

Used twice on the same sign-up page, with different vars each time:

```yaml
# pages/sign_up.yaml
- _ref:
    path: components/form_field.yaml.njk
    vars:
      key: email
      title: Email
      required: true
- _ref:
    path: components/form_field.yaml.njk
    vars:
      key: company
      title: Company (optional)
      span: 8
```

Two things here can't be done with `_var` alone. First, block ids must be literal strings at build time, so `id: {{ key }}` is rewritten to `id: email` before the build ever sees it. `_var` resolves values, not identifiers. Second, `{% if span %}` lets you omit the entire `label:` block when a caller doesn't pass `span`, rather than emitting the key with a null value that the block would have to interpret. Everything else uses `_var` in the usual way, with `default:` as the fallback when the caller omits a key.

Nunjucks can also parameterize the ref path itself. A page template that refs `../shared/requests/get_{{ entity }}.yaml` loads a different file per entity, letting one template drive several CRUD pages with no duplication. `_var` can't influence which file the build reads; Nunjucks can, because it runs first.

The pattern composes upward. A form is a stack of field fragments. A page is often a single `_ref` to a layout template, with page-specific content passed in. Most of a production Lowdefy app is `_ref` with `vars`, not copy-pasted definitions.

---

## 2. MongoDB is a structural fit

Every app we've shipped uses Mongo, via the [`@lowdefy/community-plugin-mongodb`](https://docs.lowdefy.com/MongoDB) plugin.

Lowdefy requests are declarative YAML; MongoDB aggregation pipelines are declarative JSON. Both are JSON-shaped the whole way through, so an aggregation drops straight into a request with no impedance mismatch: no ORM, no DTO layer, no serializer. You store form state and read it back, and you compose query complexity with `$lookup` in-line instead of across query boundaries.

ChangeLog at the connection level is a feature of the community plugin. Seven lines of YAML, full audit trail:

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

The other Mongo wins worth calling out: Atlas Search indexes for full-text without Elasticsearch, TTL indexes for auto-expiring verification tokens (zero cleanup code).

---

## 3. Three tiers of backend

Tier 1 is [Lowdefy requests](https://docs.lowdefy.com/connections-and-requests). This is the default choice for DB reads and writes, and most of a production app lives here:

```yaml
id: get_items
type: MongoDBFind
connectionId: items
payload:
  status:
    _state: selected_status
properties:
  query:
    status:
      _payload: status
```

Tier 2 is [Lowdefy API endpoints](https://docs.lowdefy.com/lowdefy-api). Declarative YAML that chains steps, calls third-party APIs, and expresses custom business logic server-side. Still in the app bundle. Reach for it when a single request isn't enough but imperative code isn't warranted either:

```yaml
id: archive_item
type: Api
routine:
  - id: archive
    type: MongoDBUpdateOne
    connectionId: items
    properties:
      filter:
        _id:
          _payload: item_id
      update:
        $set:
          archived: true
  - id: log_event
    type: MongoDBInsertOne
    connectionId: events
    properties:
      doc:
        type: archive-item
        item_id:
          _payload: item_id
```

Tier 3 is separate services, usually Lambdas. This is the tier tutorials skip, and it's rare. Well under 1% of a typical app's requests. It's for work that looks like a third-party: scheduled jobs, queue consumers, long-running transforms, heavy native dependencies, and anything that needs its own retry and back-pressure semantics. Most production apps have a handful of these at most. If a task doesn't clearly belong in Tier 3, it doesn't.

When you do need one, calling it from the app is still a YAML-native experience. You define an [AxiosHttp](https://docs.lowdefy.com/AxiosHttp) connection for the service:

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

And call it like any other request, via the [`Request`](https://docs.lowdefy.com/Request) action, or as a step inside an `Api` routine. Here it composes all three tiers in one endpoint: a Tier 1 Mongo insert, a Tier 3 Lambda call, and a second Tier 1 Mongo update, orchestrated by a Tier 2 `Api`:

```yaml
id: insert-comment
type: Api
routine:
  - id: event_insert_comment
    type: MongoDBInsertOne
    connectionId: events
    properties:
      doc:
        _id:
          _uuid: true
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

---

## 4. Custom plugins

When using any low-code framework you will hit gaps. You might want a rich-text editor with @-mentions, a Kanban board fed from a Mongo query, a connection to an internal API, or a custom auth adapter.

Plugins cover all of those. A [Lowdefy plugin](https://docs.lowdefy.com/plugins-introduction) can ship [blocks](https://docs.lowdefy.com/blocks), [actions](https://docs.lowdefy.com/plugins-actions), [connections and requests](https://docs.lowdefy.com/plugins-connections), [operators](https://docs.lowdefy.com/plugins-operators), and [auth adapters and providers](https://docs.lowdefy.com/auth-configuration). That covers effectively every extension point Lowdefy exposes.

For blocks, that's a few hundred lines of React and a manifest. For a connection, it's a JS module. Either way the plugin lives in the same monorepo as the app and is versioned with it. You don't "extend" Lowdefy in some framework-y sense. You write a thin module that Lowdefy mounts, passes props or params to, and collects events or results from.

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

Three community plugins, three at `workspace:*`. The `workspace:*` entries are the point. Those plugins live in the same monorepo as the app, evolve with it, and never need an npm publish cycle to ship a change. You change a React component in `plugins/plugin-rich-text`.

Once registered, a custom [block](https://docs.lowdefy.com/blocks) is indistinguishable from a built-in one:

```yaml
- id: body
  type: RichTextEditor
  properties:
    mentions:
      _request: get_mentionable_users
```

---

## 5. Auth

[Lowdefy auth](https://docs.lowdefy.com/users-introduction) is [NextAuth](https://next-auth.js.org/) with a provider and an adapter.

```yaml
auth:
  authPages:
    signIn: /login
    verifyRequest: /verify-email-request
    error: /login
  adapter:
    id: mdb_adapter
    type: MongoDBAdapter # from @lowdefy/community-plugin-mongodb
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

[`protected: true`](https://docs.lowdefy.com/protected-pages-apis) is deny-by-default. A new page that isn't listed under a role is inaccessible until it's granted explicitly.

[Roles](https://docs.lowdefy.com/roles) map to page IDs, not to capability strings. `admin` is the set of page IDs a user with that role is allowed to visit. The config is the enforcement.

EmailProvider with a short `maxAge` gives magic-link auth with 30-minute tokens.

`MongoDBAdapter` is the thin adapter. The same [`@lowdefy/community-plugin-mongodb`](https://docs.lowdefy.com/MongoDB) also ships `MultiAppMongoDBAdapter`, which adds invite-only sign-up, per-app user attributes, and caps on verification token reuse. Most of our production apps use that one, dropped in by changing `type: MongoDBAdapter` to `type: MultiAppMongoDBAdapter` and configuring the extra properties.

---

## Closing thought

None of this is exotic. Reusable fragments, audit trails, service boundaries, custom extensions, access control. It's what you'd do for any production codebase.

What Lowdefy buys you is that most of the codebase is YAML, not application code. A smaller surface area to maintain, review, and change.
