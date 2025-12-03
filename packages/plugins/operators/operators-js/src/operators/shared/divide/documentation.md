<TITLE>
_divide
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_divide` operator divides the first number by the second number. It takes an array of exactly 2 numbers and returns the result of the division.

Division by zero is not allowed and will throw an error.
<DESCRIPTION>

<USAGE>
```
(values: [number, number]): number

###### values

An array containing exactly two numbers:
- First element: The dividend (number to be divided)
- Second element: The divisor (number to divide by)
```
<USAGE>

<SCHEMA>
```yaml
_divide:
  - number  # dividend
  - number  # divisor
```
<SCHEMA>

<EXAMPLES>
### Basic division:
```yaml
_divide:
  - 100
  - 4
```

Returns: `25`

### Calculate percentage:
```yaml
_divide:
  - _state: completed_tasks
  - _state: total_tasks
```

Returns: The fraction of completed tasks (e.g., `0.75` if 75 of 100 tasks are completed)

### Calculate unit price:
```yaml
_divide:
  - _state: order.total_amount
  - _state: order.quantity
```

Returns: Price per unit

### Calculate average from sum and count:
```yaml
_divide:
  - _sum:
      - _state: scores
  - _array.length:
      _state: scores
```

Returns: Average of all scores

### Convert to percentage with multiplication:
```yaml
_product:
  - _divide:
      - _state: items_sold
      - _state: items_available
  - 100
```

Returns: Percentage sold (e.g., `80` for 80%)

### Calculate discount rate:
```yaml
_divide:
  - _subtract:
      - _state: original_price
      - _state: sale_price
  - _state: original_price
```

Returns: Discount rate as decimal (e.g., `0.2` for 20% off)
<EXAMPLES>
