---
'@lowdefy/build': patch
---

The dev server's page artifacts no longer carry each request's `properties`, `type`, `connectionId` and `auth`. Pages built on demand, and pages written inline in `lowdefy.yaml`, now keep those keys only in the request artifacts the server reads, as the production build does, so the dev client receives the same page config as production.
