<TITLE>
_array
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_array` operator provides access to JavaScript Array methods and properties. It allows you to manipulate arrays using standard JavaScript array operations like `map`, `filter`, `reduce`, `concat`, `slice`, `find`, and many more.

Methods that accept callbacks (like `map`, `filter`, `reduce`) use the `_function` operator to define the callback logic, with arguments accessed via the `_args` operator.

If `null` or `undefined` is passed as the array, it will be treated as an empty array `[]`.
<DESCRIPTION>

<USAGE>
```
_array.methodName: params

###### Methods

Available methods include:

- concat: Merge arrays
- copyWithin: Copy part of array to another location
- every: Test if all elements pass a test
- fill: Fill array with a value
- filter: Create array with elements that pass a test
- find: Find first element that passes a test
- findIndex: Find index of first element that passes a test
- flat: Flatten nested arrays
- includes: Check if array includes a value
- indexOf: Find index of a value
- join: Join array elements into a string
- lastIndexOf: Find last index of a value
- map: Transform each element
- reduce: Reduce array to single value
- reduceRight: Reduce from right to left
- reverse: Reverse array order
- slice: Extract portion of array
- some: Test if any element passes a test
- sort: Sort array elements
- splice: Add/remove elements
- length: Get array length

````
<USAGE>

<SCHEMA>
```yaml
# Single argument methods
_array.methodName: value

# Named arguments syntax
_array.methodName:
  on: array
  callback: function  # For methods like map, filter, reduce
  # Other method-specific arguments

# Array syntax for concat
_array.concat:
  - array1
  - array2
  - array3
````

<SCHEMA>

<EXAMPLES>
### Get array length:
```yaml
_array.length:
  - item1
  - item2
  - item3
```

Returns: `3`

### Filter items from a list:

```yaml
_array.filter:
  on:
    - status: pending
      name: Task A
    - status: completed
      name: Task B
    - status: pending
      name: Task C
  callback:
    _function:
      __eq:
        - __args: '0.status'
        - pending
```

Returns: `[{ status: 'pending', name: 'Task A' }, { status: 'pending', name: 'Task C' }]`

### Map array to transform elements:

```yaml
_array.map:
  on:
    - first_name: John
      last_name: Doe
    - first_name: Jane
      last_name: Smith
  callback:
    _function:
      full_name:
        __string.concat:
          - __args: '0.first_name'
          - ' '
          - __args: '0.last_name'
```

Returns: `[{ full_name: 'John Doe' }, { full_name: 'Jane Smith' }]`

### Concatenate multiple arrays:

```yaml
_array.concat:
  - - apple
    - banana
  - - cherry
    - date
  - - elderberry
```

Returns: `['apple', 'banana', 'cherry', 'date', 'elderberry']`

### Check if array includes a value:

```yaml
_array.includes:
  on:
    _state: selected_categories
  value: electronics
```

Returns: `true` if 'electronics' is in selected_categories

### Reduce array to calculate total:

```yaml
_array.reduce:
  on:
    - quantity: 2
      unit_price: 25
    - quantity: 5
      unit_price: 10
    - quantity: 1
      unit_price: 100
  callback:
    _function:
      __sum:
        - __args: '0'
        - __product:
            - __args: '1.quantity'
            - __args: '1.unit_price'
  initialValue: 0
```

Returns: `200` (2*25 + 5*10 + 1\*100)

### Find item by condition:

```yaml
_array.find:
  on:
    - id: 1
      name: Product A
    - id: 2
      name: Product B
    - id: 3
      name: Product C
  callback:
    _function:
      __eq:
        - __args: '0.id'
        - 2
```

Returns: `{ id: 2, name: 'Product B' }`

### Join array elements into string:

```yaml
_array.join:
  on:
    - Sales
    - Marketing
    - Engineering
  separator: ', '
```

Returns: `'Sales, Marketing, Engineering'`

### Slice portion of array:

```yaml
_array.slice:
  on:
    - a
    - b
    - c
    - d
    - e
  start: 1
  end: 4
```

Returns: `['b', 'c', 'd']`

### Sort array elements:

```yaml
_array.sort:
  on:
    - cherry
    - apple
    - banana
```

Returns: `['apple', 'banana', 'cherry']`

### Check if some elements match condition:

```yaml
_array.some:
  on:
    _state: items
  callback:
    _function:
      __gt:
        - __args: '0.quantity'
        - 0
```

Returns: `true` if any item has quantity > 0
<EXAMPLES>
