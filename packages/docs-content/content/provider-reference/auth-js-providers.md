# Auth.js Providers

All Auth.js preconfigured OAuth providers can be used in a Lowdefy app. The provider properties are mapped through directly, so the Auth.js documentation can be used as reference. They usually only need a few configuration properties to be used. Since these properties include secrets, the [`_secret`](/_secret) operator should be used to configure these properties.

For most OAuth providers, a callback URL must be configured with the provider for security reasons. This URL is the URL to which the user will be redirected to complete the login flow. This URL should be set to `<app-domain>/api/auth/callback/<providerId>` where the `providerId` is the Lowdefy providerId.

> This is not the same as the callback URL specified in the Login action, which is where the user is redirected by the Lowdefy app once login is complete.

The providers that can be used are:

- [FortyTwoProvider](https://authjs.dev/reference/core/providers/42-school)
- [AppleProvider](https://authjs.dev/reference/core/providers/apple)
- [AtlassianProvider](https://authjs.dev/reference/core/providers/atlassian)
- [Auth0Provider](https://authjs.dev/reference/core/providers/auth0)
- [AuthentikProvider](https://authjs.dev/reference/core/providers/authentik)
- [AzureADB2CProvider](https://authjs.dev/reference/core/providers/azure-ad-b2c)
- [AzureADProvider](https://authjs.dev/reference/core/providers/azure-ad)
- [BattleNetProvider](https://authjs.dev/reference/core/providers/battlenet)
- [BoxProvider](https://authjs.dev/reference/core/providers/box)
- [BoxyHQSAMLProvider](https://authjs.dev/reference/core/providers/boxyhq-saml)
- [BungieProvider](https://authjs.dev/reference/core/providers/bungie)
- [CognitoProvider](https://authjs.dev/reference/core/providers/cognito)
- [CoinbaseProvider](https://authjs.dev/reference/core/providers/coinbase)
- [DiscordProvider](https://authjs.dev/reference/core/providers/discord)
- [DropboxProvider](https://authjs.dev/reference/core/providers/dropbox)
- [EVEOnlineProvider](https://authjs.dev/reference/core/providers/eveonline)
- [FacebookProvider](https://authjs.dev/reference/core/providers/facebook)
- [FaceItProvider](https://authjs.dev/reference/core/providers/faceit)
- [FourSquareProvider](https://authjs.dev/reference/core/providers/foursquare)
- [FreshbooksProvider](https://authjs.dev/reference/core/providers/freshbooks)
- [FusionAuthProvider](https://authjs.dev/reference/core/providers/fusionauth)
- [GitHubProvider](https://authjs.dev/reference/core/providers/github)
- [GitlabProvider](https://authjs.dev/reference/core/providers/gitlab)
- [GoogleProvider](https://authjs.dev/reference/core/providers/google)
- [HubspotProvider](https://authjs.dev/reference/core/providers/hubspot)
- [InstagramProvider](https://authjs.dev/reference/core/providers/instagram)
- [KakaoProvider](https://authjs.dev/reference/core/providers/kakao)
- [KeycloakProvider](https://authjs.dev/reference/core/providers/keycloak)
- [LineProvider](https://authjs.dev/reference/core/providers/line)
- [LinkedInProvider](https://authjs.dev/reference/core/providers/linkedin)
- [MailchimpProvider](https://authjs.dev/reference/core/providers/mailchimp)
- [MailRuProvider](https://authjs.dev/reference/core/providers/mailru)
- [MediumProvider](https://authjs.dev/reference/core/providers/medium)
- [NaverProvider](https://authjs.dev/reference/core/providers/naver)
- [NetlifyProvider](https://authjs.dev/reference/core/providers/netlify)
- [OktaProvider](https://authjs.dev/reference/core/providers/okta)
- [OneLoginProvider](https://authjs.dev/reference/core/providers/onelogin)
- [OssoProvider](https://authjs.dev/reference/core/providers/osso)
- [OsuProvider](https://authjs.dev/reference/core/providers/osu)
- [PassageProvider](https://authjs.dev/reference/core/providers/passage)
- [PatreonProvider](https://authjs.dev/reference/core/providers/patreon)
- [PinterestProvider](https://authjs.dev/reference/core/providers/pinterest)
- [PipedriveProvider](https://authjs.dev/reference/core/providers/pipedrive)
- [RedditProvider](https://authjs.dev/reference/core/providers/reddit)
- [SalesforceProvider](https://authjs.dev/reference/core/providers/salesforce)
- [SlackProvider](https://authjs.dev/reference/core/providers/slack)
- [SpotifyProvider](https://authjs.dev/reference/core/providers/spotify)
- [StravaProvider](https://authjs.dev/reference/core/providers/strava)
- [TodoistProvider](https://authjs.dev/reference/core/providers/todoist)
- [TraktProvider](https://authjs.dev/reference/core/providers/trakt)
- [TwitchProvider](https://authjs.dev/reference/core/providers/twitch)
- [TwitterProvider](https://authjs.dev/reference/core/providers/twitter)
- [UnitedEffects](https://authjs.dev/reference/core/providers/united-effects)
- [VkProvider](https://authjs.dev/reference/core/providers/vk)
- [WikimediaProvider](https://authjs.dev/reference/core/providers/wikimedia)
- [WordpressProvider](https://authjs.dev/reference/core/providers/wordpress)
- [WorkOSProvider](https://authjs.dev/reference/core/providers/workos)
- [YandexProvider](https://authjs.dev/reference/core/providers/yandex)
- [ZitadelProvider](https://authjs.dev/reference/core/providers/zitadel)
- [ZohoProvider](https://authjs.dev/reference/core/providers/zoho)
- [ZoomProvider](https://authjs.dev/reference/core/providers/zoom)

#### Examples

###### Auth0 configuration:

```yaml
lowdefy: 5.5.1
auth:
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

In Auth0, the callback URL should be configured to `https://example.com/api/auth/callback/auth0` for production and `http://localhost:3000/api/auth/callback/auth0` for development.

###### GitHub configuration:

```yaml
lowdefy: 5.5.1
auth:
  providers:
    - id: github
      type: GitHubProvider
      properties:
        clientId:
          _secret: GITHUB_CLIENT_ID
        clientSecret:
          _secret: GITHUB_CLIENT_SECRET
```
