<TITLE>
_gte
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_gte` operator performs a greater than or equal comparison (`>=`) between two values. It takes an array of exactly 2 values and returns `true` if the first value is greater than or equal to the second value, `false` otherwise.

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
_gte:
  - value1
  - value2
```
<SCHEMA>

<EXAMPLES>
### Compare two numbers:
```yaml
_gte:
  - 10
  - 10
```

Returns: `true`

### Check minimum quantity requirement:
```yaml
_gte:
  - _state: order.quantity
  - 5
```

Returns: `true` if quantity is 5 or more

### Validate score passes threshold:
```yaml
_gte:
  - _state: exam.score
  - 60
```

Returns: `true` if score is at least 60

### Check sufficient balance:
```yaml
_gte:
  - _state: account.balance
  - _state: payment.amount
```

Returns: `true` if balance covers the payment

### Enable feature based on version:
```yaml
id: new_feature
type: Box
visible:
  _gte:
    - _state: app_version
    - 2.0
```

Feature visible for version 2.0 and above

### Validate minimum selections:
```yaml
_gte:
  - _array.length:
      _state: selected_options
  - 3
```

Returns: `true` if at least 3 options selected

### Check membership level:
```yaml
_gte:
  - _state: user.membership_level
  - _state: required_level
```

Returns: `true` if user level meets requirement
<EXAMPLES>
