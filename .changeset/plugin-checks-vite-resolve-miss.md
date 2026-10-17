---
'@lowdefy/build': patch
---

fix(build): A plugin without a `./checks` export no longer reports "could not load" in the dev server

When `@lowdefy/build` runs inside Vite's module runner (a linked build, as in the monorepo), Vite's resolver throws a plain error with no Node error code for a missing exports subpath, such as `Missing "./checks" specifier in "@lowdefy/actions-core" package`. The build now asks Node's resolver whether such a specifier resolves, and treats it as the optional subpath being absent instead of a broken plugin.
