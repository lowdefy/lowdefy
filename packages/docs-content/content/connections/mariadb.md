# MariaDB

The [Knex](/Knex) connection can be used to connect to a [MariaDB](https://www.mysql.com) database. To connect to a MariaDB database, use the `mysql2` client — knex does not have a separate `mariadb` client.

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Use the `mysql2` client to connect to MariaDB.
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`mysql2`](https://www.npmjs.com/package/mysql2) database client.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection object:
```yaml
connections:
  - id: mariadb
    type: Knex
    properties:
      client: mysql2
      connection:
        host:
          _secret: MARIADB_HOST
        database:
          _secret: MARIADB_DB
        user:
          _secret: MARIADB_USER
        password:
          _secret: MARIADB_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MARIADB_HOST = database.server.com
LOWDEFY_SECRET_MARIADB_DB = db
LOWDEFY_SECRET_MARIADB_USER = user
LOWDEFY_SECRET_MARIADB_PASSWORD = password
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
