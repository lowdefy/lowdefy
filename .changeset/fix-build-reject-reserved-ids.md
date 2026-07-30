---
'@lowdefy/build': patch
---

fix(build): Reject reserved names as page, request, connection, endpoint and step ids.

`validIdPattern` allowed letters and underscores, so `__proto__` and `constructor` passed as ids. The
engine keys plain-object registries on these ids, so a reserved id re-parented the registry instead of
adding an entry — a build-clean config that fails at runtime. `validateId` now rejects the
reserved names with a located `ConfigError`.

Apps using a reserved name as an id will now fail the build. Rename the id.
