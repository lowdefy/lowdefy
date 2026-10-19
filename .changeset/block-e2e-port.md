---
'@lowdefy/block-dev-e2e': patch
---

fix(block-dev-e2e): Set the e2e port with `LOWDEFY_E2E_PORT`, and reuse a running server only on request

Block e2e runs no longer attach to a server that is already listening on the package's
port, which could belong to another checkout. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse
one, and `LOWDEFY_E2E_PORT` to run on another port.
