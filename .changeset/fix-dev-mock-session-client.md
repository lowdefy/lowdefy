---
'@lowdefy/server-dev': patch
---

fix: Serve the dev mock session to the browser client

With a mock user (`auth.dev.mockUser` / `LOWDEFY_DEV_USER` / `lowdefy dev --mock-user`) or a headless renderer session, server-side requests authenticated but the browser client's session stayed empty — `GET /api/auth/session` was answered by Auth.js alone, which knows nothing about dev sessions. Client-side `_user` values (roles, custom userFields like tenant claims) were missing, breaking auth-driven routing; apps could remount-loop between pages whose conditions read `_user`.

Dev sessions are now built in one place (`getDevSession`) and served from it to both the server request context and the browser session endpoint, so the two can never diverge. The dev user also runs through the identical Auth.js session callback a real sign-in uses — userFields mapping, custom session-callback plugins, roles validation, `hashed_id` — so mock and headless sessions behave exactly like a production authenticated user.
