# Login

```
(params: {
  authUrl?: {
    urlQuery?: object,
  }
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  } | false
  providerId?: string,
}): void
```

The `Login` action is used to start the user login flow. If only one provider is configured, or the `Login` action is called with a `providerId`, the `Login` action requests the Provider's authorization URL from the Lowdefy server, and redirects the user to this URL. Otherwise, the action redirects the user to a page where the user can choose which provider to use to sign in.

The authorization url usually hosts a page where the user can input their credentials. After the user has logged in successfully, the user is redirected to the `api/auth/callback/[provider_id]` route in the Lowdefy app, where the rest of the authorization code flow is completed.

The `callbackUrl` parameter of the Login action specifies where the user lands after login is complete. Three sources are consulted, in order:

1. The `callbackUrl` param, if given.
2. The `?callbackUrl=` query parameter, which Lowdefy sets when it redirects an unauthenticated user to the sign-in page - so a user who was bounced there returns to the page they asked for.
3. The app's home page.

If none of the three resolves - an app with no `homePageId` whose menu offers the signed-out user no page to fall back on - the action throws rather than staying silently on the sign-in page.

To sign in without navigating at all, set `callbackUrl: false`. This is for a login form in a modal or an embedded panel, where the session store re-renders the page with the new user in place. It is not valid for magic-link or social/OAuth sign-in, which redirect through a hop Lowdefy does not control.

A sign-in the auth server rejects - a wrong password, an expired or already-used link, an invalid code - is an expected outcome, not an app error. The action throws a `UserError`: `catch` actions on the event still run and the error message still displays, but it is logged to the browser console only and is never reported to the server. The auth server's response is available to `catch` actions as `_actions.<actionId>.error.metaData`, with a `code` (for example `INVALID_EMAIL_OR_PASSWORD`) and the HTTP `status`. A network failure or a server fault is still thrown as an action error and reported.

#### Parameters

###### object
- `authUrl: object`:
  - `urlQuery: object`: Query parameters to set for the authorization URL.
- `callbackUrl: object | false`: Set to `false` to sign in without navigating. As an object:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete. An absolute URL is not `basePath`-prefixed, so it can be an external landing page.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `providerId: string`: The ID of the provider that should be used for login. If not set and only one provider is configured the configured provider will be used. Else the user will be redirected to a sign in page where they can choose a provider.

#### Examples

###### Login and land on the home page (or the page the user was bounced from):
```yaml
- id: login
  type: Login
```

###### Login in a modal, without navigating:
```yaml
- id: login
  type: Login
  params:
    callbackUrl: false
```

###### Login with the google provider:
```yaml
- id: login_with_google
  type: Login
  params:
    providerId: google
```

###### Login, with pageId and urlQuery:
```yaml
- id: login
  type: Login
  params:
    callbackUrl:
      pageId: page1
      urlQuery:
        url1: value
```

###### Only login if user is not logged in:
```yaml
- id: login
  type: Login
  skip:
    _ne:
      - _user: sub
      - null
```

###### Request the signup page from the provider:
```yaml
- id: Signup
  type: Button
  events:
    onClick:
      - id: login
        type: Login
        params:
          authUrl:
            urlQuery:
              screen_hint: signup
```
