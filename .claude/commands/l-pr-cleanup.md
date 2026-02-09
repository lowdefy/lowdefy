---
description: "Clean up and deduplicate code in a PR according to Lowdefy coding standards. Analyzes diff, linked issues, review conversation, and applies targeted improvements."
argument-hint: "<pr-number>"
---

# PR Cleanup

Analyze a pull request's changes, understand its objective from linked issues and conversation history, then clean up and deduplicate the code to match Lowdefy coding standards.

## Arguments

- `$ARGUMENTS` - PR number (e.g., `42`) or PR URL

## Instructions

### 1. Parse Input

Extract PR number from `$ARGUMENTS`:

- If URL: Extract PR number from path
- If number: Use directly
- If empty: Show "Usage: `/l-pr-cleanup <pr-number>`"

### 2. Gather Full PR Context

```bash
# PR metadata and body (contains linked issues, objective)
gh pr view $PR_NUMBER --json number,title,body,author,state,baseRefName,headRefName,additions,deletions,changedFiles,url,labels

# Full conversation - reviews, comments, discussion
gh pr view $PR_NUMBER --comments

# Review comments (inline code comments)
gh api repos/{owner}/{repo}/pulls/$PR_NUMBER/comments --jq '.[] | {path: .path, line: .diff_hunk, body: .body, user: .user.login}'

# The full diff
gh pr diff $PR_NUMBER
```

If errors:
- **Not found:** "PR #$PR_NUMBER not found in this repository."
- **Auth error:** "Run `gh auth login`."

### 3. Extract Linked Issues and Objectives

Parse the PR body for linked issues:

- `#123`, `Fixes #123`, `Closes #456`, `Resolves #789`
- Full GitHub URLs
- "Related to", "Part of" references

For EACH linked issue:

```bash
gh issue view {issue_number} --json title,body,state
gh issue view {issue_number} --comments
```

Extract:
- **Objective** - What problem is this PR solving?
- **Requirements** - What was asked for?
- **Acceptance criteria** - What defines success?
- **Conversation decisions** - What was agreed upon in comments?

### 4. Determine PR Author Context

```bash
# Check if current user is the PR author
CURRENT_USER=$(gh api user --jq '.login')
PR_AUTHOR=$(gh pr view $PR_NUMBER --json author --jq '.author.login')
```

If `CURRENT_USER == PR_AUTHOR`:
- Extract the author's conversation history from PR comments and review replies
- Note any self-corrections, questions answered, or decisions the author made
- Use this context to understand the author's intent when making cleanup decisions

### 5. Analyze Changed Files

```bash
gh pr diff $PR_NUMBER --name-only
```

Filter to relevant source files. For each changed `.js` file:

1. **Read the full current file** (not just the diff) for context
2. **Read the diff** for that specific file
3. **Identify the package** the file belongs to

Group files by package for pattern consistency checks.

### 6. Audit Against Lowdefy Standards

Check each changed file against these categories. **Only flag issues in changed/added code** - do not touch unrelated lines.

#### 6.1 File Structure

- [ ] License header present (Copyright 2020-2024 Lowdefy, Inc)
- [ ] One function per file, filename matches function name
- [ ] ES Module imports with `.js` extensions
- [ ] Import order: external packages, `@lowdefy/*`, local imports

#### 6.2 Function Patterns

- [ ] Single object parameter with destructuring
- [ ] Function declarations for exports, arrow functions for callbacks only
- [ ] Build functions mutate and return `components`
- [ ] Early returns to reduce nesting

#### 6.3 Type Checking and Defaults

- [ ] Uses `type.isNone()` instead of `== null`, `=== null || === undefined`, or `!value`
- [ ] Uses `??` instead of `||` for defaults (preserves `0`, `''`, `false`)
- [ ] Safe iteration: `(array ?? []).forEach()`, `Object.keys(obj ?? {})`
- [ ] Uses `@lowdefy/helpers` utilities (`get`, `set`, `serializer.copy`, `mergeObjects`)

#### 6.4 Error Handling

- [ ] Plugin code throws simple errors without `configKey`
- [ ] Interface layers add `configKey` and wrap in proper error class
- [ ] ConfigError for config validation, PluginError for plugin failures
- [ ] UserError for expected client-side errors (browser console only)
- [ ] Build errors use `collectConfigError()` instead of throwing directly
- [ ] Error messages include received value: `Received ${JSON.stringify(value)}`

#### 6.5 Code Clarity

- [ ] No nested ternaries (`a ? x : b ? y : z`)
- [ ] Comments explain **why**, not **what**
- [ ] No unnecessary guard clauses (fix at the source)
- [ ] No over-engineering or premature abstractions
- [ ] Minimize try/catch - prefer validation, use only for external operations

#### 6.6 Style

- [ ] Single quotes, 2-space indentation, 100 char width
- [ ] ES5 trailing commas
- [ ] No `console.log` / `console.warn` without reason

### 7. Identify Deduplication Opportunities

Search for duplicate patterns **within the PR's changed files**:

```bash
# Find repeated patterns in changed files
gh pr diff $PR_NUMBER
```

Check for:

- **Repeated validation blocks** across files - extract to shared utility
- **Copy-pasted logic** with minor variations - parameterize
- **Similar error messages** - standardize format
- **Redundant imports** - consolidate
- **Repeated object transformations** - extract helper

**Also cross-reference with existing codebase:**

Use Grep to check if patterns already exist as utilities in `packages/helpers/src/` or `packages/*/src/utils/` that should be reused instead of reimplemented.

### 8. Verify Against PR Objective

Before proposing changes, verify:

1. **Does the cleanup preserve the PR's intent?** - Changes must not alter functionality
2. **Does the cleanup align with issue requirements?** - Don't remove something that addresses acceptance criteria
3. **Does the cleanup conflict with conversation decisions?** - Respect agreed-upon approaches from PR discussion
4. **Is the cleanup within scope?** - Only clean up code that the PR touches

### 9. Present Cleanup Plan

**REQUIRED:** Use `AskUserQuestion` to present findings before making changes:

Group findings by severity:

```markdown
## PR #X Cleanup Plan

**Objective:** {1-sentence summary of what this PR does}
**Files changed:** {N files}
**Issues found:** {N}

### Blockers (must fix)
- {Security issues, broken patterns, incorrect error handling}

### Standards Violations
- {Pattern mismatches, missing type checks, wrong imports}

### Deduplication
- {Repeated code that can be consolidated}

### Style (auto-fixable)
- {Formatting, import order, trailing commas}
```

Present options:

```
Question: "How would you like to proceed with cleanup?"
Header: "Cleanup"
Options:
  - label: "Apply all fixes"
    description: "Fix everything: blockers, standards, dedup, and style"
  - label: "Standards + blockers only"
    description: "Fix critical issues and standards violations, skip style nits"
  - label: "Review one by one"
    description: "Walk through each finding and decide individually"
```

### 10. Apply Cleanup Changes

Based on user selection, apply fixes:

1. **Read each file** before editing
2. **Apply changes** using Edit tool
3. **Verify** the edit preserved functionality
4. **Run package tests** if available:
   ```bash
   pnpm --filter=@lowdefy/{package} test
   ```

After all changes:

```bash
# Run prettier on changed files
npx prettier --write {changed_files}

# Run eslint fix on changed files
npx eslint --fix {changed_files}
```

### 11. Summary

Present completion summary:

```markdown
## Cleanup Complete

**Files modified:** {list}
**Changes made:**
- {change 1}
- {change 2}

**Tests:** {passed/failed/skipped}

**Unchanged (by design):**
- {anything intentionally skipped and why}
```

## Important Rules

**DO:**
- Read the full file before editing (never edit blind)
- Preserve the PR's original functionality and intent
- Respect decisions made in PR conversation
- Follow all patterns from CLAUDE.md exactly
- Check for existing utilities before creating new ones
- Run tests after changes
- Only modify code that the PR already touches

**DO NOT:**
- Change code outside the PR's scope
- Add features or behavior the PR doesn't intend
- Remove guard clauses without understanding why they exist (trace to source first)
- Create new utility files unless deduplication is substantial (3+ occurrences)
- Skip user confirmation before making changes
- Ignore conversation context from linked issues
- Add comments, docstrings, or type annotations to unchanged code

**Pattern Reference:**

| Check | Standard |
|-------|----------|
| Null/undefined | `type.isNone(x)` not `x == null` |
| Defaults | `x ?? fallback` not `x \|\| fallback` |
| Iteration | `(arr ?? []).forEach()` |
| Deep access | `get(obj, 'path', { default: val })` |
| Deep clone | `serializer.copy(obj)` |
| Merge | `mergeObjects([a, b])` |
| Errors (plugin) | `throw new Error('message')` |
| Errors (build) | `collectConfigError({ message, configKey, context })` |
| Errors (config) | `throw new ConfigError({ message, configKey, context })` |
