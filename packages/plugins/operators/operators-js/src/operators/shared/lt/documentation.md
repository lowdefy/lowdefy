<TITLE>
_lt
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_lt` operator performs a less than comparison (`<`) between two values. It takes an array of exactly 2 values and returns `true` if the first value is less than the second value, `false` otherwise.

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
_lt:
  - value1
  - value2
```
<SCHEMA>

<EXAMPLES>
### Compare two numbers:
```yaml
_lt:
  - 5
  - 10
```

Returns: `true`

### Check if below minimum:
```yaml
_lt:
  - _state: inventory.stock
  - 10
```

Returns: `true` if stock is below 10 (low stock alert)

### Check if date is in the past:
```yaml
_lt:
  - _state: expiry_date
  - _date.now:
```

Returns: `true` if item has expired

### Validate maximum character limit:
```yaml
_lt:
  - _string.length:
      _state: comment
  - 500
```

Returns: `true` if comment is under limit

### Show warning for low balance:
```yaml
id: low_balance_alert
type: Alert
visible:
  _lt:
    - _state: account.balance
    - 100
properties:
  message: Your balance is running low
  type: warning
```

Alert shows when balance drops below 100

### Check remaining capacity:
```yaml
_lt:
  - _state: current_count
  - _state: maximum_capacity
```

Returns: `true` if there's still room

### Validate age limit:
```yaml
_lt:
  - _state: participant.age
  - 13
```

Returns: `true` if participant is under 13
<EXAMPLES>
