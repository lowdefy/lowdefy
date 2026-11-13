---
'lowdefy': patch
---

chore(deps): Replace axios with fetch in the CLI

Every HTTP request the CLI makes (npm registry lookups and downloads, telemetry and error reports, and the calls `lowdefy test` and `lowdefy journeys` make to the dev server and PostHog) goes through one `httpFetch` helper built on Node's `fetch`. `axios` is no longer a dependency of `lowdefy`. `@lowdefy/connection-axios-http` keeps axios, since its config exposes axios options.

Requests now time out, where most had no limit before:

- The version check at start-up, telemetry and error reports: 5 seconds. A slow or unreachable registry now gives "Failed to check for latest Lowdefy version." after 5 seconds instead of holding up the command.
- npm package lookups that `lowdefy upgrade` and the server download need: 30 seconds.
- Tarball downloads and journey runs: no timeout. A timeout would cut off a slow download mid-file, and the dev server bounds each journey step itself.
- Listing mutants for `lowdefy journeys harden`: 5 minutes. The existing limits stay: 2 seconds for the dev server ping, 5 seconds for build status, 60 seconds for page config and PostHog queries.

Error messages are unchanged. A network failure still names its cause (`connect ECONNREFUSED 127.0.0.1:3000`), not fetch's bare "fetch failed".
