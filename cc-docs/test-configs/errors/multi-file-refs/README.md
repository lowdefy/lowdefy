# Multi-File Error Tracing Test

This test config validates that error messages correctly show the **source file path** where the error occurred, not the parent file that imported it via `_ref`.

## Bug Description (Issue #1947)

**Before the fix:**
When using `_ref` to import pages from separate files, errors showed incorrect file paths:
```
⚠ [Config Error] Request "fetchData" not defined on page "home".
  lowdefy.yaml:184 at root.pages[0:home:PageHeaderMenu].blocks[0]...
  /Users/dev/myapp/lowdefy.yaml:184
```

The error occurred in `pages/home.yaml` but the message pointed to `lowdefy.yaml` (the parent file) with a line number from the child file.

**After the fix:**
Errors now correctly show the source file:
```
⚠ [Config Error] Request "fetchData" not defined on page "home".
  pages/home.yaml:21 at root.pages[0:home:PageHeaderMenu].blocks[0]...
  /Users/dev/myapp/pages/home.yaml:21
```

## Root Cause

In `packages/build/src/build/buildRefs/recursiveBuild.js`, when processing `_ref` imports, the code was overwriting the `~r` property (file reference) with the **parent file's** ref ID while keeping the **child file's** line number (`~l`). This created a mismatch.

## The Fix

Modified the reviver function to:
1. Only set `~r` if not already present (preserves nested import references)
2. Use the **child file's** ref ID (`parsedRefDef.id`) instead of parent's (`refDef.id`)

```javascript
// BEFORE (incorrect)
const reviver = (_, value) => {
  if (!type.isObject(value)) return value;
  Object.defineProperty(value, '~r', {
    value: refDef.id,  // BUG: parent file
    // ...
  });
  return value;
};

// AFTER (correct)
const reviver = (_, value) => {
  if (!type.isObject(value)) return value;
  if (value['~r'] === undefined) {
    Object.defineProperty(value, '~r', {
      value: parsedRefDef.id,  // FIX: child file
      // ...
    });
  }
  return value;
};
```

## Test Structure

```
multi-file-refs/
├── lowdefy.yaml              # Main config (imports pages via _ref)
├── pages/
│   ├── home.yaml             # Error: Undefined request
│   ├── products.yaml         # Error: Non-existent connection
│   ├── about.yaml            # Error: Invalid block type
│   └── contact.yaml          # Error: Invalid action type
└── README.md                 # This file
```

## How to Test

### 1. Copy test config to app directory

```bash
# From the root of lowdefy-alpha repo
mkdir -p app
cp -r cc-docs/test-configs/errors/multi-file-refs/* app/
```

### 2. Run the dev server

```bash
pnpm dev
```

### 3. Expected Error Messages

You should see **four warning messages** with correct file paths:

#### Error 1: Undefined Request (home.yaml)
```
⚠ [Config Error] Request "fetchData" not defined on page "home".
  pages/home.yaml:21 at root.pages[0:home:PageHeaderMenu]...
  /Users/dev/myapp/app/pages/home.yaml:21
```
✅ **Correct:** Shows `pages/home.yaml` (not `lowdefy.yaml`)

#### Error 2: Non-Existent Connection (products.yaml)
```
✖ [Config Error] Request "loadProducts" at page "products" references non-existent connection "wrongDb".
  pages/products.yaml:9 at root.pages[1:products:PageHeaderMenu].requests[0:loadProducts:MongoDBFindOne]
  /Users/dev/myapp/app/pages/products.yaml:9
```
✅ **Correct:** Shows `pages/products.yaml` (not `lowdefy.yaml`)

#### Error 3: Invalid Block Type (about.yaml)
```
✖ [Config Error] Block type "InvalidBlockType" was used but is not defined.
  pages/about.yaml:21 at root.pages[2:about:PageHeaderMenu].blocks[0:content:Card].blocks[1:invalidBlock:InvalidBlockType]
  /Users/dev/myapp/app/pages/about.yaml:21
```
✅ **Correct:** Shows `pages/about.yaml` (not `lowdefy.yaml`)

#### Error 4: Invalid Action Type (contact.yaml)
```
✖ [Config Error] Action type "InvalidAction" was used but is not defined.
  pages/contact.yaml:25 at root.pages[3:contact:PageHeaderMenu].blocks[0:content:Card].blocks[1:submitButton:Button].events.onClick[0:invalidAction:InvalidAction]
  /Users/dev/myapp/app/pages/contact.yaml:25
```
✅ **Correct:** Shows `pages/contact.yaml` (not `lowdefy.yaml`)

### 4. Verify Clickable Links

In VSCode terminal, the absolute paths should be clickable and open the correct file at the correct line.

## Before/After Comparison

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| **Error in `pages/home.yaml:21`** | `lowdefy.yaml:21` ❌ | `pages/home.yaml:21` ✅ |
| **Error in `pages/products.yaml:9`** | `lowdefy.yaml:9` ❌ | `pages/products.yaml:9` ✅ |
| **Error in `pages/about.yaml:21`** | `lowdefy.yaml:21` ❌ | `pages/about.yaml:21` ✅ |
| **Error in `pages/contact.yaml:25`** | `lowdefy.yaml:25` ❌ | `pages/contact.yaml:25` ✅ |

## Related Files

- **Fix:** `packages/build/src/build/buildRefs/recursiveBuild.js:95-110`
- **Tests:** `packages/build/src/build/buildRefs/buildRefs.test.js`
- **Formatter:** `packages/build/src/utils/formatConfigMessage.js`
- **Resolver:** `packages/utils/helpers/src/resolveConfigLocation.js`

## Clean Up

After testing, remove the test config:

```bash
rm -rf app/
# or keep app/.gitignore to prevent accidental commits
```

## Additional Test Cases

To test nested `_ref` imports (A → B → C), create more complex scenarios:

```yaml
# pages/nested-parent.yaml
blocks:
  - _ref: components/nested-child.yaml

# components/nested-child.yaml
id: childBlock
type: InvalidType  # Error should show components/nested-child.yaml, not pages/nested-parent.yaml
```

The fix ensures that even deeply nested imports preserve the original source file location.
