---
'@lowdefy/api': patch
'@lowdefy/connection-smtp': patch
'@lowdefy/server-dev': patch
---

fix(deps): Update nodemailer to 10.5.0, smtp-server to 3.21.4 and postal-mime to 4.2.1

Updates `nodemailer` (the SMTP connection and auth emails) to 10.5.0, with fixes to address
parsing, DKIM domain encoding and header encoding. The dev server's mail capture moves to
`smtp-server` 3.21.4, which hardens the connection lifecycle and closes a STARTTLS plaintext
injection race, and `postal-mime` 4.2.1, with many MIME and address parsing fixes.
