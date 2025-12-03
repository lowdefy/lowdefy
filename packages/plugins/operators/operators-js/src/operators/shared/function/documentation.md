<TITLE>
_function
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_function` operator creates a callback function for use with array methods like `map`, `filter`, `reduce`, `find`, `every`, and `some`. Inside the function body, you use operators with double underscores (`__`) prefix, and access callback arguments using `__args`.

The function body is evaluated for each iteration of the array method, with arguments passed through `__args`:
- `__args: '0'` - Current element
- `__args: '1'` - Current index
- `__args: '2'` - Full array

The double underscore prefix (`__`) indicates operators that should be evaluated within the function context rather than immediately.
<DESCRIPTION>

<USAGE>
```
(body: any): function

###### body

The function body containing operators prefixed with double underscores (`__`).
Access arguments using `__args` operator.
```
<USAGE>

<SCHEMA>
```yaml
_function:
  # Use double underscore prefix for operators inside function
  __operatorName: params

  # Access function arguments
  __args: '0'       # First argument (current element)
  __args: '1'       # Second argument (index)
  __args: '0.field' # Nested field access
```
<SCHEMA>

<EXAMPLES>
### Simple filter callback:
```yaml
_array.filter:
  on:
    - active: true
    - active: false
    - active: true
  callback:
    _function:
      __args: '0.active'
```

Returns: `[{ active: true }, { active: true }]`

### Transform array elements with map:
```yaml
_array.map:
  on:
    - name: Product A
      price: 100
    - name: Product B
      price: 200
  callback:
    _function:
      label:
        __args: '0.name'
      value:
        __args: '0.price'
```

Returns: `[{ label: 'Product A', value: 100 }, { label: 'Product B', value: 200 }]`

### Complex filter with multiple conditions:
```yaml
_array.filter:
  on:
    _state: inventory_items
  callback:
    _function:
      __and:
        - __gt:
            - __args: '0.quantity'
            - 0
        - __eq:
            - __args: '0.status'
            - available
```

Returns: Items that are available and have quantity > 0

### Sum values with reduce:
```yaml
_array.reduce:
  on:
    - amount: 150
    - amount: 250
    - amount: 100
  callback:
    _function:
      __sum:
        - __args: '0'
        - __args: '1.amount'
  initialValue: 0
```

Returns: `500`

### Find item by ID:
```yaml
_array.find:
  on:
    _state: products
  callback:
    _function:
      __eq:
        - __args: '0.id'
        - _state: selected_product_id
```

Returns: The product object matching the selected ID

### Check if any items match condition:
```yaml
_array.some:
  on:
    _state: cart_items
  callback:
    _function:
      __and:
        - __eq:
            - __args: '0.category'
            - electronics
        - __gt:
            - __args: '0.price'
            - 1000
```

Returns: `true` if any electronics item costs more than 1000

### String concatenation in map:
```yaml
_array.map:
  on:
    - first: John
      last: Smith
    - first: Jane
      last: Doe
  callback:
    _function:
      __string.concat:
        - __args: '0.first'
        - ' '
        - __args: '0.last'
```

Returns: `['John Smith', 'Jane Doe']`
<EXAMPLES>
