# @lowdefy/e2e-utils

Playwright testing utilities for Lowdefy applications with a locator-first API.

**Source:** `packages/utils/e2e-utils/`
**Updated:** 2026-02-10
**PR:** #1982 (Closes #1970, #1977, #1981, #1983)

## Purpose

Provides e2e testing infrastructure for Lowdefy apps:
- Locator-first API for blocks, requests, state, and URL
- Request mocking (static and inline)
- Scaffold command for project setup
- Block helper factory for type-specific interactions

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        playwright.config.js                         │
│  createConfig({ appDir, port })                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
    Phase 1: BUILD      Phase 2: FIXTURES     Phase 3: TESTS
    (before tests)      (Playwright setup)    (your test code)
```

### Phase 1: Build Time

Playwright's `webServer` runs before tests:
```bash
NEXT_PUBLIC_LOWDEFY_E2E=true npx lowdefy build && npx lowdefy start
```

The `NEXT_PUBLIC_LOWDEFY_E2E=true` flag exposes `window.lowdefy` in browser for state/validation access.

**Manifest Generation** (lazy, first worker):
- Reads `types.json` for block type → package mapping
- Walks page configs to build block lookup table
- Produces `e2e-manifest.json` with helper import paths

```json
{
  "pages": {
    "contact": {
      "name_input": {
        "type": "TextInput",
        "helper": "@lowdefy/blocks-antd/e2e/TextInput"
      }
    }
  }
}
```

### Phase 2: Playwright Fixtures

```
Worker scope (shared across tests):
┌──────────────────────────────────────────────────────────────┐
│  manifest          Loads e2e-manifest.json                   │
│  helperRegistry    Lazy-loading cache for block e2e modules  │
│  staticMocks       Loads mocks.yaml once                     │
└──────────────────────────────────────────────────────────────┘

Test scope (fresh per test):
┌──────────────────────────────────────────────────────────────┐
│  ldf               Main test API (createPageManager)         │
│  mockManager       Per-test route handlers                   │
└──────────────────────────────────────────────────────────────┘
```

### Phase 3: Test Execution

The `ldf` object provides the locator-first API:

```javascript
ldf.block('id').do.fill('value')     // Block actions
ldf.block('id').expect.visible()     // Block assertions
ldf.request('id').expect.toFinish()  // Request assertions
ldf.state('key').expect.toBe(value)  // State assertions
ldf.mock.request('id', { response }) // Inline mocking
```

## Key Modules

### Core (`src/core/`)

| File | Purpose |
|------|---------|
| `navigation.js` | `goto()`, `waitForPage()` - navigation with Lowdefy ready detection |
| `requests.js` | Request state access, `toFinish()`, `toHavePayload()` assertions |
| `state.js` | State access via `page.evaluate()` into `window.lowdefy` |
| `url.js` | URL and query parameter assertions |
| `validation.js` | Block validation state access |
| `locators.js` | Common locator patterns |

### Proxy (`src/proxy/`)

| File | Purpose |
|------|---------|
| `createPageManager.js` | Creates the `ldf` object with all APIs |
| `createBlockMethodProxy.js` | Proxy that routes `do.*`/`expect.*` to block helpers |
| `createBlockHelper.js` | Factory for block e2e helpers with auto-provided methods |
| `createHelperRegistry.js` | Lazy-loading cache for block helper imports |

### Mocking (`src/mocking/`)

| File | Purpose |
|------|---------|
| `createMockManager.js` | Per-test mock state, route interception |
| `loadStaticMocks.js` | Parses mocks.yaml, applies wildcards |

### Init (`src/init/`)

| File | Purpose |
|------|---------|
| `index.js` | CLI entry point (`npx @lowdefy/e2e-utils`) |
| `detectApps.js` | Finds Lowdefy apps in `app/` or `apps/` |
| `generateFiles.js` | Creates e2e folder structure from templates |
| `installDeps.js` | Package manager detection and install |
| `updateGitignore.js` | Adds test artifacts to .gitignore |

### Config (`src/config.js`)

```javascript
createConfig({ appDir, port, timeout, ... })      // Single app
createMultiAppConfig({ apps: [...] })             // Monorepo
```

## Locator-First API Design

**Pattern:** Get the thing, then do something with it.

```javascript
// Block
ldf.block('id')           // Returns block locator object
  .do.fill('value')       // Action methods
  .expect.visible()       // Assertion methods
  .locator()              // Raw Playwright locator
  .state()                // Block's state value
  .validation()           // Block's validation object

// Request
ldf.request('id')         // Returns request locator object
  .expect.toFinish()      // Wait for loading: false
  .expect.toHavePayload() // Assert payload
  .response()             // Raw response data

// State
ldf.state('key')          // Returns state locator object
  .do.set(value)          // Set state value
  .expect.toBe(value)     // Assert state value
  .value()                // Get raw value
```

## Block Helper Factory

The `createBlockHelper` factory auto-provides common methods:

```javascript
import { createBlockHelper } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#${blockId}_input`);

export default createBlockHelper({
  locator,
  do: {
    fill: (page, blockId, val) => locator(page, blockId).fill(val),
  },
  expect: {
    // visible, hidden, disabled, enabled, validationError auto-provided
    value: (page, blockId, val) => expect(locator(page, blockId)).toHaveValue(val),
  },
});
```

**Auto-provided methods:**
- `visible`, `hidden` - derived from locator
- `disabled`, `enabled` - default uses `toBeDisabled()`/`toBeEnabled()`, blocks can override
- `validationError`, `validationWarning`, `validationSuccess` - from `core/validation.js`

## Helper Resolution

**Key insight:** E2e helpers must resolve from server's node_modules, not test project's.

```javascript
// createHelperRegistry.js
import { createRequire } from 'module';

const serverRequire = createRequire(path.join(serverDir, 'package.json'));
const resolvedPath = serverRequire.resolve('@lowdefy/blocks-antd/e2e/TextInput');
```

This allows test projects to work without block packages as direct dependencies.

## Request Mocking

### Static Mocks (mocks.yaml)

```yaml
requests:
  - requestId: atlas_search
    response: [{ _id: 'doc-1' }]
  - requestId: fetch_*          # Wildcards supported
    pageId: admin-*
    response: []
api:
  - endpointId: external_api
    method: POST
    response: { status: ok }
```

### Inline Mocks

```javascript
await ldf.mock.request('search', { response: [] });
await ldf.mock.request('fetch', { error: 'Not found' });
await ldf.mock.api('external', { response: { ok: true } });
```

Mocks intercept at HTTP layer via Playwright's `page.route()`.

## Integration with Blocks

Block packages export e2e helpers at subpaths:

```json
// blocks-antd/package.json
{
  "exports": {
    "./e2e/TextInput": "./dist/blocks/TextInput/e2e.js",
    "./e2e/Button": "./dist/blocks/Button/e2e.js"
  }
}
```

The manifest generator reads `types.json` to map block types to packages, then constructs import paths.

## Decision Trace

### Locator-First vs Action-First API

**Decision:** Locator-first pattern (`ldf.block('id').do.fill()`)

**Why:**
- More intuitive - mirrors how you think ("get the button, click it")
- Consistent with Playwright's locator pattern
- Better for LLM code generation - pattern is predictable
- Enables IDE autocomplete after getting the locator

**Trade-off:** Slightly more verbose than action-first, but clarity wins.

### Helper Resolution from Server Context

**Decision:** Use `createRequire` from server's node_modules

**Why:**
- Test projects shouldn't need block packages as dependencies
- Blocks are already installed in `.lowdefy/server/node_modules`
- Simplifies test project setup

**Implementation:** `createHelperRegistry.js` uses `createRequire(serverDir + '/package.json')` to resolve from server context.

### Worker vs Test Scope for Fixtures

**Decision:** Worker scope for manifest/registry/staticMocks, test scope for ldf/mockManager

**Why:**
- Manifest and helpers don't change between tests - cache them
- Static mocks apply to all tests - load once
- Each test needs fresh page and mock state - isolate them

## Files Quick Reference

```
src/
├── index.js                    # Main exports
├── config.js                   # createConfig, createMultiAppConfig
├── core/
│   ├── index.js
│   ├── locators.js
│   ├── navigation.js
│   ├── requests.js
│   ├── state.js
│   ├── url.js
│   └── validation.js
├── fixtures/
│   └── index.js                # Playwright test.extend()
├── init/
│   ├── index.js                # CLI entry
│   ├── detectApps.js
│   ├── generateFiles.js
│   ├── installDeps.js
│   ├── updateGitignore.js
│   └── templates/
│       ├── playwright.config.js.template
│       ├── example.spec.js.template
│       ├── fixtures.js.template
│       ├── mocks.yaml.template
│       ├── mongodb.spec.js.template
│       ├── env.e2e.template
│       └── README.md.template
├── mocking/
│   ├── index.js
│   ├── createMockManager.js
│   └── loadStaticMocks.js
├── proxy/
│   ├── createBlockHelper.js
│   ├── createBlockMethodProxy.js
│   ├── createHelperRegistry.js
│   └── createPageManager.js
└── testPrep/
    ├── extractBlockMap.js
    └── generateManifest.js
```

## Dependencies

```
@lowdefy/blocks-antd    # Block e2e helpers
@lowdefy/blocks-basic   # Block e2e helpers
js-yaml                 # Parse mocks.yaml
prompts                 # CLI prompts

peerDependencies:
@playwright/test        # Testing framework
```

## See Also

- [block-dev-e2e.md](./block-dev-e2e.md) - Internal block testing (uses e2e-utils)
- [blocks/antd.md](../plugins/blocks/antd.md) - Block e2e helper implementations
- [blocks/basic.md](../plugins/blocks/basic.md) - List e2e helper
