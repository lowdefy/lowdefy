# _json

The `_json` parses and writes JSON strings.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _json.parse

```
(value: string): any
```

The `_json.parse` method parses a JSON string into an object.

#### Arguments

###### string
The string to parse.

#### Examples

###### Parse a JSON string:
```yaml
_json.parse: '{"key": "Value", "boolean": true, "array": [1, 2]}'
```
Returns:
```
key: Value
boolean: true
array:
  - 1
  - 2
```

## _json.stringify

```
({on: any, options?: object}): string
([on: any, options?: object]): string
```

The `_json.stringify` method creates a JSON string from an object.

#### Arguments

###### object
  - `on: any`: The object to stringify.
  - `options: object`: Optional settings.
    - `stable: boolean`: If set to true, equal objects will be stringified to the same string. Object keys are sorted.
    - `space: number | string`: Used to insert whitespace to increase legibility. If a number, it is the number of space character to use. If a string, the string is used as whitespace. The default is `2`.

#### Examples

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
}''
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
Returns `'{"key":"Value","boolean":true,"array":[1,2]}'`
