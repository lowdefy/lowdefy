---
'lowdefy': minor
---

Add request tests to `lowdefy test`: `tests/requests/*.test.yaml` files that run one page request (`pageId` + `requestId`) or one Api endpoint routine (`endpointId`) on the dev server as a named `user` with a `payload`, and compare the response to `expect` — a literal subset (extra response keys ignored, arrays compared element-wise) or a JSON schema (`expect: { schema }`). A test's `seed` loads documents (with `~d` dates) into an in-memory MongoDB the runner starts, pointing every seeded connection at it, so tests never touch the app's real database. Seeding needs the optional peers `mongodb-memory-server` and `mongodb`; a seeded run without them exits `1` with the install line. Journeys and request tests share one run, `--filter` and one summary line.
