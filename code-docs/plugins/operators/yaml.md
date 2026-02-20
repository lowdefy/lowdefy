# @lowdefy/operators-yaml

YAML parsing and stringification operators.

## Operators

| Operator | Purpose |
|----------|---------|
| `_yaml_parse` | Parse YAML string |
| `_yaml_stringify` | Convert to YAML string |

## _yaml_parse

Parse YAML string to object:

```yaml
data:
  _yaml_parse:
    _state: yamlString
```

## _yaml_stringify

Convert object to YAML string:

```yaml
yamlOutput:
  _yaml_stringify:
    _state: configData
```

## Use Cases

### Load Config from Text Input

```yaml
parsedConfig:
  _yaml_parse:
    _state: configInput
```

### Display Data as YAML

```yaml
- id: yamlPreview
  type: TextArea
  properties:
    disabled: true
    value:
      _yaml_stringify:
        _request: getConfig
```

### Dynamic Configuration

```yaml
# Parse user-provided YAML for custom settings
settings:
  _yaml_parse:
    _state: customSettings
```
