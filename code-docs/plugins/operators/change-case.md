# @lowdefy/operators-change-case

String case conversion operator using [change-case](https://github.com/blakeembrey/change-case).

## Operator

| Operator | Purpose |
|----------|---------|
| `_change_case` | Convert string case |

## Usage

```yaml
result:
  _change_case:
    on: hello world
    case: camelCase
```

## Case Types

| Case | Input | Output |
|------|-------|--------|
| `camelCase` | hello world | helloWorld |
| `capitalCase` | hello world | Hello World |
| `constantCase` | hello world | HELLO_WORLD |
| `dotCase` | hello world | hello.world |
| `headerCase` | hello world | Hello-World |
| `noCase` | helloWorld | hello world |
| `paramCase` | hello world | hello-world |
| `pascalCase` | hello world | HelloWorld |
| `pathCase` | hello world | hello/world |
| `sentenceCase` | hello world | Hello world |
| `snakeCase` | hello world | hello_world |

## Examples

### URL Slug

```yaml
slug:
  _change_case:
    on:
      _state: title
    case: paramCase
```

### Constant Name

```yaml
constName:
  _change_case:
    on:
      _state: fieldName
    case: constantCase
```

### Display Title

```yaml
displayName:
  _change_case:
    on:
      _state: key
    case: capitalCase
```
