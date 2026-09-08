# Knex

[`Knex.js`](http://knexjs.org) is a SQL query builder that can be used to connect to [PostgreSQL](/PostgreSQL), [MS SQL Server](/MSSQL), [MySQL](/MySQL), [MariaDB](/MariaDB), [SQLite](/SQLite), Oracle, and [Amazon Redshift](/AmazonRedshift) databases.

The Knex connection can be used to execute raw SQL queries using the `KnexRaw` requests, or the Knex query builder can be used with the `KnexBuilder` request.

For more details on specific databases, see the database documentation:

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - The database client to use. One of:
  - `better-sqlite3`
  - `sqlite` (alias of `better-sqlite3`)
  - `mssql`
  - `mysql2`
  - `oracledb`
  - `postgres`
  - `pg` (alias of `postgres`)
  - `postgresql` (alias of `postgres`)
  - `redshift`
- `connection: object | string`: __Required__ - Connection string or object to pass to the database client. See the specific client documentation for more details.
- `searchPath: string`:  Set PostgreSQL search path.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### MySQL with connection object:
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

###### PostgreSQL with secret connection string:
```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: postgres
      connection:
        _secret: PG_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_PG_CONNECTION_STRING = postgresql://user:password@database.server.com:5432/db
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
