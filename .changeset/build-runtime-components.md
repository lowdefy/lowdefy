---
'@lowdefy/build': minor
'@lowdefy/operators-js': minor
'@lowdefy/operators': patch
'@lowdefy/docs': patch
---

feat(build): Runtime components with typed props (core).

Adds a runtime component: a reusable block tree with a typed prop surface and consumer-filled slots,
addressed by a namespaced `type:`. It is the missing layer between `_ref` (a build-time macro) and a
React block plugin (JavaScript in a package).

A component is declared one-per-file, `components/<name>.yaml` with `{ id, props, slots, blocks }`,
and discovered the way pages are — a top-level `components:` `_ref` list in `lowdefy.yaml`. `props`
uses the module-var shape (`{ type, required, default, description }`). `buildComponents` registers
each definition into `context.componentDefs`.

At every use site (`type: <Component>`, `props: { … }`, `slots: { <name>: { blocks: […] } }`),
`expandComponent` runs first in `buildBlock` and rewrites the instance into a `Box` wrapper carrying
the expanded body: props are validated against the component's declared surface (a missing required
prop, an unknown prop with a "did you mean", and a wrong-typed literal are build errors; an
operator-valued prop is accepted), inner block ids are prefixed `<instanceId>.<innerId>` (preserving
List `$`) so two instances never share state, `{ _prop: name }` reads are resolved from the use-site
prop expressions, and `{ _slot: name }` markers are filled with the consumer's slot blocks (an
unknown slot name is a build error). Nested components expand through `buildSubBlocks`' recursion,
guarded by a per-block component-ancestry cycle check and a depth limit.

Adds the `_prop` client operator (`@lowdefy/operators-js`) and threads a `props` scope through
`WebParser.parse` (`@lowdefy/operators`).

See `designs/ai-native/components/design.md`. Deferred to follow-on tasks: the runtime-threaded
`_prop` resolution in the engine (the core resolves props at build), the `_Component` engine wrapper
block, module-namespaced components, `used at` error locations, dev hot-reload usage tracking, and
`lowdefy expand`.
