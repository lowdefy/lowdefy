# SQLite

The [Knex](/Knex) connection can be used to connect to a [SQLite](https://www.sqlite.org) database.

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `better-sqlite3` or `sqlite` (alias of `better-sqlite3`) to connect to SQLite. SQLite uses the [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) driver.
- `connection: object`:
  - `filename: string`:  __Required__ - The path to the SQLite file (relative to the project root).
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.


#### Examples

##### Specify filename:
```yaml
connections:
  - id: sqlite
    type: Knex
    properties:
      client: better-sqlite3
      connection:
        filename: ./mydb.sqlite
```

###### Different connections in deployment and production environments:
```yaml
connections:
  - id: knex
    type: Knex
    properties:
      client:
        _secret: KNEX_CLIENT
      connection:
        _json.parse:
          _secret: KNEX_CONNECTION
```
Environment variables in development:
```
LOWDEFY_SECRET_KNEX_CLIENT = better-sqlite3
LOWDEFY_SECRET_KNEX_CONNECTION = {"filename": "./mydb.sqlite"}
```
Environment variables in production:
```
LOWDEFY_SECRET_KNEX_CLIENT = postgres
LOWDEFY_SECRET_KNEX_CONNECTION = {"user": "dbuser", "host": "database.server.com", "database": "mydb", "password": "secretpassword"}
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
