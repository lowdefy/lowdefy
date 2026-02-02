# @lowdefy/e2e-utils

Playwright testing utilities for Lowdefy applications.

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

Then run tests:

```bash
pnpm e2e        # Run tests
pnpm e2e:ui     # Run with Playwright UI
```

## Core Helpers

Framework-level testing utilities:

```javascript
import { ldf } from '@lowdefy/e2e-utils';

// Navigation
await ldf.goto(page, '/dashboard');
await ldf.waitForReady(page);
await ldf.expectNavigation(page, /\/tickets\/\d+/);
await ldf.waitForPage(page, '/settings');

// Requests
await ldf.waitForRequest(page, 'create_ticket');
const response = await ldf.getRequestResponse(page, 'get_users');

// State
const state = await ldf.getState(page);
const blockState = await ldf.getBlockState(page, 'my_input');
await ldf.expectState(page, 'form.title', 'Bug report');

// Block locator
const block = ldf.block(page, 'my_block');
await expect(block).toBeVisible();
```

## Block Helpers

Block-specific interactions (requires `@lowdefy/blocks-antd`):

```javascript
import { button, selector, textInput } from '@lowdefy/e2e-utils';

// Button
await button.click(page, 'submit_btn');
await button.assertions.isVisible(page, 'submit_btn');
await button.assertions.isDisabled(page, 'submit_btn');
await button.assertions.isLoading(page, 'submit_btn');
await button.assertions.hasText(page, 'submit_btn', 'Submit');
await button.assertions.hasType(page, 'submit_btn', 'primary');

// Selector
await selector.select(page, 'priority', 'High');
await selector.clear(page, 'priority');
await selector.search(page, 'priority', 'Med');
await selector.assertions.isVisible(page, 'priority');
await selector.assertions.hasValue(page, 'priority', 'High');
await selector.assertions.isDisabled(page, 'priority');
await selector.assertions.hasPlaceholder(page, 'priority', 'Select...');

// TextInput
await textInput.fill(page, 'title', 'Bug report');
await textInput.clear(page, 'title');
await textInput.pressEnter(page, 'title');
await textInput.assertions.isVisible(page, 'title');
await textInput.assertions.hasValue(page, 'title', 'Bug report');
await textInput.assertions.isDisabled(page, 'title');
await textInput.assertions.hasPlaceholder(page, 'title', 'Enter title...');
```

## Complete Example

```javascript
import { test, expect } from '@playwright/test';
import { ldf, button, textInput, selector } from '@lowdefy/e2e-utils';

test('create ticket workflow', async ({ page }) => {
  // Navigate
  await ldf.goto(page, '/tickets/new');

  // Fill form (block helpers)
  await textInput.fill(page, 'title', 'Bug report');
  await textInput.fill(page, 'description', 'Login not working');
  await selector.select(page, 'priority', 'High');

  // Submit and verify (framework helpers)
  await button.click(page, 'submit_btn');
  await ldf.waitForRequest(page, 'create_ticket');
  await ldf.expectNavigation(page, /\/tickets\/\d+/);
  await ldf.expectState(page, 'ticket.status', 'open');
});
```

## Playwright Config

Use `createConfig` for a pre-configured Playwright setup:

```javascript
// e2e/playwright.config.js
import { createConfig } from '@lowdefy/e2e-utils/config';

export default createConfig({
  appDir: './',      // Where lowdefy.yaml is
  port: 3000,        // Dev server port
  testDir: 'e2e',    // Test directory
  testMatch: '**/*.spec.js',
});
```

## How It Works

These utilities access the Lowdefy client state via `window.lowdefy`, which is exposed in dev mode. This allows:

- Waiting for the Lowdefy client to initialize
- Checking request completion status
- Accessing page state
- Stable block selection via `#bl-{blockId}` IDs

**Note:** Tests must run against the Lowdefy dev server (`npx lowdefy dev`).

## LLM Test Generation

These helpers are designed to be LLM-friendly. An LLM can read your `lowdefy.yaml` config and generate stable tests:

```yaml
# lowdefy.yaml
blocks:
  - id: title_input
    type: TextInput
  - id: priority
    type: Selector
  - id: submit_btn
    type: Button
```

LLM generates:
```javascript
await textInput.fill(page, 'title_input', 'Bug report');
await selector.select(page, 'priority', 'High');
await button.click(page, 'submit_btn');
```

Block IDs from config → stable, readable tests.
