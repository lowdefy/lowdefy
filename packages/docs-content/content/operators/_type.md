# _type

```
(type: enum): boolean
(arguments: {
  type: string,
  on?: any,
  key?: string
}): boolean
```

The `_type` operator performs a type test on an object, and returns true if the object is of the specified type.

The regex operator has shorthand argument definitions that can be used on web client.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### object
  - `type: enum`: __Required__ - The type to test. Can be one of:
    - `string`
    - `array`
    - `date`
    - `object`
    - `boolean`
    - `number`
    - `integer`
    - `null`
    - `undefined`
    - `none` (`null` or `undefined`)
    - `empty` (`null`, `undefined`, `''`, or `[]` - note that `0`, `false` and `{}` are not empty)
    - `primitive` (`undefined`, `null`, `string`, `number`, `boolean`, or `date`)
  - `on: any`: The value to test. One of `on` or `key` must be specified unless the operator is used in an input block.
  - `key: string`: The key of a value in `state` to test. One of `on` or `key` must be specified unless the operator is used in an input block.

###### string
The type to test. The string shorthand can only be used in an input block, and the tested value will be the block's value.

#### Examples

###### Check if a value is a number:
```yaml
_type:
  type: number
  on:
    _state: input
```
Returns: `true` if a number.

###### Using the key of the value in `state`:
```yaml
_type:
  type: number
  key: input
```
Returns: `true` if a number.

###### Using the value of the block in which the operator is evaluated:
```yaml
id: input
type: TextInput
validate:
  - message: This field is required.
    status: error
    pass:
      _not:
        _type: empty
```
Returns: `true` if the input has a value. This is the test the `required` block field applies.

###### Check if a value is empty:
```yaml
_type:
  type: empty
  on:
    _state: selected_tags
```
Returns: `true` if `selected_tags` is `null`, `undefined`, `''` or `[]`, and `false` for any
other value, including `0`, `false` and `{}`.

###### Test if an id in the `urlQuery` is undefined or null:
```yaml
_type:
  type: none
  on:
    _url_query: id
```
Returns: `true` if the id is none,
