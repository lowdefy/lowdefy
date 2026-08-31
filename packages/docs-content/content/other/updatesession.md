# UpdateSession

```
(void): void
```

The `UpdateSession` action is used to update the user session. If a adapter is used, any new user data in the database will be added to the user object.

#### Parameters

The `UpdateSession` action does not take any parameters.

#### Examples

###### Update session after user updates their profile:
```yaml
id: update_profile
type: Button
events:
  onClick:
    - id: update_profile_in_db
      type: Request
      params: update_user
    - id: update_session
      type: UpdateSession
```
