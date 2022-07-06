# V4 Migration

- Replace `Context` to `Box`.
- Resolve errors if the same id was used in an action chain.
- Convert `auth`:
  - `auth` is now a root level property.
  - remove `openId` fields.
  - add providers:
  ```yaml
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
  ```
  - Add env vars `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
  - Add new callback urls to auth0 `{{ protocol }}{{ host }}/api/auth/callback/{{ providerId }}`.
  - convert login params (`callbackUrl`, `authUrl.urlQuery`)
- Convert types to plugins.
- Replace `onEnter` and `onEnterAsync` with `onMount` and `onMountAsync`.
- Convert old loading on blocks to new loading.
- Convert all request operators except `_user`, to use `_payload`.
- Convert `Message` action to `DisplayMessage`
- Static files are no longer at 'public/...', (our logged out page for example)
