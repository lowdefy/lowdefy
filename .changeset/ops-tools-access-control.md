---
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat(server-dev): production telemetry tools in the dev MCP, locked on every call

`lowdefy_prod_errors`, `lowdefy_prod_trace`, `lowdefy_prod_slow` and `lowdefy_prod_repro` query the app's log sink and resolve each row's `config_key` to a `file:line` in the working tree, so an agent goes from a production failure to the yaml that caused it in one hop. Axiom (APL) and a local JSONL export are the two sinks; `since: 'deploy'` resolves to the first process start of the deployed `git_sha`. Because the dev MCP has no authentication of its own, the tools are checked on every call: they need the read-only `LOWDEFY_OPS_QUERY_URL`, `LOWDEFY_OPS_READ_TOKEN` and `LOWDEFY_OPS_DATASET`, they refuse a read token that is also a `LOWDEFY_SECRET_*` or `logger.otlp` header value, they refuse any non-loopback host (tunnel, port-forward, LAN), and an app can turn them off with `config.ops.enabled: false`. Every query, allowed or refused, writes an `ops_query` audit line and a dev notice that `lowdefy_build_status` shows. The tools are always registered and refuse with a `howToEnable` message rather than disappearing from the manifest. The same four calls are available as `GET /lowdefy-docs/ops/*`.
