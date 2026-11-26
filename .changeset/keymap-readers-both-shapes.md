---
'@lowdefy/errors': minor
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

feat(errors): Key map readers for both entry shapes

`@lowdefy/errors` adds `resolveKeyEntry`, which resolves one key map entry to its config path, ref id, line, parent id and `~ignoreBuildChecks` value, and `createKeyPathResolver`, which does the same for scans over the whole map and resolves each entry once. Both read today's entries and a shorter entry shape, `{ s, p, r?, l?, i? }`, that stores each entry's own path segment and leaves out a ref id it shares with its parent. Error locations, `~ignoreBuildChecks` suppression, the JIT page registry, the dev server's find-config tool and config mutants now read the key map only through them, so a build can write the shorter shape next. Build output does not change.
