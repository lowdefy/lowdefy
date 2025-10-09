<TITLE>
Knex
</TITLE>

<DESCRIPTION>

[`Knex.js`](http://knexjs.org) is a SQL query builder that can be used to connect to [PostgreSQL](/PostgreSQL), [MS SQL Server](/MSSQL), [MySQL](/MySQL), [MariaDB](/MariaDB), [SQLite](/SQLite), [Oracle](/Oracle), and [Amazon Redshift](/AmazonRedshift) databases.

The Knex connection can be used to execute raw SQL queries using the `KnexRaw` requests, or the Knex query builder can be used with the `KnexBuilder` request.

### Properties

- `client: enum`: __Required__ - The database client to use. One of:
  - `mssql`
  - `mysql`
  - `oracledb`
  - `postgres`
  - `pg` (alias of `postgres`)
  - `postgresql` (alias of `postgres`)
  - `redshift`
  - `sqlite3`
  - `sqlite` (alias of `sqlite3`)
- `connection: object | string`: __Required__ - Connection string or object to pass to the database client. See the specific client documentation for more details.
- `searchPath: string`:  Set PostgreSQL search path.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

</DESCRIPTION>

<REQUESTS>

- KnexBuilder
- KnexRaw

</REQUESTS>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Knex',
  type: 'object',
  required: ['client', 'connection'],
  properties: {
    client: {
      type: 'string',
      description: 'SQL query string.',
      errorMessage: {
        type: 'Knex connection property "client" should be a string.',
      },
    },
    connection: {
      type: ['string', 'object'],
      description: 'SQL query string.',
      errorMessage: {
        type: 'Knex connection property "connection" should be a string or object.',
      },
    },
    searchPath: {
      type: 'string',
      description: 'Set PostgreSQL search path.',
      errorMessage: {
        type: 'Knex connection property "searchPath" should be a string.',
      },
    },
    version: {
      type: 'string',
      description: 'Set database version.',
      errorMessage: {
        type: 'Knex connection property "version" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'Knex connection properties should be an object.',
    required: {
      client: 'Knex connection should have required property "client".',
      connection: 'Knex connection should have required property "connection".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### MySQL with connection object

```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql
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

### PostgreSQL with secret connection string

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

</EXAMPLES>
