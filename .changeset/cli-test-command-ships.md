---
'lowdefy': patch
---

fix(cli): the `lowdefy test` command ships in the published package. The root swc config excluded test files with an unescaped `.*.test.js$`, which also matched `commands/test/test.js`, so the compiled CLI was missing the module `program.js` imports and every `lowdefy` command failed with `ERR_MODULE_NOT_FOUND` on 0.0.0-experimental-20260905094305. The pattern now escapes its dots.
