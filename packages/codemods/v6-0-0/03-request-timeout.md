# Migration: Keep the v5 Request Duration with `config.requestTimeout`

## Context

Lowdefy v6 adds a server-side request timeout. `config.requestTimeout` in `lowdefy.yaml` (milliseconds) defaults to **30000** (30 seconds) and applies to every server route except agent streaming, MCP and websockets: requests, API endpoints, cron and detached endpoint runs, auth and page routes. Set it to `0` to disable it.

Lowdefy v5 had no timeout. A request ran until it finished or until the host's own limit stopped it (for example Vercel's function `maxDuration`). So a request that took 30–60 seconds in v5, such as a heavy MongoDB aggregation, a report query or a slow external API, **fails in v6**.

The failure is easy to miss:

- The request returns a generic server error, so the user sees "Something went wrong."
- The rest of the page still renders. A page that combines several requests (summary cards, totals) shows results computed from the requests that finished, and the numbers can look plausible.
- Dev servers from before this codemod was added don't apply the timeout, so the failure only shows up under `lowdefy build` + `lowdefy start` or on the deployed app.

This codemod keeps the v5 behaviour by setting `requestTimeout: 0`, and gives the app author what they need to choose a real limit later.

## Scope

`app` — the app's `lowdefy.yaml` (or `lowdefy.yml`), including a `config:` section pulled in with `_ref`.

## What to Do

### Step 1: Check whether the app already sets a timeout

```bash
grep -rn 'requestTimeout' lowdefy.yaml lowdefy.yml 2>/dev/null
grep -rn 'requestTimeout' --include='*.yaml' --include='*.yml' --include='*.njk' . | grep -v node_modules
```

If `config.requestTimeout` is already set (any value), **stop — no changes needed**. The author has already chosen a limit.

### Step 2: Add `requestTimeout: 0` to `config`

Add the key under `config:` in `lowdefy.yaml`, with a comment so the choice is visible:

```yaml
config:
  # Lowdefy v6 defaults to a 30s request timeout; v5 had none. 0 keeps the v5 behaviour, so the
  # host's own limit (e.g. Vercel maxDuration) is the only cap. Set a value in ms to cap requests.
  requestTimeout: 0
```

If `config:` is a `_ref` to another file, add the key in that file. If the app has no `config:` section, create one.

### Step 3: Report

Tell the app author:

- `config.requestTimeout: 0` was added to keep the v5 behaviour.
- The timeout protects against requests that hang on an upstream call and run to the host's limit, which is billed compute on serverless hosts. On a host with its own limit, `0` costs the same as v5 did.
- To choose a real limit, find the app's slowest successful requests in the host's logs (request duration per endpoint or request id). Set `requestTimeout` comfortably above the slowest one, or keep `0` if some requests legitimately run long.

### Step 4: Verify

```bash
lowdefy build
lowdefy start
```

Open the pages with the heaviest requests (reports, dashboards, validation pages) and check that every request succeeds.

## Files to Check

- `lowdefy.yaml` / `lowdefy.yml` — the `config:` section
- Any file `config:` is loaded from with `_ref`

## Examples

### Before

```yaml
lowdefy: 6.0.0
name: My App

config:
  homePageId: dashboard
```

### After

```yaml
lowdefy: 6.0.0
name: My App

config:
  homePageId: dashboard
  # Lowdefy v6 defaults to a 30s request timeout; v5 had none. 0 keeps the v5 behaviour, so the
  # host's own limit (e.g. Vercel maxDuration) is the only cap. Set a value in ms to cap requests.
  requestTimeout: 0
```

## Edge Cases

- **Agent, MCP and websocket routes** are exempt from the timeout whatever the value, so apps that only have long-running agents need no change for those.
- **Hosts without a function limit** (Docker, a long-lived Node host): with `0`, a request that hangs upstream runs until the upstream call gives up. If that matters, set a limit instead of `0`.
- **Multiple apps in one repo:** each app has its own `lowdefy.yaml`. Apply the change to each one.
