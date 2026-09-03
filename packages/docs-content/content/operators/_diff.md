# _diff

# Operator methods:

## _diff.deep

```
(arguments: {lhs: any, rhs: any}): object[]
([lhs: any, rhs: any]): object[]
```

The `_diff.deep` method compares two objects and returns an object that describes the structural differences between the two objects.

#### Arguments

###### string
The string to decode.

#### Examples

###### Compare two objects using named args:
```yaml
_diff.deep:
  lhs:
    deleted: To be deleted
    edited: Edit me
    array: [1]
  rhs:
    new: New value
    edited: Edited
    array: [1, 2]
```

  ```yaml
_diff.deep:
  - deleted: To be deleted
    edited: Edit me
    array: [1]
  - new: New value
    edited: Edited
    array: [1, 2]
```
Both return:
```yaml
- kind: D
  path: [deleted]
  lhs: To be deleted
- kind: E
  path: [edited]
  lhs: Edit me
  rhs: Edited
- kind: A
  path: ['array']
  index: 1
  item:
    kind: N
    rhs: 2
- kind: N
  path: [new]
  rhs: New value
```
