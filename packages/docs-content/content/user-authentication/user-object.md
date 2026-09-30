# User Object

The `user` object contains data about the currently logged in user, and can be accessed using the [`_user`](/_user) operator. The data on the user object depends on the fields returned by the provider. By default, Auth.js will add the `name`, `email` and `image` fields.

Lowdefy will also map the `roles` and the standard OpenID Connect claim fields from the provider to the user object. The OpenID Connect claims are:
- `sub`: The user id (Subject).
- `name`
- `given_name`
- `family_name`
- `middle_name`
- `nickname`
- `preferred_username`
- `profile`
- `picture`
- `website`
- `email`
- `email_verified`
- `gender`
- `birthdate`
- `zoneinfo`
- `locale`
- `phone_number`
- `phone_number_verified`
- `address`
- `updated_at`

To map additional fields to the user object the `auth.userFields` configuration option can be used. This should be an object, where the key is the key in the user object to which the field should be mapped, and the value is the key of the value in the data from the provider. Auth.js provides three data objects called `account`, `profile` and `user`.

## Examples

###### Use the user profile picture in a Avatar block:
```yaml
id: avatar
type: Avatar
properties:
  src:
    _user: image
```

###### Insert user name and id (sub) when inserting a document in MongoDB:
```yaml
id: insert_data
type: MongoDBInsertOne
properties:
  doc:
    field:
      _state: field
    created_by:
      name:
        _user: name
      id:
        _user: sub
```

######  Setting all the data from the provider to the user object (Use this in development to see the data from the provider - it is not recommended to do this in production):
```yaml
lowdefy: 6.0.0
auth:
  userFields:
    account: account
    profile: profile
    user: user
```

######  Mapping fields to user object:
```yaml
lowdefy: 6.0.0
auth:
  userFields:
    id: profile.id
    roles: profile.my_roles
    # Some providers like Auth0 require custom claims to be added under a URL namespace
    openid_custom_claim: 'profile.https://example.com/custom'
```
