---
description: Update cc-docs based on code changes (PR, branch diff, or specific files)
argument-hint: "[#PR | branch | files...]"
---

# Update Documentation

Update cc-docs based on code changes in the Lowdefy monorepo.

## Usage

```
# Based on PR
/l-docs-update #123

# Based on branch diff from main
/l-docs-update feature/new-operator

# Based on specific changed files
/l-docs-update packages/engine/src/state.js

# Auto-detect uncommitted changes
/l-docs-update
```

## Purpose

Keep cc-docs in sync with code changes. This command:
1. Analyzes what changed
2. Determines which docs are affected
3. Updates relevant documentation
4. Validates cross-references

## Workflow

### Phase 1: Detect Changes

**For PR:**
```bash
gh pr diff {number} --name-only
gh pr view {number} --json title,body,files
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

### Phase 2: Categorize Changes

Map changed files to documentation areas:

| File Pattern | Affected Doc |
|--------------|--------------|
| `packages/{pkg}/src/**` | `cc-docs/packages/{pkg}.md` |
| `packages/plugins/{cat}/{plugin}/**` | `cc-docs/plugins/{cat}/{plugin}.md` |
| `packages/plugins/{cat}/**` | `cc-docs/plugins/{cat}/overview.md` |
| `packages/servers/**` | `cc-docs/architecture/*.md` |
| `turbo.json`, `pnpm-workspace.yaml` | `cc-docs/Overview.md` |

### Phase 3: Semantic Analysis

For each affected area, determine if docs need updating:

**Behavioral changes (update docs):**
- New exports in `index.js`
- New modules/files added
- Significant logic changes
- New dependencies on other packages
- API changes

**Skip these (no doc update):**
- Test file changes only
- Dependency version bumps
- Formatting/linting fixes
- Internal refactors with same behavior

### Phase 4: Update Documentation

For each doc that needs updating:

1. **Read existing doc completely**
2. **Read changed source files**
3. **Identify sections to update:**
   - New modules → add to "Key Modules"
   - New exports → add to "Files Quick Reference"
   - New dependencies → update "Dependencies"
   - Behavior changes → update relevant sections

4. **Preserve existing content** - only update affected sections
5. **Update frontmatter** `updated:` date

### Phase 5: Validate

```bash
# Check for broken internal links
grep -r "\]\(./" cc-docs/ | grep -v "^Binary"
```

### Phase 6: Report

```markdown
## Documentation Update Summary

**Source:** PR #123 / branch feature/x / uncommitted changes

### Changes Analyzed
- {count} files changed
- {count} packages affected
- {count} architecture areas touched

### Documentation Updates

**Updated:**
- `cc-docs/packages/engine.md` - Added new state hook section
- `cc-docs/architecture/state-management.md` - Updated flow diagram

**Skipped (non-behavioral):**
- `packages/engine/src/utils.test.js` - Test only
- `packages/helpers/package.json` - Version bump

### Validation
- All internal links valid
- Cross-references intact
```

## Update Rules

### Do Update When:
- New public exports added
- Module structure changes
- Dependencies added/removed between packages
- Significant behavior changes
- New patterns introduced

### Don't Update When:
- Test files only
- Internal refactors (same external behavior)
- Dependency version bumps
- Formatting/style changes
- Documentation changes (packages/docs)

### Update Style:
- **Add** new information to existing sections
- **Modify** outdated information
- **Never remove** content unless code was deleted
- **Preserve** existing formatting and structure
- **Update** the `updated:` date in frontmatter

## Cross-Reference Handling

When updating package docs, check if changes affect:
- Architecture docs that reference this package
- Other package docs that depend on this package
- Plugin docs that use this package

Note needed cross-reference updates in the summary.

## Accuracy Validation

Before finalizing updates, verify:

1. **Property/Type Names**
   - Check actual schema files for correct property names (e.g., `databaseUri` not `connectionString`)
   - Verify action names from exports (e.g., `DisplayMessage` not `Message`)

2. **Counts and Lists**
   - Count actual build steps instead of estimating (e.g., "31 steps" not "25+ steps")
   - List all output files/directories completely

3. **External Library Links**
   - When updating plugin docs, include/verify external library documentation links

4. **Context Parameters**
   - For parser documentation, include complete payload parameters

5. **Advanced Features**
   - Document debounce, catchActions, and other advanced patterns when present

## Example Session

**Input:** `/l-docs-update #456`

**Analysis:**
```
Changed files:
- packages/engine/src/state/hooks.js (Added)
- packages/engine/src/state/index.js (Modified)
- packages/engine/src/index.js (Modified)
- packages/client/src/useEngine.js (Modified)
```

**Categorization:**
- `packages/engine` - New module added
- `packages/client` - Uses engine, check for interface changes

**Decision:**
- Update `cc-docs/packages/engine.md` - New hooks module
- Check `cc-docs/packages/client.md` - May need cross-reference
- Check `cc-docs/architecture/state-management.md` - New state hooks

**Updates:**
1. Read PR description: "Adds React-style hooks for state management"
2. Read `hooks.js` - new `usePageState`, `useBlockState` exports
3. Update engine.md:
   - Add hooks.js to Key Modules
   - Add new exports to reference
4. Update state-management.md:
   - Add section on hook-based state access
5. Validate links

**Report:**
```
Updated 2 docs, skipped 0
- cc-docs/packages/engine.md - Added hooks module
- cc-docs/architecture/state-management.md - Added hooks section
```
