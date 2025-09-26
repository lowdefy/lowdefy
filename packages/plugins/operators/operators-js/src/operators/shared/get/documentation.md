<TITLE>_get</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_get` operator gets a value from the object or array specified in `from`. If the `key` is not found, the provided `default`, or `null` if not specified, are returned.</DESCRIPTION>
<USAGE>(arguments: {
  from: any[] | object,
  key: string,
  default?: any,
}): any
###### object
  - `from: any[] | object`: __Required__ - The object to get the value from.
  - `key: string`: __Required__ - The value of the key or array index to get from the `from` object or array. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported.
  - `default: any`: A value to return if the `key` is not found in `from`. By default, `null` is returned if a value is not found.</USAGE>
<EXAMPLES>###### Get the value of a key from an object:
```yaml
_get:
  from:
    name: George
    age: 22
  key: name
```
Returns: `"George"`

###### Use \_get to as a switch statement to choose an Icon name:

```yaml
_get:
  key:
    _state: status
  from:
    new: AiTwoTonePlusCircle
    escalated: AiTwoToneExclamationCircle
    investigation_started: AiTwoToneTool
    client_contacted: AiTwoToneSound
    awaiting_confirmation: AiOutlineLike
    closed: AiOutlineStop
```

Returns: The icon corresponding to the status in state.

###### Get from an array (arrays are `0` indexed):

```yaml
_get:
  from:
    - id: 1
      name: Joe
    - id: 2
      Name: Dave
  key: 0.name
```

Returns: `1`.

###### Dot notation:

```yaml
_get:
  from:
    my_object:
      subfield: 'Value'
  key: my_object.subfield
```

Returns: `"Value"`.

###### Return a default value if the value is not found:

```yaml
_get:
  from:
    value1: 1
  key: value2
  default: 99
```

Returns: `99`.

###### Block list indices:

Assuming `state`:

```yaml
_get:
  from:
    my_array:
      - value: 0
      - value: 1
      - value: 2
  key: my_array.$.value
```

Returns: `0` when used from the first block (0th index) in a list.</EXAMPLES>
