---
'@lowdefy/e2e-utils': major
---

feat(e2e-utils)!: Remove the `lowdefy-e2e` command

Apps test pages and endpoints with journeys, so `@lowdefy/e2e-utils` no longer scaffolds Playwright specs into an app: the package's `lowdefy-e2e` bin and its `init` command are gone. The package and its exports stay, for Lowdefy's own block e2e suites.

An app with e2e-utils specs moves them to journeys, as the [Moving from e2e-utils](https://docs.lowdefy.com/e2e-utils-migration) page shows:

- UI specs become journeys, headless or in the browser.
- Endpoint specs (`page.request.post`) become page-less journeys with `call` steps.
- `ldf.mock.request` on the app's own requests becomes a data set; on an outside service, an entry in the journey's `stubs`.
- `mdb.seed` becomes a data set.
