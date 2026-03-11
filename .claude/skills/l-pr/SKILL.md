---
name: l-pr
description: Create a draft pull request targeting develop. Auto-generates PR body from design files, GitHub issues, and/or commit history. Use when opening a PR.
argument-hint: '[#issue | path/to/design.md]'
---

# Create Pull Request

Create a draft PR targeting `develop`. Auto-generates title and body from a reference (design file or issue) plus commit history.

## Arguments

- `#123` — GitHub issue number as reference
- `path/to/design.md` — Design file as reference
- (none) — Will prompt for a reference

## Instructions

### 1. Gather State

Run in a **single** bash call:

```bash
echo "===BRANCH==="
git branch --show-current
echo "===STATUS==="
git status --porcelain
echo "===REMOTE==="
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "no-upstream"
echo "===COMMITS==="
git log develop..HEAD --oneline 2>/dev/null || git log origin/develop..HEAD --oneline
echo "===CHANGESETS==="
git diff develop..HEAD --name-only -- '.changeset/*.md' 2>/dev/null
```

If on `develop` with no commits ahead: "No commits to create a PR from. Commit your changes first." and stop.

### 2. Handle Uncommitted Changes

If there are uncommitted changes, run `/l-commit -p` to commit and push.

If already committed but not pushed, push:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || git push -u origin $(git branch --show-current)
git push
```

### 3. Resolve Reference

**If `$ARGUMENTS` contains an issue number** (e.g., `#123`):

- Fetch issue details: `gh issue view 123`
- Use as reference source

**If `$ARGUMENTS` contains a file path** (e.g., `designs/walker/design.md`):

- Read the design file
- Use as reference source

**If no argument provided**, prompt:

```
Question: "What's this PR for?"
Header: "Reference"
Options:
  - label: "GitHub issue"
    description: "I'll provide an issue number"
  - label: "Design file"
    description: "I'll provide a path to a design document"
  - label: "No reference"
    description: "Generate PR body from commits only"
```

If user selects issue or design, ask for the number/path, then fetch it.

### 4. Scan Commits for Issue References

Look through commit messages on this branch for issue references (`#123`, `closes #123`, `fixes #123`, etc.):

```bash
git log develop..HEAD --format="%s %b" 2>/dev/null
```

Collect all unique issue numbers found. These will be used for `Closes #N` lines.

### 5. Build PR Title and Body

**Title:** Generate from the reference source or primary commit. Keep under 70 chars. Use the same style as commit subjects but without the conventional commit prefix.

**Body structure:**

```markdown
## Summary

{2-3 sentences explaining the motivation and what this PR achieves. Source from: design file, issue description, or commit messages.}

## Changes

- **@lowdefy/build**: {conceptual change in this package and why}
- **@lowdefy/helpers**: {conceptual change in this package and why}

## Key Files

{ONLY include on large PRs (10+ changed files). List the 3-5 files containing the core logic, with a one-liner each. Helps reviewers know where to focus. Omit entirely on small PRs.}

- `packages/build/src/buildRefs/walker.js` — New single-pass tree walker
- `packages/operators/src/evaluateOperators.js` — In-place operator evaluation

## Breaking Changes

{ONLY include if user-facing behavior changes. Internal package changes are NOT breaking. Omit entirely if none.}

- {What changed for end users}
- {Migration steps if any}

## Notes

{ONLY include if there are reviewer gotchas, caveats, or context worth calling out. Omit entirely if not.}

Closes #N
```

**Sections:**

- **Summary** — always included
- **Changes** — always included. One bullet per affected package. Explain the conceptual change, not individual files
- **Key Files** — only on large PRs (10+ files). The 3-5 files with core logic
- **Breaking Changes** — only if user-facing behavior changes. Internal package changes don't count
- **Notes** — only if there are reviewer gotchas or caveats. Omit entirely otherwise
- **Closes #N** — at the bottom, one per resolved issue

**Rules:**

- Summary should explain the "why" — source from design file, issue, or commits
- Changes section describes what happened per package, not per file
- Only include `Closes #N` for issues that this PR actually resolves (not just mentions)
- Omit optional sections entirely rather than including them empty

### 6. Changeset Check

Check if source changes need a changeset:

**6.1 Identify modified packages**

```bash
git diff develop..HEAD --name-only -- 'packages/*/src/**'
```

Extract the unique package names from the paths (e.g., `packages/build/src/...` → `@lowdefy/build`). If no source files changed (only tests, docs, config), skip this step entirely.

**6.2 Check existing changesets**

Read each `.changeset/*.md` file added on this branch (from step 1). Parse the YAML frontmatter to find which packages they cover:

```yaml
---
'@lowdefy/build': minor
'@lowdefy/helpers': patch
---
```

**6.3 Compare coverage**

Find packages with source changes that aren't covered by any changeset. If all packages are covered, skip silently.

If uncovered packages exist, prompt:

```
Question: "These packages have source changes but no changeset: @lowdefy/build, @lowdefy/helpers. Add a changeset?"
Header: "Changeset"
Options:
  - label: "Add changeset"
    description: "Generate a changeset for uncovered packages"
  - label: "Skip"
    description: "No changeset needed (e.g., internal refactor, tests only)"
```

**6.4 Generate changeset (if requested)**

If user selects "Add changeset", run `/l-changeset` to generate the changeset, then commit and push it before creating the PR.

### 7. Docs Reminder

Check if any documentation was updated on this branch:

```bash
git diff develop..HEAD --name-only -- 'packages/docs/**' 'code-docs/**'
```

If source files in `packages/` were changed but no docs files were modified, remind the user:

"No documentation changes found. If this PR changes behavior or adds features, consider updating `packages/docs/` (user-facing) or `code-docs/` (internal architecture) before marking ready for review. You can use `/l-docs-update` to help."

This is just a message — no prompt or blocker.

### 8. Create PR

Present the PR for confirmation:

```
Question: "Create this draft PR?"
Header: "PR"
Options:
  - label: "Looks good"
    description: "{title} — {N} commits, targets develop"
  - label: "Skip"
    description: "Don't create the PR"
```

If confirmed:

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)" --base develop --draft
```

### 9. Done

Show the PR URL.
