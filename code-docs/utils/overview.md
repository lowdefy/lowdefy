# Utils Overview

Shared utility packages used throughout Lowdefy.

## Package Summary

| Package                        | Purpose                                     | Runtime   |
| ------------------------------ | ------------------------------------------- | --------- |
| `@lowdefy/helpers`             | Core helper functions                       | Universal |
| `@lowdefy/node-utils`          | Node.js file/process utilities              | Node.js   |
| `@lowdefy/logger`              | Logging utilities (node, dev, cli, browser) | Universal |
| `@lowdefy/ajv`                 | JSON Schema validation                      | Universal |
| `@lowdefy/block-utils`         | Block runtime utilities                     | Browser   |
| `@lowdefy/block-dev`           | Block testing utilities                     | Node.js   |
| `@lowdefy/nunjucks`            | Template engine wrapper                     | Universal |
| `@lowdefy/jest-yaml-transform` | YAML Jest transformer                       | Node.js   |

## Dependency Graph

```
helpers (no deps)
    ↓
node-utils, block-utils, nunjucks, block-dev, logger
    ↓
ajv (depends on nunjucks)

jest-yaml-transform (standalone)
```

## Common Use Cases

### Data Manipulation

```javascript
import { get, set, mergeObjects, serializer } from '@lowdefy/helpers';

// Deep property access
const name = get(user, 'profile.name', { default: 'Anonymous' });

// Deep property assignment
set(state, 'user.profile.name', 'John');

// Merge objects
const merged = mergeObjects([defaults, overrides]);

// Serialize/deserialize
const json = serializer.serializeToString(data);
const data = serializer.deserializeFromString(json);
```

### Type Checking

```javascript
import { type } from '@lowdefy/helpers';

type.isArray(value);
type.isObject(value);
type.isString(value);
type.isDate(value);
type.enforceType('array', value);
```

### File Operations

```javascript
import { readFile, writeFile, spawnProcess } from '@lowdefy/node-utils';

const content = await readFile('config.yaml');
await writeFile('output.json', JSON.stringify(data));
await spawnProcess({ command: 'npm', args: ['install'] });
```

### Schema Validation

```javascript
import { validate } from '@lowdefy/ajv';

const result = validate({ schema, data });
if (!result.valid) {
  console.error(result.errors);
}
```

### Block Development

```javascript
import { makeCssClass, ErrorBoundary } from '@lowdefy/block-utils';
import { mockBlock, runBlockSchemaTests } from '@lowdefy/block-dev';

// Generate CSS class
const className = makeCssClass({ color: 'red', '@media sm': { color: 'blue' } });

// Test blocks
const block = mockBlock({ meta, schema });
runBlockSchemaTests({ examples, schema });
```

### Templates

```javascript
import { nunjucksString, nunjucksFunction } from '@lowdefy/nunjucks';

// One-off render
const result = nunjucksString('Hello {{ name }}!', { name: 'World' });

// Reusable template
const template = nunjucksFunction('Hello {{ name }}!');
const result = template({ name: 'World' });
```

## Version

All packages are at version 4.4.0 and follow the monorepo versioning.

## See Also

- [helpers.md](./helpers.md) - Core helper functions
- [logger.md](./logger.md) - Logging utilities
- [node-utils.md](./node-utils.md) - Node.js utilities
- [ajv.md](./ajv.md) - Schema validation
- [block-utils.md](./block-utils.md) - Block runtime utilities
- [block-dev.md](./block-dev.md) - Block testing
- [nunjucks.md](./nunjucks.md) - Template engine
- [jest-yaml-transform.md](./jest-yaml-transform.md) - YAML transformer
