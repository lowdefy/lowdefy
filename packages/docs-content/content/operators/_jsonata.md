# _jsonata

```
(arguments: {on: any, expr: string, bindings?: object}): any
```

The `_jsonata` operator provides a powerful query and transformation language for JSON data using the [JSONata](https://jsonata.org) library. JSONata is a lightweight query and transformation language that allows you to navigate, query, and transform JSON structures with simple and intuitive expressions.

#### Arguments

###### object
  - `on: any`: The input data to evaluate the expression against.
  - `expr: string`: A JSONata expression string.
  - `bindings?: object`: Optional bindings object to provide additional variables to the expression.

#### Examples

###### Basic arithmetic:
```yaml
_jsonata:
  on:
    a: 5
    b: 3
  expr: a + b
```
Returns: `8`

###### String concatenation:
```yaml
_jsonata:
  on:
    firstName: John
    lastName: Doe
  expr: firstName & " " & lastName
```
Returns: `"John Doe"`

###### Array filtering:
```yaml
_jsonata:
  on:
    items: [1, 2, 3, 4, 5]
  expr: items[$ > 3]
```
Returns: `[4, 5]`

###### Array mapping:
```yaml
_jsonata:
  on:
    users:
      - name: Alice
        age: 30
      - name: Bob
        age: 25
  expr: users.name
```
Returns: `["Alice", "Bob"]`

###### Using bindings for external variables:
```yaml
_jsonata:
  on:
    price: 100
  expr: price * taxRate
  bindings:
    taxRate: 1.2
```
Returns: `120`

###### Aggregation with built-in functions:
```yaml
_jsonata:
  on:
    items: [1, 2, 3, 4, 5]
  expr: $sum(items)
```
Returns: `15`

###### Conditional expression:
```yaml
_jsonata:
  on:
    temperature: 25
  expr: temperature > 20 ? "warm" : "cold"
```
Returns: `"warm"`

###### Object transformation:
```yaml
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
```
Returns:
```json
{
  "fullName": "Jane Smith",
  "contact": "jane@example.com"
}
```

###### Array transformation:
```yaml
_jsonata:
  on:
    orders:
      - id: 1
        amount: 100
      - id: 2
        amount: 200
  expr: orders.{ "orderId": id, "total": amount * 1.1 }
```
Returns:
```json
[
  { "orderId": 1, "total": 110 },
  { "orderId": 2, "total": 220 }
]
```

###### Complex transformation with aggregation:
```yaml
_jsonata:
  on:
    user:
      firstName: Jane
      lastName: Smith
    orders:
      - total: 100
      - total: 200
  expr: |
    {
      "customer": user.firstName & " " & user.lastName,
      "totalSpent": $sum(orders.total)
    }
```
Returns:
```json
{
  "customer": "Jane Smith",
  "totalSpent": 300
}
```
