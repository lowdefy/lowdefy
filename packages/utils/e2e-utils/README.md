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

test('homepage loads', async ({ ldf }) => {
  await ldf.goto('/');
  await expect(ldf.page).toHaveTitle(/My App/);
});
```

### Block Interactions (`ldf.block('id').do.*`)

Interact with blocks using Playwright-style action verbs:

```javascript
test('submit form', async ({ ldf }) => {
  await ldf.goto('/contact');

  // Text inputs use .fill()
  await ldf.block('name_input').do.fill('John Doe');
  await ldf.block('email_input').do.fill('john@example.com');

  // Selectors use .select()
  await ldf.block('category').do.select('Support');

  // Buttons use .click()
  await ldf.block('submit_btn').do.click();

  // Clear an input
  await ldf.block('name_input').do.clear();
});
```

### Block Assertions (`ldf.block('id').expect.*`)

Common assertions like `visible`, `hidden`, `disabled`, `enabled` are auto-provided for every block. Validation assertions work automatically too:

```javascript
test('validates required fields', async ({ ldf }) => {
  await ldf.goto('/contact');

  await ldf.block('submit_btn').do.click();

  // Common assertions - available on every block
  await ldf.block('name_input').expect.visible();
  await ldf.block('submit_btn').expect.disabled();

  // Validation - available on every block
  await ldf.block('name_input').expect.validationError();
  await ldf.block('email_input').expect.validationError({ message: 'Email is required' });

  // Block-specific assertions
  await ldf.block('name_input').expect.value('');
  await ldf.block('submit_btn').expect.loading();
});
```

### State (`ldf.state()`)

```javascript
// Assert state values
await ldf.state('submitted').expect.toBe(true);
await ldf.state('form.email').expect.toBe('john@example.com');

// Set state directly (useful for test setup)
await ldf.state('form.mode').do.set('edit');

// Get raw state value
const email = await ldf.state('form.email').value();
const fullState = await ldf.state().value();
```

### URL (`ldf.url()` / `ldf.urlQuery()`)

```javascript
// Assert URL
await ldf.url().expect.toBe('/thank-you');
await ldf.url().expect.toMatch(/\/tickets\/\d+/);

// Query params
await ldf.urlQuery('filter').expect.toBe('active');
await ldf.urlQuery('page').do.set('2');

// Get raw values
const currentUrl = ldf.url().value();
const filterValue = ldf.urlQuery('filter').value();
```

### Requests (`ldf.request()`)

```javascript
// Wait for request to finish
await ldf.request('send_message').expect.toFinish();

// Assert response
await ldf.request('fetch_users').expect.toHaveResponse([{ id: 1 }]);

// Assert payload sent to request
await ldf.request('search').expect.toHavePayload({ query: 'widget' });

// Get raw response
const response = await ldf.request('fetch_users').response();
```

### Mocking Requests

```javascript
// Mock for this test only (defaults to current page)
await ldf.mock.request('search_products', { response: [{ id: 1 }] });

// Mock with error
await ldf.mock.request('fetch_data', { error: 'Service unavailable' });

// Mock specific page's request
await ldf.mock.request('fetch_data', { pageId: 'admin-dashboard', response: [] });

// Mock API endpoints
await ldf.mock.api('external_api', { response: { status: 'ok' }, method: 'POST' });
```

### Raw Playwright Access

```javascript
// Raw Playwright page for custom assertions
await expect(ldf.page).toHaveTitle(/My App/);

// Raw block locator for custom assertions
const locator = ldf.block('submit_btn').locator();
await expect(locator).toHaveAttribute('data-loading', 'true');

// Block state and validation
const blockState = await ldf.block('name_input').state();
const validation = await ldf.block('email_input').validation();
```

## Complete Example

```javascript
import { test, expect } from '@lowdefy/e2e-utils/fixtures';

test('create ticket workflow', async ({ ldf }) => {
  await ldf.goto('/tickets/new');

  // Fill form
  await ldf.block('title_input').do.fill('Bug report');
  await ldf.block('description_input').do.fill('Login button not working');
  await ldf.block('priority_selector').do.select('High');

  // Submit
  await ldf.block('submit_btn').do.click();

  // Verify
  await ldf.request('create_ticket').expect.toFinish();
  await ldf.url().expect.toMatch(/\/tickets\/\d+/);
  await ldf.state('ticket.status').expect.toBe('open');
});
```

## Static Mocks (mocks.yaml)

Define mocks that apply to all tests:

```yaml
# e2e/mocks.yaml
requests:
  # Mock Atlas Search (can't run in tests)
  - requestId: atlas_search
    response:
      - _id: doc-1
        title: Search Result

  # Mock with pageId and wildcards
  - requestId: fetch_*
    pageId: admin-*
    response: []

api:
  - endpointId: external_api
    method: POST
    response:
      status: ok
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

## Adding E2E Support to a Block

Use `createBlockHelper` to define a block's e2e helper. Common methods (visible, hidden, disabled, enabled, validation) are auto-provided from the locator:

```javascript
// blocks-antd/src/blocks/MyBlock/e2e.js
import { createBlockHelper } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#${blockId}_input`);

export default createBlockHelper({
  locator,
  do: {
    fill: (page, blockId, val) => locator(page, blockId).fill(val),
    clear: (page, blockId) => locator(page, blockId).clear(),
  },
  expect: {
    // Override defaults if needed (e.g., Selector uses CSS class for disabled)
    // disabled: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/my-disabled/),
    value: (page, blockId, val) => expect(locator(page, blockId)).toHaveValue(val),
  },
});
```

Add the subpath export in `package.json`:
```json
"exports": {
  "./e2e/MyBlock": "./dist/blocks/MyBlock/e2e.js"
}
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical details.
