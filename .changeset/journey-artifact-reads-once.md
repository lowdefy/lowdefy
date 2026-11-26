---
'@lowdefy/journey-headless': patch
'@lowdefy/node-utils': patch
'@lowdefy/server-dev': patch
'@lowdefy/test-utils': patch
---

perf(journey-headless): Headless journeys read each build artifact once per run

- `createArtifactReader` in `@lowdefy/node-utils` keeps each build artifact's parsed value while its file is unchanged (same inode, size and modified and changed times). A file read within 2 s of its last change (the later of its modified and changed times, so a copy that kept an old modified time counts) also keeps its text, so a rewrite of the same size inside one timestamp tick is still seen. Values are shared and frozen.
- `lowdefy test --headless --build` keeps one reader for the whole run, so the data-set rails and step checks stop re-reading and re-parsing the same page and endpoint files on every step and journey. The dev server's `readBuildArtifact` reads through the same reader, and a page built on demand is read again once it changes. The dev server keeps at most 2,000 artifacts per form (raw and deserialized), dropping the least recently read, so a long-running server stays bounded.
- The data-set rails read each endpoint's steps once per page, not once per `CallAPI` action.
- A test app reads each data set once and shares it between its sessions.
- The access table parses each endpoint's routine as plain JSON and drops it, so it no longer deserializes every endpoint whole.
- The build's secret names are kept in `.lowdefy/test/secretNames.json` by build id, so a second run on the same build skips the scan.
