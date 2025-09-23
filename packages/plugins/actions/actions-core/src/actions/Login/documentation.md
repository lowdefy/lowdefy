<TITLE>
Login
<TITLE>

<DESCRIPTION>
The `Login` action is used to start the user login flow. If only one provider is configured, or the `Login` action is called with a `providerId`, the `Login` action requests the Provider's authorization URL from the Lowdefy server, and redirects the user to this URL. Otherwise, the action redirects the user to a page where the user can choose which provider to use to sign in.

The authorization url usually hosts a page where the user can input their credentials. After the user has logged in successfully, the user is redirected to the `api/auth/callback/[provider_id]` route in the Lowdefy app, where the rest of the authorization code flow is completed.

The `callbackUrl` parameters of the Login action specify where the user is redirected after login is complete. If `callbackUrl` parameters not set, the user will return to the page from which the action was called.
<DESCRIPTION>

<USAGE>
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
  }
  providerId?: string,
}): void
```

###### object
- `authUrl: object`:
  - `urlQuery: object`: Query parameters to set for the authorization URL.
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `providerId: string`: The ID of the provider that should be used for login. If not set and only one provider is configured the configured provider will be used. Else the user will be redirected to a sign in page where they can choose a provider.
</USAGE>

<EXAMPLES>
### Login and return to the same page:
```yaml
- id: login
  type: Login
```

### Login with the google provider:
```yaml
- id: login_with_google
  type: Login
  params:
    providerId: google
```

### Login, with pageId and urlQuery:
```yaml
- id: login
  type: Login
  params:
    callbackUrl:
      pageId: page1
      urlQuery:
        url1: value
```

### Only login if user is not logged in:
```yaml
- id: login
  type: Login
  skip:
    _ne:
      - _user: sub
      - null
```

### Request the signup page from the provider:
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
</EXAMPLES>
