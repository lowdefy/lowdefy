# _index

```
(key: string): any
(key: integer): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string | integer,
  default?: any
}): any
```

The `_index` operator gets a value from the `list indices` array of a block. The `list indices` array is an array of the indices of all [`list`](/lists) block areas which the block is a part of.

#### Arguments

###### integer
If the `_index` operator is called with a integer argument, the value at that index in the `indices` array is returned. If the value is not found, `null` is returned..

###### string
If the `_args` operator is called with a string argument, the value at that index in the `indices` array is returned. If the value is not found, `null` is returned.

###### boolean
If the `_index` operator is called with boolean argument `true`, the entire `indices` array is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `indices` array is returned. One of `all` or `key` are required.
  - `key: string | integer`: The value of the index in the `indices` array is returned. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `arguments`. By default, `null` is returned if a value is not found.

#### Examples

###### Get a index:

Assuming the block is in the fourth content area of a `list` block.
```yaml
_index: 0
```
Returns: `3`

###### Get all indices:

Assuming two nested list blocks, with the block in the fourth content area of the first `list` block, and the first content area of the nested `list` block.
```yaml
_index: true
```
Returns: `[3, 0]`
