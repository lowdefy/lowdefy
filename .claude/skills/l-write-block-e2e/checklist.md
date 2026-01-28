# Block E2E Test Checklist

Use this checklist when writing e2e tests for a Lowdefy block.

## Pre-Flight Checks

- [ ] Block has `data-testid={blockId}` on root element
- [ ] Package has e2e infrastructure (playwright.config.js, e2e/app/lowdefy.yaml)
- [ ] Package has @lowdefy/block-dev-e2e as devDependency

## Schema Coverage

Review `schema.json` and ensure tests for:

### Properties
- [ ] Every property in schema.json has at least one test
- [ ] Default values work correctly
- [ ] Property combinations that matter

### Events
- [ ] Every event handler has at least one test
- [ ] Events update state correctly (verifiable in UI)
- [ ] Loading states during async actions (if applicable)

## Test Categories

### Rendering Tests
- [ ] Basic render with minimal props
- [ ] Block has correct data-testid
- [ ] Text content displays correctly

### Property Tests
- [ ] Boolean properties (disabled, ghost, block, etc.)
- [ ] Enum properties (type, size, shape, etc.)
- [ ] String properties (title, placeholder, href, etc.)
- [ ] Style/color properties

### Attribute Tests
- [ ] HTML attributes (href, target, disabled)
- [ ] ARIA attributes (if applicable)

### Class/Style Tests
- [ ] CSS classes for variants (Ant Design classes like ant-btn-primary)
- [ ] Custom style application
- [ ] Disabled styling (cursor: not-allowed)

### Child Element Tests
- [ ] Icons render correctly (look for svg)
- [ ] Nested content renders

### Event Tests
- [ ] Click events fire
- [ ] State updates after events
- [ ] Loading spinner shows during async

## Naming Conventions

Block IDs in YAML:
- `{blockname}_basic` - Basic rendering
- `{blockname}_{property}` - Property-specific (e.g., button_primary, button_disabled)
- `{blockname}_{event}` - Event tests (e.g., button_clickable)

Test descriptions:
- "renders basic {block} with title"
- "renders {property} {value} {block}"
- "applies {property} styling"
- "{event} event fires and updates state"

## Common Assertions

```javascript
// Visibility
await expect(block).toBeVisible();
await expect(block).toBeAttached();

// Text
await expect(block).toHaveText('exact text');
await expect(block).toContainText('partial');
await expect(block).toHaveText(''); // empty

// Classes (use regex for partial match)
await expect(block).toHaveClass(/ant-btn-primary/);

// Attributes
await expect(block).toHaveAttribute('href', 'value');
await expect(block).toBeDisabled();

// CSS
await expect(block).toHaveCSS('background-color', 'rgb(82, 196, 26)');

// Child elements
const svg = block.locator('svg');
await expect(svg).toBeAttached();
```

## Final Checks

- [ ] All tests pass: `pnpm e2e`
- [ ] No flaky tests (run 3x to verify)
- [ ] Test file has license header
- [ ] YAML file has license header
- [ ] Test page added to e2e/app/lowdefy.yaml
- [ ] Commit follows convention: `test({package}): Add {BlockName} e2e tests`
