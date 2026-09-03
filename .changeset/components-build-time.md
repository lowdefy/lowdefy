---
'@lowdefy/build': minor
'@lowdefy/operators': minor
'@lowdefy/operators-js': minor
'@lowdefy/docs': patch
---

feat(build): components are a build-time feature; the `_prop` operator is removed

Components are a typed, id-namespacing, slot-filling `_ref`. The `_prop` operator has been removed: it was never populated at runtime, so a `_prop` the build could not inline resolved silently to `undefined`; any marker that survives expansion is now a located build error under the `component` check slug. Declare components as a map keyed by id (`components: { AnswerPill: { props, slots, blocks } }`); the array form still builds but warns.

Several silent failures are fixed: a `_prop` in a body block's `requests` (or any other block key) is inlined instead of shipping dead; slot content written with the deprecated `areas:` key at a use site is honoured instead of being deleted; an unsupplied optional prop with no default is absent, so the block's own default applies, instead of becoming `null`; build-time operators and `${ }` provenance inside a component body survive expansion; a body reading an undeclared prop, and a component whose name collides with an installed block type, are build errors.
