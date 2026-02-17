# @lowdefy/operators-jsonata

JSONata query language operator.

## Operator

| Operator | Purpose |
|----------|---------|
| `_jsonata` | Execute JSONata expression |

## Usage

```yaml
result:
  _jsonata:
    expr: '$.users[status="active"].name'
    data:
      _request: getData
```

## JSONata Expressions

JSONata is a powerful query language for JSON:

### Basic Path

```
$.name              // Get name field
$.address.city      // Nested field
$.items[0]          // Array index
```

### Filtering

```
$.users[age > 18]           // Filter by condition
$.products[price < 100]     // Numeric comparison
$.items[type="book"]        // String match
```

### Mapping

```
$.users.name                // Get all names
$.orders.(quantity * price) // Calculate for each
```

### Aggregation

```
$sum($.items.price)         // Sum
$count($.users)             // Count
$average($.scores)          // Average
$max($.values)              // Maximum
```

### String Operations

```
$uppercase($.name)          // UPPERCASE
$lowercase($.name)          // lowercase
$trim($.text)               // Trim whitespace
$join($.tags, ', ')         // Join array
```

## Examples

### Filter and Map

```yaml
activeUserNames:
  _jsonata:
    expr: '$.users[active=true].name'
    data:
      _request: getUsers
```

### Calculate Total

```yaml
orderTotal:
  _jsonata:
    expr: '$sum($.items.(quantity * unitPrice))'
    data:
      _state: order
```

### Transform Data

```yaml
summary:
  _jsonata:
    expr: |
      {
        "totalOrders": $count($.orders),
        "totalRevenue": $sum($.orders.amount),
        "averageOrder": $average($.orders.amount)
      }
    data:
      _request: getOrders
```

## Why JSONata?

- Powerful querying in single expression
- Complex transformations without loops
- Aggregations built-in
- Readable syntax
