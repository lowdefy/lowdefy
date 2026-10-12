---
'@lowdefy/server-dev': minor
'@lowdefy/api': patch
---

feat(server-dev): Walled-client plugins run and click through in journey data sets

A plugin connection type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) can now declare `meta: { dataSet: 'walled' }`. Under a journey data set its connection passes unchanged, and the walled connections it names take the run's database, so its writes land in the journey's own database.

The data-set click rails now follow the same declarations as the data session: a click is refused only when a connection it reaches declares `external`, declares nothing, or has no connection artifact. `redirect` and `walled` types can be clicked whatever their name. The refusal names the declaration, for example `Block "send_invoice" reaches connection "billing_api" (AxiosHttp, dataSet: external), which reaches a real service, so a data-set journey cannot click it.`

Under `auth.organizations.policy: tenant`, the check that refuses unwalled connections holding a walled database's URI now reads the build directly. It gives the same verdict inside and outside journey data sets, whichever request runs first after a build.
