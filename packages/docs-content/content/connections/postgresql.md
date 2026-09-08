# PostgreSQL

The [Knex](/Knex) connection can be used to connect to a [PostgreSQL](https://www.postgresql.org) database.

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - The database client to use. To connect to PostgreSQL, use one of:
  - `postgres`
  - `pg` (alias of `postgres`)
  - `postgresql` (alias of `postgres`)
- `connection: object | string`: __Required__ - Connection string or object to pass to the [`pg`](https://www.npmjs.com/package/pg) database client.
- `searchPath: string`:  Set PostgreSQL search path.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection Object:
```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: postgres
      connection:
        user:
          _secret: PG_USER
        host:
          _secret: PG_HOST
        database:
          _secret: PG_DB
        password:
          _secret: PG_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_PG_HOST = database.server.com
LOWDEFY_SECRET_PG_DB = db
LOWDEFY_SECRET_PG_USER = user
LOWDEFY_SECRET_PG_PASSWORD = password
```

###### Secret connection string, with version and searchPath:
```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: postgres
      connection:
        _secret: PG_CONNECTION_STRING
      version: '7.2'
      searchPath:
        - knex
        - public
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
