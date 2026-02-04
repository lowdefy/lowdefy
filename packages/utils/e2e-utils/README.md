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

### Block Interactions (`ldf.do.blocks`)

Interact with blocks using Playwright-style action verbs:

```javascript
test('submit form', async ({ ldf }) => {
  await ldf.goto('/contact');

  // Text inputs use .fill()
  await ldf.do.blocks['name_input'].fill('John Doe');
  await ldf.do.blocks['email_input'].fill('john@example.com');

  // Selectors use .select()
  await ldf.do.blocks['category'].select('Support');

  // Buttons use .click()
  await ldf.do.blocks['submit_btn'].click();

  // Clear an input
  await ldf.do.blocks['name_input'].clear();
});
```

### Block Assertions (`ldf.expect.blocks`)

Common assertions like `visible`, `hidden`, `disabled`, `enabled` are auto-provided for every block. Validation assertions work automatically too:

```javascript
test('validates required fields', async ({ ldf }) => {
  await ldf.goto('/contact');

  await ldf.do.blocks['submit_btn'].click();

  // Common assertions - available on every block
  await ldf.expect.blocks['name_input'].visible();
  await ldf.expect.blocks['submit_btn'].disabled();

  // Validation - available on every block
  await ldf.expect.blocks['name_input'].validationError();
  await ldf.expect.blocks['email_input'].validationError({ message: 'Email is required' });

  // Block-specific assertions
  await ldf.expect.blocks['name_input'].value('');
  await ldf.expect.blocks['submit_btn'].loading();
});
```

### Page-Level Assertions (`ldf.expect`)

```javascript
// State
await ldf.expect.state({ key: 'submitted', value: true });
await ldf.expect.state({ key: 'form.email', value: 'john@example.com' });

// URL
await ldf.expect.url({ path: '/thank-you' });
await ldf.expect.url({ pattern: /\/tickets\/\d+/ });
await ldf.expect.urlQuery({ key: 'filter', value: 'active' });

// Requests
await ldf.expect.request({ requestId: 'send_message', loading: false });
await ldf.expect.request({ requestId: 'send_message', response: { success: true } });
```

### Mutations (`ldf.do`)

```javascript
// Set state directly (useful for test setup)
await ldf.do.state({ key: 'form.mode', value: 'edit' });

// Set URL query params
await ldf.do.urlQuery({ key: 'filter', value: 'active' });
```

### Read Operations (`ldf.get`)

```javascript
const state = await ldf.get.state();
const blockState = await ldf.get.blockState({ blockId: 'name_input' });
const validation = await ldf.get.validation({ blockId: 'email_input' });
const response = await ldf.get.requestResponse({ requestId: 'fetch_users' });
```

## Complete Example

```javascript
import { test, expect } from '@lowdefy/e2e-utils/fixtures';

test('create ticket workflow', async ({ page, ldf }) => {
  await ldf.goto('/tickets/new');

  // Fill form
  await ldf.do.blocks['title_input'].fill('Bug report');
  await ldf.do.blocks['description_input'].fill('Login button not working');
  await ldf.do.blocks['priority_selector'].select('High');

  // Submit
  await ldf.do.blocks['submit_btn'].click();

  // Verify
  await ldf.expect.request({ requestId: 'create_ticket', loading: false });
  await ldf.expect.url({ pattern: /\/tickets\/\d+/ });
  await ldf.expect.state({ key: 'ticket.status', value: 'open' });
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
