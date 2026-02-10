# @lowdefy/operators-diff

Object diffing operator for Lowdefy.

## Operator

| Operator | Purpose |
|----------|---------|
| `_diff` | Compare objects/arrays |

## Usage

```yaml
changes:
  _diff:
    original:
      _state: originalData
    updated:
      _state: updatedData
```

## Output Format

Returns array of changes:

```javascript
[
  { kind: 'N', path: ['newField'], rhs: 'value' },  // New
  { kind: 'D', path: ['removed'], lhs: 'old' },    // Deleted
  { kind: 'E', path: ['changed'], lhs: 'old', rhs: 'new' },  // Edited
  { kind: 'A', path: ['array'], index: 0, item: { kind: 'N', rhs: 'item' } }  // Array
]
```

## Change Types

| Kind | Meaning |
|------|---------|
| `N` | New - property added |
| `D` | Deleted - property removed |
| `E` | Edited - value changed |
| `A` | Array - array element changed |

## Use Cases

### Track Form Changes

```yaml
hasChanges:
  _not:
    _eq:
      - _diff:
          original:
            _state: __originalForm
          updated:
            _state: formData
      - null
```

### Show Modified Fields

```yaml
modifiedFields:
  _array:
    _map:
      on:
        _diff:
          original:
            _state: original
          updated:
            _state: current
      iterate:
        _get:
          from:
            _args: 0
          key: path.0
```
