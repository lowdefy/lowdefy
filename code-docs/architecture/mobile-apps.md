# Mobile Apps Architecture

How a Lowdefy app ships as an installable iOS/Android app — a Capacitor-wrapped static Vite SPA talking HTTPS to the app's existing Hono server. Introduced in PR #2247 (design: `designs/mobile-apps/design.md` in the design repo).

## Overview

An app developer adds a top-level `mobile:` key to `lowdefy.yaml` and authors mobile views in the same config language against the same backend — same connections, requests, endpoints, auth, and global. One `lowdefy build` produces the web app unchanged plus `build/mobile/*` artifacts. The `lowdefy mobile` CLI group builds the bundle into a committed Capacitor project.

```
lowdefy.yaml
├── pages:      ──┐
├── mobile:       │        @lowdefy/build (one build)
│   ├── pages:  ──┤────────────────┬──────────────────┐
│   ├── menus:    │                ▼                  ▼
│   └── ...       │      build/ (web artifacts,   build/mobile/
└── connections,  │       shared pages/ and       config.json, menus.json,
    auth, api ────┘       requests/ trees)        theme.css, plugins/*
```

The mobile app is `@lowdefy/mobile-client` (fetched into `.lowdefy/mobile` like the server packages), bundling the unchanged `@lowdefy/engine` + `@lowdefy/client`, the `@lowdefy/blocks-antd-mobile` block set, and the operators/actions/icons the app's mobile pages use. Page configs are not bundled — the app fetches them at runtime from `/api/page/*` exactly like web SPA navigation.

## The mobile config key

**Schema:** `packages/build/src/lowdefySchema.js` (`mobile` root property). Validated and normalized by `packages/build/src/build/buildMobile.js`:

- `appId` — native bundle id, reverse-DNS validated
- `name` — app display name
- `serverUrl` — backend origin baked into production bundles (required by `lowdefy mobile build`; `LOWDEFY_MOBILE_SERVER_URL` overrides per build)
- `config.homePageId` — mobile home (else first mobile menu link)
- `theme` — antd-mobile CSS variable map with an optional `dark` block
- `capacitor` — free-form object merged into the generated Capacitor config
- `menus`, `pages` — reuse the existing menu/page definitions
- `mobile.shell` — **reserved** for the app-shell design, rejected with a ConfigError

`buildMobile` stamps `mobile.configured` from the presence of the key. Bundle artifacts (plugin imports, theme, mandatory types) are only populated for configured apps; `mobile/config.json` and `mobile/menus.json` are always written because `/api/root?target=mobile` reads them for any app.

## Per-target type resolution

`type: Button` means antd's Button on web pages and antd-mobile's Button on mobile pages. Mechanics:

- **Two types maps.** `context.typesMap` (web, as before) and `context.typesMapMobile` — generated into dist by `packages/build/src/scripts/generateDefaultTypes.js` from `defaultPackagesMobile.js`. Block types in the mobile map come only from `blocks-antd-mobile`, `blocks-basic`, and `blocks-loaders` (`mobileBlockPackages`) — target-neutral packages like `plugin-aws` also ship web-only blocks that must not resolve on mobile. `blocks-antd-mobile` registers last so its `List` wins over blocks-basic's. Custom `plugins:` register into **both** maps (usage is counted per target).
- **Split counters.** `context.typeCountersMobile` (`packages/build/src/utils/createMobileTypeCounters.js`) gives mobile pages their own counters for client-side classes (blocks, actions, client operators) while **sharing** the main counters for server-side classes (requests, connections, server operators) — the server executes mobile page requests, so their types must reach the server imports and `updateServerPackageJson`. When adding a counter class, `createMobileTypeCounters` is where the per-target vs shared decision lives.
- **Page walk.** `buildPages` (`packages/build/src/build/full/buildPages.js`) walks web then mobile pages with one shared duplicate-pageId check (pageIds are a global namespace — requests, auth rules and `/api/page/*` are keyed by them) and stamps `page.target`. `buildPage` selects the counters and blockMetas by target.
- **Types/imports.** `buildTypesMobile` builds `components.typesMobile` (force-adding the mobile `Message` + basic/loader blocks for configured apps), `buildImportsMobile` the import lists (dev imports the whole mobile map since JIT pages aren't counted at skeleton time), and `writeMobilePluginImports` writes `mobile/plugins/*`.

## Build artifacts

```
build/
├── pages/{pageId}.json       # web AND mobile pages, each with a target field
├── requests/...              # shared — mobile page requests execute server-side
└── mobile/
    ├── config.json           # appId, name, serverUrl, homePageId, capacitor
    │                         #   (written marker-free via skipMarkers — plain JSON)
    ├── menus.json
    ├── theme.css             # :root:root CSS variables + dark block scoped to
    │                         #   html[data-prefers-color-scheme='dark']
    ├── blockPackages.json
    └── plugins/              # import files for the mobile Vite bundle
        ├── blocks.js, blockMetas.json, blockSchemas.json
        ├── actions.js, icons.js
        └── operators/{client.js, clientJsMap.js}
```

Placing mobile pages in the shared `pages/` tree is what lets `getPageConfig`, JIT dev builds, and the request/auth machinery work with zero changes.

## Auth

Mobile pages share the pageId namespace, so `auth.pages` rules (protected/public/roles patterns) apply across both targets — `getProtectedPages`/`getPageRoles` derive their pageId lists from web + mobile pages. Menu link auth is inherited from the mobile pages by `buildMobileMenu`. Runtime auth is the unchanged server-side `authorize` in `getPageConfig`/request handling.

Mobile sign-in is credentials-type providers only in v1, via `@hono/auth-js/react` pointed at `${apiBase}/api/auth` with `CapacitorHttp`'s native cookie jar persisting the session. OAuth is deferred to the BetterAuth migration.

## Runtime

**Server** (`packages/servers/server`):
- `GET /api/root?target=web|mobile` (`src/routes/root.js`) — thin wrapper over `getRootConfig(context, { target })`; `target=mobile` reads `mobile/menus.json` and resolves home from `mobile/config.json` (`packages/api/src/routes/rootConfig/*`). Session-role menu filtering applies unchanged.
- `renderPage.js` 302s to `/404` when a page artifact's target is not web, so mobile pages never half-render in a browser.
- **Every navigation path checks target**: the web SPA clients (prod `server/client/Page.jsx` and dev `server-dev/client/Page.jsx`) replace to `/404` on a non-web target; the mobile client shows its 404 view for a non-mobile target. Cross-target `Link` actions are build-valid and resolve at runtime.

**Mobile client** (`packages/mobile-client`):
- Boot: parallel fetch of `/api/root?target=mobile` + `/api/auth/session`, then render (`client/main.jsx`). No embedded config — every page including the first comes from `/api/page/*`. The dev JIT route returns the config bare while prod wraps it in `{ pageConfig }`; the client accepts both.
- `apiBase` — `@lowdefy/client` splits `apiBase` from `basePath` (`initLowdefyContext.js`): routing stays origin-local in the webview (`basePath: ''`) while `createCallRequest`/`createCallAPI`/`createWebSocketClient`/`createHandleError` target `apiBase` (the baked `serverUrl`; empty in dev where Vite proxies `/api`).
- Chrome: antd-mobile `ConfigProvider` with locale via the shared `useLocale` hook (antd-mobile loader map, same resolve order and `window.__lowdefy_setLocale` contract as web), a dark-mode hook stamping `data-prefers-color-scheme` on `<html>` (same `window.__lowdefy_setDarkMode` contract so the SetDarkMode action works), safe-area insets, error boundary.
- Dev-only JIT merge channels (`client/Page.jsx`, behind `import.meta.env.DEV`): after each page fetch, `/api/js/client` and `/api/icons/dynamic` are fetched and merged so `_js` functions and icons in JIT-resolved pages reach the bundle — mirroring the web dev client. Compiled out of production bundles.
- Import resolution: generated `build/mobile/plugins/*` files live outside the package root, so `vite.config.js` ships a `resolveId` plugin resolving their bare imports from the package's node_modules.

**Blocks** (`packages/plugins/blocks/blocks-antd-mobile`): Button, TextInput, TextArea, Switch, Selector (Picker + trigger field), DateSelector, Card, List, NavBar, TabBar, and a Toast-based Message (satisfying the client's DisplayMessage mount). TabBar is menu-driven and navigates via `methods.link` — `lowdefy._internal.link` (what the Link action calls) is exposed to all block categories through the client's block method assemblies, with a `blockDefaultProps` no-op. List renders a `List.Item` per repeated content area; per-item data is authored as blocks inside the item (the standard list idiom), with `itemArrow` and an `onItemClick` event carrying the item `index` covering the List.Item chrome.

## CLI (`lowdefy mobile init | build | dev`)

**Files:** `packages/cli/src/commands/mobile/`. `getDirectories` adds `mobile` (`.lowdefy/mobile`, ephemeral Vite tooling) and `mobileProject` (default `<config>/mobile`, the **committed** Capacitor project holding signing config, icons, native plugins; `www/` gitignored).

- `init` — runs a full build if artifacts are missing, fetches `@lowdefy/mobile-client` (same `getServer` tarball mechanism), scaffolds the project (package.json with `@capacitor/*` deps, a `pnpm-workspace.yaml` allowlisting sharp's build script for pnpm 10/11), generates `capacitor.config.json`, and runs `cap add` per platform (`--no-ios`/`--no-android`).
- `build` — full `lowdefy build` (`--no-server-build` skips), validates `serverUrl`, installs `.lowdefy/mobile` with custom plugins as deps, Vite build (via the parameterized `runClientBuild`), copies `dist/` → `mobile/www`, regenerates `capacitor.config.json` (generated-file marker, `CapacitorHttp` enabled, `androidScheme` left at the Capacitor default pending a device cookie check), `cap sync`, and `@capacitor/assets` when `mobile/assets/` exists.
- `dev` — the standard dev manager plus a mobile Vite lane the manager spawns behind `LOWDEFY_SERVER_DEV_MOBILE` (`packages/servers/server-dev/manager/processes/startMobileClient.mjs`; restarts respawn it) on a second port with `/api` proxied to the dev server — no CORS or cookie special-casing in dev. `--ios`/`--android` waits for the dev build artifacts in `<dev>/build`, writes a dev Capacitor config with the LAN `server.url`, and runs `cap run` for on-device live reload. `server.url` is dev-only (App Store posture).

## Transport

`CapacitorHttp` is enabled in the generated config: native HTTP with a native cookie jar, patching `fetch` — no CORS preflight against the server and Auth.js session cookies that persist across app restarts. No CORS configuration exists on the Hono server at all.

## Known limitations (v1)

- **Dynamic blocks on mobile pages** — `resolveDynamicContent` validates fragments against the web artifacts (`types.json`, `plugins/blockMetas.json`), not the mobile bundle. The build warns when a mobile page is `dynamic: true`. Fixing needs a `mobile/types.json` artifact and target-threading in `packages/api`.
- **Websockets / agent streaming** — `CapacitorHttp` does not support streaming bodies; not validated against at build, degrades at runtime.
- **OAuth sign-in, offline, push** — deliberate non-goals; see the design.
- `useMobileDarkMode` and the auth `Session` component duplicate small cores from `@lowdefy/client` / the web server client — extraction into `@lowdefy/client` is a planned follow-up (API-surface decision).
