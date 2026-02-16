# Bun Single-File Executable CLI — Critical Review

**Reviewer context:** Systems engineering perspective, 15+ years JS/web framework experience.
**Reviewed:** `plan.md` in this directory.
**Date:** 2026-02-16

---

## Executive Summary

The plan is well-researched and honestly scoped. Approach D (Hybrid CLI Binary + Runtime Bootstrap) is the right call. But the plan undersells several risks that could derail the project mid-implementation, and it glosses over the hardest problem: **the CLI doesn't just shell out to pnpm — the _server packages themselves_ also shell out to pnpm and hardcode `node` as the subprocess runtime**. The plan treats the CLI as the boundary of change, but the blast radius extends into `@lowdefy/server-dev` and `@lowdefy/server`.

**Verdict:** Feasible, but the phasing is wrong. Phase 2 (package manager abstraction) is significantly harder than presented and must include server-side changes. Phase 4 (runtime bootstrap) has a bootstrapping paradox that isn't addressed. And the plan is silent on the most likely failure mode: Next.js 13.5.4 under Bun.

---

## 1. What the Plan Gets Right

### Accurate Problem Framing

The three-layer model (CLI binary → package management → server runtime) is correct and well-articulated. The plan correctly identifies that the CLI is an orchestrator, not a compute engine — this is exactly why it's a good candidate for Bun compilation. The binary does I/O, spawns processes, and moves files around. No heavy computation, no native addon usage in the CLI itself.

### Honest About Limitations

The plan doesn't oversell `bun build --compile`. It correctly identifies that you can't embed Next.js into the binary, that the compiled binary can't easily expose its embedded Bun runtime for subprocess use, and that a separate Bun installation is needed for the spawned server processes. This is refreshingly honest compared to most "let's rewrite in Bun" proposals.

### Approach D Is Correct

The hybrid approach is the pragmatic choice. Approaches A and C are non-starters — A delivers no user value, C requires rearchitecting the entire server. Approach B sounds appealing but hand-waves the "embedded Bun runtime" part. Approach D acknowledges reality: you need a separate Bun binary for subprocess work, and downloading it on first run is a solved pattern (Rust's `rustup`, Deno's self-install, etc.)

---

## 2. What the Plan Gets Wrong

### 2.1 The Blast Radius Is Larger Than Shown

The plan identifies 6 files in `packages/cli/` that need package manager abstraction. This is incomplete. The actual blast radius:

**CLI layer (identified in plan):**
- `packages/cli/src/utils/checkPnpmIsInstalled.js` — hardcoded pnpm check
- `packages/cli/src/utils/installServer.js` — `context.pnpmCmd` + `['install', '--no-frozen-lockfile']`
- `packages/cli/src/utils/runLowdefyBuild.js` — `context.pnpmCmd` + `['run', 'build:lowdefy']`
- `packages/cli/src/utils/runNextBuild.js` — `context.pnpmCmd` + `['run', 'build:next']`
- `packages/cli/src/commands/dev/runDevServer.js` — `context.pnpmCmd` + `['run', 'start']`
- `packages/cli/src/commands/start/runStart.js` — `context.pnpmCmd` + `['run', 'start']`

**Server layer (NOT identified in plan):**
- `packages/servers/server-dev/manager/processes/installPlugins.mjs` — `packageManagerCmd` + `['install', '--no-frozen-lockfile']`
- `packages/servers/server-dev/manager/processes/startServer.mjs` — hardcoded `spawn('node', [context.bin.next, 'start'])`
- `packages/servers/server-dev/manager/processes/nextBuild.mjs` — hardcoded `spawn('node', [bin.next, 'build'])`
- `packages/servers/server-dev/manager/utils/getNextBin.mjs` — uses `createRequire(import.meta.url)` to resolve Next.js binary path

The server-dev package has its **own** hardcoded `node` spawn calls. Even if the CLI perfectly abstracts `pnpm` → `bun`, the spawned server-dev process will still run `node next start` and `node next build`. These are separate processes — they don't inherit the CLI's configuration.

**This means Phase 2 must modify `@lowdefy/server-dev` and `@lowdefy/server`, not just `@lowdefy/cli`.** The plan says "Files to modify" and only lists CLI files. That's a significant underestimate.

### 2.2 The `--no-frozen-lockfile` Flag Mapping Is Wrong

The plan maps:
```
pnpm install --no-frozen-lockfile  →  bun install --no-save
```

This is incorrect. `--no-frozen-lockfile` in pnpm means "don't fail if the lockfile is out of sync with package.json — update it." `--no-save` in Bun means "don't write to package.json." These are completely different semantics.

The correct Bun equivalent is just `bun install` — Bun doesn't have a frozen lockfile concept by default. If you want the pnpm behavior, it's simply `bun install` with no flags. If you want the _opposite_ (strict lockfile enforcement), it's `bun install --frozen-lockfile`.

This matters because the CLI deliberately uses `--no-frozen-lockfile` after mutating `package.json` via `addCustomPluginsAsDeps()`. The plugin injection flow is:

1. Reset `package.json` from `package.original.json`
2. Inject custom plugin dependencies into `package.json`
3. Run install (lockfile will be out of sync — that's expected)

With Bun, step 3 is just `bun install`. No special flags. But getting this wrong would cause silent failures or unexpected lockfile behavior.

### 2.3 Next.js 13.5.4 Under Bun Is the Biggest Risk

The plan says "Next.js is officially supported under Bun" and links to Bun's docs. But Lowdefy uses **Next.js 13.5.4** — a version from September 2023. Bun's Next.js support documentation and testing focuses on recent versions (14.x, 15.x). The compatibility matrix for 13.5.x under current Bun is untested territory.

Specific concerns with Next.js 13.5.4 under Bun:

- **Pages Router** — Lowdefy uses the Pages Router (`pages/` directory), not the App Router. Bun's Next.js testing skews toward App Router.
- **SWC compilation** — Next.js 13.5.4 uses `@next/swc` for compilation. The SWC binary is a Rust-compiled native addon. Under `bun install`, the correct platform-specific SWC binary must be downloaded. pnpm and Bun resolve optional dependencies differently — if Bun skips the SWC optional dependency, Next.js falls back to Babel, which is slower and may produce different output.
- **Webpack 5** — Next.js 13.5.4 uses Webpack 5 (not Turbopack). Webpack's `require.resolve` and module resolution assumptions may differ under Bun's module resolver.
- **`getNextBin.mjs`** — This function uses `createRequire(import.meta.url)` to find Next.js's binary path. Under Bun, `createRequire` works but `require.resolve()` follows Bun's module resolution algorithm, which can return different paths than Node.js when packages have multiple entry points or are hoisted differently by the package manager.

**This is the single most likely failure mode.** Not the CLI compilation, not the package manager abstraction — it's Next.js 13.5.4 actually working correctly when all processes run under Bun.

**Recommendation:** Before any other work, run a manual smoke test: `bun run next build` and `bun run next start` against a Lowdefy server-dev directory that was set up with `bun install`. If that doesn't work, the entire plan falls apart at the foundation.

### 2.4 The Bootstrapping Paradox in Phase 4

The plan proposes this flow for the compiled binary:

```
CLI binary starts (Bun runtime embedded)
  → ensureBunRuntime() — finds/downloads Bun
  → Downloads @lowdefy/server-dev tarball (built-in fetch)
  → Extracts tarball
  → Runs `bun install` using the downloaded Bun
  → Spawns `bun run start` using the downloaded Bun
```

The paradox: **the Bun runtime embedded in the compiled binary and the downloaded standalone Bun binary will be different versions.** The compiled binary freezes a specific Bun version at build time. The downloaded Bun runtime will be whatever version `ensureBunRuntime()` fetches (likely latest).

This version mismatch creates a subtle problem: the CLI (running on embedded Bun X) generates configuration and environment variables that are consumed by the server process (running on standalone Bun Y). If Bun X and Bun Y handle `process.env`, module resolution, or `node:` prefixed imports differently, you get silent runtime divergence.

**Recommendation:** Pin the downloaded Bun version to match the version embedded in the compiled binary. Store the required Bun version as a constant that's set at compile time.

### 2.5 `process.env` Propagation Is Under-Analyzed

The plan mentions `dotenv` as replaceable with Bun's built-in `.env` support. But the actual `.env` flow in Lowdefy is more nuanced:

1. CLI loads `.env` via `readDotEnv()` — calls `dotenv.config()`, which mutates `process.env`
2. CLI spawns server-dev with `env: { ...process.env, PORT, LOWDEFY_* }` — spreads the mutated env
3. Server-dev's `run.mjs` calls `readDotEnv()` _again_ — re-parses `.env` inside the spawned process
4. Server-dev spawns Next.js with `env: { ...process.env, LOWDEFY_DIRECTORY_CONFIG, PORT }` — spreads again

Bun automatically loads `.env` files before `process.env` is accessible. If the CLI binary (compiled Bun) auto-loads `.env` and _also_ calls `dotenv.config()`, values could be double-loaded or conflict. Worse, the `envWatcher` in server-dev watches for `.env` changes and re-parses — if Bun cached the initial `.env` load, the watcher's re-parse might not propagate correctly.

This isn't a blocker, but it's the kind of subtle environment handling difference that causes "works on my machine" bugs between Node.js dev and Bun dev environments.

### 2.6 The Deployment Story Has a Gap

The plan focuses on the developer experience (`lowdefy dev`, `lowdefy build`, `lowdefy start`) but doesn't address the two existing deployment paths:

**Docker (`init-docker`):**
The current Dockerfile uses `node:18-buster`, `corepack enable`, and `pnpx lowdefy@4 build`. If a user builds locally with the Bun binary but deploys via Docker, the Docker build still uses Node.js + pnpm. This is fine — but the generated `Dockerfile` should continue to work unchanged. The plan should explicitly state that the Docker path remains Node.js-based and is unaffected.

**Vercel (`init-vercel`):**
The Vercel install script uses `npx lowdefy@... build`. Vercel's build environment provides Node.js and npm. The Bun binary is irrelevant here — Vercel users won't use it. Again, fine, but the plan should explicitly scope this out.

**Self-hosted production (`lowdefy start`):**
This is where it gets interesting. If a user builds with the Bun binary and runs `lowdefy start` in production, the production server runs under the downloaded Bun runtime. This is a different runtime than what the Docker and Vercel paths use (Node.js). Plugin authors now need to test against both runtimes. The plan mentions this in the risk table ("Plugin ecosystem") but doesn't propose a concrete mitigation beyond "document compatibility."

---

## 3. Phasing Critique

### The Proposed Phasing

1. Make CLI Bun-compatible
2. Abstract package manager
3. Compile CLI binary
4. Runtime bootstrap

### The Problem

Phase 1 and 2 are presented as low-to-medium risk, but they're actually the hardest phases because they touch the most code across the most packages. Phase 3 (compilation) is genuinely easy if phases 1-2 are done correctly — `bun build --compile` is a single command. Phase 4 is medium complexity but well-understood (it's just a download-and-cache pattern).

### Recommended Phasing

**Phase 0: Validate the Foundation (1-2 days)**
Before writing any code, manually verify:
- `bun install` in a `.lowdefy/dev` directory produces a working `node_modules`
- `bun run next build` produces correct output with Next.js 13.5.4
- `bun run next start` serves the app correctly
- All Lowdefy connection plugins install correctly under `bun install`

If any of these fail, stop. Fix the foundation issue first or wait for upstream fixes.

**Phase 1: Package Manager Abstraction (Medium — spans CLI + server packages)**
This is the real work. Don't just abstract `pnpm` → configurable in the CLI. Also:
- Abstract `node` → configurable runtime in server-dev's `startServer.mjs` and `nextBuild.mjs`
- Pass runtime/package-manager config through environment variables from CLI to server-dev
- Handle flag differences (`--no-frozen-lockfile` has no Bun equivalent needed)
- Add `--package-manager` CLI option with auto-detection from lockfile

**Phase 2: Replace Problematic Dependencies**
- Replace `decompress` + `decompress-targz` with `tar` package or system `tar`
- Replace `axios` with `fetch` (or keep axios — it works fine under Bun and the plan overestimates the value of replacing it)
- Verify `commander`, `ora`, `yaml`, `semver` all work under Bun (they will — they're pure JS)

**Phase 3: Compile + Distribute**
- `bun build --compile` with version constant injection
- CI pipeline for cross-compilation (6 targets)
- GitHub Release artifacts
- Install script (`curl | sh` pattern)

**Phase 4: Runtime Bootstrap**
- `ensureBunRuntime()` with version pinning
- Platform detection and binary download
- PATH management and caching in `~/.lowdefy/bin/`

---

## 4. Technical Risks Not in the Plan

### 4.1 pnpm's Strict `node_modules` Structure

pnpm uses a content-addressable store with symlinks. `node_modules` under pnpm is flat but linked to `.pnpm/`. Bun uses a more traditional flat `node_modules`. If any Lowdefy server code or plugin makes assumptions about the `node_modules` structure (e.g., resolving peer dependencies, finding hoisted packages), switching from pnpm to Bun's installer could break resolution.

### 4.2 Native Addon Compilation Differences

Lowdefy plugins include connection packages like `@lowdefy/connection-mongodb`, `@lowdefy/connection-knex`, etc. These pull in packages with optional native addons (MongoDB's optional `kerberos`, `snappy`, `mongodb-client-encryption`; Knex's database drivers). `bun install` compiles native addons using its own toolchain, which has known differences from npm/pnpm for some packages.

This is a **plugin author problem**, not a CLI problem, but the plan should acknowledge it because users will blame the Bun migration when their MongoDB connection stops working.

### 4.3 `createRequire` in Compiled Binaries

The CLI uses `createRequire(import.meta.url)` in two places:
- `program.js` line 28: reads `package.json` for version info
- `getNextBin.mjs` line 21: resolves Next.js binary path

In a compiled Bun binary, `import.meta.url` points to the binary itself, not a source file. `createRequire` with this URL won't find `package.json` or `next/package.json` because there's no file system around the binary.

The plan mentions this for the version string (embed as constant) but not for `getNextBin.mjs`. The Next.js bin resolution is more complex — it needs to resolve against the _installed_ `node_modules` in the server directory, not against the binary's location. This will require passing the server directory path and resolving Next.js from there.

### 4.4 Windows: Bun Is Not Production-Ready

Bun's Windows support is marked as "experimental" (as of early 2026). The plan lists Windows `tar` as a risk but underestimates the broader Windows story. Many Lowdefy users develop on Windows. A compiled Bun binary for Windows that downloads a Bun runtime that's itself experimental is a recipe for frustration.

**Recommendation:** Ship Linux and macOS binaries first. Windows support should wait until Bun's Windows runtime is stable. Keep the npm/pnpm distribution path as the primary Windows story.

### 4.5 Binary Size and Update Mechanism

~52MB per binary, 6 targets = ~312MB of release artifacts per version. The plan mentions this but doesn't address:

- **Update mechanism:** How does a user know a new version is available? The npm path has `npx lowdefy@latest`. The binary has no equivalent. Options: version check on startup (adds latency), separate `lowdefy update` command, or rely on the install script to overwrite.
- **Cache invalidation:** The downloaded Bun runtime in `~/.lowdefy/bin/bun` persists across CLI upgrades. If a new CLI version requires a newer Bun version, the old cached Bun must be detected and replaced.
- **Disk usage:** `~/.lowdefy/bin/bun` (~50MB) + the CLI binary (~52MB) + server packages in `.lowdefy/` = 200MB+ per project. Multiplied across projects, this adds up. Consider a shared Bun runtime across projects.

---

## 5. What I'd Do Differently

### Start With "Bun as Runtime" (The Plan's Section 8)

The plan calls this a simpler alternative and then moves on. I'd make it the primary deliverable. Here's why:

The single biggest UX improvement isn't the compiled binary — it's **removing the pnpm dependency**. Most frustration in the current flow comes from `corepack enable`, pnpm version mismatches, and pnpm's strict lockfile behavior. Switching to `bun install` (which is faster and more forgiving) as the default package manager, while keeping the npm distribution, delivers 80% of the user experience improvement with 20% of the effort.

The flow would be:
```
npx lowdefy@latest dev          # Still works (Node.js + auto-detect bun or pnpm)
bunx lowdefy@latest dev         # Also works (Bun runtime + bun install)
```

This ships in weeks, not months. The compiled binary can come later as a polish step.

### Don't Replace axios

The plan lists replacing `axios` with `fetch` as Phase 1 work. Axios works perfectly under Bun. Replacing it adds churn, changes error handling patterns, and delivers zero user value. The CLI makes 3 HTTP calls total (registry metadata, tarball download, telemetry). Axios handles retries, arraybuffer responses, and error wrapping out of the box. `fetch` would need manual implementation of all of that.

Keep axios. Save the refactoring energy for the package manager abstraction, which is the hard part.

### Version-Lock the Bun Runtime

If you do go to Phase 4 (runtime bootstrap), store the required Bun version as a build-time constant in the CLI binary:

```javascript
// Injected at compile time by CI
const REQUIRED_BUN_VERSION = '1.2.3';
```

Then `ensureBunRuntime()` checks the cached version and re-downloads only if it's wrong. This prevents the version skew problem and makes the system deterministic.

---

## 6. Go/No-Go Checklist

Before committing to implementation, validate these:

| # | Validation | How | Blocks |
|---|-----------|-----|--------|
| 1 | Next.js 13.5.4 builds under `bun run` | Manual test in `.lowdefy/dev` | Everything |
| 2 | Next.js 13.5.4 serves correctly under Bun | Start server, test all page types | Everything |
| 3 | `@next/swc` installs correctly via `bun install` | Check platform binary is present | Build step |
| 4 | `decompress` works in Bun (or find replacement) | Unit test tarball extraction | Phase 1 |
| 5 | MongoDB driver works under Bun runtime | Integration test with connection plugin | Plugin compat |
| 6 | `createRequire` resolves correctly in compiled binary | Compile minimal test binary | Phase 3 |
| 7 | File watchers (`fs.watch`) work correctly under Bun | Test dev-mode hot reload | Dev experience |

If items 1-3 fail, the project should be deferred until they're resolved upstream. If items 4-7 fail, they're solvable with workarounds but increase scope.

---

## 7. Conclusion

The plan is directionally correct. Bun compilation is feasible and the user experience improvement is real — going from "install Node.js, install pnpm, run npx" to "download binary, run it" is a genuine step function in developer experience.

But the plan underestimates the blast radius (server packages, not just CLI), gets a flag mapping wrong (`--no-frozen-lockfile` → `--no-save`), and doesn't validate the riskiest assumption (Next.js 13.5.4 under Bun). The phasing should be reordered to validate the foundation first and ship the package manager abstraction as a standalone win before tackling binary compilation.

Ship the "Bun as runtime" alternative (Section 8 of the plan) first. It delivers the most user value with the least risk. Then layer on the compiled binary as a second phase.
