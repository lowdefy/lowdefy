---
'@lowdefy/api': patch
---

fix(api): Close the pre-authentication endpoint existence oracle.

With `auth.strategies`, an anonymous call to a protected endpoint returns 401, while a missing endpoint id still returned "does not exist" — so a logged-out caller could enumerate endpoint ids by response difference. On an app with auth configured, a session-less caller now gets the identical `Authentication required for API endpoint "..."` answer for a missing id, an `InternalApi` id and a protected id, over both `/api/endpoints/*` and MCP `tools/call`. Authenticated callers, apps without auth, and system runs (scheduled, webhook, detached) keep the opaque "does not exist".
