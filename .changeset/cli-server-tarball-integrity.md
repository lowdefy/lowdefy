---
'lowdefy': patch
---

fix(cli): The CLI checks the server package it downloads from npm against the registry's integrity hash, and extracts it with `tar` instead of `decompress`.

`decompress` 4.2.1 has a published path traversal vulnerability with no fixed release: an archive entry could be written outside the target directory. The server tarball is now checked against `dist.integrity` before it is extracted, and an entry that would land outside the server directory fails the install instead of being written.
