---
'@lowdefy/connection-google-sheets': patch
---

fix(deps): Update google-auth-library to 11.3.4

Updates `google-auth-library`, used to sign in to Google Sheets with a service account, from 9.15.1
to 11.3.4. Requests now go through `fetch` instead of the old gaxios transporter. The
`GoogleSheet` connection's properties and request results are unchanged.
