<TITLE>_json</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_json` parses and writes JSON strings.</DESCRIPTION>
<USAGE>The `_json` parses and writes JSON strings.</USAGE>
<EXAMPLES>###### Parse a JSON string:
```yaml
_json.parse: '{"key": "Value", "boolean": true, "array": [1, 2]}'
```
Returns:
```yaml
key: Value
boolean: true
array:
  - 1
  - 2
```

###### Stringify an object as JSON:

```yaml
_json.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
```

```yaml
_json.stringify:
  - key: Value
    boolean: true
    array:
      - 1
      - 2
```

Returns (as a string):

```text
'{
  "key": "Value",
  "boolean": true,
  "array": [
    1,
    2
  ]
}'
```

###### Stable option:

```yaml
_json.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
  options:
    stable: true
```

Returns (as a string):

```text
'{
  "array": [
    1,
    2
  ],
  "boolean": true,
  "key": "Value"
}'
```

###### Space option:

```yaml
_json.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
  options:
    space: 0
```

Returns `'{"key":"Value","boolean":true,"array":[1,2]}'`</EXAMPLES>
