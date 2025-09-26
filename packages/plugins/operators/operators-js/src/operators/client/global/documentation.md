<TITLE>
_global
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_global` operator gets a value from the [`global`](/page-and-app-state) object. The `global` object is a shared data object that can be accessed from any page in the app.
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

If the `_global` operator is called with a string argument, the value of the key in the `global` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean

If the `_global` operator is called with boolean argument `true`, the entire `global` object is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `global` object is returned. One of `all` or `key` are required.
- `key: string`: The value of the key in the `global` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `global`. By default, `null` is returned if a value is not found.
  </USAGE>

<EXAMPLES>
###### Get the value of `my_key` from `global`:
```yaml
_global: my_key
```
```yaml
_global:
  key: my_key
```
Returns: The value of `my_key` in `global`.

###### Get the entire `global` object:

```yaml
_global: true
```

```yaml
_global:
  all: true
```

Returns: The entire `global` object.

###### Dot notation:

Assuming global:

```yaml
my_object:
  subfield: 'Value'
```

then:

```yaml
_global: my_object.subfield
```

```yaml
_global:
  key: my_object.subfield
```

Returns: `"Value"`.

###### Return a default value if the value is not found:

```yaml
_global:
  key: might_not_exist
  default: Default value
```

Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:

Assuming `global`:

```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```

then:

```yaml
_global: my_array.$.value
```

Returns: `0` when used from the first block (0th index) in a list.
</EXAMPLES>
