# MagicLinkVerify

```
(params?: {
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  }
  errorCallbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  }
  newUserCallbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  }
  token?: string
}): void
```

The `MagicLinkVerify` action completes a magic-link sign-in from the landing page the sign-in email points at. It navigates the browser to the auth server's verify endpoint, which sets the session cookie and redirects the user on to their destination.

## Why a landing page

A magic-link token is single-use, and the verify endpoint consumes it on the **first** `GET` of the URL. Corporate mail security — Microsoft Defender Safe Links, Proofpoint URL Defense, Mimecast — fetches every link in a message as it is delivered. When the email links straight at the verify endpoint the scanner spends the token minutes before the person clicks, and the person lands on the auth error page with `INVALID_TOKEN`.

Setting [`auth.authPages.magicLink`](/auth-configuration#the-magic-link-landing-page) to a page in your app moves the email's link to that page, carrying the token and callback destinations on the URL query. Fetching a Lowdefy page has no side effect, so the token stays unspent until a person clicks a button that runs `MagicLinkVerify`.

This action **must** be bound to a click. Do not run it in `onMount` and do not auto-redirect from the landing page: scanning sandboxes that execute JavaScript would consume the token anyway, and you would be no better off than linking at the verify endpoint directly.

## Defaults come from the URL query

Every parameter is optional. The auth server minted the landing URL with the verify query on it, so the action reads its defaults from the page's own URL:

| Parameter | Default |
| --------- | ------- |
| `token` | the `?token=` query parameter |
| `callbackUrl` | the `?callbackURL=` query parameter, else the auth server's default |
| `newUserCallbackUrl` | the `?newUserCallbackURL=` query parameter, else `callbackUrl` |
| `errorCallbackUrl` | the `?errorCallbackURL=` query parameter, else `auth.authPages.error` |

Pass a parameter only to override what the email carried. The action throws if there is no token in either place, because there is nothing to verify.

`callbackUrl: false` is not valid here. Verification redirects through a hop the app does not control, so there is no staying put.

The event chain ends after this action, like every other action that navigates the browser away — a step after it would race the page being replaced.

#### Parameters

###### object
- `token: string`: The single-use magic-link token. Defaults to the `?token=` URL query parameter of the landing page.
- `callbackUrl: object`: Where a successful sign-in lands. Defaults to the `?callbackURL=` URL query parameter.
  - `home: boolean`: Land on the app's home page.
  - `pageId: string`: The pageId to land on.
  - `url: string`: The URL to land on. An absolute URL is not `basePath`-prefixed, so it can be an external landing page.
  - `urlQuery: object`: The urlQuery to set on the destination.
- `newUserCallbackUrl: object`: Where a sign-in that creates a new account lands, for a first-run or onboarding page. Defaults to the `?newUserCallbackURL=` URL query parameter. Same fields as `callbackUrl`.
- `errorCallbackUrl: object`: Where a failed verification lands, with the reason in `?error=`. Defaults to the `?errorCallbackURL=` URL query parameter, then to `auth.authPages.error`. Same fields as `callbackUrl`.

#### Examples

###### The landing page, with everything taken from the URL query:
```yaml
id: magic-link
type: PageHeaderMenu
blocks:
  - id: content
    type: Box
    blocks:
      - id: title
        type: Title
        properties:
          content: Sign in
          level: 3
      - id: description
        type: Paragraph
        properties:
          content: Click the button below to finish signing in.
      - id: verify_button
        type: Button
        properties:
          title: Sign in
        events:
          onClick:
            - id: verify
              type: MagicLinkVerify
```

###### Send a new user to an onboarding page instead:
```yaml
- id: verify
  type: MagicLinkVerify
  params:
    newUserCallbackUrl:
      pageId: welcome
```

###### Override where a successful sign-in lands:
```yaml
- id: verify
  type: MagicLinkVerify
  params:
    callbackUrl:
      pageId: dashboard
      urlQuery:
        source: magic-link
```
