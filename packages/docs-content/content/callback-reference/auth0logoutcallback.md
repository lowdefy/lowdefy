# Auth0LogoutCallback

The Auth0LogoutCallback can be used to log the user out from Auth0 when logging out of the Lowdefy app. The callback takes a `returnToPageId` property, which is the pageId the user will be directed to after logout from Auth0 is complete. The URL which the user will be directed to needs to be configured with Auth0 as an allowed logout URL.

To trigger the Auth0 logout, the `Logout` action `callbackUrl.url` param should be set to `AUTH0_LOGOUT`.

#### Properties

###### object
- `issuer: string`: Auth0 issuer URL. This should be the same that was used for the `Auth0Provider`.
- `clientId: string`: Auth0 client ID. This should be the same that was used for the `Auth0Provider`.
- `returnToPagedId: string`: The pageId in the Lowdefy application to which the user should be redirected affter logging out from Auth0.

#### Examples

###### Configuring Auth0LogoutCallback.

```yaml
lowdefy: 5.5.1
providers:
  - id: auth0
    type: Auth0Provider
    properties:
      clientId:
        _secret: AUTH0_CLIENT_ID
      clientSecret:
        _secret: AUTH0_CLIENT_SECRET
      issuer:
        _secret: AUTH0_ISSUER
callbacks:
  - id: auth0_logout
    type: Auth0LogoutCallback
    properties:
      clientId:
        _secret: AUTH0_CLIENT_ID
      issuer:
        _secret: AUTH0_ISSUER
      returnToPagedId: logged-out
```

The Auth0 allowed logout URLS should be set to `https://my-app.com/logged-out` for production and `http://localhost:3000/logged-out` for development.

###### Logging out.
```yaml
id: logout_button
type: Button
events:
  onClick:
    - id: logout
      type: Logout
      params:
        callbackUrl:
          url: AUTH0_LOGOUT
```
