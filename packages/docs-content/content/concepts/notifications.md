# Notifications

Lowdefy can render branded notification emails from config. You define a notification's content once in a `notifications:` section — as a template with interpolated properties — and render it from an API routine with the `RenderNotification` step. Rendering is all the framework does: **storing a notification, deduplicating, sending the email, and tracking delivery are composed in your API routines**, either by hand or with a notifications module.

This split is deliberate. Rendering an email safely (turning template properties and data into HTML, with a guarantee that user data can never inject links or markup) and composing link URLs are the two things config alone cannot do, so they live in the framework. Everything else — inserting a record, sending, retrying — is ordinary [requests](/connections-and-requests) and [API routines](/lowdefy-api), which you already have. A consequence worth knowing: because storing is just a request and sending is just a request, notifications work with any database and any email provider Lowdefy connects to.

## The `notifications:` section

`notifications:` is a root section. Each entry is `{ id, type, properties }`, where **the template is the type**:

```yaml
notifications:
  - id: task-assigned
    type: NotificationEmail
    properties:
      subject: 'New task: {{ task.title }}'
      title: Task assigned to you
      message: |
        Hi {{ contact.name }},

        **{{ task.title }}** has been assigned to you.
      metadata:
        - label: Due
          value: '{{ task.due_date }}'
      button:
        label: View task
    testData:
      contact:
        name: Jane Doe
      task:
        title: Review the quarterly report
        due_date: 2026-07-15
      links:
        button:
          pageId: task-view
          urlQuery:
            _id: T-001
```

The definition fields are:

- `id: string`: **Required** - A unique notification id, referenced by the `RenderNotification` step.
- `type: string`: **Required** - The template type — a built-in template (`NotificationEmail`, `DigestEmail`, `AlertEmail`) or a custom template plugin.
- `properties: object`: **Required** - The template's content. `properties.subject` is always required; the rest depend on the template type.
- `theme: object`: Per-notification overrides of the `app.email` theme (see [Theming](#theming)).
- `testData: object`: Sample data used to render the notification in the [email preview](#previewing-emails). Not used at runtime.

### Module notifications

Modules can ship notification templates: `module.lowdefy.yaml` accepts a `notifications:` section, and each template's id scopes to `{entry}/{id}` (installing `user-admin` gives `user-admin/invite-user`), so the same module installed twice never collides. Module content references its own templates with [`_module.notificationId`](/_module) — in a `RenderNotification` step or a dispatch payload — and app-level config reaches a module's template with the object form (`_module.notificationId: { id: invite-user, module: user-admin }`) or the literal scoped string. This lets a module that drives a notification flow (like user invites) ship its default email instead of every app hand-writing it. Module notifications resolve `_module.var` in their properties, so template copy can be configured through the module's vars.

### Interpolation

Template property strings interpolate against the render data with [Nunjucks](https://mozilla.github.io/nunjucks/) — `{{ task.title }}` just works, including `{% if %}` conditionals. This applies inside `notifications:` properties only.

Interpolated values are **inert** — they can never carry markup or links. A task title of `[click here](https://evil.example)` renders as literal text, not a link. Only the markdown you write in the template formats; the data you interpolate is escaped. This closes the injection risk of putting user data into a branded email.

There is no operator evaluation inside template properties — they are data templates, not operator config. Build-time operators like [`_ref`](/references-and-templates) still work as everywhere else.

### Links

Links live under `data.links` (and inside the arrays a template declares, like `data.actions`), supplied as Lowdefy-native `{ pageId, urlQuery }` objects. The `RenderNotification` step resolves them to full URLs at render time — see [Rendering notifications as a routine step](/lowdefy-api#rendering-notifications-as-a-routine-step). A link that is already an absolute URL string passes through unchanged.

## Built-in templates

Three templates cover most needs. Each renders only the sections you provide — omit `quote` and no quote block appears.

### NotificationEmail

The general-purpose template.

- `subject: string`: **Required** - Email subject line.
- `title: string`: Heading shown at the top of the email.
- `message: string`: Main message, rendered as markdown.
- `preview: string`: Preview text shown in email client inbox listings.
- `metadata: object[]`: Label-value pairs rendered as a table. Each item is `{ label, value }`.
- `quote: object`: A quoted block, `{ text, author }`.
- `button: object`: A call-to-action button, `{ label }`. Its link is resolved from `data.links.button`.

Renders one data key: `data.actions` — an array of `{ title, message, link }` action items, shown as an action list.

### DigestEmail

For roundups of many items.

- `subject: string`: **Required** - Email subject line.
- `title: string`: Heading shown at the top of the email.
- `intro: string`: Introductory text, rendered as markdown.
- `button: object`: A call-to-action button, `{ label }`, linked from `data.links.button`.

Renders one data key: `data.items` — an array of `{ title, message, link, meta }` rows.

### AlertEmail

For status-toned notices.

- `subject: string`: **Required** - Email subject line.
- `tone: string`: One of `info`, `success`, `warning`, or `error`. Sets the accent color.
- `title: string`: Heading shown at the top of the email.
- `message: string`: Main message, rendered as markdown.
- `metadata: object[]`: Label-value pairs rendered as a table.
- `button: object`: A call-to-action button, `{ label }`, linked from `data.links.button`.

### Structured data (`actions`, `items`)

Structured arrays are never wired in config — a template documents the data keys it renders, and your pipeline supplies the array under that key (`data.actions` for `NotificationEmail`, `data.items` for `DigestEmail`). Each item's `link` field is resolved to a URL the same way `links.button` is.

## Theming

One theme per app, under `app.email`:

```yaml
app:
  email:
    logo: https://cdn.myapp.com/logo.png
    companyName: MyApp
    primaryColor: '#1990ff'
    signature: |
      Regards,
      The MyApp Team
    footer: You receive these emails because you have a MyApp account.
```

The layout — logo header, greeting, content, signature, footer — is fixed; the theme parameterizes it. A notification can override any theme field (for example a sub-brand logo) with a `theme:` object; overrides shallow-merge over `app.email`.

Two fields default from your existing app config when you don't set them: `companyName` from the app's root `name:`, and `primaryColor` from `theme.antd.token.colorPrimary` — so a branded app gets branded emails without repeating itself. Set a field explicitly (an empty string works as an opt-out for `companyName`) to override the derived value.

The `logo` can be an app-relative path to a `public/` asset:

```yaml
app:
  email:
    logo: /logo-light-theme.png
```

A relative logo resolves against the `serverUrl` passed to the `RenderNotification` step, so one config works across environments. Email clients can only load absolute URLs — when no `serverUrl` is available the logo is omitted and the header falls back to the `companyName` text.

## Custom templates

Rich emails beyond the built-in templates are plugins — plain [React Email](https://react.email/) components. A custom template exports a component receiving `{ properties, data, theme, links }` and a properties schema, and declares its type under a new `notifications` type category — the same registration pattern as other [plugins](/plugins-introduction). Once installed, use it as a `type` in the `notifications:` section like any built-in template.

## Sending notifications

The framework renders; the pipeline is yours to compose. In an API routine you:

1. Render the notification with a [`RenderNotification` step](/lowdefy-api#rendering-notifications-as-a-routine-step), which returns `{ subject, title, preview, html, text, data }`.
2. Store a record with an ordinary request (for example `MongoDBInsertOne`) if you want an inbox, deduplication, or retries.
3. Send the email with an email request — [`SMTPMailSend`](/SMTP) or [`SendGridMailSend`](/SendGridMail).
4. Update the record with the send result.

That pipeline is about sixty lines of routine YAML, and you own every choice in it — record shape, deduplication strategy, retry policy. If you'd rather not write it, the official [`modules-mongodb` notifications module](https://github.com/lowdefy/modules-mongodb) ships the whole pipeline (dispatch, dedup, send, tracking) plus an inbox, bell, and mark-as-read landing page — you just define the templates and shape your events into notification items.

## Previewing emails

The [`lowdefy emails`](/cli#emails) CLI command renders every notification from its `testData` and opens [React Email](https://react.email/)'s preview server, so you can iterate on templates without sending real mail. It warns when a template renders a data key that your `testData` is missing. The preview has no server URL, so a relative `logo` falls back to the `companyName` text header there.
