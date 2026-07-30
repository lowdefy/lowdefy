# @lowdefy/helpers

Lowdefy helper functions

## Path syntax

`get`, `set`, `unset` and `omit` address values with dot-notation paths (`'a.b.0.c'`). A dot is
always a separator unless it is escaped with a backslash, in which case it is a literal character
in the segment.

```js
get({ a: { b: 1 } }, 'a.b'); // returns 1        - two segments
get({ 'a.b': 1 }, 'a\\.b'); // returns 1        - one segment, literal key 'a.b'
```

An unescaped path does **not** fall back to matching a literal dotted key. `get`, `set` and `unset`
all split first and walk the split segments — there is no retry against the un-split string:

```js
get({ 'a.b': { c: 1 } }, 'a.b.c'); // returns undefined
get({ 'a.b': { c: 1 } }, 'a\\.b.c'); // returns 1
unset({ 'a.b': 1 }, 'a.b'); // no-op, returns true
unset({ 'a.b': 1 }, 'a\\.b'); // deletes the key, returns true
```

`get` has one exception: if the whole path string is an own key of the target it is returned before
any splitting, so `get({ 'a.b': 1 }, 'a.b')` returns `1`.

`splitPath` and `joinPath` are the escape-aware primitives behind this and are exported for
consumers that need to manipulate paths without losing escape information.

## Reserved keys

Seven keys are prototype-pollution vectors and are rejected wherever a path segment or map key is
addressed:

```
__proto__
constructor
prototype
__defineGetter__
__defineSetter__
__lookupGetter__
__lookupSetter__
```

`set`, `unset`, `get`, `omit` (via `unset`), `setKey`, `getKey` and `unsetKey` throw
[`ReservedKeyError`](#reservedkeyerror) when any segment or key matches. Rejecting is deliberate —
silently filtering the segment would redirect `set(obj, 'a.__proto__.b', 1)` to `a.b`, writing to a
different location than the caller asked for. The caller decides whether to catch, log, skip or
propagate.

Use [`isReserved`](#isreserved) to check a key up front instead of catching `ReservedKeyError`.

Names that merely live on `Object.prototype` but are not pollution vectors (`hasOwnProperty`,
`toString`, `valueOf`, …) are allowed.

`mergeObjects` is the one exception: it **skips** reserved keys instead of throwing. Its reserved
names arrive as _data_ inside a merged value (`JSON.parse('{"__proto__":{…}}')`), not as a path a
developer typed, so dropping them misroutes nothing, and throwing would abort an otherwise-valid
config merge over a single poisoned field.

## Keyed maps

For any map keyed by external or user-derived values — URL params, request body fields, action
arguments, YAML ids — build it with `Object.create(null)` and write through `setKey`/`getKey`/
`unsetKey` rather than `obj[key] = value`:

```js
const modules = Object.create(null);
setKey(modules, entry.id, entry);
getKey(modules, requestedId, null);
```

Traps worth knowing:

- Keys must be strings. `setKey(map, 1, v)` throws `TypeError` — coerce numeric ids yourself.
- Targets must be plain objects. Arrays and class instances throw `TypeError`;
  `Object.create(null)` is accepted (`type.isObject` reports `true` for it).
- `getKey` returns its default only when the key is genuinely absent. A key holding `undefined`
  returns `undefined`, not the default.
- Native `Map` needs none of this — it stores keys in an internal slot and is pollution-safe by
  construction. Use `Map` directly where it fits.

A site that skips or warns on a reserved key instead of throwing should guard with
[`isReserved`](#isreserved) rather than catching `ReservedKeyError`.

## Usage

#### applyArrayIndices

```
(arrayIndices: number[], name: string): string
```

Apply arrayIndices to a object id. Substitutes all instances of `$` character in `name` with a index from `arrayIndices`, until there are no more indices or `$`'s.

```js
applyArrayIndices([1, 2], 'array.$.subArr.$'); // returns 'array.1.subArr.2'
```

#### get

```
(
  target: any,
  path: string | number,
  options?: {
    default?: any,
    copy?: boolean,
  }
): any
```

Get a value from a target object, using path with dot-notation. Returns `undefined` or the optional default value if the value is not found. If `options` is not a plain object it is taken as the default value, so `get(obj, 'a.b', 'fallback')` works. With `copy: true` the result is deep-copied with `serializer.copy`.

```js
get({ a: [{ b: 1 }] }, 'a.0.b'); // returns 1
get({ a: [{ b: 1 }] }, 'a.7.b', { default: 4 }); // returns 4
```

Paths are strings (numbers are coerced to strings). Array paths are not supported and return the default.

The walk steps into any non-null object or function, so reads inside errors, class instances, `Date`, `URL` and `Map` resolve:

```js
get(error, 'cause.code'); // reads through an Error
get({ url: new URL('https://example.com/p') }, 'url.pathname'); // returns '/p'
```

`null`, `undefined` and primitives are not traversable and yield the default.

Reserved segments (see [Reserved keys](#reserved-keys)) at any depth throw `ReservedKeyError`, even when a default is given — a reserved segment is illegal input, not a missing path. Wrap in try/catch to fall back to the default.

#### getKey

```
(target: object, key: string, defaultValue?: any): any
```

Read a single key off a plain object. The key is literal — no dot-path splitting. Reads with `Object.hasOwn`, so inherited members never leak as values. Returns `defaultValue` when the key is absent. Throws `TypeError` if `target` is not a plain object or `key` is not a string, and `ReservedKeyError` if `key` is reserved.

```js
getKey({ 'a.b': 1 }, 'a.b'); // returns 1
getKey({}, 'toString', null); // returns null, not Object.prototype.toString
```

#### isReserved

```
(key: string): boolean
```

True if `key` is one of the [reserved keys](#reserved-keys). Use this to guard a call site that
should skip, warn or otherwise degrade on a reserved key instead of catching
[`ReservedKeyError`](#reservedkeyerror) — see [Reserved keys](#reserved-keys) and
[Keyed maps](#keyed-maps).

```js
isReserved('__proto__'); // returns true
isReserved('toString'); // returns false
```

#### joinPath

```
(segments: string[]): string
```

Join segments into a dot-path, re-escaping literal dots inside a segment. Inverse of `splitPath`. Throws `TypeError` if `segments` is not an array. Non-string segments are coerced with `String`.

```js
joinPath(['a.b', 'c']); // returns 'a\\.b.c'
joinPath(splitPath('a\\.b.c')); // round-trips to 'a\\.b.c'
```

#### mergeObjects

```
(objects: object[]): object
```

Deep-merge an array of plain objects, left to right. Non-plain-object entries in the array are ignored; a non-array argument is returned as-is.

```js
mergeObjects([
  { a: 1, c: 4 },
  { a: 2, b: 3 },
]); // returns { a: 2, b: 3, c: 4 }
```

- **Non-mutating.** Inputs are never modified; a fresh object is returned.
- **Arrays are atomic leaves.** A later array replaces an earlier one rather than index-merging into it. Same for `Date`, `RegExp`, `Map` and any other non-plain value.
- **Reserved keys are skipped**, not thrown on — see [Reserved keys](#reserved-keys).

#### omit

```
(object: object, list: string[]): object
```

Remove an array of keys from a object. Uses `unset` from this package, and inherits its behaviour — dot-paths, and `ReservedKeyError` on a reserved segment.

```js
omit({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'd']); // returns { b: 2, c: 3 }
```

#### ReservedKeyError

```
new ReservedKeyError(segment: string)
```

Thrown by the path and key helpers when a segment or key is one of the [reserved keys](#reserved-keys). Extends `Error` with `name = 'ReservedKeyError'` and a `segment` property carrying the offending key. The message is always `` `Reserved key "${segment}"` `` — the fixed format is part of the contract, so the segment is surfaced in logs and serialized error payloads.

```js
try {
  set(state, userPath, value);
} catch (error) {
  if (error instanceof ReservedKeyError) {
    throw new ConfigError(`Reserved key "${error.segment}" cannot be used in :set_state`, {
      cause: error,
    });
  }
  throw error;
}
```

#### serializer

##### serializer.copy

##### serializer.deserialize

##### serializer.deserializeFromString

##### serializer.serialize

##### serializer.serializeToString

#### set

```
(target: any, path: string, value: any): any
```

Sets a value in a object at a key given by path, and returns `target`. Intermediate objects are created as needed (autovivification); the next segment decides whether a missing intermediate becomes an array or an object. Returns `target` unchanged if `target` is not a plain object or `path` is not a string.

```js
const obj = { a: 1 };
set(obj, 'b.c', 2);
// obj becomes { a: 1, b: { c: 2 } }

set(obj, 'd.0.e', 3);
// obj.d becomes [{ e: 3 }] - the integer segment creates an array
```

At each level of the walk the strict segment wins if it is present on the target. If it is absent, the segment is joined with successive following segments and the shortest joined key present on the target is used, so a write reaches a literal dotted key instead of creating a nested twin beside it. If nothing matches, the intermediate is created as usual.

```js
const obj = { 'a.b': { c: 1 } };
set(obj, 'a.b.c', 2);
// obj becomes { 'a.b': { c: 2 } } - no obj.a is created

const both = { a: { b: {} }, 'a.b': {} };
set(both, 'a.b.c', 1);
// writes to both.a.b.c - the strict segment wins when both are present
```

Paths are strings only; array paths are not supported. The leaf value always replaces what is there; to merge instead, write `set(obj, path, mergeObjects([get(obj, path), value]))`.

Reserved segments (see [Reserved keys](#reserved-keys)) at any depth throw `ReservedKeyError` before anything is written, so a rejected path leaves the target untouched.

#### setKey

```
(target: object, key: string, value: any): object
```

Set a single key on a plain object. The key is literal — no dot-path splitting, no autovivification. Throws `TypeError` if `target` is not a plain object or `key` is not a string, and `ReservedKeyError` if `key` is reserved (including on `Object.create(null)` targets, where the write would be safe — consistency beats per-target precision). Returns `target`.

```js
const obj = {};
setKey(obj, 'a.b', 1); // sets the literal key 'a.b'
// obj becomes { 'a.b': 1 }
```

Use `setKey` rather than `obj[userKey] = value` wherever the key is derived from user input — see [Keyed maps](#keyed-maps).

#### splitPath

```
(path: string): string[]
```

Split a dot-path into segments. A trailing backslash escapes the dot that follows, so the escaped dot stays inside the segment. Throws `TypeError` if `path` is not a string. A trailing backslash with nothing after it is kept as a literal backslash.

```js
splitPath('a.b.c'); // returns ['a', 'b', 'c']
splitPath('a\\.b.c'); // returns ['a.b', 'c']
```

#### stableStringify

```
(
  object: any
  options?: {
    cmp?: function,
    cycles?: boolean,
    space?: string | number,
    replacer?: function
  }
)
```

Derived from https://github.com/substack/json-stable-stringify

Returns a deterministic JSON stringified object.

#### swap

```
(
  arr: any[],
  from: number,
  to: number
)
```

Swaps the object at the from index with the object at the to index.

```js
swap([0, 1, 2, 3, 4], 2, 3); // returns [0, 1, 3, 2, 4]
```

#### type

A collection of type predicates used across the monorepo. Prefer these over native checks so behaviour stays consistent.

```
type.typeOf(value): string
```

Returns the Lowdefy type name: `'undefined'`, `'null'`, `'boolean'`, `'number'`, `'bigint'`, `'string'`, `'symbol'`, `'array'`, `'date'`, `'error'`, `'regexp'`, `'map'`, `'set'`, `'weakmap'`, `'weakset'`, `'promise'`, `'function'`, a typed-array/`'buffer'` name, `'object'` for plain objects, or the lowercased constructor name for anything else (`new URL(...)` is `'url'`).

| Predicate       | True for                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `isArray`       | `Array.isArray`                                                                                                   |
| `isObject`      | plain objects only — `Object.create(null)` yes, `new URL(...)` no                                                 |
| `isString`      | `typeof === 'string'`                                                                                             |
| `isRegExp`      | `instanceof RegExp`                                                                                               |
| `isFunction`    | any callable, generator functions included                                                                        |
| `isBoolean`     | `typeof === 'boolean'`                                                                                            |
| `isNumber`      | `typeof === 'number'` and finite — `NaN` and `Infinity` are false                                                 |
| `isNumeric`     | `Number(value)` is not `NaN` — note `''`, `null` and `[]` coerce to `0`, so true                                  |
| `isInt`         | `Number.isInteger`                                                                                                |
| `isDate`        | `instanceof Date` with a valid time — `new Date('garbage')` is false                                              |
| `isError`       | `instanceof Error`                                                                                                |
| `isSet`         | a JS `Set` instance (not "is defined")                                                                            |
| `isNull`        | `null`                                                                                                            |
| `isUndefined`   | `undefined`                                                                                                       |
| `isNone`        | `null` **or** `undefined` — the check to reach for                                                                |
| `isPrimitive`   | `undefined`, `null`, string, number, boolean **and date**                                                         |
| `isEmptyObject` | a plain object with no own keys                                                                                   |
| `isDateString`  | an ISO-8601 date-time string                                                                                      |
| `isName`        | a valid Lowdefy id — `[a-zA-Z0-9_.]`, no leading/trailing `.`, no numeric-leading segment, not `lowdefy`-prefixed |
| `isOpRequest`   | a plain object with a `_request` key holding a valid name                                                         |

`enforceType(typeName, value)` returns the value when it matches `typeName`, and a safe fallback rather than throwing when it does not: `null` for `'string'` (empty strings included), `'number'`, `'date'`, `'primitive'` and `'object'`, `false` for `'boolean'`, `[]` for `'array'`, and for `'any'` the value unless it is `undefined`. An unknown `typeName` returns `null`.

`isPrimitive` treating `date` as primitive is a deliberate Lowdefy convention, not JS semantics. The `_type: primitive` operator is app-developer-facing — do not "fix" this without coordinating with the operators-js, blocks-antd selector, and nunjucks consumers.

Type identification uses `instanceof` only; there is no cross-realm (vm/iframe/worker) duck-typing.

#### unset

```
(object: object, property: string): boolean
```

Unset a property on a object. Supports dot-notation. Returns `true`, including when the path does not exist or an intermediate is missing or primitive (a no-op).

```js
const obj = { a: { b: [] } };
unset(obj, 'a.b'); // returns true
// obj becomes { a: {} }
```

Throws `TypeError('expected an object.')` if `object` is not a plain object. Returns `true` without doing anything if `property` is not a string.

Reserved segments (see [Reserved keys](#reserved-keys)) at any depth throw `ReservedKeyError`.

#### unsetKey

```
(target: object, key: string): object
```

Delete a single key from a plain object. The key is literal — no dot-path splitting. Deletes only own properties, so an absent key never touches the prototype chain. Throws `TypeError` if `target` is not a plain object or `key` is not a string, and `ReservedKeyError` if `key` is reserved. Returns `target`.

```js
const obj = { 'a.b': 1, c: 2 };
unsetKey(obj, 'a.b');
// obj becomes { c: 2 }
```

#### urlQuery

##### urlQuery.parse

```
(string: string): object
```

Parse a urlQuery serialized by urlQuery.stringify.

```js
urlQuery.parse('a=%7B%22b%22%3A%221%22%7D'); // returns { a: { b: '1' } }
```

Entries are written with `setKey`, so URL keys matching a [reserved key](#reserved-keys) are silently skipped and parsing continues (`?__proto__=1&a=2` parses to `{ a: 2 }`). Values that do not deserialize are kept as the raw string.

##### urlQuery.stringify

```
(object: object): string
```

Serialize a urlQuery object to use as URL query parameters. Nested objects are serialized using `serializer.serializeToString`.

```js
urlQuery.stringify({ a: { b: '1' } }); // returns 'a=%7B%22b%22%3A%221%22%7D'
```

## Other exports

| Export                      | Signature                                   | Purpose                                                                           |
| --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `builtinMessages`           | `object`                                    | Default `key -> message` map for `translate`.                                     |
| `cachedPromises`            | `({ getter, cache }) => (key) => Promise`   | Wraps an async getter so in-flight and resolved promises are served from a cache. |
| `extractErrorProps`         | `(error) => object`                         | Serializable error props, following `cause` chains, with cycle and depth limits.  |
| `getLocaleDateFormat`       | `(locale, style?) => string \| null`        | Locale date/datetime/time/month pattern (`'YYYY-MM-DD'` style tokens).            |
| `getLocaleDecimalSeparator` | `(locale) => string \| null`                | Locale decimal separator.                                                         |
| `getLocaleGroupSeparator`   | `(locale) => string \| null`                | Locale thousands separator.                                                       |
| `getOperatorType`           | `(value) => string \| null`                 | Normalized operator name for an operator object, else `null`.                     |
| `LRUCache`                  | `new LRUCache({ maxSize })`                 | Least-recently-used cache with `get`/`set`.                                       |
| `translate`                 | `({ key, values, locale, i18n }) => string` | Resolve and format an i18n message via `intl-messageformat`.                      |
| `wait`                      | `(ms) => Promise`                           | Promise resolving after `ms`.                                                     |

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
