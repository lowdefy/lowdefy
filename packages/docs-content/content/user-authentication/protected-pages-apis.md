# Protected Pages and APIs

By default, all pages and APIs in a Lowdefy app are public. Protected pages and APIs are resources that can only be accessed by a logged in user. If a user that is not logged in tries to access a protected page or API, they will receive an authentication error. For pages, the user will be redirected to the 404 page, and pages that a user is not allowed to see will be filtered from the app menus. For APIs, an "API Endpoint does not exist" error will be thrown.

The config can either be set to protect all pages/APIs, except for a list of public ones, or vice-versa, all are public except for a list of protected ones.

Protected and public pages and APIs can be configured in the `auth.pages` and `auth.api` sections of the Lowdefy configuration. Here the fields `protected` and `public` can be set to true, or a list of page/API IDs. You cannot set `protected` or `public` to `false`, and both can't be an array or `true` at the same time.

When protecting all pages in the app, you will need to set at least one page as public to allow users to log in to the app.

The 404 page (used to indicate that a requested page cannot be found) is always a public page. A default 404 page will be created if you do not specify one, but if you create a page with pageId `'404'` then that page will be the 404 page.

## Examples

###### List specific public pages and APIs:
```yaml
lowdefy: 5.5.1
auth:
  pages:
    protected: true
    public:
      - '404'
      - login
      - public-page
  api:
    protected: true
    public:
      - health_check
      - get_public_content
```

###### List specific protected pages and APIs:
```yaml
lowdefy: 5.5.1
auth:
  pages:
    public: true
    protected:
      - admin
      - users
  api:
    public: true
    protected:
      - update_user_settings
      - admin_dashboard_api
```

###### Mixed configuration:
```yaml
lowdefy: 5.5.1
auth:
  # Protect specific pages while keeping most public
  pages:
    public: true
    protected:
      - dashboard
      - profile
      - settings

  # Protect all API endpoints
  api:
    protected: true
```

## Wildcard Patterns

Page and API access rules support glob patterns using `*` and `**` wildcards. This is useful for granting access to all pages from a [module](/modules):

- `team-users/*` — matches all pages in the `team-users` module
- `team-*/*` — matches all pages in modules with IDs starting with `team-`
- `*/settings` — matches the `settings` page in any module
- `**` — matches all pages

Exact page IDs still work: `home`, `team-users/users-list`.

###### Wildcard pattern example:
```yaml
lowdefy: 5.5.1
auth:
  pages:
    protected: true
    public:
      - home
      - login
    roles:
      admin:
        - team-users/*
        - admin/*
      user:
        - notifications/*
```

## Important Notes

- Pages and APIs are configured separately - protecting pages does not automatically protect APIs
- Protected resources require users to be authenticated before access is granted
- Role-based access control can be layered on top of protection for finer-grained permissions
