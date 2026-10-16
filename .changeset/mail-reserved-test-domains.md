---
'@lowdefy/connection-smtp': patch
'@lowdefy/connection-sendgrid': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

The SMTP and SendGridMail connections now drop every recipient on the reserved `.invalid` domain (the domain `invalid` and any `*.invalid`, which RFC 6761 says never resolve) before the delivery filter runs. Case is ignored. They are removed from `to`, `cc` and `bcc` on every send, in every environment, with no filter and with `filter: false`, and for auth emails too.

Before, a `replaceAddress` catch-all redirected mail for test users (`user@audit.invalid`, say) into the team's inbox, so apps had to skip email for test users themselves. Now, when every `to` recipient is on `.invalid`, nothing is sent and the send reports `{ messageId: null, to: null, filtered: true }`, as a fully filtered message does. When some `to` recipients remain, `replaceAddress`, `allowlist` and `regex` apply to those as before.

Use `.invalid` for test users that must never receive mail, and `example.com` or `.test` for journey users whose mail a journey reads from the dev server's SMTP catcher.
