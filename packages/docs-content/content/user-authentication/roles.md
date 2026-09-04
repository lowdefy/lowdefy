# Roles

Roles can be used to limit user access to certain pages and API endpoints. Only users with a role linked to the page will be able to see that page, and the page will be filtered from menus if the user does not have the role.

Roles are read from the `roles` field on the [user object](/user-object) — an array of role-name strings. These are the caller's **app roles**, resolved from their membership in the active organization (`member.appRoles`), not from a provider claim. A member is granted app roles through an [invitation](/auth-steps) (`InviteMember`) or an auth step (`UpdateMemberRoles`), so the same person can hold different roles in two organizations they belong to.

Declare the role names your app uses in `auth.roles` (id, optional label and description) so tooling can list them:

```yaml
lowdefy: 5.5.1
auth:
  roles:
    - id: user-admin
      label: User Administrator
    - id: sales
    - id: reports
```

Do **not** gate on `_user.org_roles` (the `owner`/`admin`/`member` organization tier) — no page or API gate reads it. It is an administrative fact used by the [auth-step authority floor](/auth-steps), separate from app roles. See [Organizations & Multi-Tenancy](/organizations#the-owner-admin-member-tier-vs-app-roles).

The pages that are protected by roles are configured in the `auth.pages.roles` section in the Lowdefy configuration. This should be an object, where the keys are the role names, and the values are an array of pageIds that are protected by that role.

Similarly, the API endpoints that are protected by roles are configured in the `auth.api.roles` section in the Lowdefy configuration, where the keys are the role names, and the values are an array of endpointsIds that are protected by that role.

###### Protect pages and API endpoints using roles:
```yaml
lowdefy: 5.5.1
auth:
  pages:
    public: true
    roles:
      user-admin:
        - users
        - new-user
        - edit-user
      sales:
        - customers
        - new-customer
        - edit-customer
      reports:
        - sales-report
        - operations-report
  api:
    protected: true
    roles:
      user-admin:
        - create-user
        - update-user
````
