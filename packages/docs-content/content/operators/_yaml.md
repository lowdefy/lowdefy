# _yaml

The `_yaml` parses and writes YAML strings.

# Operator methods:

## _yaml.parse

```
({on: string, options?: object}): object
([on: string, options?: object]): object
```

The `_yaml.parse` method parses a YAML string into an object.

#### Arguments

###### object
  - `on: string`: String to parse.
  - `options?: object`: Optional settings. See the [YAML.parse: method here](https://eemeli.org/yaml/#parse-options) for supported settings.

#### Examples

###### Parse a YAML string:
```yaml
_yaml.parse:
  on: |
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
or:
```yaml
_yaml.parse:
  - |
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
Returns:
```
key: Value
boolean: true
array:
  - 1
  - 2
```

## _yaml.stringify

```
({on: any, options?: object}): string
([on: any, options?: object]): string
```

The `_yaml.stringify` method creates a YAML string from an object.

#### Arguments

###### object
  - `on: any`: The object to stringify.
  - `options?: object`: Optional settings. See the [YAML.stringify: method here](https://eemeli.org/yaml/#tostring-options) for supported settings.

#### Examples

###### Stringify an object as YAML:
```yaml
_yaml.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
or:
```yaml
_yaml.stringify:
  - key: Value
    boolean: true
    array:
      - 1
      - 2
```
Returns (as a string):
```text
key: Value
boolean: true
array:
  - 1
  - 2
```
