# @lowdefy/jest-yaml-transform

Jest transformer for YAML file imports.

## Overview

Enables importing YAML files directly in Jest tests:

```javascript
import schema from './schema.yaml';
import examples from './examples.yaml';
```

## Installation

Add to Jest configuration:

```javascript
// jest.config.js
module.exports = {
  transform: {
    '\\.yaml$': '@lowdefy/jest-yaml-transform',
  },
};
```

## How It Works

1. Jest encounters a `.yaml` import
2. Transformer reads file content
3. YAML is parsed to JavaScript object
4. Returns CommonJS module exporting the object

## Transformer API

```javascript
const transformer = {
  getCacheKey(fileData, filePath, options),
  process(sourceText)
};
```

### process(sourceText)

Transform YAML source to JavaScript module:

```javascript
// Input (schema.yaml):
// type: object
// properties:
//   name:
//     type: string

// Output (JavaScript module):
module.exports = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
};
```

### getCacheKey(fileData, filePath, options)

Generate cache key for Jest caching:

```javascript
// Uses SHA1 hash of:
// - File content
// - Transformer options
// Returns unique cache key
```

## Dependencies

- `yaml` (2.3.4)
- Jest 28.1.3
- `@swc/core` (for transpilation)

## Usage Examples

### Import Block Examples

```javascript
// examples.yaml
// - id: basic
//   type: Button
//   properties:
//     label: Click

import examples from './examples.yaml';

describe('Button', () => {
  examples.forEach((example) => {
    test(`renders ${example.id}`, () => {
      // Test each example
    });
  });
});
```

### Import Schema

```javascript
// schema.yaml
// type: object
// properties:
//   label:
//     type: string
//   disabled:
//     type: boolean
//     default: false

import schema from './schema.yaml';
import { validate } from '@lowdefy/ajv';

test('validates button config', () => {
  const result = validate({
    schema,
    data: { label: 'Click' },
    returnErrors: true,
  });

  expect(result.valid).toBe(true);
});
```

### Import Test Fixtures

```javascript
// fixtures.yaml
// users:
//   - id: 1
//     name: Alice
//   - id: 2
//     name: Bob

import fixtures from './fixtures.yaml';

describe('UserList', () => {
  test('renders users', () => {
    const { getAllByRole } = render(<UserList users={fixtures.users} />);

    expect(getAllByRole('listitem')).toHaveLength(2);
  });
});
```

## Configuration

### Jest Config

```javascript
// jest.config.js
module.exports = {
  transform: {
    '\\.yaml$': '@lowdefy/jest-yaml-transform',
    '\\.yml$': '@lowdefy/jest-yaml-transform',
  },
  moduleFileExtensions: ['js', 'json', 'yaml', 'yml'],
};
```

### TypeScript Support

If using TypeScript, add declaration:

```typescript
// yaml.d.ts
declare module '*.yaml' {
  const content: any;
  export default content;
}

declare module '*.yml' {
  const content: any;
  export default content;
}
```

## Key Files

| File                 | Purpose                    |
| -------------------- | -------------------------- |
| `src/index.js`       | Transformer implementation |
| `src/process.js`     | YAML processing logic      |
| `src/getCacheKey.js` | Cache key generation       |

## Benefits

1. **Test Fixtures**: Store test data in YAML format
2. **Schema Files**: Import JSON Schema from YAML
3. **Examples**: Import block examples for testing
4. **Consistency**: Same YAML files used in tests and runtime
5. **Caching**: Jest caches transformed files for speed
