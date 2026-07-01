---
'@lowdefy/connection-google-sheets': minor
---

Update the Google Sheets connection to the latest `google-spreadsheet` library.

Internal upgrade of the underlying Google Sheets library (and its Google authentication dependency) to
a current, actively maintained version. This also resolves a crash on Node.js 26. Connection
configuration is unchanged — existing API-key and service-account setups keep working exactly as before.
