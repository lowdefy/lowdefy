# treg

[treg](https://treg.to) is an open-source catalog of external API endpoints (SEO and SERP data, people and company enrichment, social data, scraping, generation and more) behind one token. treg holds the provider credentials and bills each call from the team's prepaid balance, or runs it on the team's own provider key for free. Its routed endpoints, such as `treg.people.email.find`, try provider after provider for one job and answer with the first hit.

The `TregConnection` connection calls treg from server routines. It is a good provider backend for [enrichment tables](/Table): one connection gives every enrichment column access to the whole catalog, with an exact cost per call.

> Store the token with the [`_secret`](/_secret) operator. `TregCall` spends money, so call it from API endpoints, and bound it with `maxCost` and `idempotencyKey`.

## Connections

Connection types:
  - TregConnection

## Requests

Request types:
  - TregCall
  - TregCatalogSearch
  - TregCatalogGet
  - TregBalance

### TregConnection

#### Properties

- `token: string`: __Required__ - The treg token, sent as `X-Treg-Token`. Use a per-team token (`treg org agent-new <name>`, or a dashboard API key), which carries its team.
- `org: string`: The team slug, sent as `X-Treg-Org`. Only needed with a personal identity token (from `treg login`).
- `baseUrl: string`: Default: `https://treg.to` - The treg URL, for a self-hosted treg. An `https` URL, or `http` on `localhost`.
- `timeout: integer`: Default: `30000` - The time in milliseconds each HTTP call to treg may take.
- `maxCost: number`: The default spend ceiling per call in USD, sent as `X-Treg-Route-Max-Cost`. treg refuses a call whose reserve would exceed it and charges nothing. treg itself caps routed calls at $1 and direct calls not at all.
- `meta: object`: Default tags for every call, sent as `X-Treg-Meta`, for treg's per-tag usage reports and budgets. Up to 5 pairs; keys are lowercase letters, digits and `_`; values are letters, digits and `. _ - :`. Request `meta` is merged over it.
- `allowCustomTools: boolean`: Default: `false` - Allow `TregCall` to call the team's own registered tools with `tool` and `path`. Without it a request can only reach catalog and routed endpoints.

### TregCall

Calls one treg endpoint by its id, `POST` (or `GET` without a body) to `/call/<endpoint>`.

`endpoint` must be a catalog or routed endpoint id, such as `treg.people.email.find`: lowercase letters, digits, `.`, `_` and `-`. The raw upstream-URL form (`/call/https://…`) is never accepted, because it would let config send any URL through the team's stored credentials. The team's own registered tools are called with `tool` and `path` instead, and only when the connection sets `allowCustomTools: true`.

#### Properties

- `endpoint: string`: The catalog or routed endpoint id to call. Find ids with `TregCatalogSearch`.
- `tool: string`: The name of one of the team's own tools, with `path`. Needs `allowCustomTools` on the connection.
- `path: string`: The path on the tool's API, such as `/v1/charges`. A path only: no scheme, host, query or `..`.
- `method: enum`: `GET`, `POST`, `PUT`, `PATCH` or `DELETE`. Defaults to `POST` when `body` is set, otherwise `GET`.
- `query: object`: Query parameters. An array value sends the parameter once per item.
- `body: any`: The JSON request body. A routed endpoint takes its inputs here.
- `idempotencyKey: string`: Sent as `Idempotency-Key`. A repeat of a call with the same key gets treg's stored answer and is not charged again (`replayed: true`, cost 0). treg keeps keys for 24 hours, frees the key of a failed call, and refuses a key reused for a different request with a 422. Use a new key for genuinely new work.
- `maxCost: number`: The spend ceiling for this call in USD, overriding the connection's `maxCost`. On a routed endpoint it bounds the whole waterfall.
- `maxAge: integer`: Only accept a cached answer younger than this many seconds (`X-Treg-Max-Age`).
- `noCache: boolean`: Force a live call instead of a cached answer (`Cache-Control: no-cache`).
- `waterfall: boolean`: Routed endpoints: `false` stops at the first provider that misses. treg falls through to the next provider by default.
- `strictFilters: boolean`: Routed endpoints: `true` refuses with a 422 (nothing charged) instead of answering from a provider that could not apply a filter.
- `meta: object`: Tags for this call, merged over the connection's `meta`.
- `await: object`: Wait for an async task. Without it, a task that is still running returns `pending: true`.
  - `timeoutMs: integer`: Default: `60000` - How long to poll, from 100 to 900000.
  - `intervalMs: integer`: The wait between polls. Defaults to the interval treg's descriptor names, or 2000.

#### Response

```yaml
output:        # routed: the job's normalised answer; catalog: the provider body (without _treg)
  email: ada@example.com
  verified: false
raw:           # routed: the serving provider's body; catalog: the provider body as it came
  data: { … }
cost:          # what treg charged, from X-Treg-Cost-Micro. 0 on the team's own key and on a replay.
  micro: 4000
  usd: 0.004
callId: call_8f2…   # X-Treg-Call-Id: store it with the cost; treg support looks calls up by it
servedBy: hunter.people.email.find
tried: [ … ]        # routed: every provider tried, with its outcome and charge
outcome: hit        # routed: hit, weak, miss or pending; null for catalog endpoints
cached: false       # answered from treg's cache (X-Treg-Cache: hit)
replayed: false     # an idempotent replay of an earlier call
pending: false      # an async task that is still running (only without await)
task: null          # the async task: { id, status, pollEndpoint, reserved }
httpStatus: 200
```

The cost is always what treg reports it charged, never the catalog estimate. An async task is charged only when it succeeds: while it is pending `cost` is 0 and `task.reserved` is the hold, and after `await` it is the reserve treg settles.

#### Async tasks

Generation endpoints, and routed endpoints whose provider is still working after treg's own 60 second wait, answer with a task and an `X-Treg-Async` poll descriptor. With `await`, `TregCall` polls the descriptor's catalog endpoint (`GET /call/<poll endpoint>?<param>=<task id>`, which is free) every `intervalMs` until the task's status is a success or failure value, and returns the terminal answer (the descriptor's result path, or the whole body). Transient poll failures are retried; five in a row end the wait.

- A failed task throws a final error; treg refunds its hold.
- A task still running at `timeoutMs` throws a retryable `ServiceError` naming the call id and task id. treg keeps a routed endpoint's pending answer, with its task, under the `Idempotency-Key`, so a retry with the same key replays it at no charge and resumes waiting for the same task instead of starting a new one.
- A descriptor that polls a dynamic URL is not followed.

### TregCatalogSearch

Searches the catalog by what an endpoint does, `GET /catalog/search`. Returns treg's answer: `{ query, count, total, results, hints }`, each result with its `id`, provider, `cost` and measured reliability (`observed`).

#### Properties

- `q: string`: __Required__ - The job, in words, such as `find a work email`.
- `limit: integer`: The most results, 1 to 100. treg defaults to 25.

### TregCatalogGet

One endpoint in full, `GET /catalog/endpoints/<endpoint>`: its parameters, cost, sibling providers for the same job with their price and reliability, and an example response.

#### Properties

- `endpoint: string`: __Required__ - The endpoint id.
- `access: boolean`: Also read how this team would be served and at what price, as `access`: `{ tier, detail, estimated_cost_micro, estimated_cost_usd }`. Use it for the `cost` of a provider in an enrichment catalogue.

### TregBalance

The team's prepaid balance. Returns `{ orgId, org, balance: { micro, usd }, held: { micro, usd }, holds, entries }`: `held` is the spend reserved by calls in flight, and `entries` the recent ledger (listed to team admins only).

#### Properties

- `limit: integer`: Default: `20` - The ledger entries to return, 1 to 200.

### Errors

`TregCall` sorts treg's answers into errors a routine can branch on with [`_error`](/_error): a `ServiceError` passes with time and can be retried; anything else is final, and retrying it would fail or cost the same again.

| Answer | Error | Retry |
| --- | --- | --- |
| 402 `insufficient_balance` | "treg balance too low: needs ~$X, has $Y." The top-up link is only in the server log. | No |
| 402 `route_max_cost` | The call would exceed `maxCost`. Nothing was charged. | No |
| 422 from treg | `ConfigError` with treg's explanation: malformed `meta`, an idempotency key reused for another request, a strict filter. | No |
| 429 | `ServiceError`, with `retryAfter` from `Retry-After`. | Yes |
| 503 `provider_capacity_unavailable` | `ServiceError`: treg's own provider account is out, nothing charged. `retryAfter` is the reset time, or 60 seconds. | Yes |
| 503 `treg_saturated`, other 5xx | `ServiceError`, with `retryAfter` when treg sent one. | Yes |
| 409 from treg | `ServiceError`: a call with the same idempotency key is still in flight. | Yes |
| 502 `response_buffer_limit` | The answer is larger than treg's 8 MiB settlement buffer. Nothing was charged. | No |
| Network failure or `timeout` | `ServiceError`. | Yes |
| 401, 403, other 4xx | The status, and treg's own explanation when the answer is treg's. | No |

`_error: retryAfter` reads the seconds treg asked to wait, `_error: statusCode` the HTTP status and `_error: code` treg's error name (such as `insufficient_balance`). Error messages never contain the token, a provider's response body or the body of an authentication failure.

### Examples

###### A treg connection

```yaml
connections:
  - id: treg
    type: TregConnection
    properties:
      token:
        _secret: TREG_TOKEN
      maxCost: 0.1
      meta:
        app: crm
```
Environment variables:
```
LOWDEFY_SECRET_TREG_TOKEN = treg_…
```

###### Find a work email

```yaml
id: find_email
type: TregCall
connectionId: treg
properties:
  endpoint: treg.people.email.find
  body:
    full_name:
      _payload: full_name
    domain:
      _payload: domain
  maxCost: 0.05
```

###### An enrichment provider endpoint

An enrichment column's provider endpoint (`enrich_<provider>`) that finds a work email through treg. The worker calls it with the claimed cell's inputs and an idempotency key, and completes the cell with its answer, including the cost treg charged.

The idempotency key must stay the same across the attempts of one run of a cell, so that a cell retried after treg charged for an answer that was then lost gets the stored answer instead of paying again, and a timed-out async task is resumed. A claim token is new on every attempt, so build the key from the claim's `runId`, `columnKey`, `rowKey` and `inputHash` instead. In the worker:

```yaml
- id: provider
  type: CallApi
  properties:
    endpointId:
      _string.concat:
        - enrich_
        - _item: cell.provider
    payload:
      inputs:
        _item: cell.inputs
      idempotencyKey:
        _string.concat:
          - _item: cell.runId
          - ':'
          - _item: cell.columnKey
          - ':'
          - _item: cell.rowKey
          - ':'
          - _item: cell.inputHash
```

The provider endpoint:

```yaml
id: enrich_find_work_email_treg
type: InternalApi
routine:
  - :try:
      - id: find
        type: TregCall
        connectionId: treg
        properties:
          endpoint: treg.people.email.find
          body:
            full_name:
              _payload: inputs.full_name
            domain:
              _payload: inputs.domain
          idempotencyKey:
            _payload: idempotencyKey
          maxCost: 0.05
          meta:
            feature: enrichment
          await:
            timeoutMs: 60000
      - :return:
          status:
            _if:
              test:
                _eq:
                  - _step: find.output.email
                  - null
              then: empty
              else: ok
          value:
            _step: find.output.email
          raw:
            _step: find.raw
          cost:
            _step: find.cost.micro
    :catch:
      # A ServiceError (a rate limit, treg saturated or out of capacity, a timeout)
      # passes with time: throw it, and the worker queues the cell again after its
      # backoff. `_error: retryAfter` has the seconds treg asked to wait.
      - :if:
          _eq:
            - _error: name
            - ServiceError
        :then:
          - :throw:
              _error: true
      # Anything else, such as a balance that is too low, is final.
      - :return:
          status: error
          error:
            _error: message
          retry: false
```

###### Find endpoints for a provider catalogue

```yaml
id: search_treg
type: TregCatalogSearch
connectionId: treg
properties:
  q:
    _payload: q
  limit: 10
```

###### Read an endpoint's price for this team

```yaml
id: email_find_price
type: TregCatalogGet
connectionId: treg
properties:
  endpoint: treg.people.email.find
  access: true
```
`_step: email_find_price.access.estimated_cost_usd` is the price per call.

###### Call one of the team's own tools

```yaml
connections:
  - id: treg_tools
    type: TregConnection
    properties:
      token:
        _secret: TREG_TOKEN
      allowCustomTools: true
```
```yaml
id: stripe_balance
type: TregCall
connectionId: treg_tools
properties:
  tool: stripe
  path: /v1/balance
```
