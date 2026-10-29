---
'@lowdefy/build': minor
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

feat(build): Production server builds also write gzipped error maps

`build()` takes a `writeCompressedMaps` option. When it is set, the build also writes `keyMap.json.gz` and `refMap.json.gz` beside `keyMap.json` and `refMap.json`, gzipped from the same text, so a deploy can ship much smaller maps (on a large test app, 43 MB and 14 MB become 8.5 MB and 0.6 MB) and still name the YAML file and line of a production error. The production and e2e server build scripts set it. Dev, journeys scope and test builds write nothing new, and the plain maps are unchanged.
