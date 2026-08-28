---
'@lowdefy/build': patch
---

fix(build): Reject reserved names as page, request, connection, endpoint, step and block ids.

`validIdPattern` allowed letters and underscores, so `__proto__` and `constructor` passed as ids. The
engine keys plain-object registries on these ids, so a reserved id re-parented the registry instead of
adding an entry — a build-clean config that fails at runtime. `validateId` now rejects the
reserved names with a located `ConfigError`.

Block ids are dot-paths that nest state, so they don't go through `validateId` and are checked
separately, per dot-separated segment: `a.constructor.b` is rejected, while `a\.constructor` (an
escaped literal dot, a single segment named "a.constructor") still builds.

Apps using a reserved name as an id, or as a block id path segment, will now fail the build. Rename
the id.

`buildAuth` reaches page, endpoint and agent ids before `validateId` does, and keys plain-object role
maps on them, so a reserved id there read through `Object.prototype` — silently marking the entity
protected with `Object.prototype` as its roles, which then corrupted every plain object in the build.
Those ids are now gated where `buildAuth` first touches them. Collected build errors are deduplicated
on resolved source line plus message, so an id rejected by both gates reads as one error.
