<TITLE>
_sum
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_sum` operator adds all numbers in an array together. It takes an array of values and returns the sum of all numeric values. Non-numeric values in the array are ignored.

The initial value is 0, so an empty array returns 0.
<DESCRIPTION>

<USAGE>
```
(values: any[]): number

###### values

An array of values to add. Non-numeric values are ignored.
```
<USAGE>

<SCHEMA>
```yaml
_sum:
  - number1
  - number2
  - number3
```
<SCHEMA>

<EXAMPLES>
### Add numbers:
```yaml
_sum:
  - 10
  - 20
  - 30
```

Returns: `60`

### Calculate order total:
```yaml
_sum:
  - _state: subtotal
  - _state: tax
  - _state: shipping
```

Returns: Order total

### Sum values from state:
```yaml
_sum:
  - _state: item1.price
  - _state: item2.price
  - _state: item3.price
```

Returns: Total of all item prices

### Calculate balance:
```yaml
_sum:
  - _state: opening_balance
  - _state: deposits
  - _product:
      - -1
      - _state: withdrawals
```

Returns: Current balance

### Sum array of amounts:
```yaml
_array.reduce:
  on:
    _state: transactions
  callback:
    _function:
      __sum:
        - __args: '0'
        - __args: '1.amount'
  initialValue: 0
```

Returns: Total of all transaction amounts

### Calculate total score:
```yaml
_sum:
  - _state: round1_score
  - _state: round2_score
  - _state: round3_score
  - _state: bonus_points
```

Returns: Combined score

### Calculate weighted total:
```yaml
_sum:
  - _product:
      - _state: assignment_score
      - 0.3
  - _product:
      - _state: midterm_score
      - 0.3
  - _product:
      - _state: final_score
      - 0.4
```

Returns: Weighted grade calculation

### Sum with null handling:
```yaml
_sum:
  - _if_none:
      - _state: value1
      - 0
  - _if_none:
      - _state: value2
      - 0
  - _if_none:
      - _state: value3
      - 0
```

Returns: Sum treating null values as 0
<EXAMPLES>
