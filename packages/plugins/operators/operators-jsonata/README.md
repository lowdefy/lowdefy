# Lowdefy Operators JSONata

JSONata operator for Lowdefy - powerful query and transformation language for JSON data.

## Overview

JSONata is a lightweight query and transformation language for JSON data. It provides a simple and intuitive way to navigate, query, and transform JSON structures.

## Operator

### `_jsonata`

Evaluate a JSONata expression against data.

**Syntax:**

```yaml
_jsonata:
  on: <data>
  expr: <string>
  bindings: <object> # optional
```

**Parameters:**

- `on`: The input data to evaluate the expression against
- `expr`: A JSONata expression string
- `bindings`: Optional object to provide additional variables to the expression

**Examples:**

```yaml
# Basic arithmetic
_jsonata:
  on:
    a: 5
    b: 3
  expr: a + b
# Returns: 8

# String concatenation
_jsonata:
  on:
    firstName: John
    lastName: Doe
  expr: firstName & " " & lastName
# Returns: "John Doe"

# Array filtering
_jsonata:
  on:
    items: [1, 2, 3, 4, 5]
  expr: items[$ > 3]
# Returns: [4, 5]

# Array mapping
_jsonata:
  on:
    users:
      - name: Alice
        age: 30
      - name: Bob
        age: 25
  expr: users.name
# Returns: ["Alice", "Bob"]

# With bindings
_jsonata:
  on:
    price: 100
  expr: price * taxRate
  bindings:
    taxRate: 1.2
# Returns: 120

# Object transformation
_jsonata:
  on:
    user:
      firstName: Jane
      lastName: Smith
      email: jane@example.com
  expr: |
    {
      "fullName": user.firstName & " " & user.lastName,
      "contact": user.email
    }
# Returns: { "fullName": "Jane Smith", "contact": "jane@example.com" }

# Array transformation
_jsonata:
  on:
    orders:
      - id: 1
        amount: 100
      - id: 2
        amount: 200
  expr: orders.{ "orderId": id, "total": amount * 1.1 }
# Returns: [{ "orderId": 1, "total": 110 }, { "orderId": 2, "total": 220 }]
```

## JSONata Language Features

JSONata provides many powerful features:

- **Path Expressions**: Navigate nested objects and arrays
- **Predicates**: Filter arrays with conditions
- **Functions**: 60+ built-in functions like `$sum`, `$count`, `$average`, `$map`, `$filter`, etc.
- **Transformations**: Create new object structures
- **Conditionals**: Ternary operator for conditional logic
- **String operations**: Concatenation, substring, regex, etc.
- **Arithmetic**: Standard math operations
- **Aggregation**: Sum, count, min, max, average, etc.

For more information on JSONata syntax, visit [https://jsonata.org](https://jsonata.org)
