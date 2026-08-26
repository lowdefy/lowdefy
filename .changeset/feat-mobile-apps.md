---
'@lowdefy/blocks-antd-mobile': minor
'@lowdefy/mobile-client': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/block-dev-e2e': patch
---

feat: Lowdefy mobile apps — build installable iOS/Android apps from the same config.

A top-level `mobile:` key in `lowdefy.yaml` defines mobile views (pages, menus, theme,
appId/name/serverUrl, Capacitor passthrough) against the same backend — same connections,
requests, endpoints, auth, and global. One `lowdefy build` produces the web app unchanged
plus `build/mobile/*` artifacts with per-target block type resolution: `type: Button` is
antd Button on web pages and antd-mobile Button on mobile pages.

- New `@lowdefy/blocks-antd-mobile` block set (Button, TextInput, TextArea, Switch,
  Selector, DateSelector, Card, List, NavBar, TabBar, and a Toast-based Message).
- New `@lowdefy/mobile-client` — a static Vite SPA (Capacitor webDir) that boots from
  the new `GET /api/root?target=mobile` route and fetches pages from `/api/page/*`.
- New CLI command group: `lowdefy mobile init | build | dev` — scaffolds a committed
  Capacitor project, builds the bundle with a generated `capacitor.config.json`
  (CapacitorHttp enabled), runs `cap sync`, and adds a mobile Vite dev lane with
  `/api` proxied to the dev server.
- `@lowdefy/client` gains `apiBase` (defaults to `basePath`) so API calls can target a
  remote origin while routing stays local in the webview; web behavior is unchanged.
- Web pages requested as mobile pages 404 in the app; mobile pageIds in a browser 302
  to `/404`. Web and mobile pages share the pageId namespace — a duplicate id across
  targets is a build error.
