# Roles

Roles can be used to limit user access to certain pages and API endpoints. Only users with a role linked to the page will be able to see that page, and the page will be filtered from menus if the user does not have the role.

Roles can be read from the `roles` field on the [user object](/user-object). It should be an array of strings which are the role names. If the provider returns a `roles` field on the user profile then this will be used, otherwise the `auth.userFields` configuration can be used to map another field to the `roles` field on the user object. Custom auth callback plugins can also be used to add a roles field to the user object.

######  Setting user roles to the `my_roles` field returned from provider:
```yaml
lowdefy: 6.0.0
auth:
  userFields:
    roles: profile.my_roles
```

The pages that are protected by roles are configured in the `auth.pages.roles` section in the Lowdefy configuration. This should be an object, where the keys are the role names, and the values are an array of pageIds that are protected by that role.

Similarly, the API endpoints that are protected by roles are configured in the `auth.api.roles` section in the Lowdefy configuration, where the keys are the role names, and the values are an array of endpointsIds that are protected by that role.

###### Protect pages and API endpoints using roles:
```yaml
lowdefy: 6.0.0
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
