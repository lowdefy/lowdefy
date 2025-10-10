<TITLE>
_event
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_event` operator gets a value from the `event` object. The `event` object is a data object provided to an [`action`](/events-and-actions) by an [`event`](/events-and-actions). This object is also available to a [`request or connection`](/connections-and-requests) called by the [`Request`](/Request) action.
</DESCRIPTION>

<USAGE>
```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any
}): any
```

###### string

If the `_event` operator is called with a string argument, the value of the key in the `event` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean

If the `_event` operator is called with boolean argument `true`, the entire `event` object is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `event` object is returned. One of `all` or `key` are required.
- `key: string`: The value of the key in the `event` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `event`. By default, `null` is returned if a value is not found.
  </USAGE>

<EXAMPLES>
###### Get the value of `my_key` from `event`:
```yaml
_event: my_key
```
```yaml
_event:
  key: my_key
```
Returns: The value of `my_key` in `event`.

###### Get the entire `event` object:

```yaml
_event: true
```

```yaml
_event:
  all: true
```

Returns: The entire `event` object.

###### Dot notation:

Assuming args:

```yaml
my_object:
  subfield: 'Value'
```

then:

```yaml
_event: my_object.subfield
```

```yaml
_event:
  key: my_object.subfield
```

Returns: `"Value"`.

###### Return a default value if the value is not found:

```yaml
_event:
  key: might_not_exist
  default: Default value
```

Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:

Assuming `event`:

```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```

then:

```yaml
_event: my_array.$.value
```

Returns: `0` when used from the first block (0th index) in a list.
</EXAMPLES>
