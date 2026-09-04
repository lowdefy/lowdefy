---
name: lowdefy-api-routines
description: Use when writing server-side logic as an Api endpoint routine — control flow steps, requests inside a routine, payload schemas, calling it from the page with CallAPI, and exposing it as an MCP tool.
kind: reference
lowdefyVersion: 5.5.1
---

# Api endpoint routines

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/lowdefy-api`, `controls/if`, `controls/for`, `controls/try`, `controls/return`, `controls/reject`, `controls/set_state`, `actions/callapi`, `operators/_api`, `operators/_step`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_api` (`@lowdefy/operators-js`), `_step` (`@lowdefy/operators-js`), `_payload` (`@lowdefy/operators-js`).

### Actions

`lowdefy_get_schema` with kind `actions`: `CallAPI` (`@lowdefy/actions-core`).
<!-- generated:reference:end -->

## Recipe

Must cover: endpoint shape (`id`, `type: Api`, `routine`), a request step reading `_payload`, `_step` to chain results, `:return` vs `:reject`, `payloadSchema` (enforced on every caller), calling with `CallAPI` and reading `_api`, and the `mcp.endpoints` exposure rules.
