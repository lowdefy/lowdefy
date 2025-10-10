<TITLE>
_input
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_input` operator gets a value from the [`input`](/page-and-app-state) object. The `input` is a data object that can be set when linking to a new page using the [`Link`](/link) action, and can be used to set data like a `id` when switching to a new page. Unlike `urlQuery`, the `input` is not visible, and cannot be changed by the user, but if the page is reloaded, the `input` is lost.
</DESCRIPTION>

<USAGE>
```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

###### string

If the `_input` operator is called with a string argument, the value of the key in the `input` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean

If the `_input` operator is called with boolean argument `true`, the entire `input` object is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `input` object is returned. One of `all` or `key` are required.
- `key: string`: The value of the key in the `input` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `input`. By default, `null` is returned if a value is not found.
  </USAGE>

<EXAMPLES>
###### Get the value of `my_key` from `input`:
```yaml
_input: my_key
```
```yaml
_input:
  key: my_key
```
Returns: The value of `my_key` in `input`.

###### Get the entire `input` object:

```yaml
_input: true
```

```yaml
_input:
  all: true
```

Returns: The entire `input` object.

###### Dot notation:

Assuming input:

```yaml
my_object:
  subfield: 'Value'
```

then:

```yaml
_input: my_object.subfield
```

```yaml
_input:
  key: my_object.subfield
```

Returns: `"Value"`.

###### Return a default value if the value is not found:

```yaml
_input:
  key: might_not_exist
  default: Default value
```

Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:

Assuming `input`:

```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```

then:

```yaml
_input: my_array.$.value
```

Returns: `0` when used from the first block (0th index) in a list.
</EXAMPLES>
