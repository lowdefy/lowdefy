---
'@lowdefy/connection-sendgrid': minor
'@lowdefy/connection-smtp': minor
---

feat: Mail send requests return per-message send results

`SendGridMailSend` and `SMTPMailSend` now return a `results` array with one entry per message sent, so routines can record delivery outcomes:

- Each result includes the post-filter `to` — the address mail was actually delivered to after the connection `filter` (`replaceAddress`, `allowlist`, `regex`) is applied. When a filter redirects mail to a test inbox, routines can now persist both the intended recipient and where the message really went.
- Messages dropped entirely by the filter return `{ messageId: null, to: null, filtered: true }`.
- `SendGridMailSend` previously discarded send results and returned only a response string; it now returns `results` with the SendGrid `messageId` per message, matching `SMTPMailSend`.
- `SMTPMailSend` results keep nodemailer's `accepted` and `rejected` alongside the new `to`.
