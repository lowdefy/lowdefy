---
name: l-write-block-e2e
description: Generate comprehensive e2e tests for Lowdefy blocks using Playwright. Use when creating end-to-end tests for block functionality, testing block rendering, properties, events, and user interactions.
argument-hint: "<package-name> <BlockName>"
---

# E2E Test Generator for Lowdefy Blocks

Generate comprehensive end-to-end tests for Lowdefy block components using Playwright.

## Usage

```
/l-write-block-e2e blocks-antd Button
/l-write-block-e2e blocks-basic Span
/l-write-block-e2e blocks-antd Modal
```

## Prerequisites

Before generating tests, ensure the block package has e2e infrastructure:

1. **e2e/playwright.config.js** - Playwright configuration
2. **e2e/app/lowdefy.yaml** - Test app configuration
3. **package.json** - Has `e2e` and `e2e:ui` scripts
4. **@lowdefy/block-dev-e2e** - Dev dependency installed

If missing, set up the infrastructure first (see Setup section below).

## Instructions

### Step 1: Analyze the Block

Read these files to understand the block:

1. **Block component** (`src/blocks/{BlockName}/{BlockName}.js`)
   - What props does it accept?
   - Does it have `data-testid={blockId}`? (CRITICAL for testing)
   - What events does it support?
   - What child components does it use?

2. **Schema** (`src/blocks/{BlockName}/schema.json`)
   - All available properties with types and defaults
   - All available events

3. **Examples** (`src/blocks/{BlockName}/examples.yaml`) - if exists
   - Common usage patterns

### Step 2: Ensure data-testid Support

**CRITICAL**: The block MUST have `data-testid={blockId}` for reliable test selection.

Check the component renders with `data-testid`:
```javascript
// The block should have this attribute on its root element
id={blockId}
data-testid={blockId}
```

If `data-testid` is missing:
1. Add it to the block component
2. Rebuild the package: `pnpm build`
3. Document the change in the commit

### Step 3: Create Test Fixtures

Create `src/blocks/{BlockName}/tests/{BlockName}.e2e.yaml` with test scenarios:

```yaml
id: blockname  # Page ID - lowercase, used in URL
type: Box

blocks:
  # Basic rendering test
  - id: blockname_basic
    type: BlockName
    properties:
      title: Basic Title

  # Test each property from schema.json
  - id: blockname_property1
    type: BlockName
    properties:
      property1: value1

  # Test events with state updates for verification
  - id: blockname_clickable
    type: BlockName
    properties:
      title:
        _if:
          test:
            _eq:
              - _state: was_clicked
              - true
          then: Clicked!
          else: Click me
    events:
      onClick:
        - id: set_clicked
          type: SetState
          params:
            was_clicked: true
```

**Block ID Naming Convention:**
- `{blockname}_basic` - Basic rendering
- `{blockname}_{property}` - Property-specific tests
- `{blockname}_{event}` - Event tests
- Use lowercase, underscores

### Step 4: Create Test Spec

Create `src/blocks/{BlockName}/tests/{BlockName}.e2e.spec.js`:

```javascript
/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  ...
*/

import { test, expect } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

test.describe('BlockName Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'blockname');  // matches yaml id
  });

  test('renders with data-testid', async ({ page }) => {
    const block = getBlock(page, 'blockname_basic');
    await expect(block).toBeVisible();
  });

  // Add tests for each property and event...
});
```

### Step 5: Add Page Reference

Add the test page to `e2e/app/lowdefy.yaml`:

```yaml
pages:
  - _ref: ../../src/blocks/{BlockName}/tests/{BlockName}.e2e.yaml
```

### Step 6: Run and Validate

```bash
pnpm e2e  # Run all tests
pnpm e2e -- --grep "BlockName"  # Run specific block tests
```

Fix any failures before committing.

## Test Categories

### 1. Rendering Tests
Test that block renders correctly with different property combinations:
- Basic rendering with minimal props
- Each property from schema.json
- Combined properties

### 2. Event Tests
Test that events fire correctly:
- onClick, onChange, onBlur, etc.
- Use state updates to verify events fired
- Test loading states during async events

### 3. Attribute Tests
Test HTML attributes are set correctly:
- `disabled` attribute
- `href` attribute
- Custom classes via CSS assertions

### 4. Style/Class Tests
Test CSS classes for visual variants:
- Ant Design classes: `/ant-btn-primary/`, `/ant-btn-lg/`
- Custom style application

## Assertion Patterns

### Use `getBlock` for Element Selection
```javascript
const block = getBlock(page, 'block_id');
await expect(block).toBeVisible();
```

### Check CSS Classes (for variants)
```javascript
await expect(block).toHaveClass(/ant-btn-primary/);
await expect(block).toHaveClass(/ant-btn-loading/);
```

### Check Attributes
```javascript
await expect(block).toHaveAttribute('href', 'https://example.com');
await expect(block).toBeDisabled();
```

### Check CSS Properties
```javascript
await expect(block).toHaveCSS('background-color', 'rgb(82, 196, 26)');
await expect(block).toHaveCSS('cursor', 'not-allowed');
```

### Check Text Content
```javascript
await expect(block).toHaveText('Expected Text');
await expect(block).toContainText('Partial');
```

### Check Child Elements
```javascript
const svg = block.locator('svg');
await expect(svg).toBeAttached();
```

### Test Event State Changes
```javascript
await expect(block).toHaveText('Click me');
await block.click();
await expect(block).toHaveText('Clicked!');
```

## Package Setup (First-Time Only)

If the package doesn't have e2e infrastructure:

### 1. Create playwright.config.js

```javascript
/*
  Copyright 2020-2024 Lowdefy, Inc
  ...license header...
*/

import path from 'path';
import { fileURLToPath } from 'url';
import { createPlaywrightConfig } from '@lowdefy/block-dev-e2e';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default createPlaywrightConfig({
  packageDir,
  port: 3002,  // Use unique port per package (3001=blocks-basic, 3002=blocks-antd, etc.)
});
```

### 2. Create e2e/app/lowdefy.yaml

```yaml
# Copyright 2020-2024 Lowdefy, Inc
# ...license header...

lowdefy: local
name: {package-name} E2E Tests

pages:
  - _ref: ../../src/blocks/{BlockName}/tests/{BlockName}.e2e.yaml
```

### 3. Update package.json

Add dev dependencies:
```json
"devDependencies": {
  "@lowdefy/block-dev-e2e": "4.5.2",
  "@playwright/test": "1.50.1"
}
```

Add scripts:
```json
"scripts": {
  "e2e": "playwright test --config e2e/playwright.config.js",
  "e2e:ui": "playwright test --config e2e/playwright.config.js --ui"
}
```

### 4. Install Dependencies

```bash
pnpm install
```

## Shared Utilities

The `@lowdefy/block-dev-e2e` package provides:

- `createPlaywrightConfig({ packageDir, port })` - Creates Playwright config
- `getBlock(page, blockId)` - Gets element by `data-testid`
- `navigateToTestPage(page, pageId)` - Navigates to test page

## Port Assignments

| Package | Port |
|---------|------|
| blocks-basic | 3001 |
| blocks-antd | 3002 |
| blocks-aggrid | 3003 |
| blocks-markdown | 3004 |

## Commit Convention

```
test({package}): Add {BlockName} e2e tests

Add Playwright e2e tests for {BlockName} covering:
- {list key test scenarios}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
