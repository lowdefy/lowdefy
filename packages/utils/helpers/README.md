# @lowdefy/helpers

Lowdefy helper functions

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
  }
): any
```

Get a value from a target object, using path with dot-notation. Returns `undefined` or the optional default value if the value is not found.

```js
get({ a: [{ b: 1 }] }, 'a.0.b'); // returns 1
get({ a: [{ b: 1 }] }, 'a.7.b', { default: 4 }); // returns 4
```

#### mergeObjects

```
(objects: objects[]): object
```

Merges an array of objects using `lodash.merge`

```js
mergeObjects([
  { a: 1, c: 4 },
  { a: 2, b: 3 },
]); // returns { a: 2, b: 3, c: 4 }
```

#### omit

```
(object: object, list: string[]): object
```

Remove an array of keys from a object. Uses `unset` from this package.

```js
omit({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'd']); // returns { b: 2, c: 3 }
```

#### serializer

##### serializer.copy

##### serializer.deserialize

##### serializer.deserializeFromString

##### serializer.serialize

##### serializer.serializeToString

#### set

```
(
  target: any,
  path: string,
  value: any
): void
```

Sets a value in a object at a key given by path.

```js
const obj = { a: 1 };
set(obj, 'b.c', 2);
// obj becomes { a: 1, b: { c: 2 } }
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

#### unset

```
(object: object, property: 'string')
```

Unset a property on a object. Supports dot-notation.

```js
const obj = { a: { b: [] } };
unset(obj, 'a.b'); //
// obj becomes { a: {} }
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

##### urlQuery.stringify

```
(object: object): string
```

Serialize a urlQuery object to use as URL query parameters. Nested objects are serialized using `serializer.serializeToString`.

```js
urlQuery.stringify({ a: { b: '1' } }); // returns 'a=%7B%22b%22%3A%221%22%7D'
```

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
