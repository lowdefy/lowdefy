# Logout

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

When the `Logout` action is called, the user data and authorization cookies are cleared by the app.

The `callbackUrl` parameter of the Logout action specifies where the user lands after logout is complete. Unlike the `Login` action it has no default and does not read the `?callbackUrl=` query: with no `callbackUrl` the page is reloaded and the server re-applies the page's auth rules, which sends a signed-out user off a protected page to the sign-in page. Defaulting to the home page instead could land them on a page they may no longer see.

#### Parameters

###### object
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the logout flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the logout flow is complete.
  - `url: string`: The URL to redirect to after the logout flow is complete. An absolute URL is not `basePath`-prefixed, so it can be an external logout landing page.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after logout.
- `redirect: boolean`: If set to `false` the user session will be cleared, but the page will not be reloaded.

#### Examples

###### A logout button:
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

###### Redirect to the `logged-out` page in the app after logout:
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
