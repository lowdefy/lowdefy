---
'@lowdefy/connection-smtp': patch
'@lowdefy/connection-sendgrid': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

The SMTP and SendGridMail connections now drop every recipient on the reserved `.invalid` domain (the domain `invalid` and any `*.invalid`, which RFC 6761 says never resolve) before the delivery filter runs. Case is ignored. Surrounding spaces and a trailing dot are ignored too. They are removed from `to`, `cc` and `bcc` on every send, in every environment, with no filter and with `filter: false`, and for auth emails too.

Before, a `replaceAddress` catch-all redirected mail for test users (`user@audit.invalid`, say) into the team's inbox, so apps had to skip email for test users themselves. Now only the `.invalid` addresses are dropped and every other recipient still gets the mail:

- SMTP checks each address in a comma-separated string on its own and keeps the others. SendGrid reads a string as one address, so it drops a comma-separated string only when every address in it is on `.invalid`.
- When every `to` recipient is on `.invalid`, the remaining `cc` and `bcc` recipients still get the mail. SMTP sends it without a To header; SendGrid, which needs a `to` recipient, sends each of them their own copy.
- When no recipient is left, nothing is sent and the send reports `{ messageId: null, to: null, filtered: true }`, as a fully filtered message does. Otherwise `replaceAddress`, `allowlist` and `regex` apply to the remaining recipients as before.

Use `.invalid` for test users that must never receive mail, and `example.com` or `.test` for journey users whose mail a journey reads from the dev server's SMTP catcher.
