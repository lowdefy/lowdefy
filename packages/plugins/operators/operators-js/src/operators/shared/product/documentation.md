<TITLE>
_product
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_product` operator multiplies all numbers in an array together. It takes an array of values and returns the product of all numeric values. Non-numeric values in the array are ignored.

The initial value is 1, so an empty array returns 1.
<DESCRIPTION>

<USAGE>
```
(values: any[]): number

###### values

An array of values to multiply. Non-numeric values are ignored.
```
<USAGE>

<SCHEMA>
```yaml
_product:
  - number1
  - number2
  - number3
```
<SCHEMA>

<EXAMPLES>
### Multiply numbers:
```yaml
_product:
  - 2
  - 3
  - 4
```

Returns: `24`

### Calculate total price:
```yaml
_product:
  - _state: quantity
  - _state: unit_price
```

Returns: Total price (quantity × unit price)

### Apply discount:
```yaml
_product:
  - _state: subtotal
  - _subtract:
      - 1
      - _state: discount_rate
```

Returns: Discounted price (e.g., subtotal × 0.8 for 20% off)

### Calculate area:
```yaml
_product:
  - _state: dimensions.length
  - _state: dimensions.width
```

Returns: Area of rectangle

### Calculate volume:
```yaml
_product:
  - _state: box.length
  - _state: box.width
  - _state: box.height
```

Returns: Volume of box

### Apply tax rate:
```yaml
_product:
  - _state: subtotal
  - _sum:
      - 1
      - _state: tax_rate
```

Returns: Total with tax (e.g., subtotal × 1.15 for 15% tax)

### Calculate compound value:
```yaml
_product:
  - _state: principal
  - _math.pow:
      base:
        _sum:
          - 1
          - _state: interest_rate
      exponent:
        _state: years
```

Returns: Compound interest calculation

### Calculate line item total:
```yaml
_array.map:
  on:
    _state: order_items
  callback:
    _function:
      item_total:
        __product:
          - __args: '0.quantity'
          - __args: '0.price'
```

Returns: Array with calculated totals for each item
<EXAMPLES>
