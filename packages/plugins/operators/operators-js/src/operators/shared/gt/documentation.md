<TITLE>
_gt
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_gt` operator performs a greater than comparison (`>`) between two values. It takes an array of exactly 2 values and returns `true` if the first value is greater than the second value, `false` otherwise.

This operator works with numbers, strings (lexicographic comparison), and dates.
<DESCRIPTION>

<USAGE>
```
(values: [any, any]): boolean

###### values

An array containing exactly two values to compare:
- First element: The value to test
- Second element: The value to compare against
```
<USAGE>

<SCHEMA>
```yaml
_gt:
  - value1
  - value2
```
<SCHEMA>

<EXAMPLES>
### Compare two numbers:
```yaml
_gt:
  - 10
  - 5
```

Returns: `true`

### Check if quantity exceeds threshold:
```yaml
_gt:
  - _state: inventory.quantity
  - 100
```

Returns: `true` if quantity is greater than 100

### Validate minimum order amount:
```yaml
_gt:
  - _state: cart.total
  - 50
```

Returns: `true` if cart total exceeds 50

### Compare dates:
```yaml
_gt:
  - _state: due_date
  - _date.now:
```

Returns: `true` if due date is in the future

### Show warning for high values:
```yaml
id: warning_message
type: Alert
visible:
  _gt:
    - _state: risk_score
    - 80
properties:
  message: Risk score is above acceptable threshold
  type: warning
```

Alert shows when risk score exceeds 80

### Check array length:
```yaml
_gt:
  - _array.length:
      _state: selected_items
  - 0
```

Returns: `true` if at least one item is selected

### Validate age requirement:
```yaml
_gt:
  - _state: applicant.age
  - 18
```

Returns: `true` if applicant is older than 18
<EXAMPLES>
