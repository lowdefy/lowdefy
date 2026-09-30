# MongoDBAdapter

The MongoDBAdapter can be used to connect Auth.js to a MongoDB database. It uses the [Auth.js MongoDB adapter](https://authjs.dev/getting-started/adapters/mongodb) package. It uses the same `databaseUri` and client options configuration as the `MongoDBCollection` connection. The collection names used by the adapter can be configured using the `options.collections` property. The default values are `users`, `accounts`, `sessions` and `verification_tokens`.


#### Properties

###### object
  - `databaseUri: string`: Required - Connection uri string for the MongoDb deployment. Should be stored using the _secret operator.
  - `mongoDBClientOptions: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/interfaces/mongoclientoptions.html) for more information.
  - `options: object`:
    - `collections: object`: Set names of MongoDB collections used.
    - `databaseName`: Set the MongoDB database name. This is optional if the database name is specified in the `databaseUri`.

#### Examples

###### Minimum configuration.

```yaml
lowdefy: 6.0.0
auth:
  adapter:
    id: mdb_adapter
    type: MongoDBAdapter
    properties:
      databaseUri:
        _secret: MONGODB_URI
```

###### Full configuration.

```yaml
lowdefy: 6.0.0
auth:
  adapter:
    id: mdb_adapter
    type: MongoDBAdapter
    properties:
      databaseUri:
        _secret: MONGODB_URI
      # Optional MongoDB client options, only set these if necessary
      mongoDBClientOptions:
        connectTimeoutMS: 2000
      options:
        databaseName: my-database # Optional
        # Optionally configure the collection names used
        collections:
          Users: my_users
          Accounts: my_accounts
          Sessions: my_sessions
          VerificationTokens: my_verification_tokens
```
