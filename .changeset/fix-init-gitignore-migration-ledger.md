---
'lowdefy': patch
'@lowdefy/docs': patch
---

fix(cli): `lowdefy init` and `lowdefy init-migrations` write a `.gitignore` that lets the migration ledgers be committed

The generated `.gitignore` ignored `.lowdefy/**` and then tried to re-include `.lowdefy/migrations/`. Git cannot re-include a file whose parent directory is matched by `**`, so every per-stage ledger under `.lowdefy/migrations/` stayed ignored and the documented "commit the ledger" workflow silently did nothing on a new project. The ignore line is now `.lowdefy/*` (direct children only), which the negation can re-include below; `lowdefy init-migrations` repairs an existing `.lowdefy/**` line in place.
