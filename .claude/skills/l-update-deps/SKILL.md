---
name: l-update-deps
description: Update a dependency (or, in batch mode, a list of them) by reading its full changelog and assessing impact. Safe updates are applied directly; majors and migrations are flagged for review or written up as tasks. Use when updating packages.
argument-hint: '[package-name]'
---

# Update Dependency

Update a single dependency safely by reading its full changelog, assessing impact, and applying changes.

## Arguments

- `package-name` — The package to update (e.g., `next-auth`, `@playwright/test`)
- (none) — List all outdated packages so the user can pick one

## Instructions

### 1. Select Package

**If a specific package was given:**

```bash
pnpm outdated -r --no-color 2>/dev/null | grep -i "<package-name>"
```

Show the current version, latest version, and which lowdefy packages depend on it. If already up to date, say so and stop.

**If no package specified:**

```bash
pnpm outdated -r --no-color 2>/dev/null
```

Parse the output and note whether each dependency is a **dev** dependency (shown as `(dev)` in pnpm outdated output) or a **production** dependency. This distinction is critical for risk assessment.

Present the full list to the user, grouped by dependency type then semver. The user will type which package they want to update.

Format as a readable list:

```
**Production dependencies:**

Patch:
- next-auth 4.24.5 → 4.24.13 (server, server-dev, plugin-next-auth)
- change-case 5.4.0 → 5.4.4 (operators-change-case)

Minor:
- rc-motion 2.9.0 → 2.9.5 (blocks-antd)

Major (needs design review):
- (none currently)

**Dev dependencies (safe — don't affect end users):**

Patch/Minor:
- @babel/core 7.23.3 → 7.29.0 (block-utils)
- vitest 4.1.11 → 4.1.12 (every package with tests)

Major:
- eslint 8.54.0 → 10.0.3
- turbo 1.10.16 → 2.8.15

**Deprecated:**
- deep-diff 1.0.2 (operators-diff)
- vsce 2.15.0 (lowdefy-vscode)
```

Then say: "Which package do you want to update?"

### 2. Check Semver and Dependency Type

Classify by semver AND whether it's a dev or production dependency (pnpm outdated marks dev deps with `(dev)`):

**Dev dependencies** (build tools, test frameworks, linters — don't ship to users):

- Patch, minor, AND major are all safe to proceed. Even major updates just need build/test tooling to work.
- Still read the changelog — migration guides for major versions help avoid wasted time.

**Production dependencies** (shipped code — affects end users):

- **Patch** (1.2.3 → 1.2.5) — Proceed
- **Minor** (1.2.3 → 1.3.0) — Proceed, read changelog carefully
- **Major** (1.2.3 → 2.0.0) — Warn: "This is a major update of a production dependency. This likely needs a design review." Let the user decide.

**Deprecated** — Warn: "{package} is deprecated. This needs investigation into a replacement." Stop unless user wants to proceed.

### 3. Research Changelog

This is the most important step. Read the **full changelog** between the current and latest versions.

**3.1 Find the changelog source**

Derive the GitHub repo from the package metadata:

```bash
cat node_modules/{package}/package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('repository',{}).get('url','') if isinstance(d.get('repository'),dict) else d.get('repository',''))"
```

Or use npm:

```bash
npm info {package} repository.url --json 2>/dev/null
```

**3.2 Read the changelog**

Try these sources in order:

1. **GitHub releases** — fetch all releases between current and latest:
   ```bash
   gh api repos/{owner}/{repo}/releases --paginate --jq '.[] | select(.tag_name | test("v?{from}|v?{to}|...")) | .tag_name + "\n" + .body'
   ```
2. **CHANGELOG.md** — fetch from the repo:
   ```bash
   gh api repos/{owner}/{repo}/contents/CHANGELOG.md --jq '.content' | base64 -d
   ```
3. **Git commits** — as a last resort, read commit history between tags

**3.3 Read ALL changes**

Do not skim. Read every entry between the current version and the latest version. For each version bump, note:

- Bug fixes
- New features
- Deprecations
- Breaking changes (even if semver says it's minor — some packages break things in minor releases)
- API changes (new options, renamed parameters, removed methods)
- Behavioral changes (subtle differences in how things work)

### 4. Assess Impact

After reading the full changelog, assess how the changes affect Lowdefy. First, understand how Lowdefy uses this package:

```bash
# Find all imports/requires of the package in the codebase
```

Use Grep to search for imports of the package across the repo. Read the key files that use it.

Then determine the action:

**Safe update (no code changes needed):**

- Only bug fixes or internal improvements
- No API changes that affect Lowdefy's usage
- → Tell the user: "This update is safe. Only contains bug fixes / internal improvements. No code changes needed." Apply directly.

**Minor fixes needed:**

- Small API changes, renamed options, deprecated method replacements
- → Explain what needs to change and why, then apply the update and fix the code

**New features to expose:**

- The update adds capabilities that Lowdefy users could benefit from
- e.g., auth package adds a new provider, chart library adds a new chart type, a connection package adds new methods
- → Discuss with the user: "{package} {version} adds {feature}. This could be exposed in Lowdefy as {how}. Want to implement this?"
- If yes, plan and implement the integration

**Unsafe / needs investigation:**

- Behavioral changes that could subtly break things
- → Explain the concern and let the user decide

### 5. Apply Update

```bash
pnpm update {package}@{version} -r
pnpm install
```

Check `pnpm-workspace.yaml` first: an entry under `overrides` for the package (or `packageExtensions`, `patchedDependencies`) can pin it or a transitive copy. Move a pin with the update, or remove it when the update makes it unnecessary (`pnpm why {package} -r` shows every copy in the tree).

`pnpm update` keeps the range prefix already in each `package.json`. Lowdefy pins exact versions in most packages; keep whatever style the package already uses.

Packages import each other's `dist/`, so when the update touches a package other packages depend on, run `pnpm build` from the repo root first. Then run the tests of every Lowdefy package that depends on it (vitest; no `--` separator and no coverage flags):

```bash
pnpm --filter=@lowdefy/{dependent1} --filter=@lowdefy/{dependent2} test
```

Always run `pnpm test:dependencies` too. Some suites need more than unit tests: `pnpm test:mongodb` for the MongoDB driver and connection, the block e2e suites (`code-docs/testing.md`) for a block library's rendering, `pnpm --filter=@lowdefy/shell test` for Expo and React Native. If tests fail, investigate and fix; a failure that needs real migration work is a "needs a task" outcome (see Batch mode).

### 6. Changeset and commit

Add a changeset in `.changeset/` naming every published package whose `dependencies` (not `devDependencies`) changed, as a `patch`, titled `fix(deps): Update {package} to {version}`, with a sentence on what the update brings or fixes for Lowdefy users. Dev-only updates need no changeset.

Commit with a Conventional Commit message: `fix(deps): Update {package} to {version}` for production dependencies, `chore(deps): ...` for dev-only ones. Commit the lockfile with it.

## Batch mode (agents)

When an orchestrator hands an agent a list of packages instead of a person choosing one:

- Skip step 1's listing and do not ask which package; work through the list. Group packages released together (a scoped family such as `@tiptap/*`, `@aws-sdk/*`, `expo-*`) into one update and one commit.
- Decide step 2's outcomes yourself instead of asking:
  - Patch or minor: apply.
  - Dev-only major: apply when the migration is small and tests pass.
  - Production major: apply only when Lowdefy's code needs at most a small mechanical change and nothing a Lowdefy app author or end user sees changes (config, rendered output, operator results, request results, supported Node/React versions).
  - Anything else (a real migration, a behaviour change users see, a trade-off someone should weigh, a deprecated package needing a replacement, or a failure you could not fix): leave the version alone and write a task on the run's Pelican design with `write_task` (type `chore`, state `backlog`, label `dependencies`). The task says the package and versions, what changes in the release notes that matters, which Lowdefy files are affected, what has to change and the open choices. Someone who was not there must be able to pick it up.
- A minor or patch whose notes describe a feature Lowdefy could expose is noted in the agent's report, not built.
- Report back: what was updated (one line per package or family, with versions), commits, tests run and their result, tasks written (key and title), overrides added or removed, and anything left undone.
