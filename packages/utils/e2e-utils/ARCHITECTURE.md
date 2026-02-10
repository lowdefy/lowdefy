# @lowdefy/e2e-utils Architecture

How the e2e testing framework links up from build to test execution.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        playwright.config.js                         │
│  createConfig({ appDir, port })                                     │
│                                                                     │
│  Configures:                                                        │
│    webServer  → builds & starts the Lowdefy app                     │
│    projects   → browser targets (chromium by default)                │
│    testDir    → where to find *.spec.js files                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
    Phase 1: BUILD      Phase 2: FIXTURES     Phase 3: TESTS
    (before tests)      (Playwright setup)    (your test code)
```

---

## Phase 1: Build Time (Before Any Test Runs)

Playwright's `webServer` config runs before any tests start. It executes:

```bash
NEXT_PUBLIC_LOWDEFY_E2E=true npx lowdefy build && npx lowdefy start --port 3000
```

This does two things:

### 1.1 Lowdefy Build

`lowdefy build` compiles the YAML config into JSON build artifacts:

```
.lowdefy/server/build/
├── types.json          ← maps block type → npm package
│                         e.g. { "blocks": { "TextInput": { "package": "@lowdefy/blocks-antd" } } }
│
├── pages/
│   ├── contact/
│   │   └── contact.json   ← full page config with all blocks, areas, events
│   ├── dashboard/
│   │   └── dashboard.json
│   └── ...
```

### 1.2 The E2E Flag

`NEXT_PUBLIC_LOWDEFY_E2E=true` tells the Lowdefy runtime to expose `window.lowdefy` in the browser. Without this, the internal state (contexts, requests, validation) is not accessible and `ldf.state()`, `ldf.block().validation()`, etc. would not work.

### 1.3 Manifest Generation (Lazy)

The **e2e manifest** is generated lazily — the first Playwright worker that needs it creates it. It reads the build artifacts and produces a lookup table:

```
.lowdefy/server/build/e2e-manifest.json
```

**How it works** (`generateManifest.js` + `extractBlockMap.js`):

1. Read `types.json` to get the `block type → package name` mapping
2. For each page, read its JSON config and recursively walk the block tree
3. For each block found, record an entry with the **import path** to its e2e helper:

```json
{
  "pages": {
    "contact": {
      "name_input": {
        "type": "TextInput",
        "helper": "@lowdefy/blocks-antd/e2e/TextInput"
      },
      "email_input": {
        "type": "TextInput",
        "helper": "@lowdefy/blocks-antd/e2e/TextInput"
      },
      "submit_btn": {
        "type": "Button",
        "helper": "@lowdefy/blocks-antd/e2e/Button"
      }
    }
  }
}
```

The `helper` path follows the pattern `{packageName}/e2e/{BlockType}`. This is how blocks from *any* package can provide e2e helpers — they just need to export the module at that path.

---

## Phase 2: Playwright Fixtures (Test Setup)

Playwright fixtures are dependency-injected values available to every test. They have different scopes:

### 2.1 How Playwright Fixtures Work

```javascript
// fixtures/index.js
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Fixtures declared here are available as test arguments:
  //   test('my test', async ({ page, ldf }) => { ... })
});
```

Playwright's `base.extend()` lets us define custom fixtures alongside built-in ones like `page` and `browser`. Each fixture declares its dependencies and Playwright handles the wiring.

### 2.2 Our Fixtures

```
Worker scope (created once per Playwright worker process, shared across tests):
┌──────────────────────────────────────────────────────────────┐
│  manifest          Loads e2e-manifest.json (generates it     │
│                    lazily if missing). Contains the full      │
│                    block map for all pages.                   │
│                                                              │
│  helperRegistry    Lazy-loading cache for block e2e modules. │
│                    First access does import(), then cached    │
│                    for all subsequent tests in this worker.   │
│                                                              │
│  staticMocks       Loads mocks.yaml once per worker.         │
│                    Applied to every test automatically.       │
└──────────────────────────────────────────────────────────────┘

Test scope (created fresh for every test):
┌──────────────────────────────────────────────────────────────┐
│  ldf                The main test API. Created by            │
│                     createPageManager() with { page,         │
│                     manifest, helperRegistry, mockManager }.  │
│                                                              │
│                     Depends on:                               │
│                       page (built-in) ← fresh browser page   │
│                       manifest (worker) ← block lookup       │
│                       helperRegistry (worker) ← module cache │
│                       mockManager (test) ← request mocking   │
└──────────────────────────────────────────────────────────────┘
```

**Why worker scope for manifest, helperRegistry, and staticMocks?**

- The manifest is the same for all tests — no need to re-read it per test
- The helper registry caches `import()` calls — once `@lowdefy/blocks-antd/e2e/TextInput` is imported, it stays cached for all tests in that worker
- Static mocks are loaded once and applied to every test
- This makes tests fast after the first one

**Why test scope for ldf?**

- Each test gets its own `page` (fresh browser tab)
- `ldf` wraps that specific page, so it must be per-test
- Internal state (`currentPageId`, `currentBlockMap`) is test-specific
- Mock manager tracks per-test route handlers

### 2.3 The Fixture Lifecycle

```
Worker starts
  ├── manifest fixture runs → loads e2e-manifest.json
  ├── helperRegistry fixture runs → creates empty cache
  ├── staticMocks fixture runs → loads mocks.yaml
  │
  ├── Test 1 starts
  │   ├── Playwright creates fresh page (browser tab)
  │   ├── mockManager created, static mocks applied
  │   ├── ldf fixture runs → createPageManager({ page, manifest, helperRegistry, mockManager })
  │   ├── Test body executes
  │   └── mockManager.cleanup(), page closes
  │
  ├── Test 2 starts
  │   ├── Fresh page created
  │   ├── New mockManager and ldf created (reuses manifest, helperRegistry, staticMocks)
  │   ├── Test body executes
  │   └── Tear down
  │
  └── Worker shuts down
```

---

## Phase 3: Runtime (Test Execution)

### 3.1 The `ldf` Object Structure (Locator-First API)

```javascript
ldf = {
  // Raw Playwright page
  page,                       // Direct access to Playwright page object

  // Navigation
  goto(path),                 // Navigates and waits for Lowdefy to initialize
  waitForPage(path),          // Waits for navigation to a different page
  pageId,                     // Current page ID (getter)

  // Block locator - ldf.block('id').*
  block(blockId) → {
    do: {                     // → Proxy (mode: 'do')
      fill('John'),               → helper.do.fill(page, blockId, 'John')
      select('Option'),           → helper.do.select(page, blockId, 'Option')
      click(),                    → helper.do.click(page, blockId)
      clear(),                    → helper.do.clear(page, blockId)
    },
    expect: {                 // → Proxy (mode: 'expect')
      visible(),                  → helper.expect.visible(page, blockId)
      hidden(),                   → helper.expect.hidden(page, blockId)
      disabled(),                 → helper.expect.disabled(page, blockId)
      enabled(),                  → helper.expect.enabled(page, blockId)
      validationError(),          → helper.expect.validationError(page, blockId)
      value('John'),              → helper.expect.value(page, blockId, 'John')
    },
    locator(),                // Raw Playwright locator
    state(),                  // Block's state value
    validation(),             // Block's validation object
  },

  // Request locator - ldf.request('id').*
  request(requestId) → {
    expect: {
      toFinish(opts),             // Waits for loading: false
      toHaveResponse(response),   // Asserts response matches
      toHavePayload(payload),     // Asserts payload sent
    },
    response(),               // Raw response data
    state(),                  // Full request state object
  },

  // State locator - ldf.state('key').* or ldf.state().*
  state(key?) → {
    do: { set(value) },       // Sets state (only with key)
    expect: { toBe(value) },  // Asserts state value (only with key)
    value(),                  // Raw state value (or full state if no key)
  },

  // URL locator - ldf.url().*
  url() → {
    expect: {
      toBe(path),                 // Exact path match
      toMatch(pattern),           // Regex pattern match
    },
    value(),                  // Current URL string
  },

  // URL query locator - ldf.urlQuery('key').*
  urlQuery(key) → {
    do: { set(value) },       // Sets query param
    expect: { toBe(value) },  // Asserts query param value
    value(),                  // Raw query param value
  },

  // Mocking
  mock: {
    request(requestId, opts), // Mock a request (defaults to current pageId)
    api(apiId, opts),         // Mock an API endpoint
    getCapturedRequest(id),   // Get captured request payload
    clearCapturedRequests(),  // Clear all captured requests
  },
}
```

### 3.2 The Proxy Chain (What Happens When You Call a Block Method)

```javascript
await ldf.block('name_input').do.fill('John');
```

Step by step:

```
1. ldf.block('name_input')
   → ensurePageLoaded() check
   → Looks up blockMap['name_input']
   → Finds: { type: 'TextInput', helper: '@lowdefy/blocks-antd/e2e/TextInput' }
   → Returns object with { do, expect, locator, state, validation }

2. ldf.block('name_input').do
   → Returns createBlockMethodProxy({ page, blockId, blockInfo, helperRegistry, mode: 'do' })

3. ldf.block('name_input').do.fill
   → Proxy trap fires
   → Returns an async function (not executed yet)

4. ldf.block('name_input').do.fill('John')
   → The async function executes:
     a. helperRegistry.get('@lowdefy/blocks-antd/e2e/TextInput')
        → First call: import('@lowdefy/blocks-antd/e2e/TextInput')
        → Subsequent calls: returns from cache
     b. Looks up helper.do.fill
     c. Calls helper.do.fill(page, 'name_input', 'John')
        → Playwright fills the input element
```

### 3.3 The `createBlockHelper` Factory

Block helpers are created using the `createBlockHelper` factory, which auto-provides common methods so blocks only define what's unique.

#### Method Layers

| Layer | Methods | Source | Needs locator? |
|-------|---------|--------|----------------|
| Common | `visible`, `hidden` | Factory (from locator) | Yes |
| Common overridable | `disabled`, `enabled` | Factory default, block can override | Yes |
| Universal | `validationError`, `validationWarning`, `validationSuccess` | Factory (from `core/validation.js`) | No |
| Block-specific | `fill`, `select`, `click`, `clear`, `loading`, `text`, etc. | Block `e2e.js` | Varies |

The factory merges these layers in order: common defaults → validation → block overrides. Block overrides spread last, so a block like Selector can replace the default `disabled` implementation.

#### Factory Structure

```javascript
// createBlockHelper.js
function createBlockHelper({ locator, do: doMethods, expect: expectOverrides }) {
  return {
    locator,
    do: { ...(doMethods ?? {}) },
    expect: {
      // Common — derived from locator
      visible, hidden, disabled, enabled,
      // Universal — validation (reads window.lowdefy internals, no locator needed)
      validationError, validationWarning, validationSuccess,
      // Block overrides spread last — can replace any of the above
      ...(expectOverrides ?? {}),
    },
  };
}
```

#### Helper Shape

The factory returns an object with sub-objects for `do` and `expect`:

```javascript
{
  locator,        // (page, blockId) → Playwright Locator
  do: {
    fill,         // (page, blockId, val) → Promise  [text inputs]
    select,       // (page, blockId, val) → Promise  [selectors]
    click,        // (page, blockId) → Promise        [buttons]
    clear,        // (page, blockId) → Promise
  },
  expect: {
    visible,      // (page, blockId) → Promise  [auto-provided]
    hidden,       // (page, blockId) → Promise  [auto-provided]
    disabled,     // (page, blockId) → Promise  [auto, overridable]
    enabled,      // (page, blockId) → Promise  [auto, overridable]
    validationError,  // (page, blockId, params?) → Promise  [auto-provided]
    value,        // (page, blockId, val) → Promise  [block-specific]
  },
}
```

The proxy looks up methods by mode: `helper[mode][methodName]`.

All methods receive `(page, blockId, ...args)`:
- `page` — the Playwright Page object
- `blockId` — the Lowdefy block ID
- `...args` — values passed directly (e.g., `'John'` from `.fill('John')`)

### 3.4 State and Validation Access

Methods like `ldf.state().value()`, `ldf.block().validation()`, etc. work by evaluating JavaScript inside the browser via `page.evaluate()`:

```javascript
// How state is read from the browser
page.evaluate(() => {
  const lowdefy = window.lowdefy;
  const pageId = lowdefy?.pageId;
  return lowdefy?.contexts?.[`page:${pageId}`]?.state;
});

// How validation is read from the browser
page.evaluate((blockId) => {
  const lowdefy = window.lowdefy;
  const pageId = lowdefy?.pageId;
  const context = lowdefy?.contexts?.[`page:${pageId}`];
  const block = context?._internal?.RootAreas?.map?.[blockId];
  return block?.validationEval?.output;
}, blockId);
```

Assertion methods use `expect.poll()` to retry until the expected value appears (or timeout):

```javascript
await expect.poll(async () => {
  const state = await getState(page);
  return key.split('.').reduce((obj, k) => obj?.[k], state);
}, { timeout: 5000 }).toEqual(expectedValue);
```

### 3.5 Request Mocking

Mocking intercepts Lowdefy requests and API calls using Playwright's `page.route()`.

#### Inline Mocks (Per-Test)

```javascript
// Mock defaults to current page
await ldf.mock.request('search_products', { response: [{ id: 1 }] });

// Explicit pageId
await ldf.mock.request('search_products', { pageId: 'search-page', response: [] });

// Mock API endpoint
await ldf.mock.api('external_api', { response: { status: 'ok' }, method: 'POST' });
```

#### Static Mocks (mocks.yaml)

Static mocks are loaded once per worker and applied to every test:

```yaml
# e2e/mocks.yaml
requests:
  - requestId: atlas_search
    response: [{ _id: 'doc-1', title: 'Result' }]

  # Wildcards supported
  - requestId: fetch_*
    pageId: admin-*
    response: []

api:
  - endpointId: external_api
    method: POST
    response: { status: ok }
```

Wildcards use Playwright's glob matching (`*` matches any characters in a single path segment).

---

## Adding E2E Support to a New Block

To make a block work with `@lowdefy/e2e-utils`:

1. **Create `e2e.js`** next to your block component using the `createBlockHelper` factory:

```javascript
// src/blocks/MyBlock/e2e.js
import { createBlockHelper } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#${blockId}_my-element`);

export default createBlockHelper({
  locator,
  do: {
    fill: (page, blockId, val) => locator(page, blockId).fill(val),
    clear: (page, blockId) => locator(page, blockId).clear(),
  },
  expect: {
    // Only define block-specific assertions here.
    // visible, hidden, disabled, enabled, validationError, etc.
    // are all auto-provided by the factory.
    value: (page, blockId, val) => expect(locator(page, blockId)).toHaveValue(val),
  },
});
```

To override a common method (e.g., Selector uses CSS class for disabled):

```javascript
export default createBlockHelper({
  locator,
  do: { /* ... */ },
  expect: {
    // Override the default disabled/enabled (which use toBeDisabled()/toBeEnabled())
    disabled: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-select-disabled/),
    enabled: (page, blockId) => expect(locator(page, blockId)).not.toHaveClass(/ant-select-disabled/),
  },
});
```

2. **Export it** in your package.json:

```json
{
  "exports": {
    "./e2e/MyBlock": "./dist/blocks/MyBlock/e2e.js"
  }
}
```

3. That's it. The manifest generator will pick up any block of this type and the proxy will route to your helpers. Common assertions (visible, hidden, disabled, enabled, validation) are provided automatically.

---

## Summary: What Runs Where

| Phase | When | Where | What |
|-------|------|-------|------|
| `lowdefy build` | Before tests | Node.js (Playwright webServer) | Compiles YAML → JSON, produces types.json + page configs |
| `lowdefy start` | Before tests | Node.js + browser | Starts the production server |
| Manifest generation | First worker init | Node.js (Playwright fixture) | Reads build artifacts → produces e2e-manifest.json |
| Static mocks load | First worker init | Node.js (Playwright fixture) | Reads mocks.yaml → applies to all tests |
| Helper import | First block access | Node.js (Playwright) | `import('@lowdefy/blocks-antd/e2e/TextInput')` |
| Block methods | During test | Node.js → browser | Playwright locators interact with DOM |
| State/validation reads | During test | Browser (page.evaluate) | Reads from `window.lowdefy` internals |
