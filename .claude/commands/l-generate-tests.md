# Generate Tests for Changed Code

Generate comprehensive tests for code changes following Lowdefy testing standards.

## Usage

- `/generate-tests` - Generate tests for uncommitted changes
- `/generate-tests 123` - Generate tests for PR #123

## Instructions

You are a senior software engineer generating tests for the Lowdefy codebase. Follow these instructions precisely.

### Step 1: Identify Changed Files

**If a PR number is provided ($ARGUMENTS):**

```bash
gh pr diff $ARGUMENTS --name-only
```

**If no PR number (uncommitted changes):**

```bash
git diff --name-only HEAD
git diff --cached --name-only
```

Filter the results to only include `.js` files in `packages/*/src/` directories. Exclude:

- `*.test.js` files (existing tests)
- `packages/plugins/blocks/` (block testing is disabled)
- `packages/docs/` (documentation)
- Files in `test/` directories (test utilities, not testable code)
- `index.js` files that only re-export

### Step 2: Analyze Each Changed File

For each changed file:

1. **Read the file** to understand its purpose and exports
2. **Check if a test file exists** at `{filename}.test.js`
3. **Determine the package type** from the file path:
   - `packages/build/` - Build functions
   - `packages/api/` - API/request handlers
   - `packages/engine/` - Engine/state management
   - `packages/cli/` - CLI utilities
   - `packages/operators/` - Operator functions
   - `packages/plugins/connections/` - Connection handlers
   - `packages/plugins/actions/` - Action handlers
   - `packages/utils/` or `packages/helpers/` - Utility functions

### Step 3: Generate Tests Following Patterns

#### Required Test File Structure

```javascript
/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { expect, test, vi } from 'vitest';
// ... imports

// Tests here
```

#### Test Naming Convention

Use descriptive names: `test('{functionName} {scenario}', () => { })`

Examples:

- `test('buildConnections no connections', ...)`
- `test('buildConnections connections not an array', ...)`
- `test('throw on missing id', ...)`

#### Package-Specific Patterns

**Build Functions (`packages/build/`):**

```javascript
import { expect, test } from 'vitest';

import buildX from './buildX.js';
import testContext from '../test/testContext.js';

const context = testContext();

test('buildX basic case', () => {
  const components = {
    /* test data */
  };
  const res = buildX({ components, context });
  expect(res.property).toEqual(expected);
});

test('buildX throws on invalid input', () => {
  const components = {
    /* invalid data */
  };
  expect(() => buildX({ components, context })).toThrow('Expected error message');
});
```

**API/Request Handlers (`packages/api/`):**

```javascript
import { expect, test, vi } from 'vitest';

import functionName from './functionName.js';
import testContext from '../../test/testContext.js';

const mockFn = vi.fn();

const context = testContext({
  connections: {
    /* mock connections */
  },
  readConfigFile: vi.fn(),
});

test('functionName success case', async () => {
  const result = await functionName({ context, ...params });
  expect(result).toEqual(expected);
});
```

**Operators (`packages/operators/` or `packages/plugins/operators/`):**

```javascript
import { expect, test } from 'vitest';

import _operatorName from './_operatorName.js';

test('_operatorName basic usage', () => {
  const result = _operatorName({
    location: 'test.location',
    params: {
      /* operator params */
    },
  });
  expect(result).toEqual(expected);
});

test('_operatorName throws on invalid params', () => {
  expect(() =>
    _operatorName({
      location: 'test.location',
      params: 'invalid',
    })
  ).toThrow('_operatorName');
});
```

**Actions (`packages/plugins/actions/`):**

```javascript
import { expect, test, vi } from 'vitest';

import ActionName from './ActionName.js';

const mockSetState = vi.fn();

test('ActionName executes correctly', async () => {
  await ActionName({
    methods: { setState: mockSetState },
    params: {
      /* action params */
    },
  });
  expect(mockSetState).toHaveBeenCalledWith(expected);
});
```

**Connections (`packages/plugins/connections/`):**

```javascript
import { expect, test, vi } from 'vitest';

// Mock external dependencies. A client the code calls with `new` needs a
// function implementation, not an arrow function.
vi.doMock('dependency', () => ({
  client: vi.fn(),
}));

test('ConnectionRequest success', async () => {
  const { default: ConnectionRequest } = await import('./ConnectionRequest.js');
  const result = await ConnectionRequest({
    request: {
      /* request config */
    },
    connection: {
      /* connection config */
    },
  });
  expect(result).toEqual(expected);
});
```

**Utility Functions (`packages/utils/`, `packages/helpers/`):**

```javascript
import { expect, test } from 'vitest';

import utilityFunction from './utilityFunction.js';

test('utilityFunction basic case', () => {
  expect(utilityFunction(input)).toEqual(expected);
});

test('utilityFunction edge case', () => {
  expect(utilityFunction(null)).toEqual(defaultValue);
});
```

#### ES Module Mocking Pattern

`vi.doMock` is not hoisted, so import the module under test dynamically after it:

```javascript
vi.doMock('@lowdefy/node-utils', () => ({
  readFile: vi.fn(),
}));

test('function with mocked dependency', async () => {
  const { default: fn } = await import('./fn.js');
  // Test with mocked dependencies
});
```

#### Test Categories to Cover

For each function, generate tests for:

1. **Happy path** - Normal successful execution
2. **Edge cases** - Empty inputs, null/undefined values
3. **Error cases** - Invalid inputs, missing required fields
4. **Validation** - Type checking, required field validation

#### Validation Testing Pattern

```javascript
test('throw on missing required field', () => {
  expect(() => fn({})).toThrow('Field name missing.');
});

test('throw on invalid field type', () => {
  expect(() => fn({ field: 123 })).toThrow('Field is not a string. Received 123.');
});
```

### Step 4: Create or Update Test Files

1. If test file doesn't exist, create it with full structure
2. If test file exists, read it first and add new tests for changed functionality
3. Ensure tests don't duplicate existing coverage

### Step 5: Run Tests

After generating tests, run them to verify:

```bash
pnpm --filter=@lowdefy/{package-name} test
```

Fix any failing tests before completing.

### Important Constraints

1. **Never test blocks** - Block testing is disabled per CLAUDE.md
2. **Use type helpers** - Use `type.isNone()`, `type.isObject()`, etc. from `@lowdefy/helpers`
3. **Include license header** - Every test file must have the Apache 2.0 license header
4. **Co-locate tests** - Test files go next to source files as `{name}.test.js`
5. **Import from vitest explicitly** - `import { expect, test, vi } from 'vitest';` (there are no globals)
6. **Use .js extensions** - All imports must include `.js` extension

### Output

Provide a summary of:

- Files analyzed
- Tests generated (new files created)
- Tests updated (existing files modified)
- Tests skipped (with reason: blocks, docs, etc.)
- Test run results
