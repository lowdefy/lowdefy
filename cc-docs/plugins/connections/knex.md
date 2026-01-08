# @lowdefy/connection-knex

SQL database connection for Lowdefy using Knex.js. Supports PostgreSQL, MySQL, SQLite, and more.

## Connection Type

| Type | Purpose |
|------|---------|
| `Knex` | Connect to SQL databases |

## Supported Databases

- PostgreSQL
- MySQL / MariaDB
- SQLite3
- Microsoft SQL Server
- Oracle

## Connection Configuration

### PostgreSQL

```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: pg
      connection:
        host:
          _secret: PG_HOST
        port: 5432
        database: myapp
        user:
          _secret: PG_USER
        password:
          _secret: PG_PASSWORD
```

### MySQL

```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql2
      connection:
        host: localhost
        database: myapp
        user:
          _secret: MYSQL_USER
        password:
          _secret: MYSQL_PASSWORD
```

### Connection String

```yaml
connections:
  - id: db
    type: Knex
    properties:
      client: pg
      connection:
        _secret: DATABASE_URL
```

## Request Types

| Type | Purpose |
|------|---------|
| `KnexRaw` | Raw SQL query |
| `KnexBuilder` | Knex query builder |

### KnexRaw

Execute raw SQL:

```yaml
requests:
  - id: getUsers
    type: KnexRaw
    connectionId: postgres
    properties:
      query: |
        SELECT * FROM users
        WHERE active = ?
        ORDER BY created_at DESC
        LIMIT ?
      bindings:
        - true
        - 100
```

### KnexBuilder

Use Knex query builder:

```yaml
requests:
  - id: getUsers
    type: KnexBuilder
    connectionId: postgres
    properties:
      query:
        - select:
            - id
            - name
            - email
        - from: users
        - where:
            active: true
        - orderBy:
            - column: created_at
              order: desc
        - limit: 100
```

## Query Builder Operations

### Select

```yaml
properties:
  query:
    - select: '*'
    - from: users
```

### Where

```yaml
properties:
  query:
    - select: '*'
    - from: users
    - where:
        department:
          _state: departmentId
    - andWhere:
        active: true
```

### Insert

```yaml
properties:
  query:
    - insert:
        name:
          _state: name
        email:
          _state: email
    - into: users
    - returning: '*'
```

### Update

```yaml
properties:
  query:
    - update:
        name:
          _state: name
    - table: users
    - where:
        id:
          _state: userId
    - returning: '*'
```

### Delete

```yaml
properties:
  query:
    - delete: null
    - from: users
    - where:
        id:
          _state: userId
```

### Join

```yaml
properties:
  query:
    - select:
        - 'users.*'
        - 'departments.name as department_name'
    - from: users
    - leftJoin:
        - departments
        - 'users.department_id'
        - 'departments.id'
```

## Parameterized Queries

Prevent SQL injection with bindings:

```yaml
properties:
  query: |
    SELECT * FROM users
    WHERE name LIKE ?
    AND department = ?
  bindings:
    _array:
      - _string:
          - '%'
          - _state: search
          - '%'
      - _state: department
```

## Design Notes

### Connection Pooling

Knex manages connection pools automatically. Configure pool size in connection properties.

### SQL Injection Prevention

Always use bindings for user input. The query builder automatically parameterizes values.
