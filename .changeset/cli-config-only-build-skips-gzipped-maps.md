---
'@lowdefy/cli': patch
'@lowdefy/node-utils': minor
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

perf(cli): A config-only build skips the gzipped error maps

`lowdefy build --no-client-build` no longer writes `keyMap.json.gz` and `refMap.json.gz`. Nothing serves a build without its client as it is, and it is what endpoint tests, access checks and `test:build` scripts run, so they skip encoding and gzipping the key map: 2 to 3 s on a large app. `lowdefy vercel-output` and `lowdefy docker-output` write the gzipped maps from the plain ones when the build folder has none, so a Vercel build (`lowdefy build --no-client-build`, then the client build, then `lowdefy vercel-output`) still ships them, byte for byte as the build would have written them. A full `lowdefy build` writes them as before, so `lowdefy start` and Docker images keep error locations.

The server build scripts read `LOWDEFY_BUILD_SKIP_COMPRESSED_MAPS`, which the CLI sets for a config-only build. `@lowdefy/node-utils` adds `compressBuildMaps`, which the build and the CLI both use to write the gzipped maps.
