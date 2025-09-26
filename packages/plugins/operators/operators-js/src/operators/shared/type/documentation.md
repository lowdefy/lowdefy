<TITLE>_type</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_type` operator performs a type test on an object, and returns true if the object is of the specified type.

The regex operator has shorthand argument definitions that can be used on web client.</DESCRIPTION>
<USAGE>```yaml
(type: enum): boolean
(arguments: {
type: string,
on?: any,
key?: string
}): boolean

````
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
    - `primitive` (`undefined`, `null`, `string`, `number`, `boolean`, or `date`)
  - `on: any`: The value to test. One of `on` or `key` must be specified unless the operator is used in an input block.
  - `key: string`: The key of a value in `state` to test. One of `on` or `key` must be specified unless the operator is used in an input block.

###### string
The type to test. The string shorthand can only be used in an input block, and the tested value will be the block's value.</USAGE>
<EXAMPLES>###### Check if a value is a number:
```yaml
_type:
  type: number
  on:
    _state: input
````

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
  - message: This field id required.
    status: error
    pass:
      _not:
        _type: none
```

Returns: `true` if the input is none.

###### Test if an id in the `urlQuery` is undefined or null:

```yaml
_type:
  type: none
  on:
    _url_query: id
```

Returns: `true` if the id is none,</EXAMPLES>
