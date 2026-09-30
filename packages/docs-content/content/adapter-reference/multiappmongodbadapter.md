# MultiAppMongoDBAdapter

The MultiAppMongoDBAdapter connects Next-Auth to a MongoDB database where multiple apps share a single collection of people. Each person is stored as a contact document with a sub-document per app, so one person can be a user of some apps and not others, with roles and attributes per app.

Contacts are looked up by lowercase email. When a person signs in for the first time, a contact is created (or the existing contact is updated) with an app membership sub-document for the current app. A contact only counts as a user of an app if the app sub-document has `is_user: true` and neither the contact nor the app membership is disabled.

When `invite.required` is `true`, sign up is refused with an `Access denied.` error unless the contact has an open invite for the app (`apps.<appName>.invite.open: true`). Signing up consumes the invite.

The default collection names are `user-contacts`, `user-accounts`, `user-sessions` and `user-verification-tokens`.

#### Properties

###### object
  - `appName: string`: Required - The key of this app in the contact's `apps` sub-document.
  - `databaseUri: string`: Required - Connection uri string for the MongoDb deployment. Should be stored using the _secret operator.
  - `mongoDBClientOptions: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/interfaces/mongoclientoptions.html) for more information.
  - `collections: object`: Set names of MongoDB collections used.
    - `accounts: string`: Default: `user-accounts`.
    - `contacts: string`: Default: `user-contacts`.
    - `sessions: string`: Default: `user-sessions`.
    - `verificationTokens: string`: Default: `user-verification-tokens`.
  - `invite: object`:
    - `required: boolean`: Default: `false` - Only allow sign up for contacts with an open invite for this app.
  - `verificationTokens: object`:
    - `uses: number`: Default: `1` - The number of times a verification token can be used.

#### Examples

###### Minimum configuration.

```yaml
lowdefy: 6.0.0
auth:
  adapter:
    id: multi_app_adapter
    type: MultiAppMongoDBAdapter
    properties:
      appName: my-app
      databaseUri:
        _secret: MONGODB_URI
```

###### Invite-only sign up with custom collections.

```yaml
lowdefy: 6.0.0
auth:
  adapter:
    id: multi_app_adapter
    type: MultiAppMongoDBAdapter
    properties:
      appName: my-app
      databaseUri:
        _secret: MONGODB_URI
      invite:
        required: true
      collections:
        contacts: people
        accounts: people-accounts
        sessions: people-sessions
        verificationTokens: people-verification-tokens
```
