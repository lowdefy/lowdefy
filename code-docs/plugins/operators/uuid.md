# @lowdefy/operators-uuid

UUID generation operator.

## Operator

| Operator | Purpose       |
| -------- | ------------- |
| `_uuid`  | Generate UUID |

## Usage

Generate a new UUID v4:

```yaml
newId:
  _uuid: v4
```

## Versions

| Version | Description          |
| ------- | -------------------- |
| `v1`    | Timestamp-based      |
| `v4`    | Random (recommended) |

## Examples

### Generate ID for New Record

```yaml
requests:
  - id: createItem
    type: MongoDBInsertOne
    properties:
      doc:
        _id:
          _uuid: v4
        name:
          _state: name
```

### Unique Key for List Items

```yaml
events:
  onClick:
    - id: addItem
      type: SetState
      params:
        items:
          _array:
            - _spread:
                _state: items
            - id:
                _uuid: v4
              value: ''
```

## Note

UUIDs generated client-side are visible in source. For security-sensitive IDs, generate server-side.
