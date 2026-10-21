# @lowdefy/email-templates

## 7.1.0

### Patch Changes

- @lowdefy/helpers@7.1.0
- @lowdefy/nunjucks@7.1.0

## 7.0.0

### Minor Changes

- 46d28c4: feat(email-templates): Notification templates can render a data value as markdown with the `markdown` filter. `message: "{{ intro }}\n\n{{ body | markdown }}"` keeps `intro` escaped and renders `body` as headings, lists, links and images, for markdown the app wrote itself, such as a release note body. Raw HTML stays escaped in a filtered value, every value without the filter renders as before, and the filter changes nothing in plain properties like `subject`. Rendered images now get `max-width:100%;height:auto;` so they fit the email column.
- 31605fb: Notification and email links to patterned pages: a `{ pageId, urlQuery, pathParams }` link builds its URL from the page's pattern in `routes.json` with `buildPagePath`, and a missing path value fails with the builder's error. The stored notification record keeps `pathParams` on the link object. `resolveLink` in `@lowdefy/email-templates` now takes `{ link, paths }`, `buildPreviewProps` takes `paths`, and `lowdefy emails` passes the page paths from `routes.json`.

### Patch Changes

- chore: Update `nodemailer` to 10.0.13 in `connection-smtp` and `markdown-it` to 14.3.1 in `email-templates`.
- 550be9f: feat(api,client,build): email one-time code sign-in, and the magic-link email carries the code

  Magic-link sign-in fails behind corporate mail security that opens links before the
  person does: the scanner follows the link, the single-use token is spent, and the
  click that follows is rejected. Apps can now offer a one-time code instead. Enable
  `auth.emailOTP` and the app emails a short code the person types into the tab they
  started from, which no link scanner can consume, and which also works when the email
  is read on a different device from the one signing in. Two new actions drive it,
  `EmailOtpSend` and `EmailOtpVerify`.

  With both `auth.magicLink` and `auth.emailOTP` enabled, the magic-link email carries
  the code as well, so one email serves both paths and nothing about the existing
  `Login` flow changes: the person clicks the button, or falls back to typing the code.

- e5cffa6: feat(api,client,build,actions-core): magic-link landing page keeps the token unconsumed until a real click

  A magic-link sign-in token can only be used once, and the auth server spends it on
  the first request to the link — including a request nobody made. Corporate email
  security (Microsoft Defender Safe Links, Proofpoint URL Defense, Mimecast) opens
  every link in a message as it is delivered, so by the time the person clicks, the
  link is already used up and they land on the error page.

  Set the new `auth.authPages.magicLink` to a page in your app and the sign-in email
  links there instead, carrying the token and the sign-in destinations along. The
  page just sits there when a scanner fetches it; a button on it runs the new
  `MagicLinkVerify` action, which finishes the sign-in. The token is only spent when
  a person clicks, so scanned mailboxes can sign in again.

  `MagicLinkVerify` needs no configuration — it reads the token and the destinations
  from the page's own address. Bind it to a button click, never to page load: a
  scanner that runs the page's JavaScript would use up the token all the same.

  Leave `auth.authPages.magicLink` unset and magic-link sign-in behaves exactly as
  before. The sign-in email also now shows the link as readable text under the
  button, for mail clients that strip or rewrite buttons.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [81bd4f0]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/nunjucks@7.0.0

## 6.1.0

### Patch Changes

- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0
  - @lowdefy/nunjucks@6.1.0

## 6.0.0

### Minor Changes

- 742a900: feat: Email notification rendering

  Lowdefy apps can now define notifications in config: branded emails rendered from framework templates, delivered over any SMTP provider. The framework renders; storing and sending are composed in YAML routines — so any database works through its normal request types, and apps or modules own the notification record.

  **`notifications:` config section (`@lowdefy/build`, `@lowdefy/api`)**

  - New root section where the template is the type: `{ id, type, properties }` with per-notification `theme` overrides and `testData`
  - Template properties are nunjucks data templates — `{{ task.title }}` interpolates against the pipeline's data with no operator syntax; interpolated values are inert (can never inject markup or links)
  - New `RenderNotification` API routine step: renders one data item per call and returns `{ subject, title, preview, html, text, data }` where `data` is the link-resolved item — inserting the record, deduplicating, sending and updating send results are plain routine steps (`:for`, requests, `_uuid`)
  - New `app.email` theme settings (logo, companyName, primaryColor, signature, footer)
  - Link resolution is driven by the step's `serverUrl`, `landingPage` and `recordId` properties: `{ pageId, urlQuery }` links resolve to direct page URLs, or through a landing page (`?_id=<recordId>&option=<dotpath>`) that can mark the record read before redirecting (for example the modules-mongodb notifications module's link page)

  **Email templates (`@lowdefy/email-templates`)**

  - Three React Email templates: `NotificationEmail` (message, metadata table, quoted comment, CTA button, action list), `DigestEmail` (item roundups) and `AlertEmail` (status-toned notices)
  - Sections render only when configured; markdown in `message` with raw HTML disabled
  - Custom templates are plain React Email plugin packages under the new `notifications` type category

  **SMTP connection (`@lowdefy/connection-smtp`)**

  - New `SMTP` connection wrapping nodemailer — works with SES, Postmark, Mailgun, Resend and self-hosted servers; `SMTPMailSend` request type
  - Environment-aware delivery `filter` (`replaceAddress` catch-all, domain `allowlist`, `regex`) applied to every send

  **SendGrid (`@lowdefy/connection-sendgrid`)**

  - Supports the same delivery `filter` and default `replyTo`; interchangeable with SMTP wherever a routine sends notification emails
  - Array requests now send per message; request-level `templateId` is no longer overridden by an unset connection `templateId`

  **Preview CLI (`lowdefy`)**

  - New `lowdefy emails` command: builds the app, generates a preview per notification from its `testData`, and opens React Email's preview server; warns when a template data key is missing from `testData`

  Builds also now validate that `CallAgent` steps reference existing agents — previously this check existed but never ran, so broken agent references that used to build will now fail with a config error.

### Patch Changes

- Updated dependencies [742a900]
- Updated dependencies [6446ae6]
  - @lowdefy/nunjucks@6.0.0
  - @lowdefy/helpers@6.0.0
