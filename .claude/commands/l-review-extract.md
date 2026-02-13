# Review Code for Extraction Opportunities

Analyze changed code to identify functions or patterns that should be extracted as utilities or helpers.

## Usage

- `/l-review-extract` - Review uncommitted changes
- `/l-review-extract 123` - Review PR #123

**Run this before `/l-generate-tests`** to ensure code is properly structured before writing tests.

## Instructions

You are a senior software engineer reviewing code for the Lowdefy codebase. Your goal is to identify extraction opportunities that **reduce duplication** and **improve maintainability** without increasing complexity.

### Step 1: Identify Changed Files

**If a PR number is provided ($ARGUMENTS):**
```bash
gh pr diff $ARGUMENTS --name-only
```

**If no PR number (uncommitted changes):**
```bash
git diff --name-only HEAD
git diff --cached --name-only
```

Filter to `.js` files in `packages/*/src/`. Exclude `*.test.js`, `packages/docs/`.

### Step 2: Analyze Changed Code

For each changed file:

1. **Read the full file** to understand context
2. **Get the diff** to see what changed:
   - PR: `gh pr diff $ARGUMENTS -- path/to/file.js`
   - Uncommitted: `git diff HEAD -- path/to/file.js`
3. **Identify the package** the file belongs to

### Step 3: Identify Extraction Candidates

Look for these patterns that indicate extraction opportunities:

#### A. Duplicate Logic (High Priority)

Code that appears in multiple places (in changed files or across the codebase):

```javascript
// BAD: Same validation in multiple files
if (type.isUndefined(item.id)) {
  throw new Error('Item id missing.');
}
if (!type.isString(item.id)) {
  throw new Error(`Item id is not a string. Received ${JSON.stringify(item.id)}.`);
}
```

**Search for similar patterns:**
```bash
# Find similar validation patterns
rg "throw new Error\('.*id missing" packages/
rg "is not a string\. Received" packages/
```

#### B. Complex Inline Logic (Medium Priority)

Logic that obscures the main function's purpose:

```javascript
// BAD: Complex transformation inline
function buildPage({ page }) {
  const areas = Object.keys(page.areas || {}).reduce((acc, key) => {
    const blocks = (page.areas[key].blocks || []).map(block => ({
      ...block,
      pageId: page.id,
      // ... 10 more lines of transformation
    }));
    return { ...acc, [key]: { blocks } };
  }, {});
  // ... rest of function
}

// GOOD: Extract the transformation
function transformAreas({ areas, pageId }) { /* ... */ }

function buildPage({ page }) {
  const areas = transformAreas({ areas: page.areas, pageId: page.id });
  // ... rest of function
}
```

#### C. Reusable Patterns (Medium Priority)

Patterns that could benefit other parts of the codebase:

- Error formatting with consistent structure
- Object transformation helpers
- Validation chains
- Safe property access patterns beyond what `@lowdefy/helpers` provides

#### D. Testability Improvements (Low Priority)

Code that's hard to test because it's embedded in larger functions:

```javascript
// Hard to test the date logic independently
function processEvent({ event }) {
  const timestamp = new Date();
  const formatted = `${timestamp.getFullYear()}-${timestamp.getMonth()}`;
  // ... uses formatted throughout
}
```

### Step 4: Evaluate Extraction Impact

**DO NOT suggest extraction if:**

1. **Single use** - Code only appears once and is unlikely to be reused
2. **Simple operations** - 1-3 lines that are clearer inline
3. **Tightly coupled** - Extraction would require passing many parameters
4. **Increases indirection** - Would make code harder to follow
5. **Premature abstraction** - No clear second use case exists

**DO suggest extraction if:**

1. **Multiple occurrences** - Same pattern in 2+ places
2. **Complex logic** - More than 5-10 lines of focused logic
3. **Independent concern** - Can be understood and tested in isolation
4. **Clear interface** - Natural parameter/return structure
5. **Existing utility pattern** - Similar helpers already exist in `@lowdefy/helpers`

### Step 5: Determine Extraction Location

Based on scope, determine where the utility should live:

| Scope | Location | Example |
|-------|----------|---------|
| Used across packages | `packages/helpers/src/` | `type.isNone()`, `get()`, `set()` |
| Single package, multiple files | `packages/{pkg}/src/utils/` | `createCheckDuplicateId` |
| Build-specific | `packages/build/src/utils/` | Build helpers |
| Plugin-specific | Within the plugin package | Connection helpers |

### Step 6: Present Findings to User

For each extraction candidate, present:

```markdown
## Extraction Opportunity: {descriptive name}

**Location:** `path/to/file.js` (lines X-Y)

**Pattern detected:** {duplicate logic | complex inline | reusable pattern | testability}

**Current code:**
```javascript
// Show the relevant code snippet
```

**Occurrences found:** {N locations}
- `path/to/file1.js:42`
- `path/to/file2.js:88`

**Impact assessment:**
- Complexity reduction: {Low | Medium | High}
- Reuse potential: {Low | Medium | High}
- Test improvement: {Low | Medium | High}

**Suggested extraction:**
- **Name:** `{functionName}`
- **Location:** `packages/{pkg}/src/utils/{functionName}.js`
- **Interface:**
  ```javascript
  function {functionName}({ param1, param2 }) {
    // Brief description of what it does
    return result;
  }
  ```

**Implementation steps:**
1. Create `{functionName}.js` with the extracted logic
2. Create `{functionName}.test.js` with tests
3. Update `{original file}` to import and use the new utility
4. {Any additional steps like updating exports}

---

Would you like me to implement this extraction? (yes/no/skip)
```

### Step 7: Implement One by One

If the user approves an extraction:

1. **Create the utility file** with proper license header
2. **Create the test file** following testing patterns
3. **Update the original file(s)** to use the new utility
4. **Update exports** if needed (e.g., `index.js`)
5. **Run tests** to verify: `pnpm --filter=@lowdefy/{package} test`

After each extraction, ask before proceeding to the next.

### Extraction Patterns Reference

#### Validation Helper Pattern

```javascript
/*
  Copyright 2020-2026 Lowdefy, Inc
  ... license header ...
*/

import { type } from '@lowdefy/helpers';

function validateRequiredString({ value, name, location }) {
  if (type.isUndefined(value)) {
    throw new Error(`${name} missing at ${location}.`);
  }
  if (!type.isString(value)) {
    throw new Error(`${name} is not a string at ${location}. Received ${JSON.stringify(value)}.`);
  }
}

export default validateRequiredString;
```

#### Transformation Helper Pattern

```javascript
/*
  Copyright 2020-2026 Lowdefy, Inc
  ... license header ...
*/

function transformBlocks({ blocks, pageId }) {
  return (blocks || []).map((block) => ({
    ...block,
    pageId,
  }));
}

export default transformBlocks;
```

#### Factory Pattern (for stateful utilities)

```javascript
/*
  Copyright 2020-2026 Lowdefy, Inc
  ... license header ...
*/

function createCounter() {
  const counts = {};
  return {
    increment(key) {
      counts[key] = (counts[key] || 0) + 1;
    },
    getCounts() {
      return { ...counts };
    },
  };
}

export default createCounter;
```

### Output Summary

After reviewing all files, provide:

```markdown
## Review Summary

**Files analyzed:** {N}
**Extraction opportunities found:** {N}

### High Priority
- {opportunity 1} - {reason}

### Medium Priority
- {opportunity 2} - {reason}

### Skipped (no extraction needed)
- {file} - {reason: single use, simple, etc.}

Would you like to proceed with implementing the extractions?
```

### Important Guidelines

1. **Be conservative** - Only suggest extractions with clear benefit
2. **Preserve functionality** - Never change what code does
3. **Follow existing patterns** - Match the style of `@lowdefy/helpers` and existing utils
4. **Consider the reviewer** - Would a senior engineer agree this improves the code?
5. **One at a time** - Implement and verify each extraction before the next
