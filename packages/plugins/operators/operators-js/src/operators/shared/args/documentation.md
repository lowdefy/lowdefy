<TITLE>
_args
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_args` operator retrieves values from the `args` object passed to a `_function` callback. It is used within `_function` operators to access arguments passed to array methods like `map`, `filter`, `reduce`, and similar callback-based operations.

Arguments are accessed by index (0, 1, 2, etc.) where:

- `0` is typically the current element
- `1` is typically the index
- `2` is typically the full array

This operator uses dot notation or object syntax to access nested values within the arguments.
<DESCRIPTION>

<USAGE>
```
(key: string | object): any

###### key (string)

A dot-notation path string to get a value from the args object.

###### key (object)

An object with the following properties:

- `key`: The dot-notation path string.
- `default`: A default value to return if the key is not found.

````
<USAGE>

<SCHEMA>
```yaml
# String shorthand - get value by key
_args: string

# Object syntax with default
_args:
  key: string
  default: any
````

<SCHEMA>

<EXAMPLES>
### Basic access to first argument in array map:
```yaml
_array.map:
  on:
    - apple
    - banana
    - cherry
  callback:
    _function:
      fruit:
        __args: '0'
```

Returns: `[{ fruit: 'apple' }, { fruit: 'banana' }, { fruit: 'cherry' }]`

### Access element index in array filter:

```yaml
_array.filter:
  on:
    - name: Item A
      active: true
    - name: Item B
      active: false
    - name: Item C
      active: true
  callback:
    _function:
      __args: '0.active'
```

Returns: `[{ name: 'Item A', active: true }, { name: 'Item C', active: true }]`

### Using index argument in map:

```yaml
_array.map:
  on:
    - first
    - second
    - third
  callback:
    _function:
      index:
        __args: '1'
      value:
        __args: '0'
```

Returns: `[{ index: 0, value: 'first' }, { index: 1, value: 'second' }, { index: 2, value: 'third' }]`

### Nested property access within callback:

```yaml
_array.map:
  on:
    - user:
        name: John
        email: john@example.com
    - user:
        name: Jane
        email: jane@example.com
  callback:
    _function:
      display_name:
        __args: '0.user.name'
```

Returns: `[{ display_name: 'John' }, { display_name: 'Jane' }]`

### Using reduce with accumulator and current value:

```yaml
_array.reduce:
  on:
    - quantity: 5
      price: 10
    - quantity: 3
      price: 20
    - quantity: 2
      price: 15
  callback:
    _function:
      __sum:
        - __args: '0'
        - __product:
            - __args: '1.quantity'
            - __args: '1.price'
  initialValue: 0
```

Returns: `140` (0 + 5*10 + 3*20 + 2\*15)

### Complex filtering with multiple conditions:

```yaml
_array.filter:
  on:
    - status: active
      role: admin
      department: IT
    - status: inactive
      role: user
      department: HR
    - status: active
      role: user
      department: IT
  callback:
    _function:
      __and:
        - __eq:
            - __args: '0.status'
            - active
        - __eq:
            - __args: '0.department'
            - IT
```

Returns: `[{ status: 'active', role: 'admin', department: 'IT' }, { status: 'active', role: 'user', department: 'IT' }]`
<EXAMPLES>
