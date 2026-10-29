---
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

fix(server, server-e2e): Read the gzipped key and ref maps to locate errors

The production and e2e servers now resolve an error's config file and line from `keyMap.json.gz` and `refMap.json.gz` instead of the plain maps. They load the maps once per process, on the first error that names a config key, and keep them for the life of the process. When a build has no gzipped maps, the first error notes that and no later error reads the filesystem for them, so the error is logged without a location at no further cost. Any other read, gunzip or parse failure is logged once as a warning and tried again on the next error.
