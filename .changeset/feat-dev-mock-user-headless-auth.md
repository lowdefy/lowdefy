---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat: Authenticate the dev server as a mock user for headless rendering and agent tools

The dev server's headless renderer (used by the AI-agent screenshot and state-inspection tools) now authenticates, so auth-protected pages render instead of returning 404.

- **New `lowdefy dev --mock-user [user]` flag** — start the development server authenticated as a mock user. Pass a JSON user object to set the identity and roles (e.g. `--mock-user '{"sub":"dev","roles":["admin"]}'`), or use the bare flag for a default user. This drives the same `auth.dev.mockUser` mechanism from the command line.
- **Headless renderer authenticates** — the docs/MCP headless browser now carries an authenticated session, so `lowdefy_screenshot_page` and headless state inspection work on pages with `auth.public: false`. The developer's real browser session is unaffected. To render role-gated pages, configure `auth.dev.mockUser` (or `--mock-user`) with matching roles.
