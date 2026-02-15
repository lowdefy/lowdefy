# Next.js + React 19 Upgrade Plan

> Companion plan to `antd-v6-upgrade-plan.md`. These two upgrades share dependencies and should be
> coordinated — certain steps must happen together, others have a strict order.

---

## 1. Current State

| Dependency | Current Version | Target Version | Jump |
|------------|----------------|----------------|------|
| Next.js | 13.5.4 | 15.x (latest stable) | 2 major versions |
| React | 18.2.0 | 19.x (latest stable) | 1 major version |
| react-dom | 18.2.0 | 19.x | 1 major version |
| next-auth | 4.24.5 | 4.24.x (keep) | None |
| next-with-less | 3.0.1 | **Remove** | N/A |
| @sentry/nextjs | 8.53.0 | Latest 8.x | Patch |

### Why Not Next.js 16?

Next.js 16 makes Turbopack the default bundler. Custom webpack configs (which Lowdefy uses
extensively) cause build failures by default. While `--webpack` flag exists as an escape hatch, it's
swimming against the current. Next.js 15 is the sweet spot — React 19 support, Pages Router fully
stable, webpack still the default, long-term support.

If/when Lowdefy migrates to Turbopack, that's a separate initiative after the webpack config is
simplified (which the antd v6 upgrade helps with by removing `next-with-less`).

### Why Not Next.js 14 First? (Re: GitHub Issue #2008)

Issue #2008 proposes upgrading to Next.js 14.2.35 as a safe, code-change-free step. That's valid as
a standalone patch, but since we're already doing the antd v6 upgrade which removes `next-with-less`
and the Less pipeline, we can jump straight to Next.js 15:

- **Next.js 14 still needs `next-with-less`** — but the antd upgrade removes Less entirely
- **Next.js 15 requires React 19** — which antd v6 natively supports
- **Doing 13→14→15 means two upgrade cycles** touching the same files

The antd v6 upgrade is the enabler: once Less is gone and antd v6 is on React 19, the Next.js 15
upgrade becomes straightforward.

**However:** Issue #1971 (security patch to 13.5.11 for CVE-2025-29927) should be done immediately
as a hotfix on the current codebase — it's a one-line version bump with no code changes.

---

## 2. Relationship with Antd v6 Upgrade

### Dependency Chain

```
┌─────────────────────────────────────────────────────┐
│ Antd v6 Upgrade (must happen FIRST)                 │
│                                                     │
│  1. Remove Less/emotion → no more next-with-less    │
│  2. Antd v6 → natively supports React 19            │
│  3. New styling (class/styles) → no emotion runtime │
└──────────────────────┬──────────────────────────────┘
                       │ enables
┌──────────────────────▼──────────────────────────────┐
│ Next.js 15 + React 19 Upgrade                       │
│                                                     │
│  1. React 19 — antd v6 already supports it          │
│  2. No next-with-less — already removed             │
│  3. No Less pipeline — already removed              │
│  4. Clean next.config.js — much simpler             │
└─────────────────────────────────────────────────────┘
```

### What the Antd Upgrade Removes (Prerequisite)

These blockers for Next.js 15 are resolved by the antd v6 upgrade:

| Blocker | Removed By |
|---------|-----------|
| `next-with-less` (unmaintained, breaks on Next 15+) | Antd v6 drops Less entirely |
| `@emotion/css` (SSR complexity) | New `styles`/`class` system replaces emotion |
| `styles.less` import in `_app.js` | Replaced by `globals.css` generation |
| React 18 lock-in (antd v5 needs patch for React 19) | Antd v6 natively supports React 19 |

---

## 3. What Changes in Next.js 15

### 3.1 React 19 Required

Next.js 15 requires React 19. This is the biggest change and affects:

**`defaultProps` on function components — deprecated (warning, not error):**

105 block files use `BlockName.defaultProps = blockDefaultProps`. React 19 deprecates
`defaultProps` on function components (still works on class components). These will log warnings.

**Migration:** Convert to JS default parameters. Since all blocks use the same pattern
(`blockDefaultProps`), this is mechanical:

```javascript
// BEFORE
function Button({ blockId, methods, properties }) { ... }
Button.defaultProps = blockDefaultProps;

// AFTER — destructure with defaults
function Button({
  blockId,
  methods = {},
  properties = {},
  ...rest
} = {}) { ... }
```

**However:** This is cosmetic (warnings, not errors). Can be deferred to a follow-up PR after the
core upgrade is stable. The warnings don't break functionality.

**Class components extending `React.Component` (7 files):**

These still support `defaultProps` in React 19 — no change needed. But they should be converted to
function components eventually:

- `packages/utils/block-utils/src/ErrorBoundary.js` — keep as class (needs `componentDidCatch`)
- `packages/utils/block-utils/src/HtmlComponent.js`
- `packages/plugins/blocks/blocks-echarts/src/blocks/EChart/EChart.js`
- `packages/plugins/blocks/blocks-google-maps/src/blocks/GoogleMapsScript/GoogleMapsScript.js`
- `packages/plugins/blocks/blocks-markdown/src/blocks/DangerousMarkdown/DangerousMarkdown.js`
- `packages/plugins/blocks/blocks-qr/src/blocks/QRScanner/QRScanner.js`
- `packages/plugins/blocks/blocks-basic/src/blocks/DangerousHtml/DangerousHtml.js`

**No `forwardRef` usage** — verified zero occurrences. No migration needed.

**No string refs** — not used anywhere.

**No legacy context API** — not used.

**`ref` as regular prop:** React 19 allows `ref` to be passed as a regular prop to function
components (no `forwardRef` needed). Since Lowdefy doesn't use `forwardRef`, this is just a nice
bonus for future code.

### 3.2 Pages Router — Fully Supported

Next.js 15 fully supports Pages Router. No migration to App Router needed. Key points:

- `getServerSideProps` — works unchanged
- `getStaticProps` — works unchanged
- `pages/api/*` routes — work unchanged
- `_app.js` and `_document.js` — work unchanged
- `next/router` — works unchanged (App Router uses `next/navigation` but Pages Router keeps
  `next/router`)
- `next/dynamic` — works unchanged
- `next/head` — works unchanged
- `next/link` — works unchanged (automatic `<a>` wrapping already happened in Next 13)

### 3.3 Async Request APIs (App Router Only)

The `cookies()`, `headers()`, `draftMode()` async changes in Next.js 15 **only affect App Router**.
Since Lowdefy uses Pages Router exclusively, none of this applies.

In Pages Router, request data flows through `getServerSideProps` context and API route `(req, res)`
parameters — both unchanged.

### 3.4 Caching Behavior Changes

Next.js 15 changed default caching behavior:

- `fetch` requests are **no longer cached by default** (was cached in 14)
- GET Route Handlers are **no longer cached by default**
- Client-side Router Cache no longer caches page components by default

**Impact on Lowdefy:** Minimal. Lowdefy's data fetching goes through its own request system
(`apiWrapper` → `@lowdefy/api`), not through Next.js `fetch`. The only place this could matter is
`getServerSideProps` in `index.js` and `[pageId].js`, but those were never cached anyway
(`getServerSideProps` runs on every request by design).

### 3.5 `next.config.js` Changes

Next.js 15 introduces `next.config.ts` support but `.js` still works. No changes needed.

**After the antd upgrade removes `next-with-less`,** the config becomes much simpler:

```javascript
// BEFORE (current — complex)
const withLess = require('next-with-less');
const nextConfig = withLess({
  basePath: lowdefyConfig.basePath,
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { /* 8 fallbacks */ };
    }
    return config;
  },
  // ... other options
});

// AFTER (post-antd-upgrade + Next 15 — clean)
const nextConfig = {
  basePath: lowdefyConfig.basePath,
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { /* 8 fallbacks */ };
    }
    return config;
  },
  // ... other options
};
```

The webpack fallbacks stay — they're for Node.js module shimming on the client side, unrelated to
Less/antd.

### 3.6 `next-auth` Compatibility

`next-auth@4.24.5` is compatible with Next.js 15. The Pages Router auth pattern (`pages/api/auth/
[...nextauth].js`) works unchanged. No migration to Auth.js v5 needed as part of this upgrade.

**Note:** Auth.js v5 (formerly NextAuth v5) is a separate, optional upgrade that could happen later.
It has a different API surface and would be a separate initiative.

### 3.7 `@sentry/nextjs` Compatibility

`@sentry/nextjs@8.53.0` supports Next.js 15. The `withSentryConfig` wrapper pattern works
unchanged. May want to bump to latest 8.x for bug fixes but no breaking changes expected.

---

## 4. Implementation Plan

### Phase 0: Security Hotfix (Do Immediately, Independent)

**Addresses:** GitHub issue #1971 (CVE-2025-29927)

Bump Next.js from 13.5.4 to 13.5.11 in:
- `packages/servers/server/package.json`
- `packages/servers/server-dev/package.json`

This is a patch version — zero code changes, zero risk. Do this on `main`/`develop` immediately,
don't wait for the v5 upgrade.

### Phase 1: Antd v6 Upgrade (See `antd-v6-upgrade-plan.md`)

Complete the antd v6 upgrade first. This:
- Removes `next-with-less` and all Less files
- Removes `@emotion/css`
- Replaces `styles.less` import with `globals.css`
- Gets antd v6 running on React 18 (it supports both 18 and 19)

**At the end of this phase:** Lowdefy runs on Next.js 13.5.x + React 18.2.0 + antd v6. Everything
works. This is a stable checkpoint.

### Phase 2: React 19 Upgrade

**After antd v6 is stable.** This is a version bump + warning cleanup:

1. **Bump versions:**
   ```
   react: 18.2.0 → 19.x
   react-dom: 18.2.0 → 19.x
   ```
   Update in all package.json files that declare React as a dependency.

2. **Verify antd v6 on React 19:** Should work natively — no patch needed. Run the full test suite.

3. **Address `defaultProps` warnings (105 files):**
   - Option A: Convert all 105 blocks in one pass (mechanical, scriptable)
   - Option B: Suppress warnings and convert gradually (pragmatic)
   - Recommendation: **Option A** — it's a find-and-replace pattern, do it in one commit

4. **Convert class components to functions (6 files, optional):**
   - Skip `ErrorBoundary` (needs `componentDidCatch` — only class component feature with no hook
     equivalent)
   - The other 6 can be converted but aren't urgent — class components work fine in React 19

5. **Test `_document.js` class component:**
   - `LowdefyDocument extends Document` — this is a Next.js pattern, not a React pattern. Next.js
     handles this internally. Verify it still works in Next 15 (it should — Pages Router preserved).

6. **Run full test suite.** Fix any React 19 behavioral changes (e.g., ref callback cleanup
   functions, StrictMode double-render changes).

### Phase 3: Next.js 15 Upgrade

**After React 19 is stable.** This is the final step:

1. **Bump Next.js:**
   ```
   next: 13.5.4 → 15.x (latest stable)
   ```
   Update in:
   - `packages/servers/server/package.json`
   - `packages/servers/server-dev/package.json`
   - `packages/plugins/plugins/plugin-next-auth/package.json` (devDependency)
   - `packages/plugins/connections/connection-mongodb/package.json` (devDependency)

2. **Remove `next-with-less`** (should already be gone from antd upgrade):
   - Delete from `package.json` dependencies
   - Remove `const withLess = require('next-with-less')` from `next.config.js`
   - Remove `withLess()` wrapper — use plain config object

3. **Remove Less dependencies** (should already be gone):
   - `less`, `less-loader` from both server packages

4. **Update `_app.js` style import:**
   ```javascript
   // BEFORE
   import '../build/plugins/styles.less';

   // AFTER (already done by antd upgrade)
   import '../build/globals.css';
   ```

5. **Update `@next/eslint-plugin-next`:**
   ```
   @next/eslint-plugin-next: 13.5.4 → 15.x
   ```

6. **Verify all Pages Router patterns work:**
   - `getServerSideProps` in `index.js`, `[pageId].js`
   - `getStaticProps` in `404.js`
   - All API routes in `pages/api/`
   - `dynamic(() => ..., { ssr: false })` in `_app.js`
   - `useRouter` in client Page component
   - `next/link` and `next/head` usage

7. **Verify `next build` and `next start` work** for production server.

8. **Verify server-dev** hot reload, file watching, and dev API endpoints.

9. **Verify standalone output** (`LOWDEFY_BUILD_OUTPUT_STANDALONE=1`).

10. **Verify Sentry integration** with `@sentry/nextjs` on Next.js 15.

---

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `next-with-less` incompatible with Next 15 | **Blocker** | Antd upgrade removes it first |
| React 19 breaks antd components | **Blocker** | Antd v6 natively supports React 19 |
| `defaultProps` warnings flood console | Low | Convert in one pass (scriptable) |
| `next-auth` incompatible | Low | v4.24.5 supports Next 15 Pages Router |
| `@sentry/nextjs` incompatible | Low | v8.53.0 supports Next 15 |
| Caching behavior changes | Low | Lowdefy uses own data layer, not Next fetch |
| Webpack fallbacks break | Low | Webpack config format unchanged in Next 15 |
| `_document.js` class pattern breaks | Low | Pages Router preserves this pattern |
| Standalone output breaks | Medium | Test explicitly with `LOWDEFY_BUILD_OUTPUT_STANDALONE=1` |
| `process/browser` polyfill changes | Low | Verify client-side builds still resolve |

---

## 6. Files to Modify

### Core Changes (Phase 3)

| File | Change |
|------|--------|
| `packages/servers/server/package.json` | next: 15.x, remove next-with-less/less/less-loader |
| `packages/servers/server-dev/package.json` | next: 15.x, remove next-with-less/less/less-loader |
| `packages/servers/server/next.config.js` | Remove `withLess` wrapper |
| `packages/servers/server-dev/next.config.js` | Remove `withLess` wrapper |
| `packages/plugins/plugins/plugin-next-auth/package.json` | next: 15.x (devDep) |
| `packages/plugins/connections/connection-mongodb/package.json` | next: 15.x (devDep) |

### React 19 Changes (Phase 2)

| File | Change |
|------|--------|
| All `package.json` with react dependency | react: 19.x, react-dom: 19.x |
| 105 block files with `.defaultProps` | Convert to default parameters (optional, can defer) |
| 6 class component files | Convert to function components (optional, can defer) |

### Already Done by Antd Upgrade

| File | Change |
|------|--------|
| `_app.js` (both servers) | `styles.less` → `globals.css` import |
| `next.config.js` (both servers) | `withLess` wrapper removal |
| All block files | `makeCssClass` removal, new `styles`/`classNames` API |

---

## 7. Testing Strategy

### Automated
- `pnpm test` — full test suite (unit + integration)
- `pnpm -r --filter=@lowdefy/server test` — server-specific tests
- `next build` in both server packages — verify build succeeds
- `next start` — verify production server starts

### Manual
- Dev server hot reload (file change → browser update)
- Page navigation (client-side routing via `next/link`)
- Authentication flow (NextAuth sign-in/sign-out)
- API request execution (operator parsing, connection handling)
- 404 page rendering (static generation)
- Standalone Docker build (`output: 'standalone'`)
- Sentry error capture (trigger error, verify in Sentry dashboard)
- Base path configuration (set `basePath`, verify all routes work)

---

## 8. What We're NOT Doing

| Scope Exclusion | Reason |
|----------------|--------|
| App Router migration | Pages Router fully supported, massive refactor for no clear benefit |
| Auth.js v5 (NextAuth v5) | Different API surface, separate initiative |
| Turbopack | Requires removing all custom webpack config, separate initiative |
| Next.js 16 | Turbopack default is a blocker, Next 15 is the right target |
| `next/image` adoption | Not currently used, separate initiative |
| React Server Components | Requires App Router, not applicable to Pages Router |
| Server Actions | Requires App Router |

---

## 9. Timeline Integration with Antd Upgrade

```
Phase 0: Security hotfix (13.5.4 → 13.5.11)     ← Do now, independent
    │
    ▼
Antd v6 Phase 1-3: Foundation + blocks + styling ← Main antd work
    │
    ▼
Antd v6 Phase 4: Theme system                    ← Antd wrap-up
    │
    ├── React 19 upgrade (Phase 2)                ← Can start here
    │       Version bump + defaultProps cleanup
    │
    ▼
Antd v6 Phase 5: Tailwind                        ← Antd final phase
    │
    ├── Next.js 15 upgrade (Phase 3)              ← Or here
    │       next-with-less already gone, clean upgrade
    │
    ▼
Done — Lowdefy v5 on Next.js 15 + React 19 + antd v6
```

The React 19 upgrade can slot in any time after antd v6 is on React 18 (since antd v6 supports
both). The Next.js 15 upgrade should come after `next-with-less` is fully removed.

---

## 10. Open Questions

1. **Node.js version:** Next.js 15 requires Node.js 18.18+. What's the minimum Node.js version
   Lowdefy currently supports? May need to bump.

2. **Website package:** `packages/website/package.json` already uses `next@^14.2.0`. Should it also
   go to 15? Or is it independent?

3. **`eslint-config-next`:** Issue #2008 mentions pinning this in the website package. Verify the
   correct version to use with Next 15.

4. **Monorepo React version sync:** All packages need the same React version. Verify there are no
   packages that pin React 18 specifically in ways that conflict.
