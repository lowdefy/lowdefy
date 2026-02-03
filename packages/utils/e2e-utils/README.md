# @lowdefy/e2e-utils

Playwright testing utilities for Lowdefy applications with a polymorphic block API.

## Installation

```bash
pnpm add -D @lowdefy/e2e-utils @playwright/test
npx playwright install chromium
```

## Quick Start

Initialize e2e testing in your Lowdefy app:

```bash
npx lowdefy-e2e init
```

This creates:
- `e2e/playwright.config.js` - Pre-configured Playwright config
- `e2e/example.spec.js` - Starter test to copy from

Run tests:

```bash
pnpm e2e        # Run tests
pnpm e2e:ui     # Run with Playwright UI
```

## Writing Tests

Import `test` from our fixtures - it includes the `ldf` helper automatically:

```javascript
import { test, expect } from '@lowdefy/e2e-utils/fixtures';

test('homepage loads', async ({ page, ldf }) => {
  await ldf.goto('/');
  await expect(page).toHaveTitle(/My App/);
});
```

### Polymorphic Block API

The `ldf.blocks` API automatically detects block types and routes to the correct helper:

```javascript
test('submit form', async ({ ldf }) => {
  await ldf.goto('/contact');

  // No need to import block-specific helpers!
  // ldf.blocks knows TextInput uses .fill(), Button uses .click(), etc.
  await ldf.blocks.name_input.fill('John Doe');
  await ldf.blocks.email_input.fill('john@example.com');
  await ldf.blocks.category.select('Support');
  await ldf.blocks.subscribe.check(true);

  await ldf.blocks.submit_btn.click();

  // Verify state was updated
  await ldf.expectState('form_submitted', true);
});
```

### Available Methods

**Navigation & State (on `ldf`):**
```javascript
await ldf.goto('/path');                    // Navigate and wait for Lowdefy ready
await ldf.expectState('key', 'value');      // Assert state value
await ldf.expectState('nested.key', true);  // Supports dot notation
const state = await ldf.getState();         // Get full page state
const value = await ldf.getBlockState('my_input');  // Get single block's state
const block = ldf.block('my_block');        // Get Playwright locator for block
```

**Button (`ldf.blocks.{buttonId}`):**
```javascript
await ldf.blocks.submit_btn.click();
await ldf.blocks.submit_btn.isVisible();
await ldf.blocks.submit_btn.isDisabled();
await ldf.blocks.submit_btn.isLoading();
await ldf.blocks.submit_btn.hasText('Submit');
await ldf.blocks.submit_btn.hasType('primary');
```

**TextInput (`ldf.blocks.{inputId}`):**
```javascript
await ldf.blocks.title.fill('Bug report');
await ldf.blocks.title.clear();
await ldf.blocks.title.pressEnter();
await ldf.blocks.title.isVisible();
await ldf.blocks.title.hasValue('Bug report');
await ldf.blocks.title.isDisabled();
await ldf.blocks.title.hasPlaceholder('Enter title...');
```

**Selector (`ldf.blocks.{selectorId}`):**
```javascript
await ldf.blocks.priority.select('High');
await ldf.blocks.priority.clear();
await ldf.blocks.priority.search('Med');
await ldf.blocks.priority.isVisible();
await ldf.blocks.priority.hasValue('High');
await ldf.blocks.priority.isDisabled();
await ldf.blocks.priority.hasPlaceholder('Select...');
```

## Complete Example

```javascript
import { test, expect } from '@lowdefy/e2e-utils/fixtures';

test('create ticket workflow', async ({ page, ldf }) => {
  // Navigate to form
  await ldf.goto('/tickets/new');

  // Fill form using polymorphic API
  await ldf.blocks.title_input.fill('Bug report');
  await ldf.blocks.description_input.fill('Login button not working');
  await ldf.blocks.priority_selector.select('High');
  await ldf.blocks.assignee_selector.select('John Doe');

  // Submit
  await ldf.blocks.submit_btn.click();

  // Verify navigation and state
  await expect(page).toHaveURL(/\/tickets\/\d+/);
  await ldf.expectState('ticket.status', 'open');
});
```

## Playwright Config

```javascript
// e2e/playwright.config.js
import { createConfig } from '@lowdefy/e2e-utils/config';

export default createConfig({
  appDir: './',           // Where lowdefy.yaml is (default: './')
  port: 3000,             // Server port (default: 3000)
  testDir: 'e2e',         // Test directory (default: 'e2e')
  testMatch: '**/*.spec.js',
  timeout: 180000,        // WebServer timeout in ms (default: 180000)
});
```

---

# Technical Architecture

## Package Structure

```
e2e-utils/src/
├── config.js              # Playwright config generator
├── index.js               # Direct exports (basic helpers)
├── globalSetup.js         # Runs before all tests
│
├── fixtures/              # Playwright fixtures
│   └── index.js           # Creates the `ldf` fixture
│
├── core/                  # Basic helper functions
│   ├── locators.js        # getBlock()
│   ├── navigation.js      # goto(), waitForReady()
│   ├── state.js           # getState(), expectState()
│   └── requests.js        # waitForRequest()
│
├── proxy/                 # Polymorphic block API
│   ├── createPageManager.js    # The `ldf` object
│   ├── createBlockProxy.js     # ldf.blocks['id'] routing
│   └── createHelperRegistry.js # Loads block helpers dynamically
│
├── testPrep/              # Build manifest generation
│   ├── generateManifest.js     # Creates e2e-manifest.json
│   └── extractBlockMap.js      # Parses page configs
│
└── init/                  # CLI scaffolding
    └── index.js           # `npx lowdefy-e2e init`
```

## Execution Flow

When you run `pnpm e2e`:

```
1. PLAYWRIGHT LOADS CONFIG
   └── config.js sets up globalSetup and webServer

2. GLOBAL SETUP RUNS
   └── globalSetup.js generates e2e-manifest.json from build artifacts

3. WEB SERVER STARTS
   └── Runs: NEXT_PUBLIC_LOWDEFY_E2E=true lowdefy build && lowdefy start
   └── Waits for http://localhost:3000 to respond

4. TESTS RUN
   └── Each test file executes
   └── Fixtures inject `ldf` into tests

5. WEB SERVER STOPS
```

## How Fixtures Work

Playwright fixtures are dependency-injected test helpers. We extend Playwright's base `test`:

```javascript
// fixtures/index.js
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Worker-scoped (shared across tests)
  helperRegistry: [async ({}, use) => { ... }, { scope: 'worker' }],
  manifest: [async ({}, use) => { ... }, { scope: 'worker' }],

  // Test-scoped (created fresh for each test)
  ldf: async ({ page, manifest, helperRegistry }, use) => {
    const pageManager = createPageManager({ page, manifest, helperRegistry });
    await use(pageManager);  // ← This is injected into tests
  },
});
```

When you write:
```javascript
test('my test', async ({ ldf }) => { ... });
```

Playwright:
1. Creates `page` (built-in fixture)
2. Creates `manifest` (our fixture - loads e2e-manifest.json)
3. Creates `helperRegistry` (our fixture - caches block helpers)
4. Passes all three to create `ldf` (pageManager)
5. Injects `ldf` into your test function

## The Manifest

The manifest maps block IDs to their types and helper paths:

```json
{
  "pages": {
    "contact": {
      "name_input": {
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

Generated from Lowdefy build artifacts:
- `types.json` - Maps block types to packages
- `pages/{pageId}/{pageId}.json` - Page configs with block definitions

## How `ldf.blocks.submit_btn.click()` Works

This uses JavaScript Proxy for dynamic routing:

```
ldf.blocks.submit_btn.click()
    │       │          │
    │       │          └── Method call
    │       └── Block ID lookup
    └── Blocks proxy

Step 1: ldf.blocks
        └── Returns createBlockProxy({ page, blockMap, helperRegistry })

Step 2: .submit_btn
        └── Proxy intercepts property access
        └── Looks up blockMap['submit_btn'] → { type: 'Button', helper: '...' }
        └── Returns another Proxy for method calls

Step 3: .click()
        └── Proxy intercepts method call
        └── helperRegistry.get('@lowdefy/blocks-antd/e2e/Button')
        └── Calls: buttonHelper.click(page, 'submit_btn')
```

## Block Helpers

Each block type has an `e2e.js` file co-located with the component:

```
blocks-antd/src/blocks/
├── Button/
│   ├── Button.js      # React component
│   ├── schema.json    # Properties schema
│   └── e2e.js         # E2E helper
├── TextInput/
│   └── e2e.js
└── Selector/
    └── e2e.js
```

Example helper (`Button/e2e.js`):

```javascript
import { expect } from '@playwright/test';

function locator(page, blockId) {
  return page.locator(`#bl-${blockId} .ant-btn`);
}

async function click(page, blockId) {
  await locator(page, blockId).click();
}

function isDisabled(page, blockId) {
  return expect(locator(page, blockId)).toBeDisabled();
}

export default { locator, click, isDisabled, /* ... */ };
```

Each method receives `(page, blockId, ...args)` - the proxy handles this automatically.

## Why `window.lowdefy`?

Tests need access to Lowdefy's internal state (for `expectState`, `getState`, etc.).

In dev mode, Lowdefy exposes `window.lowdefy`. For production builds (used by e2e tests), we set `NEXT_PUBLIC_LOWDEFY_E2E=true` to enable this:

```javascript
// packages/client/src/initLowdefyContext.js
if (stage === 'dev' || process.env.NEXT_PUBLIC_LOWDEFY_E2E === 'true') {
  window.lowdefy = lowdefy;
}
```

This gives tests access to:
- `window.lowdefy.pageId` - Current page ID
- `window.lowdefy.contexts[pageId].state` - Page state
- `window.lowdefy.contexts[pageId].requests` - Request status

## Adding New Block Helpers

To add e2e support for a new block type:

1. Create `e2e.js` next to the block component:
   ```
   blocks-antd/src/blocks/DateSelector/e2e.js
   ```

2. Export methods that take `(page, blockId, ...args)`:
   ```javascript
   import { expect } from '@playwright/test';

   function locator(page, blockId) {
     return page.locator(`#bl-${blockId} .ant-picker`);
   }

   async function selectDate(page, blockId, date) {
     // Implementation...
   }

   export default { locator, selectDate };
   ```

3. Add subpath export in `package.json`:
   ```json
   "exports": {
     "./e2e/DateSelector": "./dist/blocks/DateSelector/e2e.js"
   }
   ```

The manifest generator will automatically pick it up for pages using that block type.
