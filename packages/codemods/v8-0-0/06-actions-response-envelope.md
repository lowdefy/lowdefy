# Migration: `_actions.<id>.response` is the endpoint's response

## Context

From Lowdefy v8.0.0 a `CallAPI` action's result is read at `_actions.<actionId>.response.<path>`, not `_actions.<actionId>.response.response.<path>`.

Before v8 the action returned the engine's _api record_ — an object holding `response`, `status`, `success`, `error`, `responseTime` and the rest — and the action-record envelope put that at `_actions.<id>.response`, so the endpoint's `:return` value ended up two `response` keys deep. The action now returns the `:return` value itself.

The api record's other fields have not moved: they are read through `_api.<endpointId>`, which is where they were always declared to live.

| v7                                                 | v8                                        |
| -------------------------------------------------- | ----------------------------------------- |
| `_actions.load.response.response`                  | `_actions.load.response`                  |
| `_actions.load.response.response.results[0].title` | `_actions.load.response.results[0].title` |
| `_actions.load.response.status`                    | `_api.<endpointId>.status`                |
| `_actions.load.response.success`                   | `_api.<endpointId>.success`               |
| `_actions.load.response.responseTime`              | `_api.<endpointId>.responseTime`          |
| `_actions.load.error`                              | unchanged                                 |

The v8 build rewrites the old double-`response` spelling for you and emits a `ConfigWarning` (check slug `actions-response-envelope`) naming each site, so an un-migrated app keeps working for one release. The rewrite is removed in v9. It only applies to reads addressed at a `CallAPI` action on the same page — for any other action, `.response.response` is an ordinary read of a `response` key in that action's own result and is left alone.

Only `CallAPI` is affected. A `Request` action's result was never double-wrapped.

## What to Do

### Step 1: Collect every site

```bash
npx lowdefy@8 build 2>&1 | grep 'double "response" envelope'
```

Each warning names the read, the rewritten path and the `file:line`. Or grep:

```bash
grep -rn 'response\.response' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

### Step 2: Rewrite the endpoint-result reads

Drop one `response` segment. This is the whole change for a read of the endpoint's data.

### Step 3: Move the api-record reads to `_api`

A read of `status`, `success`, `error`, `responseTime`, `loading`, `payload`, `startTimestamp` or `endTimestamp` through `_actions.<id>.response.<field>` was reading the api record and now reads a field of the endpoint's response — which almost certainly does not exist, so it silently resolves to `null`. **These do not produce a warning and the build cannot rewrite them**, because after the collapse the path is legal: an endpoint may genuinely return a `status` key.

Rewrite each one as `_api.<endpointId>.<field>`, taking the `endpointId` from the `CallAPI` action's `params.endpointId`. If the endpoint really does return a field with one of those names, leave the read as it is and say so in the report.

Note `_api` reads the _latest_ call of that endpoint on the page, where `_actions` reads the call this event chain made. In an event chain that calls one endpoint once — the ordinary case — they are the same call.

### Step 4: Re-run the build

```bash
npx lowdefy@8 build 2>&1 | grep -c 'double "response" envelope'
```

Must print `0`.

### Step 5: Report

One entry per site: the file and line, the old path, the new path, and which of the two rewrites it was (`response.response` → `response`, or api-record field → `_api`). List separately every `_actions.<id>.response.<field>` you decided was a genuine endpoint field rather than an api-record read, with the reason — that judgement is the only place this codemod can be wrong.

## Scope

`app` — all YAML config files, including Nunjucks templates and `_ref`'d page fragments. Client-side only: `_actions` is not available on the server, so endpoint routines and connections are unaffected.

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `_actions`

## Examples

### Before

```yaml
events:
  onClick:
    - id: load
      type: CallAPI
      params:
        endpointId: search_controls
        payload:
          q:
            _state: query
    - id: store
      type: SetState
      params:
        results:
          _actions: load.response.response.results
        total:
          _actions: load.response.response.total
        ok:
          _actions: load.response.success
```

### After

```yaml
events:
  onClick:
    - id: load
      type: CallAPI
      params:
        endpointId: search_controls
        payload:
          q:
            _state: query
    - id: store
      type: SetState
      params:
        results:
          _actions: load.response.results
        total:
          _actions: load.response.total
        ok:
          _api: search_controls.success
```

## Edge Cases

- **The object form of the operator** — `{ _actions: { key: load.response.response.total } }` — rewrites the same way, on `key` (or `path`).
- **A computed path** (`{ _actions: { key: { _state: which } } }`) cannot be rewritten at build and is not warned about. Check these by hand.
- **`_actions.<id>.error`, `.type`, `.index`, `.skipped`** are action-record fields and are unchanged.
- **A `Request` action** returns an array of request responses, one per request id, and is unchanged. `.response.response` on a `Request` action is a real read of a `response` key in the data.
- **An endpoint with a `responseSchema`** gets its `_actions.<id>.response.<path>` reads checked against the schema at build (check slug `response-schema`), which will name any path the rewrite got wrong.

## Verification

```bash
npx lowdefy@8 build 2>&1 | grep -cE 'double "response" envelope|response\.response'
```

Must print `0`. Then exercise each rewritten event in the running app and confirm the block that consumes the value still renders it — a read that silently became `null` renders empty rather than erroring, so a visual check is the test that matters here.
