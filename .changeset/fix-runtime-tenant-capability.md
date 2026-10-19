---
'@lowdefy/build': patch
'@lowdefy/api': patch
---

fix(api,build): Resolve tenant capability for non-scoping connection types.

Under `auth.organizations.policy: tenant`, `resolveTenant` read the tenant
capability from the runtime connection export, but the declarations live in
build-side `types.js` connectionMetas — and only `MongoDBCollection` mirrored
its capability onto the runtime export. Every other connection type (SMTP,
SendGrid, AxiosHttp, the AI connections, and third-party plugin types) threw a
ConfigError on first use under the tenant policy; the first real-world hit was
every notification email send.

The build now stamps the validated capability onto each connection artifact
(`tenantCapability`), and `resolveTenant` serves from it when the runtime
export carries no meta — one source of truth, so build-declared capability and
runtime behavior can no longer diverge, and third-party types are covered
without any package changes. The runtime meta still wins when present, a stamp
of `true` without runtime enforcement refuses as version drift instead of
serving unscoped, and a type declaring nothing anywhere keeps its fail-closed
build and runtime errors.
