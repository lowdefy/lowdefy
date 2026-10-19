---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): Declare the packages the MongoDB auth adapter imports

The vendored BetterAuth MongoDB adapter imports `better-auth` and `change-case`, but the
package did not list them, so they only resolved when another package happened to hoist
them. Both are now dependencies. The unused `@auth/mongodb-adapter` and `uuid`
dependencies are removed.
