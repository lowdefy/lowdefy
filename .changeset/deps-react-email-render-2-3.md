---
'@lowdefy/email-templates': patch
---

fix(deps): Update @react-email/render to 2.3.1

@react-email/render 2.3.1 puts each table cell on its own line in the plain-text version of an email, so content laid out in rows and columns no longer runs together, and loads prettier only when pretty output is asked for.
