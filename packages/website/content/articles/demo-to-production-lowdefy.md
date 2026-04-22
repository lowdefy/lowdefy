---
title: 'Six patterns for production Lowdefy apps'
subtitle: 'Notes from building Lowdefy apps for a living'
authorId: 'machiel'
publishedAt: '2026-04-21'
readTimeMinutes: 5
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

The most common pattern in a production Lowdefy codebase is "define once, reuse with different values." Lowdefy's [`_ref`](https://docs.lowdefy.com/references-and-templates) takes a path and optionally a `vars` object. The referenced file reads those vars with `_var`. A `.yaml.njk` extension turns on Nunjucks string interpolation in the file itself, for literal values like ids.

A contact form is a good example. Defined once as a component:

```yaml
# components/contact_form.yaml.njk
- id: {{ id }}
  type: Box
  layout:
    gap: 16
  blocks:
    - id: {{ id }}.name
      type: TextInput
      required: true
      properties:
        title: Name
    - id: {{ id }}.email
      type: TextInput
      required: true
      properties:
        title: Email
    - id: {{ id }}.message
      type: TextArea
      required: true
      properties:
        title:
          _var:
            key: message_label
            default: Message
        rows: 5
    - id: {{ id }}.submit
      type: Button
      properties:
        title:
          _var:
            key: submit_label
            default: Send
      events:
        onClick:
          - id: validate
            type: Validate
          - id: send
            type: Request
            params:
              _var: submit_request
```

Two things resolve at build time. Nunjucks handles string-level interpolation (`{{ id }}.email` becomes the real block id at the call site). `_var` handles field-level variable lookup, with `default:` as a fallback.

Reused on a public contact page:

```yaml
# pages/contact.yaml
- _ref:
    path: components/contact_form.yaml.njk
    vars:
      id: contact_form
      submit_request: submit_contact
```

And again, inside a support modal on another page, with different labels and a different request:

```yaml
# pages/product.yaml
- id: support_modal
  type: Modal
  blocks:
    - _ref:
        path: components/contact_form.yaml.njk
        vars:
          id: support_form
          message_label: Describe the issue
          submit_label: Open ticket
          submit_request: open_support_ticket
```

One component, two pages, two submit targets, no duplicated markup. The pattern composes. A page is often a single `_ref` to a layout template with page-specific blocks passed in. Most of a production Lowdefy app is `_ref` with `vars`, not copy-pasted definitions.

---

## 2. MongoDB is a structural fit

Every app we've shipped uses Mongo, via the [`@lowdefy/community-plugin-mongodb`](https://docs.lowdefy.com/MongoDB) plugin.

Requests are declarative YAML. Aggregation pipelines are declarative JSON. An aggregation drops into a Lowdefy request with no impedance mismatch. Lowdefy payloads are JSON-shaped. Mongo documents are JSON-shaped. You store the form state, and you read it back. You compose complexity with `$lookup` in-line instead of across query boundaries.

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

Tier 1: [Lowdefy requests](https://docs.lowdefy.com/connections-and-requests). The default choice for DB reads and writes. Stays in the app bundle and covers most CRUD use cases.

Tier 2: [Lowdefy API endpoints](https://docs.lowdefy.com/lowdefy-api). Declarative YAML that works well for expressing custom business logic, chaining requests, and calling third-party APIs. Still in the app bundle.

Tier 3: Separate services, usually Lambdas. This is the tier tutorials skip, and it's rare — well under 1% of a typical app's requests. It's basically for work that looks like a third-party: scheduled jobs, queue consumers, long-running transforms, heavy native dependencies, and anything that needs its own retry and back-pressure semantics. Most production apps have a handful of these at most. If a task doesn't clearly belong in Tier 3, it doesn't.

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

And call it like any other request — via the [`Request`](https://docs.lowdefy.com/Request) action, or as a step inside an `Api` routine:

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

Plugins cover all of those. A [Lowdefy plugin](https://docs.lowdefy.com/plugins-introduction) can ship [blocks](https://docs.lowdefy.com/blocks), [actions](https://docs.lowdefy.com/plugins-actions), [connections and requests](https://docs.lowdefy.com/plugins-connections), [operators](https://docs.lowdefy.com/plugins-operators), and [auth adapters and providers](https://docs.lowdefy.com/auth-configuration) — effectively every extension point Lowdefy exposes. For blocks, that's a few hundred lines of React and a manifest. For a connection, it's a JS module. Either way the plugin lives in the same monorepo as the app and is versioned with it. You don't "extend" Lowdefy in some framework-y sense. You write a thin module that Lowdefy mounts, passes props or params to, and collects events or results from.

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

[`protected: true`](https://docs.lowdefy.com/protected-pages-apis) is deny-by-default. A new page that isn't listed under a role is inaccessible until it's granted explicitly.

[Roles](https://docs.lowdefy.com/roles) map to page IDs, not to capability strings. `admin` is the set of page IDs a user with that role is allowed to visit. The config is the enforcement.

EmailProvider with a short `maxAge` gives magic-link auth with 30-minute tokens.

Out of the box, the stock adapter doesn't handle invite-only sign-up, per-app user attributes, or caps on verification token reuse. Most of our production apps need at least one of those, so they ship a small custom adapter plugin that wraps the community one and adds what's missing.

---

## 6. Usage logging

Structured usage events from the Lowdefy app go into a dedicated Mongo collection, so you can answer questions like which pages get used, which filters are common, and whether last week's feature saw any traffic.

```yaml
- id: log-usage
  type: MongoDBCollection
  properties:
    collection: log-usage
    databaseUri:
      _secret: MONGODB_URI
    write: true
```

The request is defined on the page, with `payload` capturing the page id and any query params at call time, and `properties` writing them into the log document on the server:

```yaml
requests:
  - id: log_usage
    type: MongoDBInsertOne
    connectionId: log-usage
    payload:
      page_id: items-list
      params:
        status:
          _url_query: status
    properties:
      doc:
        _id:
          _uuid: true
        timestamp:
          _date: now
        user_id:
          _user: id
        page_id:
          _payload: page_id
        params:
          _payload: params
```

Called via the [`Request`](https://docs.lowdefy.com/Request) action from the page's [`onMount`](https://docs.lowdefy.com/events-and-actions):

```yaml
events:
  onMount:
    - id: log
      type: Request
      params: log_usage
```

Wiring this into every page is manual today. A first-class logging hook at the page or app level is the kind of thing we'd rather have built in, and it's on the list.

---

## Closing thought

None of this is exotic. Reusable fragments, audit trails, service boundaries, custom extensions, access control, usage logging. It's what you'd do for any production codebase.

What Lowdefy buys you is that most of the codebase is YAML, not application code. A smaller surface area to maintain, review, and change.
