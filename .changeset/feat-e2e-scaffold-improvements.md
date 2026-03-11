---
'@lowdefy/e2e-utils': patch
---

feat(e2e-utils): Improved e2e scaffold with new scripts and SLOW_MO support.

**New scaffold scripts:**

- `e2e:headed` — Run tests with a visible browser in slow motion (`SLOW_MO=500`, `--workers=1`)
- `e2e:server` — Start the e2e server once, then rerun tests without rebuilding

**SLOW_MO env var:**

- `createConfig` now reads the `SLOW_MO` environment variable and passes it to Playwright's `launchOptions.slowMo`
- No manual config extension needed — just set `SLOW_MO=500` in your npm script

**Scaffold template fixes:**

- Fixed `appDir` from `'../'` to `'./'` — `path.resolve` resolves relative to cwd, not the config file
- Fixed `fixtures.js` template to use `mdbFixtures` (plural) from `/fixtures` subpath with `mergeTests`
- Simplified `example.spec.js` to use `/api/auth/session` health check — works on auth-protected apps
- Fixed README template with correct `appDir` values, "Faster Test Runs" section, and "Common Patterns" section
