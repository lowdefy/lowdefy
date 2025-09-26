<TITLE>_user</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_user` operator gets a value from the [`user`](/user-object) object. The `user` object contains the data in the user idToken if OpenID Connect authentication is configured and a user is logged in.</DESCRIPTION>
<USAGE>```yaml
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```
###### string
If the `_user` operator is called with a string argument, the value of the key in the `user` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean

If the `_user` operator is called with boolean argument `true`, the entire `user` object is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `user` object is returned. One of `all` or `key` are required.
- `key: string`: The value of the key in the `user` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `user`. By default, `null` is returned if a value is not found.</USAGE>
  <EXAMPLES>###### Get the value of `name` from `user`:

```yaml
_user: name
```

```yaml
_user:
  key: name
```

Returns: The value of `name` in `user`.

###### Get the entire `user` object:

```yaml
_user: true
```

```yaml
_user:
  all: true
```

Returns: The entire `user` object.

###### Dot notation:

Assuming user:

```yaml
sub: abc123
name: User Name
my_object:
  subfield: 'Value'
```

then:

```yaml
_user: my_object.subfield
```

```yaml
_user:
  key: my_object.subfield
```

Returns: `"Value"`.

###### Return a default value if the value is not found:

```yaml
_user:
  key: might_not_exist
  default: Default value
```

Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:

Assuming `user`:

```yaml
sub: abc123
name: User Name
my_array:
  - value: 0
  - value: 1
  - value: 2
```

then:

```yaml
_user: my_array.$.value
```

Returns: `0` when used from the first block (0th index) in a list.</EXAMPLES>
