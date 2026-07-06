---
'@lowdefy/api': minor
'@lowdefy/build': minor
'lowdefy': minor
'@lowdefy/connection-sendgrid': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/email-templates': minor
'@lowdefy/nunjucks': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Email notification rendering

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
