# Bun Single-File Executable CLI — Investigation Plan

**Branch:** `claude/bun-executable-cli-cnenE`
**Status:** Investigation / Research
**Goal:** Determine feasibility and strategy for distributing the Lowdefy CLI as a Bun single-file executable that users can install without Node.js, pnpm, or any JavaScript runtime.

---

## 1. Problem Statement

Today, using Lowdefy requires:

1. **Node.js** installed (runtime)
2. **pnpm** installed (package manager — CLI shells out to it)
3. **`npx lowdefy@latest dev`** or `npm install -g lowdefy` (distribution)

This creates friction for new users. A single downloadable binary (like Go or Rust CLIs) would let someone run `lowdefy dev` without installing any JavaScript toolchain. Bun's `bun build --compile` flag can produce standalone executables that bundle the Bun runtime — no Node.js required.

**The question is:** how far can we take this, given that the CLI orchestrates Next.js builds, spawns server processes, and installs npm packages at runtime?

---

## 2. Current CLI Architecture

### 2.1 What the CLI Does

The CLI (`packages/cli/`) is an orchestrator. It does very little compute itself — it downloads, configures, and spawns other packages:

| Command | What It Does |
|---------|-------------|
| `lowdefy dev` | Downloads `@lowdefy/server-dev` tarball from npm → extracts → `pnpm install` → spawns `pnpm run start` in server-dev dir |
| `lowdefy build` | Downloads `@lowdefy/server` tarball from npm → extracts → `pnpm install` → spawns `pnpm run build:lowdefy` → spawns `pnpm run build:next` |
| `lowdefy start` | Spawns `pnpm run start` in already-built server dir |
| `lowdefy init` | Writes `lowdefy.yaml` and `.gitignore` |

### 2.2 Key Dependencies on Node.js Ecosystem

| Dependency | What It Does | Node.js Specific? |
|-----------|-------------|-------------------|
| `child_process.spawn()` | Spawns `pnpm` commands | Yes (Bun compatible) |
| `child_process.execSync()` | Checks if pnpm is installed | Yes (Bun compatible) |
| `fs` / `fs-extra` | File operations | Yes (Bun compatible) |
| `net.createServer()` | Port availability check | Yes (Bun compatible) |
| `axios` | HTTP requests (npm registry, tarball download) | No (Bun has fetch) |
| `decompress` / `decompress-targz` | Extract downloaded tarballs | Native addon — problematic |
| `commander` | CLI argument parsing | No |
| `yaml` | Parse lowdefy.yaml | No |
| `ora` | Terminal spinners | No |
| `dotenv` | Load .env files | No (Bun has built-in) |

### 2.3 The Critical Dependency Chain

```
CLI binary
  └─ spawns pnpm install          ← requires pnpm on PATH
       └─ installs node_modules   ← requires npm registry access
  └─ spawns pnpm run start        ← requires pnpm on PATH
       └─ runs Next.js server     ← requires Node.js (or Bun)
            └─ serves React app   ← requires built Next.js output
```

**The CLI itself could be a standalone binary, but everything it orchestrates still needs a JavaScript runtime and package manager.**

---

## 3. Bun Single-File Executable Capabilities

### 3.1 What `bun build --compile` Can Do

- Bundle all imported JS/TS files + npm packages into a single binary
- Include the Bun runtime (no Node.js needed to run the binary)
- Cross-compile for Linux x64/ARM64, macOS ARM64/x64, Windows x64
- Embed static files via `import file from "./data.json" with { type: "file" }`
- All Node.js compatible APIs work (fs, path, child_process, net, crypto, etc.)
- Binary size: ~50-90MB per platform

### 3.2 What It Cannot Do (Relevant Limitations)

| Limitation | Impact on Lowdefy CLI |
|-----------|----------------------|
| **No built-in package manager API** | Cannot run `pnpm install` from within the binary without pnpm on PATH. [Open feature request](https://github.com/oven-sh/bun/issues/16262). |
| **No dynamic `require()` of arbitrary paths** | Can't load plugins discovered at runtime (but we don't need this in the CLI itself) |
| **Cannot embed Next.js** | Next.js has its own build pipeline, dynamic module loading, and webpack/turbopack — incompatible with static bundling into a single binary |
| **~50-90MB binary size per platform** | Full cross-platform matrix (6 targets) = ~400MB+ total distribution size |
| **Cannot embed entire directories natively** | [Open feature request](https://github.com/oven-sh/bun/issues/5445) — workarounds exist for individual files |

### 3.3 Bun as a Runtime for Next.js

Bun **can** run Next.js via `bun run next dev` or `bun run next start`. This is supported and documented. But this requires Bun installed as a runtime, not compiled into the CLI binary.

---

## 4. Feasibility Analysis

### 4.1 The Core Tension

The CLI binary can be self-contained, but its **purpose** is to orchestrate processes that need a JavaScript runtime and package manager. There are three layers to consider:

```
Layer 1: CLI binary itself          ← CAN be a Bun executable
Layer 2: Package management         ← NEEDS pnpm/bun/npm on PATH (or embedded)
Layer 3: Server runtime (Next.js)   ← NEEDS Node.js or Bun runtime on PATH
```

### 4.2 Approach Comparison

| Approach | CLI Binary | Package Mgmt | Server Runtime | User Installs | Feasibility |
|----------|-----------|-------------|---------------|---------------|-------------|
| **A: CLI-only binary** | Bun executable | Still needs pnpm | Still needs Node.js | Binary + Node.js + pnpm | Easy but limited value |
| **B: CLI + embedded Bun runtime** | Bun executable | Bun install (via binary) | Bun (via binary) | Binary only | Medium — high value |
| **C: Full self-contained** | Bun executable | Embedded | Embedded server | Binary only | Hard — requires rearchitecting server |
| **D: Hybrid — CLI binary + runtime bootstrap** | Bun executable | Binary downloads Bun | Bun (downloaded) | Binary only | Medium — practical |

---

## 5. Recommended Approach: D — Hybrid CLI Binary + Runtime Bootstrap

### 5.1 Concept

The Lowdefy CLI becomes a Bun single-file executable that:

1. **Is the CLI itself** — command parsing, config reading, orchestration
2. **Bootstraps its own runtime** — downloads a Bun binary on first run if not present
3. **Uses Bun as the package manager** — `bun install` instead of `pnpm install`
4. **Uses Bun as the server runtime** — `bun run` instead of Node.js

The user downloads one file. That file handles everything else.

### 5.2 How It Works

```
User downloads `lowdefy` binary (Bun-compiled, ~60MB)
         ↓
First run: `lowdefy dev`
         ↓
CLI checks for Bun runtime:
  - If compiled binary → Bun runtime is embedded, extract path to self
  - If standalone Bun installed → use system Bun
  - If neither → download Bun binary to ~/.lowdefy/bin/bun
         ↓
CLI downloads @lowdefy/server-dev tarball (same as today, using fetch)
         ↓
CLI runs `bun install` in server directory (instead of pnpm install)
         ↓
CLI spawns `bun run start` (instead of pnpm run start)
         ↓
Next.js dev server starts under Bun runtime
```

### 5.3 Key Insight: Bun Compiled Binary IS a Bun Runtime

When you compile with `bun build --compile`, the resulting binary **contains the full Bun runtime**. This means the binary can:

- Run `bun install` by spawning itself with special args, or by using Bun's APIs
- Run `bun run start` by spawning child processes
- Potentially use `Bun.spawn()` directly (available in compiled binaries)

**However**, the compiled binary's `process.argv[0]` points to itself, not to `bun`. To use Bun's package manager and runtime features, we need either:

- **Option 1**: Spawn the binary itself with `--bun-run` style commands (not currently supported)
- **Option 2**: Download a standalone Bun binary alongside the CLI for subprocess work
- **Option 3**: Wait for Bun to expose package manager as a JS API ([issue #16262](https://github.com/oven-sh/bun/issues/16262))

**Option 2 is the most practical today.**

### 5.4 Implementation Phases

#### Phase 1: Make the CLI Bun-Compatible (Low Risk, High Value)

Ensure the CLI codebase runs under Bun without modification. This is valuable regardless of the executable strategy.

**Changes needed:**

1. **Replace `decompress` + `decompress-targz`** — These use native addons. Replace with Bun-compatible tar extraction (e.g., `tar` package or `Bun.spawn(['tar', ...])`)
2. **Replace `axios` with `fetch`** — Bun has native fetch, reduces bundle size
3. **Replace `dotenv` with Bun's built-in** — or keep it (works in both)
4. **Replace `commander` or keep it** — works in Bun, but Bun has `util.parseArgs`
5. **Replace `ora`** — works in Bun as-is
6. **Abstract package manager** — Replace hardcoded `pnpm` with configurable `pnpm` | `bun` | `npm`
7. **Test full `lowdefy dev` and `lowdefy build` flows under `bun run`**

**Estimated effort:** Small-medium. Mostly replacing `axios` and `decompress`.

#### Phase 2: Package Manager Abstraction (Medium Risk, Required)

The CLI currently hardcodes `pnpm` everywhere. Abstract this so it can use `bun` as the package manager:

```javascript
// Before:
spawnProcess(context.pnpmCmd, ['install', '--no-frozen-lockfile'], { cwd });

// After:
spawnProcess(context.packageManager, ['install'], { cwd });
// where context.packageManager = 'bun' | 'pnpm' | 'npm'
```

**Files to modify:**
- `packages/cli/src/commands/build/build.js` — `installServer()`, `runLowdefyBuild()`, `runNextBuild()`
- `packages/cli/src/commands/dev/dev.js` — `installServer()`, `runDevServer()`
- `packages/cli/src/commands/start/start.js` — `runStart()`
- `packages/cli/src/utils/installServer.js`
- `packages/cli/src/utils/runCommand.js` — pnpm check
- All spawn sites that use `context.pnpmCmd`

**Bun equivalents:**
| pnpm command | Bun equivalent |
|-------------|---------------|
| `pnpm install --no-frozen-lockfile` | `bun install --no-save` |
| `pnpm run build:lowdefy` | `bun run build:lowdefy` |
| `pnpm run build:next` | `bun run build:next` |
| `pnpm run start` | `bun run start` |

**Estimated effort:** Medium. Mechanical but many call sites.

#### Phase 3: Bun Executable Compilation (Medium Risk)

Once the CLI runs cleanly under Bun, compile it:

```bash
bun build --compile ./src/index.js --outfile lowdefy
```

**Challenges to solve:**

1. **`createRequire` for package.json** — The CLI uses `createRequire(import.meta.url)` to read its own `package.json` for version info. In a compiled binary, `import.meta.url` doesn't point to a real file. Fix: embed version as a constant at build time.

2. **Tarball extraction** — Need a pure-JS or Bun-native solution for extracting npm tarballs. Options:
   - Shell out to system `tar` command (available on macOS/Linux, not always Windows)
   - Use Bun's `Bun.spawn(['tar', '-xzf', ...])`
   - Use a pure-JS tar library like `tar-stream`

3. **Binary size** — ~60MB per platform. Distribute via GitHub Releases with platform-specific downloads (like Deno, Bun itself, etc.)

4. **Cross-compilation** — Build for all targets in CI:
   ```bash
   bun build --compile --target=bun-linux-x64 ./src/index.js --outfile lowdefy-linux-x64
   bun build --compile --target=bun-linux-arm64 ./src/index.js --outfile lowdefy-linux-arm64
   bun build --compile --target=bun-darwin-arm64 ./src/index.js --outfile lowdefy-darwin-arm64
   bun build --compile --target=bun-darwin-x64 ./src/index.js --outfile lowdefy-darwin-x64
   bun build --compile --target=bun-windows-x64 ./src/index.js --outfile lowdefy-windows-x64.exe
   ```

**Estimated effort:** Medium. Mostly solving the tarball extraction and version embedding.

#### Phase 4: Runtime Bootstrap (Medium-High Risk)

The compiled CLI binary needs a Bun runtime to spawn server processes. The binary itself contains Bun's runtime, but it can't easily expose that for subprocess use. Solution: bootstrap a Bun installation.

**Strategy:**

```javascript
async function ensureBunRuntime(context) {
  // 1. Check if bun is already on PATH
  try {
    execSync('bun --version', { stdio: 'pipe' });
    context.packageManager = 'bun';
    context.runtimeCmd = 'bun';
    return;
  } catch {
    // Not found, continue
  }

  // 2. Check if we've previously downloaded it
  const bunPath = path.join(homedir(), '.lowdefy', 'bin', 'bun');
  if (existsSync(bunPath)) {
    context.packageManager = bunPath;
    context.runtimeCmd = bunPath;
    return;
  }

  // 3. Download Bun binary
  context.logger.info('Downloading Bun runtime (first-time setup)...');
  await downloadBunBinary(bunPath);
  context.packageManager = bunPath;
  context.runtimeCmd = bunPath;
}
```

**Bun binary download:** Bun publishes standalone binaries on GitHub Releases. We can download the appropriate platform binary (~40MB compressed) to `~/.lowdefy/bin/bun`.

**Estimated effort:** Medium. Download logic, platform detection, PATH management.

---

## 6. What This Means for the Full CLI Experience

### 6.1 `lowdefy dev` with Bun Executable

```
User runs: ./lowdefy dev
  1. CLI binary starts (Bun runtime embedded)
  2. ensureBunRuntime() — finds/downloads Bun
  3. Reads lowdefy.yaml (built-in YAML parser)
  4. Downloads @lowdefy/server-dev tarball (built-in fetch)
  5. Extracts tarball (tar command or pure-JS)
  6. Adds custom plugins to package.json
  7. Runs `bun install` in server-dev directory
  8. Spawns `bun run start` → Next.js dev server starts
  9. File watching, hot reload, SSE — all work under Bun
```

**User experience:** Download one binary, run `lowdefy dev`. First run downloads Bun runtime (~40MB, cached). Everything else works as today.

### 6.2 `lowdefy build` with Bun Executable

```
User runs: ./lowdefy build
  1-6: Same as dev
  7. Runs `bun run build:lowdefy` (Lowdefy build process)
  8. Runs `bun run build:next` (Next.js production build)
  9. Output in .lowdefy/server/ — deployable
```

### 6.3 `lowdefy start` with Bun Executable

```
User runs: ./lowdefy start
  1. CLI binary starts
  2. ensureBunRuntime()
  3. Spawns `bun run start` in .lowdefy/server/
  4. Next.js production server starts under Bun
```

### 6.4 Next.js Compatibility Under Bun

Next.js is officially supported under Bun ([bun.com/docs/guides/ecosystem/nextjs](https://bun.com/docs/guides/ecosystem/nextjs)). Both `next dev` and `next build` / `next start` work. Key considerations:

- **Webpack/Turbopack:** Both work under Bun (they're JS, not native)
- **API Routes:** Work as-is (standard Node.js HTTP)
- **Server-Side Rendering:** Works (Bun implements Node.js `http` module)
- **`getServerSession` (NextAuth):** Works (uses standard request/response)
- **Native modules in plugins:** Some connection plugins (e.g., MongoDB) use native addons that may need recompilation for Bun — but this is a `bun install` concern, not a CLI concern

### 6.5 What Breaks / Needs Work

| Area | Issue | Mitigation |
|------|-------|------------|
| **Windows tar** | No system `tar` on older Windows | Use pure-JS tar extraction or bundle `tar.exe` |
| **Native npm packages** | Some packages compile native addons differently under Bun | Bun handles most cases; document known issues |
| **pnpm lockfile** | Switching from pnpm to bun changes lockfile format | Support both; detect from existing lockfile |
| **Plugin ecosystem** | Custom plugins tested under Node.js may behave differently under Bun | Test matrix; document compatibility |
| **CI/CD pipelines** | Users' deployment scripts assume Node.js + pnpm | Provide migration guide; keep Node.js path working |

---

## 7. Distribution Strategy

### 7.1 Multiple Distribution Channels

Keep npm distribution (for existing users) AND add binary distribution:

| Channel | Command | Requires |
|---------|---------|----------|
| **npm (existing)** | `npx lowdefy@latest dev` | Node.js + npm |
| **Binary download (new)** | `curl -fsSL https://get.lowdefy.com \| sh` | Nothing |
| **Homebrew (new)** | `brew install lowdefy` | Homebrew |
| **GitHub Release (new)** | Download from releases page | Nothing |

### 7.2 Install Script

A shell script (like Bun's, Deno's, Rust's) that detects platform and downloads the right binary:

```bash
curl -fsSL https://get.lowdefy.com | sh
# Detects OS + arch, downloads binary, adds to PATH
```

### 7.3 Binary Size Considerations

| Component | Size |
|-----------|------|
| Bun runtime (embedded) | ~50MB |
| CLI code + dependencies | ~2MB |
| **Total per-platform binary** | **~52MB** |

This is comparable to Bun itself (~50MB), Deno (~40MB), and Go CLI tools (~20-50MB). Acceptable for a development tool.

---

## 8. Alternative: Bun as Runtime Only (No Compiled Binary)

A simpler alternative that captures most of the value:

1. **Don't compile the CLI** — keep it as an npm package
2. **Support `bun` as a package manager** — abstract pnpm → bun/pnpm/npm
3. **Users install via `bunx lowdefy@latest dev`** — uses Bun as runtime
4. **All spawned processes use `bun run`** — Bun as the runtime everywhere

**Pros:** Much less work, no binary distribution infrastructure needed.
**Cons:** Still requires Bun or Node.js installed. Not a "zero-dependency download."

This could be Phase 1.5 — deliver value quickly while the full binary approach is developed.

---

## 9. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| Bun incompatibility with specific npm packages | Medium | Low | Test extensively; keep Node.js path as fallback |
| Next.js breaks under Bun in edge cases | High | Low | Bun team actively maintains Next.js compat |
| `decompress` native addon fails in Bun binary | High | High | Replace with pure-JS or system tar |
| Binary size concerns (~50MB) | Low | Certain | Acceptable for dev tools; document |
| Bun package manager API never ships | Medium | Medium | Use downloaded standalone Bun binary |
| Windows support gaps | Medium | Medium | Test on Windows; use pure-JS alternatives |
| User confusion about two install methods | Low | Medium | Clear documentation; installer script |

---

## 10. Recommended Implementation Order

### Step 1: Make CLI Bun-Compatible (No Breaking Changes)
- Replace `decompress` with Bun-compatible tar extraction
- Replace `axios` with `fetch`
- Test full CLI under `bun run` (not compiled yet)
- **Deliverable:** Users can do `bunx lowdefy@latest dev`

### Step 2: Abstract Package Manager
- Replace hardcoded `pnpm` with configurable package manager
- Add `--package-manager=bun|pnpm|npm` CLI option
- Auto-detect from lockfile or fall back to what's available
- **Deliverable:** `bunx lowdefy@latest dev --package-manager=bun` works end-to-end

### Step 3: Compile CLI Binary
- Set up `bun build --compile` in CI
- Solve version embedding, tarball extraction in binary context
- Publish platform binaries to GitHub Releases
- Create install script
- **Deliverable:** `curl -fsSL https://get.lowdefy.com | sh && lowdefy dev`

### Step 4: Runtime Bootstrap
- Binary auto-downloads Bun runtime on first use
- Full zero-dependency experience
- **Deliverable:** Download one file, run `lowdefy dev`, everything works

---

## 11. Open Questions

1. **Should the npm distribution continue to use pnpm or switch to bun?** Recommendation: keep pnpm as default for npm users, use bun for binary distribution.

2. **Should the binary bundle the server packages?** Could embed `@lowdefy/server` and `@lowdefy/server-dev` in the binary to avoid the npm registry download. Would increase binary size but eliminate the first-run download step.

3. **What about `lowdefy.config.ts` support?** Bun natively runs TypeScript — this could be a natural extension.

4. **Should we support `deno compile` as well?** Deno has similar single-binary capabilities. Supporting both would widen reach but increase maintenance.

5. **How do we handle versioning?** The binary embeds a specific CLI version. Auto-update mechanism? Or just re-download?

---

## 12. Sources

- [Bun Single-File Executable Documentation](https://bun.com/docs/bundler/executables)
- [Bun + Next.js Guide](https://bun.com/docs/guides/ecosystem/nextjs)
- [Bun Package Manager API Feature Request (Issue #16262)](https://github.com/oven-sh/bun/issues/16262)
- [Embed Directory in Executable Feature Request (Issue #5445)](https://github.com/oven-sh/bun/issues/5445)
- [Bun Compile Standalone Issues (Issue #14676)](https://github.com/oven-sh/bun/issues/14676)
- [Bundling Node.js Web App with Bun (Chatfall example)](https://hiddentao.com/archives/2024/11/16/bundling-your-nodejs-web-app-into-a-single-executable-using-bun)
- [Nuxt as Bun Single-File Executable](https://github.com/nuxt/nuxt/discussions/27746)
- [Creating NPX-Compatible CLI Tools with Bun](https://runspired.com/2025/01/25/npx-executables-with-bun.html)
