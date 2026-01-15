# @lowdefy/helpers

Core helper functions used throughout the Lowdefy framework.

## Overview

Provides universal utilities for:
- Deep object access and manipulation
- Type checking and enforcement
- Serialization/deserialization
- Caching and memoization

## Installation

```javascript
import { get, set, type, serializer } from '@lowdefy/helpers';
```

## Functions

### get(target, path, options)

Deep object property access with dot-notation:

```javascript
const user = {
  profile: {
    name: 'John',
    emails: ['john@example.com']
  }
};

get(user, 'profile.name');                    // 'John'
get(user, 'profile.emails.0');                // 'john@example.com'
get(user, 'profile.age', { default: 0 });     // 0
get(user, 'profile', { copy: true });         // Deep copy
```

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `default` | any | Return if path not found |
| `copy` | boolean | Return deep copy |

### set(target, path, value, options)

Deep object property assignment:

```javascript
const state = {};

set(state, 'user.name', 'John');
// state = { user: { name: 'John' } }

set(state, 'items.0.id', 1);
// state = { ..., items: [{ id: 1 }] }

set(state, 'config', { a: 1 }, { merge: true });
// Merges instead of replacing
```

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `merge` | boolean | Merge objects instead of replace |

**Security:** Prevents prototype pollution (`__proto__`, `constructor`, `prototype`).

### unset(target, path)

Remove nested properties:

```javascript
const state = { user: { name: 'John', age: 30 } };
unset(state, 'user.age');
// state = { user: { name: 'John' } }
```

### mergeObjects(objects)

Merge multiple objects using lodash.merge:

```javascript
const defaults = { theme: 'light', debug: false };
const overrides = { debug: true };

mergeObjects([defaults, overrides]);
// { theme: 'light', debug: true }
```

### omit(object, keys)

Remove specified keys from object:

```javascript
omit({ a: 1, b: 2, c: 3 }, ['b', 'c']);
// { a: 1 }
```

### swap(array, indices)

Swap array elements:

```javascript
swap([1, 2, 3, 4], [0, 2]);
// [3, 2, 1, 4]
```

### applyArrayIndices(array, indices)

Apply array index operations:

```javascript
applyArrayIndices(['a', 'b', 'c'], [1]);
// Applies index transformations
```

## Type Module

Comprehensive type checking:

```javascript
import { type } from '@lowdefy/helpers';

// Basic types
type.isArray([]);           // true
type.isObject({});          // true
type.isString('');          // true
type.isNumber(42);          // true
type.isBoolean(true);       // true
type.isNull(null);          // true
type.isUndefined(undefined);// true
type.isNone(null);          // true (null or undefined)

// Complex types
type.isDate(new Date());    // true
type.isError(new Error());  // true
type.isFunction(() => {});  // true
type.isPromise(Promise.resolve()); // true
type.isRegExp(/pattern/);   // true

// Special checks
type.isPrimitive('string'); // true
type.isInteger(42);         // true

// Type enforcement
type.enforceType('array', value);  // Returns [] if not array
type.enforceType('string', 123);   // Returns '123'
```

### Type Predicates

| Method | Checks For |
|--------|------------|
| `isArray` | Array |
| `isObject` | Plain object |
| `isString` | String |
| `isNumber` | Number (not NaN) |
| `isBoolean` | Boolean |
| `isNull` | null |
| `isUndefined` | undefined |
| `isNone` | null or undefined |
| `isDate` | Date object |
| `isError` | Error object |
| `isFunction` | Function |
| `isPromise` | Promise |
| `isRegExp` | RegExp |
| `isSymbol` | Symbol |
| `isPrimitive` | Primitive type |
| `isInteger` | Integer |

### enforceType(typeName, value)

Coerce value to specified type:

```javascript
type.enforceType('string', 123);    // '123'
type.enforceType('number', '42');   // 42
type.enforceType('array', null);    // []
type.enforceType('object', null);   // {}
type.enforceType('boolean', 'yes'); // true
```

## Serializer

Handle JSON serialization with special types. **IMPORTANT**: Always use the serializer instead of raw `JSON.stringify`/`JSON.parse` when working with Lowdefy config objects to preserve internal metadata.

```javascript
import { serializer } from '@lowdefy/helpers';

const data = {
  date: new Date(),
  error: new Error('message')
};

// Serialize to string
const json = serializer.serializeToString(data);

// Deserialize from string
const restored = serializer.deserializeFromString(json);

// Deep copy with special type handling
const copy = serializer.copy(data);

// Standard serialize (for transport)
const serialized = serializer.serialize(data);
const deserialized = serializer.deserialize(serialized);
```

### Methods

| Method | Description |
|--------|-------------|
| `serialize(data)` | Convert to JSON-safe object |
| `deserialize(data)` | Restore from JSON-safe object |
| `serializeToString(data)` | Convert to JSON string |
| `deserializeFromString(str)` | Parse JSON string |
| `copy(data, options)` | Deep copy with type handling |

### Internal Property Handling (~r, ~k, ~l)

The serializer specially handles non-enumerable internal properties used throughout Lowdefy:

| Property | Description |
|----------|-------------|
| `~r` | Reference ID - tracks which file an object came from |
| `~k` | Key map ID - links objects to their config location |
| `~l` | Line number - tracks source line numbers in YAML files |

These properties are:
- Non-enumerable (hidden from `Object.keys()`, spread operators)
- Preserved through `serializer.copy()` and `serializer.serialize()`
- Restored as non-enumerable after `serializer.deserialize()`

**Why this matters:**
```javascript
// BAD - loses internal properties like ~l (line numbers)
const copy = JSON.parse(JSON.stringify(configObject));

// GOOD - preserves all internal properties
const copy = serializer.copy(configObject);
```

**Using with custom revivers:**
```javascript
// Copy with custom processing while preserving internal properties
const processed = serializer.copy(data, {
  reviver: (key, value) => {
    if (key === 'date') return new Date(value);
    return value;
  }
});
```

## Caching

### cachedPromises(promiseFn)

Cache promise results:

```javascript
const fetchUser = cachedPromises(async (id) => {
  return await api.getUser(id);
});

// First call fetches
await fetchUser('123');

// Second call returns cached
await fetchUser('123');
```

### LRUCache

Least-Recently-Used cache:

```javascript
import { LRUCache } from '@lowdefy/helpers';

const cache = new LRUCache({ maxSize: 100 });

cache.set('key', 'value');
cache.get('key');  // 'value'
cache.has('key');  // true
cache.delete('key');
cache.clear();
```

## URL Utilities

### urlQuery

Parse and format URL query strings:

```javascript
import { urlQuery } from '@lowdefy/helpers';

// Parse
urlQuery.parse('page=1&filter=active');
// { page: '1', filter: 'active' }

// Format
urlQuery.format({ page: 1, filter: 'active' });
// 'page=1&filter=active'
```

## Other Utilities

### stableStringify(obj, options)

Deterministic JSON stringification:

```javascript
import { stableStringify } from '@lowdefy/helpers';

// Objects with same keys in different order
// produce identical output
stableStringify({ b: 2, a: 1 });
stableStringify({ a: 1, b: 2 });
// Both: '{"a":1,"b":2}'
```

### wait(ms)

Promise-based delay:

```javascript
import { wait } from '@lowdefy/helpers';

await wait(1000);  // Wait 1 second
```

## Dependencies

- `lodash.merge` (4.6.2)

## Config Location Resolution

### resolveConfigLocation({ configKey, keyMap, refMap, configDirectory })

Resolves a `~k` (configKey) to human-readable location with file path and line number. Used by error formatting utilities to provide precise error locations.

```javascript
import { resolveConfigLocation } from '@lowdefy/helpers';

const location = resolveConfigLocation({
  configKey: 'abc123',
  keyMap: context.keyMap,
  refMap: context.refMap,
  configDirectory: '/Users/dev/myapp',
});
// Returns:
// {
//   source: 'pages/home.yaml:15',                    // file:line
//   config: 'pages.0.blocks.0',                      // config path
//   link: '/Users/dev/myapp/pages/home.yaml:15'      // absolute path with line
// }
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `configKey` | string | The `~k` value from a config object |
| `keyMap` | object | Maps keys to config locations (from `keyMap.json`) |
| `refMap` | object | Maps ref IDs to source files (from `refMap.json`) |
| `configDirectory` | string | Absolute path to config root |

**Returns:** Object with `source`, `config`, and `link` properties, or `null` if location cannot be resolved.

**Usage in Error Formatting:**

```javascript
import formatConfigError from './formatConfigError.js';

throw new Error(
  formatConfigError({
    message: 'Block type "Buton" not found.',
    configKey: block['~k'],
    context,
  })
);
// Output:
// [Config Error] Block type "Buton" not found.
//   pages/home.yaml:15 at pages.0.blocks.0.type
//   /Users/dev/myapp/pages/home.yaml:15
```

See [Error Tracing System](../architecture/error-tracing.md) for complete documentation.

## Key Files

| File | Purpose |
|------|---------|
| `src/get.js` | Deep property access |
| `src/set.js` | Deep property assignment |
| `src/type.js` | Type checking module |
| `src/serializer.js` | Serialization utilities |
| `src/resolveConfigLocation.js` | Config location resolver for error tracing |
| `src/mergeObjects.js` | Object merging |
| `src/LRUCache.js` | LRU cache implementation |
