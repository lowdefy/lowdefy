# Microsoft SQL Server

The [Knex](/Knex) connection can be used to connect to [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-2019).

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `mssql` to connect to Microsoft SQL Server.
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`tedious`](https://www.npmjs.com/package/tedious) database client (knex's `mssql` dialect uses tedious internally).
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection object:
```yaml
connections:
  - id: mssql
    type: Knex
    properties:
      client: mssql
      connection:
        host:
          _secret: MSSQL_HOST
        database:
          _secret: MSSQL_DB
        user:
          _secret: MSSQL_USER
        password:
          _secret: MSSQL_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MSSQL_HOST = database.server.com
LOWDEFY_SECRET_MSSQL_DB = db
LOWDEFY_SECRET_MSSQL_USER = user
LOWDEFY_SECRET_MSSQL_PASSWORD = password
```

###### Secret connection string:
```yaml
connections:
  - id: mssql
    type: Knex
    properties:
      client: mssql
      connection:
        _secret: MSSQL_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_MSSQL_CONNECTION_STRING = mssql://user:password@database.server.com:1433/db
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
