<TITLE>
Logout
<TITLE>

<DESCRIPTION>
When the `Logout` action is called, the user data and authorization cookies are cleared by the app.

The `callbackUrl` parameters of the Logout action specify where the user is redirected after logout is complete. If `callbackUrl` parameters not set, the user will return to the page from which the action was called.
<DESCRIPTION>

<USAGE>
```
(params: {
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  }
  redirect?: boolean,
}): void
```

###### object
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `redirect: boolean`: If set to `false` the user session will be cleared, but the page will not be reloaded.
</USAGE>

<EXAMPLES>
### A logout button:
```yaml
- id: logout_button
  type: Logout
  properties:
    title: Logout
  events:
    onClick:
      - id: logout
        type: Logout
```

### Redirect to the `logged-out` page in the app after logout:
```yaml
- id: logout_button
  type: Logout
  properties:
    title: Logout
  events:
    onClick:
      - id: logout
        type: Logout
        params:
          callbackUrl:
            pageId: logged-out
```
</EXAMPLES>
