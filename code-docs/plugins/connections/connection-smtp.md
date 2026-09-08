---
plugin: '@lowdefy/connection-smtp'
category: connections
updated: 2026-07-06
---

# @lowdefy/connection-smtp

[nodemailer](https://nodemailer.com/) SMTP integration for Lowdefy — send email over any SMTP server.

## Purpose

One connection type for every SMTP provider: Amazon SES, Postmark, Mailgun, Resend, SendGrid's SMTP relay, or a self-hosted server. Connection properties pass through to nodemailer's transport, so any transport shape nodemailer accepts (pooling, TLS, a `service` shortcut, a connection `url`) works alongside the documented properties. This is the transport used by the [notification rendering](../../architecture/notifications.md) pipeline's send step, but it is a general-purpose email connection usable from any routine or request.

## Provided Types

Declared in `src/types.js`:

| Type           | Kind       | Description                                     |
| -------------- | ---------- | ----------------------------------------------- |
| `SMTP`         | connection | An SMTP transport (from address, auth, filter)  |
| `SMTPMailSend` | request    | Send one email, or an array of emails           |

## Architecture

### Connection

`src/connections/SMTP/SMTP.js` exports `{ schema, requests: { SMTPMailSend } }`. The schema (`schema.js`) requires `from`, defines `email`/`emails` types (string `Name <addr>` or `{ name, email }`), and adds `replyTo` and a delivery `filter`; `additionalProperties: true` lets nodemailer transport options (`host`, `port`, `secure`, `auth`, plus anything else) pass through. `transportSchema.js` documents the common transport fields as a shared schema seam (also consumed by the auth email config).

### Request and the shared send path

`SMTPMailSend/SMTPMailSend.js` accepts one mail object or an array and calls the shared `send()` (`src/connections/SMTP/send.js`) per message. `send()` applies the connection's delivery filter, then `nodemailer.createTransport(...).sendMail(...)`, closing the transport in a `finally` (matters when `pool: true`). Because both the request type and any future caller route through `send()`, the delivery filter has exactly one enforcement point.

> **Note:** an `email.send` connection *capability* (a JS door for framework code to send without knowing request names) was removed in PR #2234 — it became consumerless when the notification pipeline moved to YAML. The `send()` function and filter remain; `SMTPMailSend` is their consumer.

### Delivery filter

`applyMailFilter.js` implements environment-aware filtering, applied to every send. Filter values are typically supplied by `_secret`, so any field resolving to `null` is ignored — an unset filter is disabled, letting one config serve every environment.

- `replaceAddress` — short-circuits: all mail redirects to this single address, `cc`/`bcc` dropped.
- `allowlist` — only recipients whose domain is in the list are kept.
- `regex` — only recipient addresses matching the pattern are kept.

`allowlist` and `regex` combine. When every `to` recipient is filtered out, `send()` returns without sending (`applyMailFilter` returns `null`).

## Key Implementations

### SMTPMailSend

**Location:** `src/connections/SMTP/SMTPMailSend/`

**Purpose:** send transactional email.

**Options:** `to` (required), `cc`, `bcc`, `replyTo`, `subject`, `text`, `html`, `attachments[]` (`filename`/`content`/`path`/`contentType`/`encoding`/`cid`). Accepts a single object or an array of them.

**Example usage context:**

```yaml
connections:
  - id: smtp
    type: SMTP
    properties:
      host: smtp.example.com
      port: 465
      secure: true
      auth:
        user: my-user
        pass:
          _secret: SMTP_PASS
      from: App <no-reply@example.org>
      filter:
        replaceAddress:
          _secret: DEV_CATCH_ALL # unset in prod → filter disabled
requests:
  - id: send_reminder
    type: SMTPMailSend
    connectionId: smtp
    properties:
      to: someone@example.org
      subject: Reminder
      text: Please water the plants.
```

## Patterns & Conventions

- **Transport passthrough** — the connection is a thin nodemailer wrapper; it does not re-validate transport options, deferring to nodemailer.
- **Single filter enforcement point** — all sends go through `send()`, so the filter cannot be bypassed.
- **Secret-driven filter** — `null` filter fields are no-ops, so the same config is safe across dev/sandbox/prod.

## Dependencies

**Key external:**

- `nodemailer` — SMTP transport and sending — [Documentation](https://nodemailer.com/)

## Design Decisions

- **One connection for all SMTP providers.** Rather than a connection per provider, transport passthrough covers every SMTP service with one type; provider differences are just transport options.
- **Filter in the connection, not the request.** Delivery filtering is an environment concern, so it lives on the connection (one place, secret-driven) rather than being repeated on every send.

## Related

- [Notification Rendering](../../architecture/notifications.md) — the pipeline that composes `SMTPMailSend` after `RenderNotification`
- [@lowdefy/connection-sendgrid](./sendgrid.md) — the SendGrid alternative, with the same delivery filter
