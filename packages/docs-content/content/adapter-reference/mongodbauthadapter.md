# MongoDBAuthAdapter

The MongoDBAuthAdapter stores the auth engine's users, sessions, accounts, organizations and related records in a MongoDB database. It is configured as `auth.database` and ships with the `MongoDBCollection` connection package.

Collection names follow the fixed `user-*` naming convention applied by the auth engine (`users`, `user-sessions`, `user-accounts`, ...) — there is no collection rename configuration. The `attributes` fields on users, members and invitations are stored as native sub-documents, so they can be filtered and aggregated with normal MongoDB queries.

If you are upgrading from the old `MongoDBAdapter`: the type is renamed, `databaseUri` becomes `uri`, and `options.databaseName` folds into the URI path or the `database` property. See the [auth upgrade guide](/auth-upgrade).

#### Properties

###### object
  - `uri: string`: Required - Connection uri string for the MongoDB deployment. Should be stored using the _secret operator.
  - `database: string`: Set the MongoDB database name. This is optional if the database name is specified in the `uri`.
  - `mongoDBClientOptions: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/) for more information.

#### Examples

###### Minimum configuration.

```yaml
lowdefy: 5.5.1
auth:
  database:
    id: auth_db
    type: MongoDBAuthAdapter
    properties:
      uri:
        _secret: AUTH_DATABASE_URI
```

###### Full configuration.

```yaml
lowdefy: 5.5.1
auth:
  database:
    id: auth_db
    type: MongoDBAuthAdapter
    properties:
      uri:
        _secret: AUTH_DATABASE_URI
      database: my-database # Optional
      # Optional MongoDB client options, only set these if necessary
      mongoDBClientOptions:
        connectTimeoutMS: 2000
```
