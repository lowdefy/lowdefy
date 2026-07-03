---
'@lowdefy/api': minor
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/connection-sendgrid': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/email-templates': minor
'@lowdefy/nunjucks': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Built-in email notifications

Lowdefy apps can now define notifications in config: branded emails rendered from framework templates, stored per recipient, delivered over any SMTP provider, with in-app inbox data and a mark-as-read landing page.

**`notifications:` config section (`@lowdefy/build`, `@lowdefy/api`)**

- New root section where the template is the type: `{ id, type, properties }` with `emailConnectionId`, `dataConnectionId`, optional `delivery: deferred`, per-notification `theme` overrides and `testData`
- Template properties are nunjucks data templates — `{{ task.title }}` interpolates against the pipeline's data with no operator syntax; interpolated values are inert (can never inject markup or links)
- New `SendNotification` API routine step: renders the template, stores the record (with `deduplication_key` support), and sends inline or defers to a scheduled drain endpoint
- New `app.email` (logo, companyName, primaryColor, signature, footer), `app.serverUrl` and `app.notificationLandingPage` settings
- Email links go directly to their target pages by default; set `app.notificationLandingPage` to route them through a landing page (for example the modules-mongodb notifications module's link page) that marks the record read before redirecting

**Email templates (`@lowdefy/email-templates`)**

- Three React Email templates: `NotificationEmail` (message, metadata table, quoted comment, CTA button, action list), `DigestEmail` (item roundups) and `AlertEmail` (status-toned notices)
- Sections render only when configured; markdown in `message` with raw HTML disabled
- Custom templates are plain React Email plugin packages under the new `notifications` type category

**SMTP connection (`@lowdefy/connection-smtp`)**

- New `SMTP` connection wrapping nodemailer — works with SES, Postmark, Mailgun, Resend and self-hosted servers; `SMTPMailSend` request type
- Environment-aware delivery `filter` (`replaceAddress` catch-all, domain `allowlist`, `regex`) applied to every send

**SendGrid (`@lowdefy/connection-sendgrid`)**

- Supports the same delivery `filter` and default `replyTo`; interchangeable with SMTP wherever a notification references an email connection
- Array requests now send per message; request-level `templateId` is no longer overridden by an unset connection `templateId`

**MongoDB storage (`@lowdefy/connection-mongodb`)**

- Notification records are stored with rendered content, so retries, deferred drains, inboxes and mark-as-read are plain YAML requests over the record schema; duplicate keys are enforced with a unique partial index

**Preview CLI (`lowdefy`)**

- New `lowdefy emails` command: builds the app, generates a preview per notification from its `testData`, and opens React Email's preview server; warns when a template data key is missing from `testData`

Builds also now validate that `CallAgent` steps reference existing agents — previously this check existed but never ran, so broken agent references that used to build will now fail with a config error.
