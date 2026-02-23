# @lowdefy/operators-mql

[MongoDB Query Language](https://www.mongodb.com/docs/manual/reference/operator/query/) operators for Lowdefy. Filter and query data using MongoDB-style syntax.

## Overview

MQL operators let you use MongoDB query syntax to filter arrays and objects in your configuration.

## Key Operators

| Operator         | Purpose                           |
| ---------------- | --------------------------------- |
| `_mql_test`      | Test if object matches query      |
| `_mql_expr`      | Evaluate aggregation expression   |
| `_mql_aggregate` | Run aggregation pipeline on array |

## \_mql_test

Test if an object matches a query:

```yaml
isActive:
  _mql_test:
    on:
      _state: user
    test:
      status: active
      age:
        $gte: 18
```

## \_mql_expr

Evaluate aggregation expression:

```yaml
total:
  _mql_expr:
    expr:
      $multiply:
        - $quantity
        - $price
    on:
      _state: item
```

## \_mql_aggregate

Run aggregation pipeline:

```yaml
summary:
  _mql_aggregate:
    on:
      _request: getOrders
    pipeline:
      - $match:
          status: completed
      - $group:
          _id: $category
          total:
            $sum: $amount
          count:
            $sum: 1
```

## MongoDB Query Operators

Supported query operators:

| Operator  | Purpose            |
| --------- | ------------------ |
| `$eq`     | Equal              |
| `$ne`     | Not equal          |
| `$gt`     | Greater than       |
| `$gte`    | Greater or equal   |
| `$lt`     | Less than          |
| `$lte`    | Less or equal      |
| `$in`     | In array           |
| `$nin`    | Not in array       |
| `$and`    | Logical AND        |
| `$or`     | Logical OR         |
| `$not`    | Logical NOT        |
| `$regex`  | Regular expression |
| `$exists` | Field exists       |

## Filter Array Example

```yaml
activeUsers:
  _mql_aggregate:
    on:
      _request: getUsers
    pipeline:
      - $match:
          active: true
          role:
            $in:
              - admin
              - editor
```

## Use Cases

- Client-side data filtering
- Complex conditional logic
- Data transformation without requests
- Aggregating request responses
