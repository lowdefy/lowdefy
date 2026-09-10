---
'@lowdefy/errors': patch
'@lowdefy/helpers': patch
---

fix: Classify authorization refusals and expected outcomes consistently.

- New `AuthorizationError` (403): an authenticated caller refused by a request, endpoint or agent
  gate is one warn line and a 403, not a fault logged at error level with a 500 and a Sentry
  event.
- `AuthenticationError` and `AuthorizationError` keep their class when revived from the wire.
- `ServiceError` takes its `configKey` from its cause, and `ServiceError.isServiceError` also
  recognises AWS SDK `$metadata.httpStatusCode` and numeric 5xx codes.
- `websocket-refs`, `dynamic-endpoint-refs`, `callapi-refs`, `callapi-internal-refs` and `icons`
  are valid `~ignoreBuildChecks` slugs.
