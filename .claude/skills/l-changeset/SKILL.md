---
name: l-changeset
description: Generate a changeset file for the current branch. Analyzes commits, determines bump types, and writes a user-facing changelog entry. Use when preparing version bumps.
argument-hint: '[patch | minor | major]'
---

# Generate Changeset

Create a changeset file describing the changes on the current branch for the changelog.

## Arguments

- `patch`, `minor`, or `major` — Override the bump type for all packages
- (none) — Auto-detect bump type from commits

## Instructions

### 1. Gather State

Run in a **single** bash call:

```bash
echo "===BRANCH==="
git branch --show-current
echo "===COMMITS==="
git log develop..HEAD --oneline 2>/dev/null || git log origin/develop..HEAD --oneline
echo "===CHANGED-SRC==="
git diff develop..HEAD --name-only -- 'packages/*/src/**' 2>/dev/null
echo "===EXISTING-CHANGESETS==="
git diff develop..HEAD --name-only -- '.changeset/*.md' 2>/dev/null
```

If no commits ahead of develop: "No changes to create a changeset for." and stop.

### 2. Identify Affected Packages

From the changed source files, extract unique package names:

- `packages/build/src/...` → `@lowdefy/build`
- `packages/helpers/src/...` → `@lowdefy/helpers`
- `packages/plugins/blocks/blocks-antd/src/...` → `@lowdefy/blocks-antd`

**IMPORTANT: The CLI package name is `lowdefy`, NOT `@lowdefy/cli`.** Using `@lowdefy/cli` will cause changeset processing to fail.

If no source files changed (only tests, docs, config), say: "No source changes found. Changesets are only needed for functional changes to package source code." and stop.

### 3. Check Existing Changesets

Read any existing changeset files added on this branch. Parse their YAML frontmatter to see which packages are already covered.

If all affected packages are already covered by existing changesets, say: "All changed packages are already covered by existing changesets: {list files}." and stop, unless the user explicitly asked to create a new one.

### 4. Determine Bump Types

**If the user provided an override** (`patch`, `minor`, `major`): use that for all packages.

**Otherwise, auto-detect from commits:**

- `feat:` or `feat(...)` → `minor`
- `fix:`, `chore:`, `refactor:`, `docs:`, `test:` → `patch`
- Commit message contains `BREAKING CHANGE` or `!:` → `major`
- Mixed types: use the highest bump level across all commits

For each affected package, assign the bump type. If different packages have different bump levels based on the commits that touch them, assign per-package.

### 5. Write the Description

**This is critical.** Changeset descriptions appear in the public changelog that users read. They must be:

- **User-facing**: Describe what changed for users, not internal implementation details
- **Concise but informative**: 1-3 sentences for simple changes, structured sections for larger ones

**Guidelines:**

- "Improved build performance" NOT "Refactored walker in buildRefs to use single-pass traversal"
- "Fixed page content missing in dev server" NOT "Set refId to null for inline pages in createPageRegistry"
- "Added support for nested \_ref variables" NOT "Updated populateRefs to handle recursive var resolution"
- Use the conventional commit subject as a starting point: `feat(build): ...` → `feat: ...`
- For multi-package changes, explain the overall improvement, then bullet the per-package details

**Small change format:**

```markdown
fix(build): Preserve inline page content in dev server builds.

Pages declared inline in lowdefy.yaml were showing as empty in dev mode. Inline pages are now correctly detected and preserved during incremental builds.
```

**Large change format:**

```markdown
feat: Single-pass async walker for ref resolution

**Single-Pass Walker (`@lowdefy/build`)**

- New walker resolves refs, evaluates build operators, and tags provenance in one pass
- Improved build performance by eliminating redundant serialization passes

**In-Place Operator Evaluation (`@lowdefy/operators`)**

- Build operators are now evaluated inline during ref resolution instead of in a separate pass
```

### 6. Generate the File

**File name:** Descriptive, kebab-case, based on the change. Examples:

- `fix-build-inline-pages.md`
- `feat-walker-single-pass.md`
- `fix-serializer-marker-mutation.md`

Do NOT use random names.

**File format:**

```markdown
---
'@lowdefy/build': minor
'@lowdefy/operators': minor
---

{description}
```

Write the file to `.changeset/{name}.md`.

### 7. Confirm

Present the changeset for confirmation:

```
Question: "Generated changeset:"
Header: "Changeset"
Options:
  - label: "Looks good"
    description: "{name}.md — {packages} ({bump})"
  - label: "Skip"
    description: "Don't create the changeset"
```

If the user provides feedback via "Other", incorporate it and write the updated file (don't re-prompt).

### 8. Done

Show the file path and a summary of what was written.

If changes are uncommitted, remind: "Run `/l-commit` to commit the changeset."
