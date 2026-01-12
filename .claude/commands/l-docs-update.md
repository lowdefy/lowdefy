---
description: Update cc-docs based on code changes or session insights
argument-hint: "[#PR | branch | files...]"
---

# Update Documentation

Update cc-docs based on code changes in the Lowdefy monorepo and extract insights from the current session.

## Usage

```
/l-docs-update #123              # Based on PR
/l-docs-update feature/branch    # Based on branch diff from main
/l-docs-update path/to/file.js   # Based on specific files
/l-docs-update                   # Auto-detect from current branch/uncommitted
```

## Workflow

### Phase 1: Identify Context

**If a PR number is provided ($ARGUMENTS):**
```bash
gh pr view $ARGUMENTS --json number,title,body,headRefName,baseRefName,url,comments,reviews
gh pr diff $ARGUMENTS --name-only
```

**If no PR number (use current branch):**
```bash
gh pr view --json number,title,body,headRefName,baseRefName,url,comments,reviews
```

**For branch:**
```bash
git diff main...{branch} --name-only
```

**For uncommitted:**
```bash
git status --porcelain
git diff --name-only
```

If no context found, inform user:
> "No changes detected. Provide a PR number, branch name, or file paths."

### Phase 2: Fetch Linked Issues (if PR context)

Extract issue references from the PR body (patterns: `#123`, `fixes #123`, `closes #123`, `resolves #123`).

For each linked issue:
```bash
gh issue view {ISSUE_NUMBER} --json number,title,body,comments
```

### Phase 3: Analyze Session for Insights

Review the current conversation and code changes for:

**Architectural Decisions**
- Why was a particular approach chosen?
- What trade-offs were considered?
- What constraints influenced the design?

**Code Patterns**
- New patterns others should follow
- Anti-patterns to avoid
- Helper utilities used repeatedly

**Debugging Insights**
- Non-obvious root causes discovered
- Diagnostic approaches that worked
- Common pitfalls and how to avoid them

**Integration Knowledge**
- How components interact
- Data flow through the system
- External dependencies and their quirks

**User-Facing Changes**
- New features that need user documentation
- Changed behaviors users need to know about
- New operators, blocks, actions, or connections

### Phase 4: Categorize Changes

Map changes to documentation areas:

| File Pattern | Affected Doc |
|--------------|--------------|
| `packages/{pkg}/src/**` | `cc-docs/packages/{pkg}.md` |
| `packages/plugins/{cat}/{plugin}/**` | `cc-docs/plugins/{cat}/{plugin}.md` |
| `packages/plugins/{cat}/**` | `cc-docs/plugins/{cat}/overview.md` |
| `packages/servers/**` | `cc-docs/architecture/*.md` |
| `turbo.json`, `pnpm-workspace.yaml` | `cc-docs/Overview.md` |

Map insights to documentation:

| Insight Type | Target Location | When to Update |
|--------------|-----------------|----------------|
| Architecture decisions | `cc-docs/architecture/` | New patterns, system design changes |
| Package internals | `cc-docs/packages/{package}.md` | How a package works internally |
| Plugin details | `cc-docs/plugins/{type}/{name}.md` | Plugin implementation details |
| Philosophy/principles | `cc-docs/Philosophy.md` | Core design principles discovered |
| User features | `packages/docs/` (YAML) | New user-facing functionality |

### Phase 5: Determine What to Update

**Do update when:**
- New public exports added
- Module structure changes
- Dependencies added/removed between packages
- Significant behavior changes
- New patterns introduced
- Architectural decisions made

**Skip when:**
- Test file changes only
- Dependency version bumps
- Formatting/linting fixes
- Internal refactors (same external behavior)
- Work is incomplete and patterns aren't clear

### Phase 6: Update Documentation

For each doc that needs updating:

1. **Read existing doc completely**
2. **Read changed source files**
3. **Identify sections to update:**
   - New modules → add to "Key Modules"
   - New exports → add to "Files Quick Reference"
   - New dependencies → update "Dependencies"
   - Behavior changes → update relevant sections
   - Decisions → add to "Decision Trace" or create architecture doc
4. **Preserve existing content** - only update affected sections
5. **Update frontmatter** `updated:` date

**Documentation principles:**
- Clarity over brevity
- Include the "why", not just the "what"
- Use real examples from the PR when possible
- Link to source: `packages/build/src/buildPages.js:45`
- Avoid speculation - only document what was discovered

### Phase 7: Validate

```bash
# Check for broken internal links
grep -r "\]\(./" cc-docs/ | grep -v "^Binary"
```

**Accuracy checks:**
- Property/type names match actual schema files
- Counts are actual, not estimated
- External library links are valid
- Context parameters are complete

### Phase 8: Post PR Comment (if PR context)

```bash
gh pr comment {PR_NUMBER} --body "$(cat <<'EOF'
## Documentation Updates

This PR triggered documentation improvements based on session insights.

### Files Updated
{list of cc-docs files created/modified}

### Decision Traces Captured
{If any architectural decisions were documented, summarize them}

### Insights Captured
- {insight 1}
- {insight 2}

---
*Generated by `/l-docs-update`*
EOF
)"
```

### Phase 9: Report

```markdown
## Documentation Update Summary

**Source:** PR #123 / branch feature/x / uncommitted changes

### Changes Analyzed
- {count} files changed
- {count} packages affected

### Documentation Updates

**cc-docs (internal):**
- `cc-docs/packages/engine.md` - Added new state hook section

**packages/docs (user-facing):**
- {list of user doc files created/modified, if any}

**Skipped (non-behavioral):**
- `packages/engine/src/utils.test.js` - Test only

### Insights Captured
1. {insight summary}
2. {insight summary}

### Decision Traces
- {decision title}: {brief summary}
```

## Constraints

1. **Don't invent insights** - Only document things that actually came up
2. **Preserve existing docs** - Read before editing, add don't replace
3. **Follow CLAUDE.md standards** - All code examples must follow patterns
4. **No speculation** - If uncertain, note as "needs investigation"
5. **Attribution** - Reference the PR/issue that prompted the doc
6. **Keep cc-docs technical** - For Claude Code, not end users
7. **Keep packages/docs user-friendly** - For Lowdefy users, not contributors

## When NOT to Update

Skip if:
- Session was purely exploratory with no conclusions
- Changes are trivial (typos, formatting)
- Work is incomplete and patterns aren't clear
- Documentation already exists and is accurate

Inform user: "No documentation updates needed. {reason}"

## cc-docs Structure Reference

```
cc-docs/
├── Overview.md              # High-level architecture overview
├── Philosophy.md            # Design principles and philosophy
├── packages/
│   ├── api.md               # @lowdefy/api internals
│   ├── build.md             # @lowdefy/build internals
│   ├── client.md            # @lowdefy/client internals
│   ├── engine.md            # @lowdefy/engine internals
│   └── ...
├── plugins/
│   ├── blocks/              # Block plugin details
│   ├── connections/         # Connection plugin details
│   ├── operators/           # Operator plugin details
│   └── actions/             # Action plugin details
└── architecture/
    ├── build-pipeline.md    # How the build system works
    ├── request-flow.md      # How requests are processed
    ├── state-management.md  # How state works in the engine
    └── ...
```
