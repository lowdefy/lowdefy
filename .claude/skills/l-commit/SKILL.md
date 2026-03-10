---
name: l-commit
description: Stage and commit changes with conventional commit format. Smart analysis groups changes, proposes splits, and writes structured commit descriptions. Use when committing code changes.
argument-hint: '[-p]'
---

# Commit Changes

Stage and commit with conventional commit format: `{type}({scope}): {message}`

## Arguments

- `-p` — Push after committing
- Any other text is treated as commit guidance (e.g., `/l-commit fix the build issue`)

## Instructions

### 1. Gather State (parallel)

Run these in a **single** bash call to minimize round-trips:

```bash
echo "===BRANCH==="
git branch --show-current
echo "===STATUS==="
git status --porcelain
echo "===STAGED==="
git diff --cached --stat
echo "===UNSTAGED==="
git diff --stat
echo "===RECENT==="
git log --oneline -5
```

If no changes: say "Nothing to commit." and stop.

### 2. Branch Check

If on `main` or `develop`, prompt:

```
Question: "You're on {branch}. Create a new branch?"
Header: "Branch"
Options:
  - label: "Create branch"
    description: "Suggest a branch name based on the changes"
  - label: "Stay on {branch}"
    description: "Commit directly"
```

If "Create branch": create and checkout the suggested branch.

### 3. Read Diffs

Read the actual diffs to understand the changes:

```bash
git diff --cached
git diff
```

If the diffs are very large, use `--stat` and selectively read key files.

### 4. Analyze and Propose

Perform all analysis silently, then present **one single question** to the user.

**4.1 Determine commit grouping**

Group changes by concern:

- Different types (`fix` vs `feat` vs `chore` vs `refactor` vs `docs`) should be separate commits
- Unrelated changes within the same type should be separate
- Related files (component + its test) stay together

**Commit types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`

**Scope:** Use the lowdefy package name without the `@lowdefy/` prefix (e.g., `build`, `engine`, `helpers`, `blocks-antd`). For cross-package changes, use the primary package. For repo-level changes (CI, root config), omit the scope.

**4.2 Check for changeset need**

If any modified packages would need a changeset (functional changes to `packages/`), note it in the proposal. Don't auto-generate — the user can run `/l-changeset` separately.

**4.3 Present proposal**

**Single commit:**

```
Question: "Proposed commit:"
Header: "Commit"
Options:
  - label: "Looks good"
    description: "fix(build): Handle dotted payload keys in validation. [auth.js, validate.js, +2 more]"
  - label: "Skip"
    description: "Don't commit right now"
```

**Multiple commits:**

```
Question: "Changes address multiple concerns:"
Header: "Commits"
Options:
  - label: "Split as proposed"
    description: "1: fix(build): Handle dotted keys. (2 files) | 2: chore: Update deps. (1 file)"
  - label: "Combine into one"
    description: "Single commit with all changes"
```

The user can always select "Other" to provide custom feedback — no need for an explicit "Adjust" option.

**File list rules:**

- List only substantive files (skip lock files, auto-generated, formatting-only)
- Use short basenames unless disambiguation needed
- Max 15 files per commit, then `(+N more)`

If the user provides custom feedback: incorporate it and proceed (don't re-prompt).

### 5. Build Commit Descriptions

For each commit, review the conversation history and build a structured description:

```
Request: {what the user asked for, in their words}
Motivation: {why this change was needed}

Decisions:
- {decision}: {rationale}

Changes:
- {file}: {what changed and why}

Tags: {3-8 comma-separated lowercase keywords for git log --grep}
```

**Rules:**

- Preserve the user's own language in Request/Motivation
- Keep concise: 1-2 lines for Request/Motivation, one line per Decision/Change
- Max 15 files in Changes — skip trivial, formatting-only, lock files
- Focus on "why" over "what"
- Tags: lowercase, hyphenated. Include entity names, feature areas, technology. Include user's terminology AND normalized synonyms
- Omit empty sections (e.g., skip Decisions if none were made)

### 6. Execute Commits

For each commit:

**Single commit:**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(build): Handle dotted payload keys in validation.

Request: "Fix the crash when payload keys have dots"
Motivation: Dotted keys like "user.name" were incorrectly split during validation.

Changes:
- validate.js: Use bracket notation for dotted key access
- auth.js: Updated payload key iteration

Tags: payload, validation, dotted-keys, build
EOF
)"
```

**Split commits** — stage specific files only:

```bash
git add src/validate.js src/auth.js
git commit -m "$(cat <<'EOF'
...
EOF
)"
```

For splits, verify no files are left unstaged after the final commit.

**Subject line rules:**

- Format: `{type}({scope}): {message}.`
- Keep `{message}` under ~50 chars (type/scope don't count)
- Drop trailing period if needed for space

### 7. Post-commit

If a changeset may be needed, remind: "Consider running `/l-changeset` if this needs a version bump."

**Push (if requested):**

If `$ARGUMENTS` contains `-p`:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || git push -u origin $(git branch --show-current)
git push
```

If `-p` was not passed, remind: "Run `git push` when ready, or `/l-commit -p` next time."
