---
'@lowdefy/build': major
'@lowdefy/errors': minor
'@lowdefy/docs': patch
---

feat(build)!: `_js` bodies are parsed and name-checked at build.

Every `_js` body (string form and `{ fn, args }` form) is now analysed with `espree` and
`eslint-scope` while the js map is built. A reference to a name that is not declared in the body,
not a parameter of the prototype the body runs with (client or server) and not part of the
JavaScript standard library is a build error; a declared-but-unused `const`, `let` or `function`
is a build warning; a body that does not parse is a build error naming the line. A server body
that reaches for a browser global such as `document` is reported with a hint that it runs on the
server. Each finding carries the operator node's config location, and a body shared by several
blocks is reported at every site. The new `js-lint` check slug (`~ignoreBuildChecks: [js-lint]`)
suppresses the check. The client and server `_js` prototypes now have a single source of truth in
`jsFunctionPrototypes.js`, shared by the lint and the generated js map modules.
