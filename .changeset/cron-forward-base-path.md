---
'@lowdefy/api': patch
---

fix(api): A forwarded cron pings the target environment's `<basePath>/api/cron/<endpointId>`. It pinged `<url>/api/cron/<endpointId>`, so with `config.basePath` set every forwarded schedule missed the app's cron route.
