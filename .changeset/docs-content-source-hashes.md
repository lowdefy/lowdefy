---
'@lowdefy/docs-content': patch
'@lowdefy/docs': patch
---

`index.json` records, for each extracted doc, the docs source files it was built from and their hash, and the docs tests fail naming each doc whose source changed since the last `pnpm docs:content`. Before, only added, removed or moved pages were caught, so edits to an existing page could ship without the extracted docs agents read.
