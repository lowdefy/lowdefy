---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): Name dev callers once with `auth.dev.users` and pass the name to any dev tool.

`auth.dev.users` declares named caller fixtures beside `auth.dev.mockUser`:

```yaml
auth:
  dev:
    users:
      admin: { id: dev-admin, roles: [admin], organization_id: org_1 }
      member: { id: dev-member, roles: [member], organization_id: org_1 }
```

Every dev tool that takes a `user` — `lowdefy_screenshot_page`, `lowdefy_inspect_state`,
`lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request`, `lowdefy_run_endpoint` and
the matching `/lowdefy-docs` routes — now accepts one of these names in place of an inline user
object, so a multi-tenant caller is written once instead of repeated (and mistyped) on every call:
`{ "pageId": "users", "user": "admin" }`, or `?user=admin` on the GET routes.

A name that is not declared is refused — a `400` on the routes, an error result over MCP — listing
the names that are declared. It never falls back to the default roleless caller, which renders an
empty page that reads like a working one. Inline user objects keep working exactly as before.

Fixtures do not bypass login: they only name the caller a headless tool acts as, and the production
server ignores them, as it does `dev.mockUser`.
