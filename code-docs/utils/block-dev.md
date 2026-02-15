# @lowdefy/block-dev

Block testing and development utilities.

## Overview

Provides testing utilities for:
- Mock block environments
- Schema validation tests
- Render snapshot tests
- Method testing

## Installation

```javascript
import { mockBlock, runBlockSchemaTests } from '@lowdefy/block-dev';
```

## Functions

### mockBlock({ meta, schema })

Create mock block environment for testing:

```javascript
import { mockBlock } from '@lowdefy/block-dev';

const { block, methods, makeCssClass } = mockBlock({
  meta: {
    valueType: 'string',
    category: 'input'
  },
  schema: buttonSchema
});

// block contains mock block instance
// methods contains Jest mock functions
// makeCssClass is mocked CSS generator
```

**Returns:**

| Property | Description |
|----------|-------------|
| `block` | Mock block instance |
| `methods` | Object with mock methods |
| `makeCssClass` | CSS class generator |
| `lowdefy` | Mock lowdefy context |
| `schemaError` | Schema validation errors |

**Mocked Methods:**

- `setValue` - Mock for input value changes
- `triggerEvent` - Mock for event triggering
- `registerMethod` - Mock for method registration
- `registerEvent` - Mock for event registration
- `moveItemDown` - Mock for list item movement
- `moveItemUp` - Mock for list item movement
- `pushItem` - Mock for adding list items
- `removeItem` - Mock for removing list items
- `unshiftItem` - Mock for prepending list items

### runBlockSchemaTests({ examples, schema })

Run Jest schema validation tests:

```javascript
import { runBlockSchemaTests } from '@lowdefy/block-dev';

describe('Button Schema', () => {
  runBlockSchemaTests({
    examples: [
      {
        id: 'basic',
        type: 'Button',
        properties: { label: 'Click' }
      },
      {
        id: 'styled',
        type: 'Button',
        properties: { label: 'Submit', color: 'primary' }
      }
    ],
    schema: buttonSchema
  });
});
```

### runRenderTests({ examples, methods })

Render blocks and compare snapshots:

```javascript
import { runRenderTests } from '@lowdefy/block-dev';
import Button from './Button';

describe('Button Render', () => {
  runRenderTests({
    examples: [
      {
        id: 'basic',
        type: 'Button',
        properties: { label: 'Click' }
      }
    ],
    Block: Button,
    methods: {
      triggerEvent: jest.fn()
    }
  });
});
```

### runMockRenderTests({ examples, methods, mockDataTest })

Render with mocked data:

```javascript
import { runMockRenderTests } from '@lowdefy/block-dev';

describe('Table Render', () => {
  runMockRenderTests({
    examples: tableExamples,
    Block: Table,
    mockDataTest: (data) => {
      return data.map(row => ({ ...row, id: 'mock-id' }));
    }
  });
});
```

### runMockMethodTests({ meta, schema })

Test block methods in isolation:

```javascript
import { runMockMethodTests } from '@lowdefy/block-dev';

describe('Input Methods', () => {
  runMockMethodTests({
    meta: {
      valueType: 'string',
      category: 'input'
    },
    schema: inputSchema
  });
});
```

### stubBlockProps({ block, meta, schema })

Generate stub props for testing:

```javascript
import { stubBlockProps } from '@lowdefy/block-dev';

const props = stubBlockProps({
  block: {
    id: 'test-button',
    type: 'Button',
    properties: { label: 'Test' }
  },
  meta: { category: 'display' },
  schema: buttonSchema
});

// props can be spread into component
<Button {...props} />
```

## Classes

### BlockSchemaErrors

Error class for schema violations:

```javascript
import { BlockSchemaErrors } from '@lowdefy/block-dev';

try {
  validateBlock(block);
} catch (error) {
  if (error instanceof BlockSchemaErrors) {
    console.log(error.errors);
  }
}
```

## Mock Setup

`mockBlock` automatically mocks:

### Math.random

```javascript
Math.random = () => 0.5;  // Deterministic for snapshots
```

### window.matchMedia

```javascript
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addListener: () => {},
  removeListener: () => {}
});
```

### CSS Animations

```javascript
window.AnimationEvent = function() {};
window.TransitionEvent = function() {};
```

## Dependencies

- `@lowdefy/block-utils` (4.4.0)
- `@lowdefy/helpers` (4.4.0)
- `@testing-library/react`
- `@testing-library/dom`
- `jest` (28.1.3)
- `@emotion/jest`

## Usage Examples

### Complete Block Test

```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { mockBlock, runBlockSchemaTests, stubBlockProps } from '@lowdefy/block-dev';
import Button from '../Button';
import buttonSchema from '../buttonSchema';
import buttonExamples from '../examples.yaml';

describe('Button', () => {
  // Schema tests
  runBlockSchemaTests({
    examples: buttonExamples,
    schema: buttonSchema
  });

  // Render test
  test('renders with label', () => {
    const props = stubBlockProps({
      block: { id: 'btn', type: 'Button', properties: { label: 'Click' } },
      meta: { category: 'input' },
      schema: buttonSchema
    });

    const { getByText } = render(<Button {...props} />);
    expect(getByText('Click')).toBeInTheDocument();
  });

  // Event test
  test('triggers onClick event', () => {
    const { block, methods } = mockBlock({
      meta: { category: 'input' },
      schema: buttonSchema
    });

    const props = stubBlockProps({
      block: { id: 'btn', type: 'Button', properties: { label: 'Click' } },
      meta: { category: 'input' },
      schema: buttonSchema
    });

    const { getByRole } = render(
      <Button {...props} methods={methods} />
    );

    fireEvent.click(getByRole('button'));
    expect(methods.triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
  });
});
```

### Input Block Test

```javascript
import { mockBlock, stubBlockProps } from '@lowdefy/block-dev';
import TextInput from '../TextInput';
import inputSchema from '../inputSchema';

describe('TextInput', () => {
  test('calls setValue on change', () => {
    const { methods } = mockBlock({
      meta: { valueType: 'string', category: 'input' },
      schema: inputSchema
    });

    const props = stubBlockProps({
      block: { id: 'input', type: 'TextInput', properties: {} },
      meta: { valueType: 'string', category: 'input' },
      schema: inputSchema
    });

    const { getByRole } = render(
      <TextInput {...props} methods={methods} />
    );

    fireEvent.change(getByRole('textbox'), { target: { value: 'test' } });
    expect(methods.setValue).toHaveBeenCalledWith('test');
  });
});
```

## Key Files

| File | Purpose |
|------|---------|
| `src/mockBlock.js` | Block environment mocking |
| `src/runBlockSchemaTests.js` | Schema test runner |
| `src/runRenderTests.js` | Render test runner |
| `src/stubBlockProps.js` | Props generation |
| `src/BlockSchemaErrors.js` | Error class |
