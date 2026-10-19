# Amazon Redshift

The [Knex](/Knex) connection can be used to connect to a [Amazon Redshift](https://aws.amazon.com/redshift) database.

## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `redshift` to connect to Amazon Redshift.
- `connection: object | string`: __Required__ - Connection string or object to pass to the [`pg`](https://www.npmjs.com/package/pg) database client.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection object:
```yaml
connections:
  - id: redshift
    type: Knex
    properties:
      client: redshift
      connection:
        host:
          _secret: REDSHIFT_HOST
        database:
          _secret: REDSHIFT_DB
        user:
          _secret: REDSHIFT_USER
        password:
          _secret: REDSHIFT_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_REDSHIFT_HOST = examplecluster.XXXXXXXXXXXX.us-west-2.redshift.amazonaws.com
LOWDEFY_SECRET_REDSHIFT_REDSHIFT_DB = db
LOWDEFY_SECRET_REDSHIFT_USER = user
LOWDEFY_SECRET_REDSHIFT_PASSWORD = password
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
