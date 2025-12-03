<TITLE>
_lte
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_lte` operator performs a less than or equal comparison (`<=`) between two values. It takes an array of exactly 2 values and returns `true` if the first value is less than or equal to the second value, `false` otherwise.

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
_lte:
  - value1
  - value2
```
<SCHEMA>

<EXAMPLES>
### Compare two numbers:
```yaml
_lte:
  - 10
  - 10
```

Returns: `true`

### Check if within budget:
```yaml
_lte:
  - _state: order.total
  - _state: available_budget
```

Returns: `true` if order is within budget

### Validate maximum quantity:
```yaml
_lte:
  - _state: quantity_requested
  - _state: quantity_available
```

Returns: `true` if request can be fulfilled

### Check deadline:
```yaml
_lte:
  - _date.now:
  - _state: submission_deadline
```

Returns: `true` if still within deadline

### Limit selections:
```yaml
id: add_item_button
type: Button
properties:
  disabled:
    _not:
      _lte:
        - _array.length:
            _state: selected_items
        - 5
```

Button disabled when more than 5 items selected

### Validate file size:
```yaml
_lte:
  - _state: file.size
  - 10485760
```

Returns: `true` if file is 10MB or less

### Check priority level:
```yaml
_lte:
  - _state: task.priority
  - 3
```

Returns: `true` if priority is high (1-3)
<EXAMPLES>
