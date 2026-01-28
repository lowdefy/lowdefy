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

test.describe('MyBlock', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'myblock');
  });

  test('renders block', async ({ page }) => {
    const block = getBlock(page, 'myblock_basic');
    await expect(block).toBeAttached();
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

Returns a Playwright locator for a block by its `id` attribute.

```javascript
const box = getBlock(page, 'box_basic');
await expect(box).toBeVisible();
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
