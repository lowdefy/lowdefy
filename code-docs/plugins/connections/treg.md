# @lowdefy/connection-treg

[treg](https://treg.to) (open source, AGPL, github.com/superdesigndev/treg) puts thousands of external API endpoints from about a hundred providers behind one token. This package calls it from server routines. The enrichment design (E8) uses it as a provider backend: one connection gives every enrichment column the catalog, with an exact per-call cost. User docs: `packages/docs/connections/Treg.yaml`.

## Types

| Type                | Kind       | Does                                                                        |
| ------------------- | ---------- | --------------------------------------------------------------------------- |
| `TregConnection`    | connection | `token`, `org`, `baseUrl`, `timeout`, `maxCost`, `meta`, `allowCustomTools` |
| `TregCall`          | request    | `/call/<endpoint>`: a catalog or routed endpoint, or a custom tool          |
| `TregCatalogSearch` | request    | `GET /catalog/search?q=&limit=`                                             |
| `TregCatalogGet`    | request    | `GET /catalog/endpoints/<id>` (+ `/access` for the team's price)            |
| `TregBalance`       | request    | `/auth/me` or `/orgs` for the team id, then `GET /orgs/<id>/balance`        |

All four requests are `checkRead: false, checkWrite: false`, like `AxiosHttp` and the other API-calling requests: the connection read/write flags are for data stores. The spend guards are `maxCost` (`X-Treg-Route-Max-Cost`) and `idempotencyKey`.

## Layout

```
src/connections/TregConnection/
  TregConnection.js, schema.js      connection { schema, requests }
  tregFetch.js                      the one HTTP call: token header, timeout, no redirects
  mapTregError.js                   non-2xx answer → the error to throw
  readRetryAfter.js                 Retry-After header, retry_after body, resets_at → seconds
  parseCost.js, microUsd.js         X-Treg-Cost-Micro → { micro, usd }
  formatMeta.js, createMetaSchema.js  X-Treg-Meta tags
  redactToken.js                    token out of any treg text put in a message
  TregCall/                         resolveCallPath, buildCallHeaders, mapCallResponse,
                                    readAsyncTask, awaitAsyncTask, readJsonPath, omitTreg
  TregCatalogSearch/, TregCatalogGet/, TregBalance/ (resolveOrg)
src/test/startMockTreg.js           loopback mock server for the tests
```

It uses the runtime's global `fetch` (Node 24+), so the package has no HTTP dependency. `tregFetch` combines the request's `signal` with `AbortSignal.timeout(timeout)`: a caller abort is rethrown (the API layer turns it into a `UserError`), a timeout or network failure becomes a `ServiceError`. `redirect: 'manual'`, because following a redirect would send `X-Treg-Token` to wherever it points; a 3xx is a final error.

## TregCall

**The path is the security boundary.** `endpoint` must match `^[a-z0-9][a-z0-9._-]*$`, so the raw upstream-URL form (`/call/https://…`, which treg resolves to any registered tool by host and injects the team's credential) can never be built. The schema checks it, and `resolveCallPath` checks it again because it builds the path that decides which upstream gets the credential. `tool` + `path` (`/call/<tool>/<path>`) needs `allowCustomTools: true` on the connection, which the request schema cannot see, and the path may not carry a scheme, `//`, a query, a backslash or a `.`/`..` segment (also percent-encoded), and must be printable ASCII before and after percent-decoding: the WHATWG URL parser strips tabs and newlines, so `.\t./https://…` would become `../https://…` and resolve to the upstream-URL form. As a last check `tregFetch` refuses any path the URL parser does not keep exactly as written (same origin, `pathname` equal to the base path plus the path, no query or fragment), so no normalisation can move a call to another `/call/` target.

**Routed vs catalog.** A routed endpoint (`treg.<capability>`, or any answer with `X-Treg-Route-Outcome`) answers `{ output, raw, _treg: { served_by, tried, outcome, charged_micro } }`; `output` and `raw` are taken from it. A catalog body is the provider's own, relayed verbatim, so `output` is the body without `_treg` and `raw` is the body. `cost` is always `X-Treg-Cost-Micro` (absent = the team's own key, not billed = 0; a replay reports 0), never `_treg.charged_micro` or a catalog estimate.

**Async.** An answer with `X-Treg-Async` (or a routed 202 whose `_treg.outcome` is `pending` with `_treg.async`, which is what an idempotent replay returns, headers not stored) is a task. `readAsyncTask` reads the task id (`task_id`, or `id_from` into the body) and the reserve (`X-Treg-Reserved-Micro`, `_treg.reserved_micro`, else `X-Treg-Cost-Micro`). Without `await` the result is `pending: true`, `cost` 0, `task: { id, pollEndpoint, reserved }`. With `await`, `awaitAsyncTask` polls `GET /call/<poll.endpoint>?<poll.param.name>=<id>` every `intervalMs` (default: the descriptor's `interval` seconds, else 2 s) until `status.path` reads a `success` or `failure`/`billed_failure` value, within `timeoutMs` (default 60 s). Success returns `result.path` of the terminal body (or the body) as `output`, the reserve as `cost`. Failure is a final `async_task_failed`. Transient poll errors (`ServiceError`s) are retried, five in a row end it; other poll errors are thrown. Timeout is a `ServiceError` `async_timeout` with the task and call ids: treg stores a routed pending answer under the `Idempotency-Key`, so a retry with the same key replays it free and polls the same task. A descriptor with `poll.url_from` (a dynamic URL) is refused: following it would be the upstream-URL form.

## Errors

`mapTregError` decides by status and treg's `detail.error` code, and uses `X-Treg-Error: 1` (treg stamps its own refusals) to tell treg's answers from a provider's relayed verbatim.

| Answer                                        | Thrown                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| 402 `insufficient_balance` / `out_of_balance` | `Error` "treg balance too low: needs ~$X, has $Y." (402), top-up URL in `cause` |
| 402 `route_max_cost`                          | `Error` naming the ceiling and estimate (402)                                   |
| 422 with `X-Treg-Error`                       | `ConfigError` with treg's detail                                                |
| 429                                           | `ServiceError`, `retryAfter`                                                    |
| 503 `provider_capacity_unavailable`           | `ServiceError`, `retryAfter` = Retry-After, else `resets_at`, else 60           |
| 503 `treg_saturated`, other 5xx               | `ServiceError`, `retryAfter` when given                                         |
| 409 with `X-Treg-Error` (key in flight)       | `ServiceError`                                                                  |
| 502 `response_buffer_limit`                   | `Error` with no `statusCode` (a 5xx status would make the API layer retry it)   |
| 401 / 403 / 3xx / other 4xx                   | `Error` with the status; treg's own detail only for treg's own non-auth answers |

A `ServiceError` passes `callRequestResolver` unchanged (`isLowdefyError`); a plain `Error` becomes a `RequestError` unless `ServiceError.isServiceError` matches it, which is why final errors never carry a 5xx/429 status and avoid its trigger words. `retryAfter` is a number of seconds, and `projectCaughtError` keeps it on a `ServiceError`, so a routine's `_error: retryAfter` can drive a backoff.

What never reaches a message: the token (it is only ever a header, and `redactToken` scrubs any treg text that is quoted), a provider's body, the body of a 401/403, and the 402 top-up link (only in the `cause`, which the server log prints and the wire drops). The client never sees any of these messages anyway: the wire projection sends the generic message for non-`UserError`s. The messages matter because a routine can write `_error: message` into a table cell.

## Enrichment

`MongoDBEnrichmentComplete` results take `cost` (integer micro-USD) and store it as the cell's `cost`; the Table details panel shows it. The idempotency key a provider sends should be stable across the attempts of one run of a cell. A claim token is new on every claim, so a key built from it only dedupes within one attempt; `runId:columnKey:rowKey:inputHash` from the claim is stable. A retried error result takes `retryAfterMs`: the worker passes `_error: retryAfter` × 1000 from a treg `ServiceError`, so the retry waits as long as treg asked instead of the exponential backoff. See the enrichment provider example in the user docs.

The enrichment reference app (`packages/plugins/blocks/blocks-table/e2e/enrichment/app`) has a treg provider, `find_work_email_treg` (`api/providers/enrich_find_work_email_treg.yaml`), whose `TregConnection` points at the treg mock in `mocks/mockServices.mjs`; `run_cell.yaml` builds the idempotency key and the `retryAfterMs`. Its spec (`tests/treg.e2e.spec.js`) covers the stored cost, a 402, a 503 retried after `retry_after`, a lost answer replayed under the same key (charged once), a new key per run, and an awaited async task.

## Tests

Every test runs against `startMockTreg` (a `node:http` server on a random loopback port) or a stubbed `fetch`; nothing calls treg.to.
