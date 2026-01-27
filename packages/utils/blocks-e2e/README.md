# Lowdefy Blocks E2E Tests

End-to-end tests for all Lowdefy block packages using Playwright. Tests run against a real Lowdefy dev server, validating blocks in their production environment.

## Why `packages/utils/`?

This package lives in `packages/utils/` rather than alongside the block packages because:

1. **Cross-package testing** - Tests blocks from multiple packages (`blocks-basic`, `blocks-antd`, etc.) with a single Lowdefy app and dev server
2. **Not publishable** - This is internal test tooling, not a package published to npm
3. **Shared infrastructure** - Follows the pattern of other internal utilities like `@lowdefy/block-dev` and `@lowdefy/jest-yaml-transform`
4. **Single CI job** - One centralized location means one test run in CI, not one per block package

## Setup

1. Ensure the monorepo is built:

   ```bash
   pnpm build:turbo
   ```

2. Install Playwright browsers (first time only):
   ```bash
   cd packages/utils/blocks-e2e
   pnpm exec playwright install chromium
   ```

## Running Tests

From the `packages/utils/blocks-e2e` directory:

```bash
# Run all e2e tests (headless)
pnpm e2e

# Run with Playwright UI for debugging
pnpm e2e:ui

# Run tests for a specific block package
pnpm e2e tests/blocks-basic/

# Run specific test file
pnpm e2e tests/blocks-basic/box.spec.ts

# Run in headed mode (see the browser)
pnpm e2e --headed
```

## Folder Structure

```
blocks-e2e/
├── README.md
├── package.json
├── playwright.config.ts
├── app/                          # Lowdefy test application
│   ├── lowdefy.yaml              # App entry point (references all pages)
│   ├── blocks-basic/             # Pages for blocks-basic
│   │   ├── box.yaml
│   │   ├── span.yaml
│   │   └── ...
│   ├── blocks-antd/              # Pages for blocks-antd
│   │   ├── button.yaml
│   │   └── ...
│   └── [package]/                # Add folders for other block packages
└── tests/                        # Test specs
    ├── blocks-basic/
    │   ├── box.spec.ts
    │   └── ...
    ├── blocks-antd/
    │   └── ...
    └── [package]/
```

## How It Works

1. **Playwright starts the dev server** via the `webServer` config
2. **The dev server** runs a Lowdefy app from `app/` that loads all block packages
3. **Each test page** (e.g., `app/blocks-basic/box.yaml`) renders blocks with various configurations
4. **Playwright tests** navigate to pages and assert block behavior

The dev server is reused between test runs during development (`reuseExistingServer: true`), making subsequent runs fast. In CI, a fresh server starts for each run.

## Adding Tests for a Block Package

### 1. Create a folder for the package

```bash
mkdir -p app/blocks-foo tests/blocks-foo
```

### 2. Create test pages

Add `app/blocks-foo/myblock.yaml`:

```yaml
id: myblock
type: Box
blocks:
  # Test 1: Basic rendering
  - id: myblock_basic
    type: MyBlock
    properties:
      content: Hello World

  # Test 2: With events (use SetState to verify)
  - id: myblock_clickable
    type: MyBlock
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

### 3. Reference pages in lowdefy.yaml

```yaml
# app/lowdefy.yaml
pages:
  # blocks-basic
  - _ref: blocks-basic/box.yaml
  # blocks-foo (add new pages)
  - _ref: blocks-foo/myblock.yaml
```

### 4. Create the spec file

Add `tests/blocks-foo/myblock.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('MyBlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/myblock');
  });

  test('renders with content', async ({ page }) => {
    const block = page.getByTestId('myblock_basic');
    await expect(block).toHaveText('Hello World');
  });

  test('onClick updates state', async ({ page }) => {
    const block = page.getByTestId('myblock_clickable');
    await expect(block).toHaveText('Click me');
    await block.click();
    await expect(block).toHaveText('Clicked!');
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
await expect(emptyBox).toBeAttached(); // Element exists in DOM
await expect(boxWithContent).toBeVisible(); // Element is visible
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
pnpm e2e --debug tests/blocks-basic/box.spec.ts
```

### Keep browser open on failure

```bash
pnpm e2e --headed --timeout=0
```

## CI / GitHub Actions

### Playwright Config Behavior

When `process.env.CI` is set, the config automatically adjusts:

- `reuseExistingServer: false` - always starts fresh server
- `retries: 2` - retries failed tests
- `workers: 1` - sequential execution for stability
- `forbidOnly: true` - fails if `.only` is left in tests

### Prerequisites

Before running e2e tests in CI:

1. **Build the monorepo** - CLI and server-dev must be built:

   ```bash
   pnpm build:turbo
   ```

2. **Install Playwright browsers** - Chromium binaries are required:
   ```bash
   pnpm exec playwright install chromium --with-deps
   ```
   The `--with-deps` flag installs system dependencies (needed on Linux).

### Example GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build:turbo

      - name: Install Playwright browsers
        run: |
          cd packages/utils/blocks-e2e
          pnpm exec playwright install chromium --with-deps

      - name: Run e2e tests
        run: |
          cd packages/utils/blocks-e2e
          pnpm e2e

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: packages/utils/blocks-e2e/playwright-report/
          retention-days: 7
```

### Performance Considerations

| Step             | Duration | Notes                                |
| ---------------- | -------- | ------------------------------------ |
| Install browsers | ~1-2 min | Can be cached (see below)            |
| Build monorepo   | ~2-5 min | Required for CLI/server-dev          |
| Server startup   | ~30-60s  | First request triggers Next.js build |
| Tests            | ~10-30s  | Depends on test count                |

### Caching Playwright Browsers

To speed up CI runs, cache the Playwright browser binaries:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('packages/utils/blocks-e2e/package.json') }}

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: |
    cd packages/utils/blocks-e2e
    pnpm exec playwright install chromium --with-deps
```

### Alternative: Playwright Docker Image

For faster, more consistent CI runs, use the official Playwright Docker image:

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.50.1-jammy

    steps:
      # ... checkout, setup, build steps ...

      - name: Run e2e tests
        run: |
          cd packages/utils/blocks-e2e
          pnpm e2e
        env:
          HOME: /root # Required for Playwright in Docker
```

### Troubleshooting CI Failures

**Server startup timeout:**

- Increase `timeout` in `playwright.config.ts` webServer config
- Check if build step completed successfully
- CI machines may be slower than local

**Browser crashes:**

- Ensure `--with-deps` was used when installing browsers
- Try the Docker image approach for consistent environment

**Flaky tests:**

- The config already has `retries: 2` in CI
- Consider increasing if tests are timing-dependent
- Use `await expect().toBeVisible()` with proper timeouts

**Port conflicts:**

- Tests use port 3001 by default
- Change in `playwright.config.ts` if needed
