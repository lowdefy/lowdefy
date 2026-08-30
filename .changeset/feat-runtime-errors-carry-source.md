---
'@lowdefy/server-dev': minor
'@lowdefy/api': minor
'@lowdefy/operators-js': patch
'@lowdefy/docs': patch
---

Runtime errors reach the agent feedback channel with their config source.

- The dev server now collects server-side failures — request, endpoint, MCP and agent tool errors — into a ring buffer surfaced as `serverErrors` in `GET /lowdefy-docs/build-status` and the `lowdefy_build_status` MCP tool, beside `clientErrors`. Each entry carries the resolved yaml `source` and `config` path, plus `endpointId`, `requestId` and `pageId` where known.
- MCP tool errors carry their config source (` (at file.yaml:line)`) and hint in dev. Unexpected tool-call failures now go through the server's error sink so they are logged with their source. Production keeps returning the bare message.
- `_js` execution errors report the original JavaScript error (`ReferenceError: x is not defined`) instead of pasting the whole function source into the message.
