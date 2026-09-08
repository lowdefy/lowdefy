---
'lowdefy': patch
'@lowdefy/client': patch
'@lowdefy/helpers': patch
'@lowdefy/node-utils': patch
---

fix: Fix dynamic page navigation and dev server port detection.

- **lowdefy (CLI)**: Port availability checks now probe loopback addresses (`127.0.0.1`, `::1`) in addition to the wildcard bind, so `dev`/`start` no longer report a port held by another local process as free.
- **@lowdefy/client**: Fixed a blank page that could appear when navigating to a page with server-resolved dynamic content — the page config is now memoized correctly and the page tree remounts when new dynamic content is resolved.
- **@lowdefy/helpers**: Added `getOperatorType`, a small shared utility for detecting operator objects in config.
- **@lowdefy/node-utils**: Added `findAvailablePort` and `isPortAvailable` utilities (moved from the CLI) for reuse across dev tooling.
