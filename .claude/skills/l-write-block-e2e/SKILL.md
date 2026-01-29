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
/l-write-block-e2e blocks-antd TextInput
```

## Prerequisites

Before generating tests, ensure the block package has e2e infrastructure:

1. **e2e/playwright.config.js** - Playwright configuration
2. **e2e/app/lowdefy.yaml** - Test app configuration
3. **package.json** - Has `e2e` and `e2e:ui` scripts
4. **@lowdefy/block-dev-e2e** - Dev dependency installed

If missing, set up the infrastructure first (see Package Setup section).

## Instructions

### Step 1: Analyze the Block

Read these files to understand the block:

1. **Block component** (`src/blocks/{BlockName}/{BlockName}.js`)
   - Check ID pattern: `id={blockId}` (display) vs `id={\`${blockId}_input\`}` (input)
   - Does it use Label wrapper? (input blocks do)
   - What events does it support?

2. **Schema** (`src/blocks/{BlockName}/schema.json`)
   - All available properties with types and defaults
   - All available events

### Step 2: Identify Block Type

**Display Blocks** (Button, Title, Alert, Badge, etc.):
- Have `id={blockId}` on main element
- Use `getBlock(page, blockId)` directly

**Input Blocks with Label** (TextInput, Selector, NumberInput, etc.):
- Wrapped in Label component which has `id={blockId}`
- Actual input has `id={\`${blockId}_input\`}`
- Need helper: `const getInput = (page, blockId) => page.locator(\`#${blockId}_input\`);`

**Select/Dropdown Blocks** (Selector, MultipleSelector, etc.):
- Use Ant Design Select internally
- The `.ant-select` wrapper is created by Ant Design (we can't add test IDs to it)
- Need helper: `const getSelector = (page, blockId) => page.locator(\`.ant-select:has(#${blockId}_input)\`);`
- Options have IDs: `${blockId}_0`, `${blockId}_1`, etc.

### Step 3: Create Test Fixtures

Create `src/blocks/{BlockName}/tests/{BlockName}.e2e.yaml`:

```yaml
# Copyright 2020-2024 Lowdefy, Inc
# ... license header ...

id: blockname  # Page ID - lowercase, used in URL
type: Box

events:
  onInit:
    - id: set_defaults
      type: SetState
      params:
        blockname_with_value: Initial Value
        blockname_clearable: Clear me

blocks:
  # ============================================
  # BASIC RENDERING
  # ============================================

  - id: blockname_basic
    type: BlockName
    properties:
      title: Basic Title

  - id: blockname_with_value
    type: BlockName
    properties:
      title: With Value

  # ============================================
  # PROPERTY TESTS
  # ============================================

  - id: blockname_disabled
    type: BlockName
    properties:
      disabled: true

  - id: blockname_small
    type: BlockName
    properties:
      size: small

  # ============================================
  # EVENT TESTS
  # ============================================

  # For value-based events (onChange with value)
  - id: blockname_onchange
    type: BlockName
    events:
      onChange:
        - id: set_onchange
          type: SetState
          params:
            blockname_onchange_value:
              _event: value

  - id: onchange_display
    type: Span
    properties:
      content:
        _if:
          test:
            _ne:
              - _state: blockname_onchange_value
              - null
          then:
            _string.concat:
              - 'Value: '
              - _state: blockname_onchange_value
          else: ''

  # For boolean events (onBlur, onFocus, etc.)
  - id: blockname_onblur
    type: BlockName
    events:
      onBlur:
        - id: set_onblur
          type: SetState
          params:
            blockname_onblur_fired: true

  - id: onblur_display
    type: Span
    properties:
      content:
        _if:
          test:
            _eq:
              - _state: blockname_onblur_fired
              - true
          then: Blur fired
          else: ''

  # ============================================
  # INTERACTION TESTS
  # ============================================

  - id: blockname_clearable
    type: BlockName
    properties:
      allowClear: true
```

**Block ID Naming Convention:**
- `{blockname}_basic` - Basic rendering
- `{blockname}_{property}` - Property-specific (e.g., `textinput_disabled`)
- `{blockname}_on{event}` - Event tests (e.g., `textinput_onblur`)
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

// For input blocks with Label wrapper:
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// For Selector-type blocks (class selector needed - Ant Design controls the wrapper):
// const getSelector = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);
// const getOption = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

test.describe('BlockName Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'blockname');  // matches yaml id
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'blockname_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic Title');
  });

  test('renders with initial value', async ({ page }) => {
    const input = getInput(page, 'blockname_with_value');
    await expect(input).toHaveValue('Initial Value');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'blockname_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const input = getInput(page, 'blockname_small');
    await expect(input).toHaveClass(/ant-input-sm/);
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when value changes', async ({ page }) => {
    const input = getInput(page, 'blockname_onchange');
    await input.fill('New Value');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: New Value');
  });

  test('onBlur event fires when input loses focus', async ({ page }) => {
    const input = getInput(page, 'blockname_onblur');
    await input.focus();
    await input.blur();

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can clear value with clear button', async ({ page }) => {
    const block = getBlock(page, 'blockname_clearable');
    const input = getInput(page, 'blockname_clearable');

    await expect(input).toHaveValue('Clear me');
    await block.hover();
    const clearBtn = block.locator('.ant-input-clear-icon');
    await clearBtn.click();
    await expect(input).toHaveValue('');
  });
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

## Selector Strategy

### Framework Wrapper ID Pattern

All Lowdefy blocks are wrapped by `BlockLayout` which renders `id="bl-{blockId}"`. This wrapper ID is **framework-guaranteed** and always exists, making it the most reliable selector for targeting blocks.

- `getBlock(page, blockId)` uses `#bl-{blockId}` (framework wrapper)
- Input elements use `#${blockId}_input` (component-rendered)
- Options use `#${blockId}_0`, `#${blockId}_1`, etc. (component-rendered)

### Selector Priority (Most to Least Preferred)

| Priority | Selector Type | When to Use | Example |
|----------|---------------|-------------|---------|
| 1 | Framework wrapper | Block container | `getBlock()` → `#bl-{blockId}` |
| 2 | Input ID | Form inputs | `#${blockId}_input` |
| 3 | Role-based | Buttons with accessible names | `getByRole('button', { name: 'Copy' })` |
| 4 | Class + ID | Ant Design internals | `.ant-select:has(#${blockId}_input)` |
| 5 | Class only | **Last resort** - style assertions | `.ant-input-sm` |

### Role-Based Selectors (Preferred for Ant Design Buttons)

Use Playwright's role-based selectors for Ant Design action buttons:

```javascript
// Copy button - single element, works directly
const copyBtn = block.getByRole('button', { name: 'Copy' });

// Edit button - Ant Design has nested elements, use .first()
const editBtn = block.getByRole('button', { name: 'Edit' }).first();
```

**Why role-based is better:**
- Uses semantic meaning (what the button does) not implementation (class names)
- Less fragile than class selectors like `.ant-typography-copy`
- Ant Design won't change accessible names without it being a breaking change

### About Class Selectors

We use `.ant-select:has(#${blockId}_input)` for Selector blocks because:
- The `.ant-select` wrapper is created internally by Ant Design
- We cannot add `data-testid` to it (we don't control that element)
- We scope it with the ID we DO control to ensure uniqueness
- This is standard practice for testing Ant Design components

**When class selectors are still needed:**
- Style assertions: `await expect(input).toHaveClass(/ant-input-sm/);`
- Elements without accessible names (wrapper divs, icons)
- The `.ant-typography-edit-content` wrapper for Typography edit mode

## Ant Design Class Patterns

### Size Classes
| Component | Small | Large |
|-----------|-------|-------|
| Input/TextArea | `ant-input-sm` | `ant-input-lg` |
| Button | `ant-btn-sm` | `ant-btn-lg` |
| Select | `ant-select-sm` | `ant-select-lg` |
| NumberInput wrapper | `ant-input-number-sm` | `ant-input-number-lg` |
| DatePicker | `ant-picker-small` | `ant-picker-large` |

### Style Classes
| Style | Class Pattern |
|-------|---------------|
| Borderless | `ant-input-borderless`, `ant-select-borderless` |
| Disabled Select | `ant-select-disabled` |
| Loading Button | `ant-btn-loading` |
| Primary Button | `ant-btn-primary` |
| Danger Button | `ant-btn-dangerous` |

### Typography Classes
| Type | Class |
|------|-------|
| Secondary | `ant-typography-secondary` |
| Warning | `ant-typography-warning` |
| Danger | `ant-typography-danger` |
| Success | `ant-typography-success` |
| Disabled | `ant-typography-disabled` |

## Common Test Patterns

### Testing Clear Button (requires hover)
```javascript
test('can clear value', async ({ page }) => {
  const block = getBlock(page, 'blockname_clearable');
  const input = getInput(page, 'blockname_clearable');

  await expect(input).toHaveValue('Clear me');
  await block.hover();
  const clearBtn = block.locator('.ant-input-clear-icon');
  await clearBtn.click();
  await expect(input).toHaveValue('');
});
```

### Testing NumberInput Controls
```javascript
test('can increment with controls', async ({ page }) => {
  const block = getBlock(page, 'numberinput_controls');
  const input = getInput(page, 'numberinput_controls');

  await expect(input).toHaveValue('10');
  await block.hover();
  const upHandler = block.locator('.ant-input-number-handler-up');
  await upHandler.click();
  await expect(input).toHaveValue('11');
});
```

### Testing Select Dropdown
```javascript
test('can select option', async ({ page }) => {
  const selector = getSelector(page, 'selector_basic');
  await selector.click();

  const option = getOption(page, 'selector_basic', 1);
  await option.click();

  const selected = selector.locator('.ant-select-selection-item');
  await expect(selected).toHaveText('Option 2');
});
```

### Testing Password Visibility Toggle
```javascript
test('can toggle password visibility', async ({ page }) => {
  const block = getBlock(page, 'passwordinput_visibility');
  const input = getInput(page, 'passwordinput_visibility');

  await expect(input).toHaveAttribute('type', 'password');
  const toggle = block.locator('.ant-input-password-icon');
  await toggle.click();
  await expect(input).toHaveAttribute('type', 'text');
});
```

## Known Patterns

### Typography Editable (TitleInput, ParagraphInput)
The editable typography components replace the element with an edit wrapper when clicking the edit button:

```javascript
test('can edit title and onChange fires', async ({ page }) => {
  const block = getBlock(page, 'titleinput_onchange');

  // Click the edit button - use role-based selector with .first()
  // (Ant Design has nested button elements)
  const editBtn = block.getByRole('button', { name: 'Edit' }).first();
  await editBtn.click();

  // After clicking, the element is replaced with an editable wrapper
  // Use page.locator to find the textarea (not block.locator)
  const textarea = page.locator('.ant-typography-edit-content textarea');
  await expect(textarea).toBeVisible();
  await textarea.fill('New Title Value');

  // Press Enter to confirm
  await textarea.press('Enter');

  // Verify the onChange event fired
  const display = getBlock(page, 'onchange_display');
  await expect(display).toHaveText('Value: New Title Value');
});

test('onCopy event fires when copy button is clicked', async ({ page }) => {
  const block = getBlock(page, 'titleinput_oncopy');

  // Copy button - role-based selector works directly (single element)
  const copyBtn = block.getByRole('button', { name: 'Copy' });
  await copyBtn.click();

  const display = getBlock(page, 'oncopy_display');
  await expect(display).toHaveText('Copy fired');
});
```

**Key insights:**
- When Typography enters edit mode, the heading/paragraph is replaced with a `div.ant-typography-edit-content` containing a textarea
- Use `page.locator('.ant-typography-edit-content textarea')` instead of `block.locator('textarea')`
- For `onCopy` to fire, `copyable` must be an object (e.g., `copyable: { text: 'Copy text' }`), not just `true`

### TextArea maxLength
TextArea enforces maxLength at component level, not via HTML attribute. Test by filling more characters and checking result:
```javascript
await textarea.fill('a'.repeat(150));
const value = await textarea.inputValue();
expect(value.length).toBeLessThanOrEqual(100);
```

### DatePicker Blocks (DateSelector, DateTimeSelector, etc.)
Date picker blocks use Ant Design's DatePicker which has specific patterns:

```javascript
// Helper to get the picker wrapper (use framework wrapper ID)
const getPicker = (page, blockId) => page.locator(`#bl-${blockId} .ant-picker`);

// Helper to get the input
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

test('can select a date', async ({ page }) => {
  const input = getInput(page, 'ds_basic');
  await input.click();

  // Wait for dropdown
  const dropdown = page.locator('.ant-picker-dropdown:visible');
  await expect(dropdown).toBeVisible();

  // Use .ant-picker-cell-in-view for reliable date cell targeting
  // (more reliable than .ant-picker-cell-today which may not be visible)
  const dateCell = page.locator('.ant-picker-cell-in-view').first();
  await dateCell.click();

  await expect(input).toHaveValue(/\d{4}-\d{2}-\d{2}/);
});

test('can clear value', async ({ page }) => {
  const picker = getPicker(page, 'ds_clearable');
  const input = getInput(page, 'ds_clearable');

  // First select a date
  await input.click();
  await page.locator('.ant-picker-cell-in-view').first().click();

  // Hover to reveal clear button
  await picker.hover();
  await picker.locator('.ant-picker-clear').click();
  await expect(input).toHaveValue('');
});
```

**Key insights:**
- DatePicker size classes are `ant-picker-small/large` (not `sm/lg`)
- Use `.ant-picker-cell-in-view` for reliable date cell selection
- RangePicker: start input has ID, end input needs `.ant-picker-input:last-child input`

## Package Setup (First-Time Only)

### 1. Create e2e/playwright.config.js

```javascript
/*
  Copyright 2020-2024 Lowdefy, Inc
  ... license header ...
*/

import path from 'path';
import { fileURLToPath } from 'url';
import { createPlaywrightConfig } from '@lowdefy/block-dev-e2e';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default createPlaywrightConfig({
  packageDir,
  port: 3002,  // See port assignments below
});
```

### 2. Create e2e/app/lowdefy.yaml

```yaml
# Copyright 2020-2024 Lowdefy, Inc
# ... license header ...

lowdefy: local
name: {package-name} E2E Tests

pages:
  - _ref: ../../src/blocks/{BlockName}/tests/{BlockName}.e2e.yaml
```

### 3. Update package.json

```json
"devDependencies": {
  "@lowdefy/block-dev-e2e": "4.5.2",
  "@playwright/test": "1.50.1"
}
```

```json
"scripts": {
  "e2e": "playwright test --config e2e/playwright.config.js",
  "e2e:ui": "playwright test --config e2e/playwright.config.js --ui"
}
```

## Shared Utilities

The `@lowdefy/block-dev-e2e` package provides:

- `createPlaywrightConfig({ packageDir, port })` - Creates Playwright config
- `getBlock(page, blockId)` - Gets element by `#bl-{blockId}` (framework wrapper ID)
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
