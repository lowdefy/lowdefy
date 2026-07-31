# Login and Logout

The [`Login`](/Login) and [`Logout`](/Logout) actions can be used to log users in and out.

## Login

The `Login` action is used to start the user login flow. If only one OAuth provider is configured, or the `Login` action is called with a `providerId`, the `Login` action requests the Provider's authorization URL from the Lowdefy server, and redirects the user to this URL. Otherwise, the action redirects the user to a page where the user can choose which provider to use to sign in.

The authorization url usually hosts a page where the user can input their credentials. After the user has logged in successfully, the user is redirected to the `/api/auth/callback/<provider_id>` route in the Lowdefy app, where the rest of the authorization code flow is completed. This URL usually needs to be configured in the identity provider's settings.

The `callbackUrl` parameter of the Login action specifies where the user lands after login is complete. Three sources are consulted, in order: the `callbackUrl` param, then the `?callbackUrl=` query parameter Lowdefy sets when it redirects an unauthenticated user to the sign-in page, then the app's home page. If none resolves the action throws, rather than staying silently on the sign-in page.

To sign in without navigating at all - a login form in a modal, or an embedded panel - set `callbackUrl: false`. This is not valid for magic-link or social/OAuth sign-in, which redirect through a hop Lowdefy does not control.

The parameters are:
- `authUrl: object`:
  - `urlQuery: object`: Query parameters to set for the authorization URL.
- `callbackUrl: object | false`: Set to `false` to sign in without navigating. As an object:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete. An absolute URL is not `basePath`-prefixed, so it can be an external landing page.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `providerId: string`: The ID of the provider that should be used for login. If not set and only one provider is configured the configured provider will be used. Else the user will be redirected to a sign in page where they can choose a provider.

## Examples

###### A login page that redirects users in the onMount event:
```yaml
id: login
type: Box
events:
  onMount:
    # Redirect to "page1" if user is already logged in.
    - id: logged_in_redirect
      type: Link
      skip:
        _eq:
          - _user: sub
          - null
      params:
        pageId: page1
    # Call the Login action to log the user in.
    - id: login
      type: Login
      skip:
        _ne:
          - _user: sub
          - null
      params:
        # Redirect to "page1" after login is complete.
        callbackUrl:
          pageId: page1
```

###### A set of login and logout buttons:
```yaml
id: login_logout
type: Box
blocks:
  - id: Login
    type: Button
    visible:
      _eq:
        - _user: sub
        - null
    events:
      onClick:
        - id: login
          type: Login
  - id: Logout
    type: Button
    visible:
      _ne:
        - _user: sub
        - null
    events:
      onClick:
        - id: logout
          type: Logout
```

###### A signup button that uses `authUrl.urlQuery` to request the signup screen:
```yaml
id: Signup
type: Button
events:
  onClick:
    - id: signup
      type: Login
      params:
        authUrl:
          urlQuery:
            screen_hint: signup
```

## Logout

When the `Logout` action is called, the user data and authorization cookies are cleared by the app.

The `callbackUrl` parameter of the Logout action specifies where the user lands after logout is complete. Unlike the `Login` action it has no default and does not read the `?callbackUrl=` query: with no `callbackUrl` the page is reloaded and the server re-applies the page's auth rules, which sends a signed-out user off a protected page to the sign-in page.

The parameters are:
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the logout flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the logout flow is complete.
  - `url: string`: The URL to redirect to after the logout flow is complete. An absolute URL is not `basePath`-prefixed, so it can be an external logout landing page.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after logout.
- `redirect: boolean`: If set to `false` the user session will be cleared, but the page will not be reloaded.


#### Examples

###### Redirect to the `logged-out` page in the app after logout:
```yaml
id: Logout
type: Button
events:
  onClick:
    - id: logout
      type: Logout
      params:
        callbackUrl:
          pageId: logged-out
```
