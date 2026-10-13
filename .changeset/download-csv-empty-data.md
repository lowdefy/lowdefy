---
'@lowdefy/plugin-csv': patch
---

fix(plugin-csv): `DownloadCsv` no longer throws `csvMake data takes an array of objects` when `data` is an empty array or missing, for example a request or filter that returned no rows. The file now downloads with only the header row from `fields`, or as an empty file when `fields` is not set. Every row is now validated, not just the first, so a malformed row raises the action's own error instead of a confusing failure while building the CSV.
