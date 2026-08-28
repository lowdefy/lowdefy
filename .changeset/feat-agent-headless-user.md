---
'@lowdefy/server-dev': minor
---

feat: Per-call `user` for the agent tools that render a page headless

The headless renderer signs in as a roleless user, so any page or request gated on a role rendered empty or refused for an agent — and the only lever was `--mock-user`, which bypasses login for the whole dev server, the developer's own browser included.

`lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` now accept a `user` — merged over the default headless user, so `{"roles": ["admin"]}` is usually all you need:

```json
{ "pageId": "users", "user": { "roles": ["admin"] } }
```

Each call opens its own browser context, so one call can act as an admin and the next as a plain member. Since no auth engine runs for an injected caller, nothing derives the rest of the record — pass `email`, `profile` or `attributes` too when a page reads them.

`user` is headless-only, because a page the developer opens in their own browser carries their real session. Passing `user` to `lowdefy_inspect_state`/`lowdefy_eval_operator` therefore selects the headless source, and combining it with `source: "tab"` is an error rather than a silently ignored role — as is combining it with `lowdefy_load_state`'s `mode: "registry-only"`, which hands the developer a URL to open themselves.

The plain HTTP routes take the same param — `?user={"roles":["admin"]}` on the GET routes, a `user` key in the body of `POST /lowdefy-docs/eval-operator` and `POST /lowdefy-docs/state-checkpoints/load`. A malformed or contradictory `user` answers `400`, distinct from the `502` a failed render returns, so an agent can tell "fix your call" from "retry".
