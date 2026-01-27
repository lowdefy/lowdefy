# End-to-End Tests for blocks-basic

This directory contains Playwright e2e tests for the `@lowdefy/blocks-basic` package. Tests run against a real Lowdefy dev server, validating blocks in their production environment.

## Setup

1. Ensure the monorepo is built:
   ```bash
   pnpm build:turbo
   ```

2. Install Playwright browsers (first time only):
   ```bash
   cd packages/plugins/blocks/blocks-basic
   pnpm exec playwright install chromium
   ```

## Running Tests

From the `packages/plugins/blocks/blocks-basic` directory:

```bash
# Run all e2e tests (headless)
pnpm e2e

# Run with Playwright UI for debugging
pnpm e2e:ui

# Run specific test file
pnpm e2e box.spec.ts

# Run in headed mode (see the browser)
pnpm e2e --headed
```

## Folder Structure

```
e2e/
├── README.md                 # This file
├── playwright.config.ts      # Playwright configuration
├── app/                      # Lowdefy test application
│   ├── lowdefy.yaml          # App entry point
│   ├── box.yaml              # Test page for Box block
│   └── [block].yaml          # Add more pages for other blocks
├── box.spec.ts               # Tests for Box block
└── [block].spec.ts           # Add more spec files for other blocks
```

## How It Works

1. **Playwright starts the dev server** via the `webServer` config in `playwright.config.ts`
2. **The dev server** runs a minimal Lowdefy app from `e2e/app/`
3. **Each test page** (e.g., `box.yaml`) renders blocks with various configurations
4. **Playwright tests** navigate to pages and assert block behavior

The dev server is reused between test runs during development (`reuseExistingServer: true`), making subsequent runs fast (~2s). In CI, a fresh server starts for each run.

## Adding Tests for a New Block

### 1. Create a test page

Add `e2e/app/[block].yaml` with test configurations:

```yaml
# e2e/app/span.yaml
id: span
type: Box
blocks:
  # Test 1: Basic rendering
  - id: span_basic
    type: Span
    properties:
      content: Hello World

  # Test 2: With styling
  - id: span_styled
    type: Span
    properties:
      content: Styled text
      style:
        color: red

  # Test 3: With events (use SetState to verify)
  - id: span_clickable
    type: Span
    properties:
      content:
        _if:
          test:
            _eq:
              - _state: clicked
              - true
          then: Clicked!
          else: Click me
    events:
      onClick:
        - id: set_clicked
          type: SetState
          params:
            clicked: true
```

### 2. Reference the page in lowdefy.yaml

```yaml
# e2e/app/lowdefy.yaml
lowdefy: local
name: blocks-basic e2e tests

pages:
  - _ref: box.yaml
  - _ref: span.yaml    # Add new page
```

### 3. Create the spec file

Add `e2e/[block].spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Span Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/span');
  });

  test('renders with content', async ({ page }) => {
    const span = page.getByTestId('span_basic');
    await expect(span).toHaveText('Hello World');
  });

  test('applies style properties', async ({ page }) => {
    const span = page.getByTestId('span_styled');
    await expect(span).toHaveCSS('color', 'rgb(255, 0, 0)');
  });

  test('onClick updates state', async ({ page }) => {
    const span = page.getByTestId('span_clickable');
    await expect(span).toHaveText('Click me');
    await span.click();
    await expect(span).toHaveText('Clicked!');
  });
});
```

## Test Patterns

### Selecting elements

All blocks render with `data-testid={blockId}`:

```typescript
const box = page.getByTestId('box_basic');
```

### Testing visibility

Empty blocks may have zero dimensions. Use `toBeAttached()` for empty containers:

```typescript
await expect(emptyBox).toBeAttached();      // Element exists in DOM
await expect(boxWithContent).toBeVisible();  // Element is visible
```

### Testing styles

```typescript
await expect(box).toHaveCSS('background-color', 'rgb(0, 128, 255)');
await expect(box).toHaveCSS('padding', '10px');
```

### Testing events with SetState

Use `SetState` to change visible content, then assert the change:

```yaml
# In YAML: toggle content on click
properties:
  content:
    _if:
      test:
        _eq:
          - _state: wasClicked
          - true
      then: After click
      else: Before click
events:
  onClick:
    - id: handle_click
      type: SetState
      params:
        wasClicked: true
```

```typescript
// In spec: verify state change
await expect(element).toHaveText('Before click');
await element.click();
await expect(element).toHaveText('After click');
```

### Testing nested blocks

```typescript
const parent = page.getByTestId('parent_box');
const child = page.getByTestId('child_span');
await expect(parent).toBeVisible();
await expect(child).toBeVisible();
await expect(child).toHaveText('Child content');
```

## Configuration

### Port

Tests run on port 3001 (to avoid conflicts with other dev servers on 3000). Change in `playwright.config.ts` if needed.

### Timeout

The webServer has a 120s timeout for initial startup. Increase if builds are slow.

### Browsers

Currently configured for Chromium only. Add more browsers in `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

## Debugging

### View test report

After running tests:
```bash
pnpm exec playwright show-report
```

### Debug a specific test

```bash
pnpm e2e --debug box.spec.ts
```

### Keep browser open on failure

```bash
pnpm e2e --headed --timeout=0
```

## CI Considerations

In CI (`process.env.CI` is set):
- `reuseExistingServer: false` - always starts fresh server
- `retries: 2` - retries failed tests
- `workers: 1` - sequential execution for stability
- `forbidOnly: true` - fails if `.only` is left in tests
