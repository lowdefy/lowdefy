---
'@lowdefy/api': patch
'@lowdefy/ai-utils': patch
'@lowdefy/docs-content': patch
---

fix: A payload the app's own config builds and its endpoint's `payloadSchema` refuses is a `ConfigError`

A payload is now refused by who built it. When the app's own config built it (a page's `CallAPI`, a nested or detached `CallApi` step, a Dynamic block's endpoint, an auth or agent hook, a scheduled run's `schedule.payload`), the config breaks its own endpoint's contract, so the refusal is a `ConfigError`: logged as a server error with its config location, and a journey that triggers it fails. Before, every refusal was a `UserError`, logged at warn level only, whoever built the payload.

What app catch lists see changes for a page's `CallAPI` whose payload is refused: `_error.name` (and `_actions.<id>.error.name`) is now `ConfigError`, not `ActionError`, with no `cause`, and outside development its message is the generic server error message rather than the schema message. The catch actions still run. A nested `CallApi` step's refusal reaches a routine's `:catch` as a `ConfigError`, not a `UserError`.

An outside caller's payload is still the caller's mistake: an API client calling `POST /api/endpoints/<endpointId>` without naming a page gets a `400` `UserError`, and an MCP or agent tool call gets the schema message back so the model can correct its input.
