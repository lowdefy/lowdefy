---
'@lowdefy/api': patch
---

fix: A page `CallAPI` without a `payload` is checked against the endpoint's `payloadSchema` as an empty object, as a nested `CallApi`, agent tool, MCP call and schedule already were. Before, a schema with `type: object` refused it.
