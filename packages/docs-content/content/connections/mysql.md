# MySQL

The [Knex](/Knex) connection can be used to connect to a [MySQL](https://www.mysql.com) database.

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `mysql2` to connect to MySQL. MySQL uses the [`mysql2`](https://www.npmjs.com/package/mysql2) driver.
- `connection: object | string `: __Required__ - Connection object or string to pass to the database client.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection Object:
```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql2
      connection:
        host:
          _secret: MYSQL_HOST
        user:
          _secret: MYSQL_USER
        database:
          _secret: MYSQL_DB
        password:
          _secret: MYSQL_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MYSQL_HOST = database.server.com
LOWDEFY_SECRET_MYSQL_DB = db
LOWDEFY_SECRET_MYSQL_USER = user
LOWDEFY_SECRET_MYSQL_PASSWORD = password
```

###### Connection string:
```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql2
      connection:
        _secret: MYSQL_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_MYSQL_CONNECTION_STRING = mysql://user:password@database.server.com/db
```

## Requests

Request types:

- KnexBuilder
- KnexRaw

### KnexBuilder

#### Properties

- `query: object[]`: **Required** - SQL query builder array. An array of objects, with a single key which is the name of the knex builder function. The value should be an array of arguments to pass to the builder function.
- `tableName: string | object`: The name of the table to query from.

#### Examples

###### Build a query:

```yaml
id: knexBuilder
type: KnexBuilder
connectionId: knex
payload:
  name:
    _state: name
properties:
  query:
    - select:
        - '*'
    - from:
        - users
    - where:
        - name
        - _payload: name
```

###### Using `tableName`:

```yaml
id: knexBuilder
type: KnexBuilder
connectionId: knex
payload:
  name:
    _state: name
properties:
  tableName: users
  query:
    - select:
        - '*'
    - where:
        - name
        - _payload: name
```

###### Aliases:

```yaml
id: knexBuilder
type: KnexBuilder
connectionId: knex
properties:
  tableName:
    a: tableA
    b: tableB
  query:
    - select:
        - aField: 'a.field'
        - bField: 'b.field'
    - limit:
        - 1
```

### KnexRaw

#### Properties

- `query: string`: **Required** - SQL query string.
- `parameters: string | number | array | object`: SQL query parameters.

#### Examples

###### Simple raw query:

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
properties:
  query: SELECT * FROM "my_table";
```

###### Query with named parameters:

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
payload:
  selected_name:
    _state: selected_name
properties:
  query: select * from users where name = :name
  parameters:
    name:
      _payload: selected_name
```

###### Query with positional parameters:

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
payload:
  selected_name:
    _state: selected_name
properties:
  query: select * from users where name = ?
  parameters:
    - _payload: selected_name
```

###### Reference a `.sql` file:

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
properties:
  query:
    _ref: my_query.sql
```
