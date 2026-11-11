---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

feat(build): Production server builds also write gzipped error maps

`build()` takes a `writeCompressedMaps` option. When it is set, the build also writes `keyMap.json.gz` and `refMap.json.gz` beside `keyMap.json` and `refMap.json`, so a deploy can ship much smaller maps and still name the YAML file and line of a production error. The production and e2e server build scripts set it. Dev, journeys scope and test builds write nothing new, and the plain maps are unchanged.

`refMap.json.gz` is `refMap.json` gzipped. `keyMap.json.gz` holds the key map in columns, which a server can keep in a fraction of the memory: on a large app with 1.16 million keys it is 3.3 MB (10.4 MB for `keyMap.json` gzipped), and a server that loads it holds about 48 MB instead of 151 MB and loads it in about 70 ms instead of 500 ms. `@lowdefy/errors` adds `encodeColumnarKeyMap`, which writes the columns, and `createColumnarKeyMap`, which reads them back as a key map that `resolveConfigLocation`, `resolveKeyEntry`, `createKeyPathResolver` and `shouldSuppressBuildCheck` take in place of a plain one.
