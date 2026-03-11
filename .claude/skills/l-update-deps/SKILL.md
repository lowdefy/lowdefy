---
name: l-update-deps
description: Update a single dependency by reading its full changelog and assessing impact. Safe updates are applied directly, major updates are flagged for design review. Use when updating packages.
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
- @emotion/jest 11.10.5 → 11.14.2 (block-dev, block-utils, client, layout)

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

This ensures the lockfile is updated. Then run tests for all affected lowdefy packages:

```bash
pnpm --filter=@lowdefy/{dependent1} --filter=@lowdefy/{dependent2} test --no-coverage
```

If tests pass, the update is good. If tests fail, investigate and fix.

### 6. Commit

Once the update is applied and tests pass, run `/l-commit` to commit the changes.
