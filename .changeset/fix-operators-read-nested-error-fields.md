---
'@lowdefy/helpers': patch
'@lowdefy/operators': patch
'@lowdefy/operators-js': patch
'@lowdefy/engine': patch
'lowdefy': patch
---

fix(operators): Read fields inside errors and other non-plain objects.

Dot-path reads stopped at any value that was not a plain object or an array, so a nested
error field silently returned the operator default even though the value was there. Mapping
a sign-in failure to a friendly message with `_actions: login.error.cause.code` always fell
through to the default branch.

Reads now step into any object — errors, class instances, `Date`, `URL`. Nothing that
previously resolved changes; the set of readable values only grows.

Also in this release, `@lowdefy/helpers`' `type` utility drops the `isBuffer`, `isArguments`,
`isGeneratorFn` and `isGeneratorObj` predicates, and identifies `Date`, `Error` and `RegExp`
with `instanceof` rather than duck-typing. Values constructed in another JavaScript realm (a
`vm` context, iframe, or worker) are no longer detected as those types. Lowdefy has no such
value path, so this affects only custom plugins that introduce one.
