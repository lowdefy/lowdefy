---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/plugin-next-auth': minor
'@lowdefy/errors': minor
---

feat: `auth.strategies` — apiKey and JWT header authentication for API callers.

- New `auth.strategies` config block: apiKey (default `X-API-Key` header) and jwt strategies, each granting the caller the strategy's `roles`.
- MCP and service clients that cannot hold a session cookie authenticate per request; a matched strategy yields a caller (`apiKey:{strategyId}:{keyId}`) that flows through the existing authorization and `_user` machinery.
- Unauthenticated calls to role-gated endpoints now return 401 (`AuthenticationError`) instead of a masked error.
