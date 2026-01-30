# @lowdefy/block-dev-e2e

Shared Playwright utilities for e2e testing Lowdefy block packages.

## Installation

Add to your block package's devDependencies:

```json
{
  "devDependencies": {
    "@lowdefy/block-dev-e2e": "4.5.2",
    "@playwright/test": "1.50.1"
  }
}
```

## Setup

### 1. Create Playwright config

Create `e2e/playwright.config.js`:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import { createPlaywrightConfig } from '@lowdefy/block-dev-e2e';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default createPlaywrightConfig({
  packageDir,
  port: 3001, // Use unique port per block package
});
```

### 2. Create test app

Create `e2e/app/lowdefy.yaml`:

```yaml
lowdefy: local
name: my-blocks E2E Tests

pages:
  - _ref: ../../src/blocks/MyBlock/tests/MyBlock.e2e.yaml
```

### 3. Add test fixtures

Create `src/blocks/MyBlock/tests/MyBlock.e2e.yaml`:

```yaml
id: myblock
type: Box

blocks:
  - id: myblock_basic
    type: MyBlock
    properties:
      title: Test Title
```

### 4. Add e2e tests

Create `src/blocks/MyBlock/tests/MyBlock.e2e.spec.js`:

```javascript
import { test, expect } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

// Helper: get framework wrapper, then locate Ant component inside
const getButton = (page, blockId) => getBlock(page, blockId).locator('.ant-btn');

test.describe('MyBlock', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'myblock');
  });

  test('renders block', async ({ page }) => {
    const block = getBlock(page, 'myblock_basic');
    await expect(block).toBeVisible();

    const button = getButton(page, 'myblock_basic');
    await expect(button).toHaveText('Test Title');
  });
});
```

### 5. Add scripts to package.json

```json
{
  "scripts": {
    "e2e": "playwright test --config e2e/playwright.config.js",
    "e2e:ui": "playwright test --config e2e/playwright.config.js --ui"
  }
}
```

## API

### createPlaywrightConfig({ packageDir, port, testMatch })

Creates a Playwright config for a block package.

- `packageDir` - Absolute path to the block package root
- `port` - Dev server port (default: 3001)
- `testMatch` - Glob pattern for test files (default: `**/tests/*.e2e.spec.js`)

### getBlock(page, blockId)

Returns a Playwright locator for a block's framework wrapper element (`#bl-{blockId}`). This wrapper is guaranteed to exist for all block types.

**Two-step pattern for targeting Ant Design components:**
```javascript
// 1. Get the framework wrapper
const block = getBlock(page, 'button_basic');
await expect(block).toBeVisible();

// 2. Locate the Ant Design component inside the wrapper
const button = block.locator('.ant-btn');
await expect(button).toHaveText('Click Me');
```

**Common helper patterns:**
```javascript
// Display blocks (Button, Alert, Badge, etc.)
const getButton = (page, blockId) => getBlock(page, blockId).locator('.ant-btn');

// Input blocks - use the input's specific ID
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Selector blocks - scope with input ID
const getSelector = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);
```

### navigateToTestPage(page, pageId)

Navigates to a test page.

```javascript
await navigateToTestPage(page, 'box'); // Goes to /box
```

## Running Tests

```bash
pnpm e2e              # Run all e2e tests
pnpm e2e:ui           # Run with Playwright UI
pnpm e2e --headed     # Run with visible browser
pnpm e2e --debug      # Debug mode
```

## Port Assignments

Use unique ports to allow parallel test runs:

| Package | Port |
|---------|------|
| blocks-basic | 3001 |
| blocks-antd | 3002 |
| blocks-aggrid | 3003 |
| blocks-markdown | 3004 |
