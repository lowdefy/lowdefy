# SMTP Email

The `SMTP` connection sends email over any SMTP server — Amazon SES, Postmark, Mailgun, Resend, SendGrid's SMTP relay, or a self-hosted server. One connection type covers every provider.

The `SMTP` connector uses the [nodemailer](https://nodemailer.com/) library. Connection properties are passed through to nodemailer's transport, so any [transport option](https://nodemailer.com/smtp/) nodemailer accepts (pooling, TLS options, a `service` shortcut, a connection `url`) can be set alongside the documented properties.

> Secrets like passwords and API keys should be stored using the [`_secret`](operators/secret.md) operator.

## Connections

Connection types:
  - SMTP

## Requests

Request types:
  - SMTPMailSend

### Types

- `email: string | object`: An email address as either a `string` or an `object`.
  - `string`: In the format `someone@example.org` or `Some One <someone@example.org>`.
  - `object`: With `name` and `email` properties, for example `{ "name": "Some One", "email": "someone@example.org" }`.
- `emails: email | email[]`: A single email address or a list of email addresses.

### SMTP

#### Properties

- `host: string`: Hostname or IP address of the SMTP server to connect to.
- `port: integer`: Port to connect to. Defaults to `587` when `secure` is `false`, or `465` when `secure` is `true`.
- `secure: boolean`: If `true`, the connection uses TLS when connecting to the server.
- `auth: object`: Authentication credentials for the SMTP server.
  - `user: string`: Username to authenticate with.
  - `pass: string`: Password to authenticate with.
- `from: emails`: __Required__ - Default email address to send email from.
- `replyTo: emails`: Default email address replies should be sent to.
- `filter: object`: Environment-aware delivery filter, applied to every send. See [Delivery filter](#delivery-filter) below.

Additional nodemailer transport options (for example `service`, `url`, `pool`, `tls`) are passed through unchanged.

### SMTPMailSend

Sends one email, or an array of emails. When an array is given, each message is sent in turn.

#### Properties

##### object

A `mail description`:
- `to: emails`: __Required__ - Email address or addresses to send to.
- `cc: emails`: Email address to cc in communication.
- `bcc: emails`: Email address to bcc in communication.
- `replyTo: emails`: Email address to reply to. Overrides the connection `replyTo`.
- `subject: string`: Email subject.
- `text: string`: Email message in plain text format.
- `html: string`: Email message in html format.
- `attachments: object[]`: List of email attachments to include with the email.
  - `filename: string`: Name of the attachment file.
  - `content: string`: String content of the attachment.
  - `path: string`: File path or URL to stream the attachment from.
  - `contentType: string`: The mime type of the content you are attaching. For example, `text/plain` or `text/html`.
  - `encoding: string`: Encoding used to decode string `content` into a buffer. For example, `base64` or `hex`.
  - `cid: string`: Content id to reference the attachment as an embedded image in html.

##### array

An array of `mail description` objects can also be provided.

### Delivery filter

The connection's `filter` is applied to every message before it is sent — from `SMTPMailSend` requests, notification pipelines, and any other send over the connection. It has one enforcement point, so no send can bypass it. Because filter values are usually supplied by [`_secret`](operators/secret.md), any field that resolves to `null` or `undefined` is ignored — an unset filter is disabled. This lets one connection config serve every environment: development sets a catch-all, a sandbox sets a domain allowlist or regex, production sets nothing.

- `replaceAddress: string`: Redirect all mail to this single address. When set, it takes precedence — every message is delivered to this address only, with `cc` and `bcc` dropped. Use it to catch all outbound mail in development.
- `allowlist: string[]`: A list of domains. Only recipients whose domain is in the list are sent to; others are dropped. When every `to` recipient is filtered out, the message is not sent.
- `regex: string`: A regular expression. Only recipient addresses matching the pattern are sent to.

`allowlist` and `regex` combine — a recipient must satisfy both to receive mail.

### Examples

###### Send a reminder email

```yaml
connections:
  - id: my_smtp
    type: SMTP
    properties:
      host: smtp.example.com
      port: 465
      secure: true
      auth:
        user: my-smtp-user
        pass:
          _secret: SMTP_PASS
      from: Reminders <reminders@example.org>
# ...
requests:
  - id: send_reminder
    type: SMTPMailSend
    connectionId: my_smtp
    properties:
      to: Harry Potter <harry@example.org>
      subject: Reminder for Mr. Potter to water the 🌱
      text: |
        Hi Harry

        Please remember to water the magic plants today :)

        Thank you
# ...
```

###### Catch all mail in a development environment

```yaml
connections:
  - id: my_smtp
    type: SMTP
    properties:
      host: smtp.example.com
      auth:
        user: my-smtp-user
        pass:
          _secret: SMTP_PASS
      from: App <no-reply@example.org>
      filter:
        # In dev, DEV_CATCH_ALL is set and all mail is redirected to it.
        # In production the secret is unset, so the filter is disabled.
        replaceAddress:
          _secret: DEV_CATCH_ALL
```

###### Send over SendGrid's SMTP relay

```yaml
connections:
  - id: my_smtp
    type: SMTP
    properties:
      host: smtp.sendgrid.net
      port: 465
      secure: true
      auth:
        user: apikey
        pass:
          _secret: SENDGRID_API_KEY
      from: App <notify@example.org>
```
