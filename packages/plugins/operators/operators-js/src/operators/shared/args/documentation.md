<TITLE>_args</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_args` operator gets a value from the `arguments` array passed to a function operator. The `arguments` array is an array of all the positional arguments passed to the function.</DESCRIPTION>
<USAGE>(key: string): any
(key: integer): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string | integer,
  default?: any
}): any
###### string
If the `_args` operator is called with a string argument, the value of the key in the `arguments` array is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### integer

If the `_args` operator is called with a integer argument, the value at that index in the `arguments` array is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean

If the `_args` operator is called with boolean argument `true`, the entire `arguments` array is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `arguments` array is returned. One of `all` or `key` are required.
- `key: string | integer`: The value of the key or index in the `arguments` array is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `arguments`. By default, `null` is returned if a value is not found.</USAGE>
  <EXAMPLES>###### Map over an array:

```yaml
_array.map:
  on:
    - firstName: Ted
      lastName: Mosby
    - firstName: Robin
      lastName: Scherbatsky
    - firstName: Marshall
      lastName: Eriksen
    - firstName: Lily
      lastName: Aldrin
    - firstName: Barney
      lastName: Stinson
  callback:
    _function:
      __string.concat:
        - __args: 0.firstName
        - ' '
        - __args: 0.lastName
```

Returns:

````yaml
- Ted Mosby
- Robin Scherbatsky
- Marshall Eriksen
- Lily Aldrin
- Barney Stinson
```</EXAMPLES>
````
