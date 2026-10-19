# User Object

The `user` object holds data about the currently signed-in **caller**, read with the [`_user`](/_user) operator on both the server and the client. It is not the provider's profile — it is a caller Lowdefy resolves from the user's row *and their membership in the active organization*, so the same person carries a different `_user` in two organizations they belong to.

Its shape is **fixed**. Unlike the old provider-claim mapping, there is no `userFields` config and no set of OpenID Connect claims copied onto the session — the provider subject and extra claims are not on the user object at all. If you need a provider claim at signup, persist it with an [auth hook](/auth-upgrade#7-rewrite-callbacks-and-events-as-hooks) and read it from where you stored it.

## Fields

| Field | On which callers | Meaning |
| ----- | ---------------- | ------- |
| `id` | all | The internal user id. **This replaces the old `sub`** — it is a *different value* (the provider subject lives on the `user-accounts` collection as `accountId`). |
| `email` | all | The user's email. |
| `email_verified` | session | Whether the email is verified. |
| `name`, `image` | session | Display name and avatar — the **per-organization** copies from the active membership, falling back to the deployment-global user record. |
| `roles` | session, strategy | The app's own role strings, from the active membership's `appRoles`. **The only thing `auth.pages.roles` / `auth.api.roles` match.** |
| `org_roles` | session | The organization tier from `member.role`: `owner`, `admin` or `member`. An administrative fact — **no gate reads it**. |
| `attributes` | session | One merged bag: global `user.attributes` under the active `member.attributes`, per key, member wins. |
| `organization_id` | session, mcp | The organization the caller acts in — the value the [tenant wall](/organizations#the-tenant-wall) stamps and filters on. |
| `active_organization_id` | session | The active organization id (equal to `organization_id`). |
| `two_factor_enrolled` | session | Whether the caller holds a factor satisfying `auth.twoFactor.required`. |
| `auth_method` | strategy, mcp | How the caller authenticated — the strategy id, or `'mcp'` for an [assistant](/mcp-oauth). Absent on browser sessions. |
| `profile` | session | The user record's opaque display/app-data bag. Absent (never `{}`) when the user has written no profile. |
| `contact_id` | session | Link to the app's canonical record for this person, when one exists. |

> **`_user.role` (singular) carries nothing.** Lowdefy never writes it; it sits one character from `roles`, so gating on `_user.role` is gating on a constant. Read `roles`.

A caller resolved from an [API strategy](/auth-configuration) (`apiKey`, `jwt`) sits outside the membership boundary: it carries `id`, `roles`, `attributes` and `auth_method`, but no organization, `name`, `image`, `profile` or `two_factor_enrolled`. A signed-in user who holds only a pending invitation (before they accept, under `tenant`) is an *awaiting-organization* caller — known to the always-public accept page, refused everywhere else.

## Examples

###### Use the user's avatar in an Avatar block:
```yaml
id: avatar
type: Avatar
properties:
  src:
    _user: image
```

###### Stamp the creator when inserting a document:
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
        _user: id
```

###### Read a value out of the merged attributes bag:
```yaml
_user: attributes.plan
```
