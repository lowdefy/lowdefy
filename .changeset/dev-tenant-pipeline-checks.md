---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

fix(build,server-dev): Run the tenant pipeline checks on page requests under `lowdefy dev`

Under `auth.organizations.policy: tenant`, the build checks page requests for aggregation stages the tenant wall can not scope without `tenant: authored`, and for `$out`/`$merge` from a shared connection into a walled collection. The dev server builds each page on demand and did not restore the connection facts those checks read, so they only ran in a full `lowdefy build`. The dev server now restores them, so the same config errors show up while developing.
