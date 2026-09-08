---
topic: notifications
updated: 2026-07-06
packages: [build, api, email-templates, connection-smtp, servers]
---

# Notification Rendering

How Lowdefy turns a `notifications:` config entry plus a data item into a rendered email, and where the framework's responsibility stops.

> **IMPORTANT: The framework renders; it does not store or send.**
>
> The only things a notification needs that config alone cannot express are **rendering an email** (React rendering + a guarantee that interpolated user data can never inject markup or links) and **composing link URLs**. Those live in the framework, in the `RenderNotification` step. Everything else — inserting a record, deduplicating, sending, tracking delivery, the inbox — is ordinary requests and routines, composed by apps or by the `modules-mongodb` notifications module.
>
> An earlier revision shipped a batteries-included `SendNotification` step that also stored (via a `notificationAdapter` connection capability), deduplicated, and sent. It was **torn down** to the render primitive (commit `83ef1af13`, PR #2234). Do not reintroduce storage or sending into the framework: storing is a request, sending is a request, and a framework pipeline competes with the modules layer. See [Key Design Decisions](#key-design-decisions).

## Context

A notification is defined once in the root `notifications:` section as a template (`{ id, type, properties }`, where `type` is an email template) with Nunjucks-interpolated properties. At runtime the `RenderNotification` API routine step renders one item against that template and returns the rendered content and resolved links. The step is pure with respect to the outside world — no database, no SMTP — so the surrounding routine owns the pipeline.

This split is the load-bearing design decision. It keeps the framework surface to the two operations YAML genuinely cannot perform, and it means notifications work with **any database** (storing is a request) and **any transport** (sending is a request) with no framework changes.

## The Flow

### Step 1: Build the `notifications:` section

**Package:** `@lowdefy/build`
**Location:** `packages/build/src/build/buildNotifications.js`, `writeNotifications.js`

`buildNotifications` validates each entry: `id`/`type` required, `properties.subject` required (a framework contract independent of the template's own schema), `theme`/`testData` are objects. It renames `id` → `notificationId`, namespaces the id to `notification:<id>`, and increments the `notifications` type counter. `writeNotifications` writes each to a `notifications/<id>.json` build artifact.

Modules can ship notifications: `buildModules` scopes each manifest `notifications:` entry to `{entryId}/{id}` and merges it into `components.notifications` **before** `buildNotifications` runs, so duplicate detection and the `notification:` prefixing operate on scoped ids, and the artifact writes to a nested path (`notifications/<entry>/<id>.json` — the write chain auto-mkdirs, same as scoped api artifacts). The section is deferred in module manifests (`deferredRegions.js` CONTENT_SECTIONS) so `_module.var`/`_module.*Id` inside templates resolve in the manifest phase with the entry in scope, and it is non-exportable (no cross-module `_ref`); scoped ids are produced by the `_module.notificationId` walker operator (string and `{ id, module }` forms, mirror of `_module.endpointId`).

Template properties are **not** operator config — no `countOperators` runs over them. They are Nunjucks data templates evaluated at render time.

**Inputs:** the `notifications:` array from config.
**Outputs:** `notifications/<id>.json` artifacts; `context.notificationIds`.

### Step 2: Build the `RenderNotification` step

**Package:** `@lowdefy/build`
**Location:** `packages/build/src/build/buildApi/buildRoutine/{validateStep.js, setStepId.js, countStepTypes.js}`, `validateRenderNotificationSteps.js`

`RenderNotification` is a built-in routine step, wired the same way `CallAgent` is: `setStepId.js` maps `RenderNotification: 'notification'` (the step id is prefixed `notification:`), `validateStep.js` requires `properties.notificationId` (string or operator) and `properties.data` (a single object — a literal array is a build error), and forbids `connectionId`. `countStepTypes.js` excludes it from the request type counters. After `buildNotifications`, `validateRenderNotificationSteps.js` checks every step with a static `notificationId` references an existing notification.

**Inputs:** routine steps from `api:` configs.
**Outputs:** validated, id-prefixed `RenderNotification` steps; a build error for unknown notification ids.

### Step 3: Register templates as a plugin type category

**Package:** `@lowdefy/build`
**Location:** `packages/build/src/build/writePluginImports/writeNotificationImports.js`

`notifications` is a new plugin type category (alongside blocks, connections, operators, actions, agents). The build writes `plugins/notifications.js`, which re-exports the template registry plus `renderEmail` and `interpolateProperties` from `@lowdefy/email-templates` — or `undefined` placeholders when the app has no notifications. This is the seam that keeps `@lowdefy/email-templates` out of the client bundle and out of apps that don't use notifications.

### Step 4: Wire the render helpers onto the API context

**Package:** `@lowdefy/server`, `@lowdefy/server-dev`
**Location:** `packages/servers/*/src/middleware/apiContext.js`

The server middleware imports the generated `plugins/notifications.js` and places `notifications` (the template registry), `renderEmail`, and `interpolateProperties` on the request `context`. The api handler reads them from there — the api package has no direct dependency on `@lowdefy/email-templates`.

### Step 5: Render one item

**Package:** `@lowdefy/api`
**Location:** `packages/api/src/routes/endpoints/handleRenderNotification.js` (dispatched from `runRoutine.js` on the `notification:` id prefix)

For one call the handler:

1. Evaluates `step.properties` → `{ notificationId, data, serverUrl, landingPage, recordId }`. Validates `notificationId` is a string and `data` is a single object (arrays error, pointing at `:for`). `serverUrl` is trailing-slash-trimmed; `landingPage`/`recordId` are optional strings.
2. Loads the `notifications/<id>.json` config (`getNotificationConfig.js`) and looks up the template in `context.notifications`.
3. Merges the theme (`{ ...app.email, ...config.theme }`) and resolves a relative `theme.logo` (`resolveThemeLogo.js`) — a `/path` logo becomes `<serverUrl><basePath><path>`; absolute and protocol-relative (`//`) URLs pass through; a relative logo with no `serverUrl` is dropped (EmailLayout falls back to the `companyName` text header). Resolution runs after the merge, so per-notification `theme.logo` overrides also resolve. Note `app.email` arrives with build-time defaults baked in: `buildApp` derives `companyName` from the root `name:` and `primaryColor` from `theme.antd.token.colorPrimary` when unset.
4. Resolves links (`resolveNotificationLinks.js`) — `{ pageId, urlQuery }` link objects in `data.links` and in the template's declared `dataKeys` arrays become URLs. With `landingPage` set they route through `<serverUrl><basePath><landingPage>?_id=<recordId>&option=<dotpath>`; otherwise direct page URLs. Absolute URL strings pass through. Guards: links present with no `serverUrl` errors; `landingPage` set with links but no `recordId` errors.
5. Interpolates the template properties against the resolved item (`interpolateProperties`), validates against the template's `schema`, and renders to `{ html, text }` (`renderEmail`).
6. Adds the step result `{ subject, title, preview, html, text, data }` — `title` falls back to `subject`; `preview` is derived (`derivePreview.js`) from the template `preview` or a markdown-stripped message excerpt; `data` is the link-resolved item.

**Inputs:** the step, routine context.
**Outputs:** the step result; **no** database write, **no** email sent.

### Step 6: The pipeline (outside the framework)

**Package:** app YAML / `modules-mongodb`

The surrounding routine composes the pipeline: mint a record id (`_uuid`) before rendering (landing links embed it), call `RenderNotification`, insert a record with an ordinary request, send with `SMTPMailSend`/`SendGridMailSend`, update the record with the result. The `modules-mongodb` notifications module ships this as `dispatch-notifications` → `dispatch-notification-item` endpoints plus an inbox, bell, and landing page. See that repo, not this one.

## Package Responsibilities

| Package                        | Role in notification rendering                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `@lowdefy/build`               | Builds the `notifications:` section, the `RenderNotification` step, the type category      |
| `@lowdefy/api`                 | Runs the `RenderNotification` step (interpolate → validate → resolve links → render)       |
| `@lowdefy/email-templates`     | `renderEmail`, injection-safe `interpolateProperties`, `resolveLink`, the three templates  |
| `@lowdefy/connection-smtp`     | `SMTP` connection, `SMTPMailSend` request, delivery filter (used by the app-composed send) |
| `@lowdefy/connection-sendgrid` | Same delivery filter + `replyTo`; the SendGrid alternative for sending                     |
| `@lowdefy/server(-dev)`        | Places the template registry + render helpers on the api context                           |

## Data Structures

### `RenderNotification` step result

The full framework output for one item — the pipeline reads these off `_step.<id>`:

```javascript
{
  subject: string,   // interpolated subject
  title: string,     // interpolated title, falls back to subject
  preview: string,   // template preview, else markdown-stripped message excerpt
  html: string,      // rendered email HTML
  text: string,      // rendered email plain text
  data: object,      // the item, with links resolved to URLs
}
```

### Injection-safe interpolation

`interpolateProperties` (`packages/utils/email-templates/src/interpolate/`) escapes every interpolated value on two axes — HTML (Nunjucks autoescape) and markdown (a renderer escape pass over values) — then parses markdown with raw HTML disabled. Only author-written markdown formats; interpolated user data renders verbatim. A value of `[x](https://evil)` shows as literal text, never a link. `markdownProperties` on each template names which properties are markdown.

## Key Design Decisions

### Render primitive, not a pipeline step

**Question:** should the framework ship one `SendNotification` step that renders + stores + dedups + sends, or only a `RenderNotification` step?

**Decision:** only `RenderNotification`. The pipeline is composed in YAML (by apps or the modules layer).

**Rationale:** apply the test "does YAML physically prevent this?" Only rendering (React + escaping) and link-URL composition qualify. Storing is a `MongoDBInsertOne`; sending is an `SMTPMailSend`; the retry drain is a scheduled endpoint. A `SendNotification` step needed a `notificationAdapter` connection capability solely because framework JS cannot issue YAML requests — a cost the step created, not a primitive. And a framework pipeline competes with Lowdefy's own `modules-mongodb` layer, whose purpose is opinionated composition over primitives.

**Trade-offs:**

- Pro: any database (storing is a request) and any transport (sending is a request) work with zero framework changes.
- Pro: the notification record schema is owned by the module and evolves at module speed, not as a versioned framework contract.
- Pro: the framework surface is small — one step, three templates, one connection.
- Con: "Lowdefy has notifications" becomes "Lowdefy renders notification emails; the module has notifications." A non-module app writes ~60 lines of pipeline YAML.
- Con: pipeline correctness (insert-before-send dedup ordering, retry bookkeeping) is the module's responsibility, not a framework guarantee.

### Link resolution stays in the step

**Question:** should `RenderNotification` return only rendered content and let YAML compose URLs?

**Decision:** no — link resolution stays in the step; `serverUrl`, `landingPage`, and `recordId` are step properties.

**Rationale:** resolved URLs are baked into the email's buttons, so URL composition is part of producing a correct render, and the "links present but no server URL" check protects the rendered output. Composing landing URLs (`?_id=&option=<dotpath>`) from chained string operators in YAML would be fragile in every app. Making the inputs step properties (rather than the old `app.serverUrl`/`app.notificationLandingPage` app config) lets the caller — typically the module, via a module var — own them.

### `email.send` capability removed

**Question:** keep the `email.send` connection capability the old pipeline called?

**Decision:** deleted. Nothing consumed it once the pipeline moved to YAML.

**Rationale:** it was framework code serving no consumer — the exact smell the teardown removed. The shared `send()` function and delivery filter survive inside the connection packages, consumed by the `SMTPMailSend`/`SendGridMailSend` request types.

## Common Patterns

### The composed pipeline (reference shape)

```yaml
- :set_state:
    record_id: { _uuid: true } # before render — landing links embed it
- id: render
  type: RenderNotification
  properties: { notificationId: ..., data: ..., serverUrl: ..., landingPage: ..., recordId: ... }
- :try: # insert before send claims the dedup key
    - { id: insert, type: MongoDBInsertOne, ... } # data: the ORIGINAL item
  :catch: [...] # duplicate key → skip
- :if: [...] # send gate
  :then:
    - :try:
        - { id: send, type: SMTPMailSend, ... }
        - { id: mark_sent, type: MongoDBUpdateOne, ... }
      :catch: [...] # $inc send_attempts; never fail the routine
```

Store the **original** item in the record's `data` — the landing page reads link targets back out of it at the `option` dot-path; a resolved copy would redirect to itself.

## Error Handling

All `RenderNotification` failures are `ConfigError`s anchored to the step or notification config key: non-string `notificationId`, array/non-object `data`, unknown template type, missing render helpers (stale build), links without `serverUrl`, `landingPage` without `recordId`, interpolation failure, and template schema mismatch. The step never catches send or storage errors — it does neither.

## Extension Points

- **Custom templates** are plugins under the `notifications` type category — a React Email component receiving `{ properties, data, theme, links }`, a `schema`, and `markdownProperties`/`dataKeys` statics.
- **Any email transport** — the pipeline's send step is a plain request, so any email connection works.
- **Any database** — the pipeline's store step is a plain request.

## Related Topics

- [Build Pipeline](./build-pipeline.md)
- [Request Lifecycle](./request-lifecycle.md)
- [Plugin System](./plugin-system.md)
- [@lowdefy/connection-smtp](../plugins/connections/connection-smtp.md)
- [@lowdefy/email-templates](../utils/email-templates.md)

## Related Files

### Build Integration

- `packages/build/src/build/buildNotifications.js` — validates the `notifications:` section, namespaces ids
- `packages/build/src/build/writeNotifications.js` — writes `notifications/<id>.json` artifacts
- `packages/build/src/build/validateRenderNotificationSteps.js` — validates step notification-id references
- `packages/build/src/build/buildApi/buildRoutine/{validateStep,setStepId,countStepTypes}.js` — the step machinery
- `packages/build/src/build/writePluginImports/writeNotificationImports.js` — generates `plugins/notifications.js`
- `packages/build/src/lowdefySchema.js` — the `notification` definition and `app.email` theme

### API Integration

- `packages/api/src/routes/endpoints/handleRenderNotification.js` — the render step handler
- `packages/api/src/routes/endpoints/runRoutine.js` — dispatches the `notification:` prefix
- `packages/api/src/routes/notifications/getNotificationConfig.js` — loads the config artifact
- `packages/api/src/routes/notifications/resolveNotificationLinks.js` — link → URL composition
- `packages/api/src/routes/notifications/resolveThemeLogo.js` — relative theme logo → URL resolution
- `packages/api/src/routes/notifications/derivePreview.js` — preview text derivation

### Templates

- `packages/utils/email-templates/src/renderEmail.js` — React render to `{ html, text }`
- `packages/utils/email-templates/src/interpolate/interpolateProperties.js` — injection-safe interpolation
- `packages/utils/email-templates/src/resolveLink.js` — link resolution helper
- `packages/utils/email-templates/src/notifications/` — NotificationEmail, DigestEmail, AlertEmail
- `packages/utils/email-templates/src/components/`, `defaultTheme.js` — layout and theme

### Connections (used by the app-composed send)

- `packages/plugins/connections/connection-smtp/src/connections/SMTP/` — connection, `SMTPMailSend`, `applyMailFilter.js`
- `packages/plugins/connections/connection-sendgrid/src/connections/SendGridMail/` — SendGrid equivalent

### Server Integration

- `packages/servers/server/src/middleware/apiContext.js` — places the render helpers on the context
- `packages/servers/server-dev/src/middleware/apiContext.js` — dev server equivalent

### CLI

- `packages/cli/src/commands/emails/` — the `lowdefy emails` preview command

### Issues & PRs

- PR #2234 — Email notification rendering (the render-primitive teardown)
