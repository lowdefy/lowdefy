# OpenIDConnectProvider

The OpenIDConnectProvider can be used to authenticate with a OpenID Connect compliant identity provider that is not already included as a default Auth.js provider, without the need to develop a custom provider plugin.

#### Properties

###### object
  - `wellKnown: string`
  - `authorization: string | object`: The default is `{ params: { scope: 'openid email profile' } }`.
  - `token: string | object`
  - `userinfo: string | object`
  - `version: string`
  - `checks: string | string[]`: The default is `['pkce', 'state']`
  - `clientId: string`
  - `clientSecret: string`
  - `idToken: boolean`: The default is `true`.
  - `region: string`
  - `issuer: string`
  - `allowDangerousEmailAccountLinking: boolean`
  - `style: object`

###### See the [Auth.js OAuth provider guide](https://authjs.dev/guides/configuring-oauth-providers) for more details on provider properties.

#### Examples

###### Simple configuration.

Usually only the `wellKnown`, `clientId` and `clientSecret` properties need to be configured:

```yaml
lowdefy: 5.5.1
auth:
  providers:
    - id: my_provider
      type: OpenIDConnectProvider
      properties:
        wellKnown:
          _secret: OPENID_CONNECT_WELLKNOWN
        clientId:
          _secret: OPENID_CONNECT_CLIENT_ID
        clientSecret:
          _secret: OPENID_CONNECT_CLIENT_SECRET
```

where `LOWDEFY_SECRET_OPENID_CONNECT_WELLKNOWN` usually has the format `https://my-provider.com/.well-known/openid-configuration`
