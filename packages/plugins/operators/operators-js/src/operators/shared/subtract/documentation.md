<TITLE>
_subtract
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_subtract` operator subtracts the second number from the first number. It takes an array of exactly 2 numbers and returns the difference.

Both values must be numbers; otherwise, an error will be thrown.
<DESCRIPTION>

<USAGE>
```
(values: [number, number]): number

###### values

An array containing exactly two numbers:
- First element: The minuend (number to subtract from)
- Second element: The subtrahend (number to subtract)
```
<USAGE>

<SCHEMA>
```yaml
_subtract:
  - number  # minuend
  - number  # subtrahend
```
<SCHEMA>

<EXAMPLES>
### Basic subtraction:
```yaml
_subtract:
  - 100
  - 25
```

Returns: `75`

### Calculate remaining balance:
```yaml
_subtract:
  - _state: account.balance
  - _state: payment.amount
```

Returns: Balance after payment

### Calculate discount amount:
```yaml
_subtract:
  - _state: original_price
  - _state: sale_price
```

Returns: Amount discounted

### Calculate remaining quantity:
```yaml
_subtract:
  - _state: stock.available
  - _state: order.quantity
```

Returns: Remaining stock after order

### Calculate days until deadline:
```yaml
_subtract:
  - _date.valueOf:
      _state: due_date
  - _date.valueOf:
      _date.now:
```

Returns: Milliseconds until deadline

### Calculate time elapsed:
```yaml
_subtract:
  - _date.valueOf:
      _date.now:
  - _date.valueOf:
      _state: start_time
```

Returns: Milliseconds since start time

### Calculate profit margin:
```yaml
_subtract:
  - _state: revenue
  - _state: costs
```

Returns: Net profit

### Validate sufficient funds:
```yaml
_gte:
  - _subtract:
      - _state: available_credit
      - _state: cart_total
  - 0
```

Returns: `true` if enough credit remains
<EXAMPLES>
