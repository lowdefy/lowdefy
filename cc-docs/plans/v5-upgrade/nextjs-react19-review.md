# Critical Review: Next.js 15 + React 19 Upgrade Plan

> Reviewed against: `nextjs-react19-upgrade.md`
> Reviewer: Systems expert perspective, verified against codebase and official docs.

---

## Verdict

The plan is **mostly sound but has several factual errors, a missed blocker, and one risk
significantly understated.** The phased approach and dependency chain are correct. The decision to
target Next.js 15 over 16 is right. But the details need correction before implementation.

---

## Critical Errors

### 1. "Next.js 15 requires React 19" — Wrong

**The plan states this repeatedly as a foundational assumption. It's incorrect.**

Next.js 15 peer dependencies are `"react": "^18.2.0 || 19.0.0-rc-..."`. The Pages Router
explicitly supports React 18. From the Next.js 15 blog:

> "We've also introduced backwards compatibility for React 18 with the Pages Router based on
> community feedback."

**Impact:** This changes the phasing strategy. React 19 and Next.js 15 are **independent upgrades**
for Pages Router. The plan's Phase 2 (React 19) and Phase 3 (Next.js 15) can happen in either
order, or simultaneously. The forced dependency chain `antd v6 → React 19 → Next.js 15` is
actually `antd v6 → (React 19 + Next.js 15 in any order)`.

**Recommendation:** This is good news. It means you can upgrade Next.js 15 first (with React 18)
to get security fixes and modern Next.js features, then upgrade React 19 separately. Or do both
together. The plan's strict ordering is unnecessarily rigid.

### 2. Sentry `sentry.*.config.js` Pattern is Broken on Next.js 15 — Missed Blocker

**The plan rates Sentry as "Low" risk. This is wrong — it's a blocker.**

Sentry v8 changed how server/edge configs are loaded for Next.js 15:

| File | Next.js 13 (current) | Next.js 15 (required) |
|------|---------------------|----------------------|
| `sentry.client.config.js` | Auto-loaded | Replaced by `instrumentation-client.ts` |
| `sentry.server.config.js` | Auto-loaded | Must be imported via `instrumentation.ts` |
| `sentry.edge.config.js` | Auto-loaded | Must be imported via `instrumentation.ts` |
| `instrumentation.ts` | Not needed | **Required** — with `register()` function |

Both servers currently have all three `sentry.*.config.js` files. These will **silently stop
loading** on Next.js 15 — Sentry will appear to work but server-side error capture will be broken.

**Required new file (`instrumentation.ts` in both servers):**

```typescript
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
```

Also: the `experimental.instrumentationHook` config is no longer needed in Next.js 15 (it prints a
warning if set). Verify Lowdefy doesn't set this.

**The plan must add Sentry migration as a Phase 3 step with explicit file changes.**

### 3. `outputFileTracing` Config Option Removed — Missed Breaking Change

**The plan doesn't mention this.** The boolean `outputFileTracing` option was removed in Next.js 15.
Output file tracing is now always enabled and cannot be disabled.

Current code:
- `server/next.config.js:26` — `outputFileTracing: true` (harmless, already the default)
- `server-dev/next.config.js:24` — `outputFileTracing: false` (**will error or be ignored**)

The dev server explicitly disables file tracing for faster builds. In Next.js 15, this option no
longer exists.

**Additionally**, the `experimental.outputFileTracingRoot` and related options were promoted to
top-level config. Verify neither server uses these experimental variants.

**Fix:** Remove `outputFileTracing` from both `next.config.js` files. For dev server performance,
investigate alternative Next.js 15 config options if tracing causes slowness.

---

## Factual Corrections

### 4. "105 block files need defaultProps conversion" — Context Missing

The count is correct, but the plan's migration pattern is wrong:

```javascript
// Plan suggests:
function Button({
  blockId,
  methods = {},
  properties = {},
  ...rest
} = {}) { ... }
```

This doesn't replicate what `blockDefaultProps` actually provides. Need to verify what
`blockDefaultProps` contains — it's imported from `@lowdefy/block-utils`. The defaults may include
nested objects, callback functions, or other values that can't be expressed as simple `= {}`
defaults.

**Recommendation:** Read `blockDefaultProps` source first. If it's just `{ properties: {},
methods: {} }`, simple defaults work. If it has deeper structure, a different pattern is needed
(e.g., a wrapper HOC or merging in the function body).

Also: React 19 `defaultProps` is deprecated with a **warning**, not removed. It still works. Since
Lowdefy wraps the entire app in `dynamic(() => ..., { ssr: false })`, these warnings only appear in
the browser console, not during SSR. They're noisy but non-blocking. The plan correctly notes this
can be deferred.

### 5. Website Package Uses App Router + Next.js 14 — Not Mentioned

The plan mentions `packages/website` in passing (open question #2) but doesn't note that it already
uses App Router with Next.js 14. This matters because:

- The website is a separate deployment — it can stay on Next 14 or upgrade independently
- The website already uses `next/image`, `next/font`, client components with `'use client'`
- If upgraded to Next 15, the website **would** need React 19 (App Router requires it)

**Recommendation:** Explicitly scope the plan to the server packages. The website is independent.

### 6. "No `next/router` usage" — Needs Verification

The codebase scan found zero `next/router` imports in server/client packages. But Lowdefy's client
Page component must handle navigation somehow. Either:
- It uses `window.location` directly (likely — since the whole app is client-rendered)
- It uses a custom routing layer
- The imports are indirect (through a utility)

This isn't a problem for the upgrade, but the plan's claim should note WHY there are no router
imports — it's because Lowdefy manages its own client-side navigation, not because it doesn't do
routing.

---

## Understated Risks

### 7. `next-auth@4.24.5` — Medium Risk, Not Low

The plan rates this as "Low" because the Pages Router API route pattern (`req, res`) is unchanged.
That's correct for the current code. But:

- `next-auth@4` is effectively unmaintained (Auth.js v5 is the successor)
- The `getServerSession(req, res, authOptions)` signature used in `serverSidePropsWrapper.js` and
  `apiWrapper.js` works, but any future Next.js minor version could change internal `req`/`res`
  behavior
- `plugin-next-auth` imports 42+ providers from `next-auth/providers/*` using CommonJS `require()`.
  If `next-auth` ever ships ESM-only (unlikely for v4, but the package is in maintenance mode), this
  breaks

**Recommendation:** Keep risk at Medium. Note that `next-auth@4` + Next.js 15 Pages Router works
today but is a tech debt timebomb. Auth.js v5 migration should be on the roadmap.

### 8. `process/browser` Polyfill — Verify It Still Resolves

The plan mentions this but underestimates the risk. Both `next.config.js` files have:

```javascript
process: require.resolve('process/browser'),
```

This resolves to the `process` npm package (version 0.11.10, quite old). In Next.js 15:
- `config.resolve.fallback` still works (webpack 5 format, unchanged)
- `require.resolve()` in `next.config.js` still works (CJS still supported)
- The `process` package at 0.11.10 is stable

**However:** Next.js 15 may have different defaults for which Node.js built-ins get polyfilled
vs stubbed. Verify that explicitly setting `process: require.resolve('process/browser')` doesn't
conflict with Next.js 15's own handling.

**Test:** Build both servers with Next.js 15 and check for `process.env` access in client-side
bundles.

---

## Missing From the Plan

### 9. `server-dev` Spawns `next start`, Not `next dev`

The plan says "Verify server-dev hot reload" but doesn't note a critical detail:
`server-dev/manager/processes/startServer.mjs` spawns `next start` (production mode), NOT
`next dev`. The dev experience (hot reload, file watching) is managed by the Lowdefy manager
process, not by Next.js's built-in dev server.

This means:
- Next.js 15's dev server improvements (Turbopack dev, faster HMR) don't benefit server-dev
- The `next start` binary interface is stable — low risk
- But the Lowdefy build produces files that `next start` serves, so the build output format must
  match what Next.js 15 expects

**Recommendation:** Add to the plan: verify that `next start` in Next.js 15 correctly serves the
Lowdefy build output (static files, API routes, pages). The output format may have subtle
differences.

### 10. No `middleware.js` — Good, But Note Why

The codebase scan confirmed zero middleware files. This is good because Next.js 15 changed
middleware behavior (and Next.js 16 renames `middleware.js` to `proxy.js`). Worth noting
explicitly as a non-issue.

### 11. Edge Runtime Consideration

The `sentry.edge.config.js` files exist in both servers. Does Lowdefy actually use Edge Runtime
anywhere? If not, these files are dead code and can be removed during the Sentry migration. If
Edge Runtime IS used somewhere, the plan needs to account for Next.js 15's Edge Runtime changes.

### 12. `next/dynamic` Pattern in `_app.js` — Unusual but Safe

Both servers wrap the entire App in:
```javascript
const DynamicApp = dynamic(() => Promise.resolve(App), { ssr: false });
```

This is an unusual pattern — it disables SSR for the entire application. It works in Next.js 15
Pages Router (the `ssr: false` restriction only applies to App Router Server Components). But
it's worth noting:

- This means `getServerSideProps` runs and returns props, but the page component renders only on
  the client
- All React rendering is client-side — the HTML sent to the browser is an empty shell
- This is intentional for Lowdefy (config-driven rendering can't meaningfully SSR)

**No change needed**, but document this as a known architectural pattern so future reviewers
don't "fix" it.

---

## Revised Risk Table

| Risk | Plan Said | Actual | Notes |
|------|-----------|--------|-------|
| Sentry config migration | Low | **Blocker** | `sentry.*.config.js` auto-loading broken in Next 15 |
| `outputFileTracing` removed | Not mentioned | **Medium** | Dev server explicitly disables it — will error |
| React 19 required for Next 15 | Assumed true | **False** | Pages Router supports React 18 on Next 15 |
| `next-auth` compatibility | Low | **Medium** | Works today but unmaintained, tech debt |
| `process/browser` polyfill | Low | **Low-Medium** | Verify no conflicts with Next 15 defaults |
| `defaultProps` warnings | Low | Low | Correct — warnings only, defer-able |
| standalone output | Medium | Medium | Correct |
| class `_document.js` | Low | Low | Confirmed still supported |
| `next/dynamic` ssr:false | Not assessed | Low | Confirmed still works in Pages Router |
| Caching changes | Low | Low | Correct — Lowdefy uses own data layer |

---

## Revised Phase Order

Given that React 19 is NOT required for Next.js 15 Pages Router:

```
Phase 0: Security hotfix (13.5.4 → 13.5.11)        ← Do now
    │
    ▼
Antd v6 upgrade (removes Less, emotion, next-with-less)
    │
    ├─── These can now happen in EITHER order or together:
    │
    ├── Next.js 15 upgrade                           ← Simpler than plan suggests
    │     Remove outputFileTracing from configs
    │     Add instrumentation.ts for Sentry
    │     Rename sentry.client.config → instrumentation-client
    │     Remove next-with-less (already gone from antd upgrade)
    │     Remove outputFileTracing config option
    │     Keep React 18 — no React changes needed yet
    │
    ├── React 19 upgrade                             ← Independent
    │     Version bump
    │     defaultProps cleanup (optional, warnings only)
    │
    ▼
Done — Lowdefy v5 on Next.js 15 + React 19 + antd v6
```

This is simpler than the plan's rigid chain. The key insight: **decouple React 19 from Next.js 15.**

---

## Decisions Still Open

1. **Sentry instrumentation pattern:** Create `instrumentation.ts` or `.js`? Since both servers use
   CJS `next.config.js`, verify that `.ts` instrumentation files work or use `.js`.

2. **`outputFileTracing: false` removal in dev server:** Will this cause performance regression in
   dev builds? May need to find an alternative optimization.

3. **Auth.js v5 timeline:** When does `next-auth@4` become a liability? Should this be added to the
   roadmap?

4. **Edge runtime:** Are the `sentry.edge.config.js` files dead code? If so, remove during
   migration rather than porting to `instrumentation.ts`.

5. **Node.js minimum:** Next.js 15.0 requires 18.18+. Latest 15.x may require 20.9+. Pin the
   target Next.js 15 minor version to know the exact Node.js requirement.
