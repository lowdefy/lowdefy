# MagicLinkVerify

```
(params?: {
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
    pathParams?: object
  }
  errorCallbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
    pathParams?: object
  }
  newUserCallbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
    pathParams?: object
  }
  token?: string
}): void
```

The `MagicLinkVerify` action completes a magic-link sign-in from the landing page the sign-in email points at. It navigates the browser to the auth server's verify endpoint, which sets the session cookie and redirects the user on to their destination.

## Why a landing page

A magic-link token is single-use, and the verify endpoint consumes it on the **first** `GET` of the URL. Corporate mail security — Microsoft Defender Safe Links, Proofpoint URL Defense, Mimecast — fetches every link in a message as it is delivered. When the email links straight at the verify endpoint the scanner spends the token minutes before the person clicks, and the person lands on the auth error page with `INVALID_TOKEN`.

Setting [`auth.authPages.magicLink`](/auth-configuration#the-magic-link-landing-page) to a page in your app moves the email's link to that page, carrying the token and callback destinations in the URL fragment (after the `#`). Fetching a Lowdefy page has no side effect, so the token stays unspent until a person clicks a button that runs `MagicLinkVerify`.

## The token stays out of URLs

A browser never sends a URL's fragment to the server, so the token on the landing page does not reach the server's request logs, a host's firewall or log drains, or a `Referer` header. `MagicLinkVerify` clears the fragment from the address bar and browser history, then posts the token in a form to `/api/auth/magic-link/verify`. The server refuses a post whose `Origin` is not the app's own, and otherwise verifies the token as Better Auth's `GET` verify endpoint does: it sets the session cookie and redirects to the callback destination, or to `errorCallbackURL` with `?error=`.

Read the fragment in the page's config with [`_url_hash`](/_url_hash), for example to show the button only when the link carried a token. A link emailed in the older form, with `?token=` on the URL query, still works: the action falls back to the URL query for each value.

This action **must** be bound to a click. Do not run it in `onMount` and do not auto-redirect from the landing page: scanning sandboxes that execute JavaScript would consume the token anyway, and you would be no better off than linking at the verify endpoint directly.

## Defaults come from the URL fragment

Every parameter is optional. The auth server minted the landing URL with the verify params in its fragment, so the action reads its defaults from the page's own URL:

| Parameter | Default |
| --------- | ------- |
| `token` | the `token` fragment parameter |
| `callbackUrl` | the `callbackURL` fragment parameter, else the auth server's default |
| `newUserCallbackUrl` | the `newUserCallbackURL` fragment parameter, else `callbackUrl` |
| `errorCallbackUrl` | the `errorCallbackURL` fragment parameter, else `auth.authPages.error` |

Pass a parameter only to override what the email carried. The action throws if there is no token in either place, because there is nothing to verify.

`callbackUrl: false` is not valid here. Verification redirects through a hop the app does not control, so there is no staying put.

The event chain ends after this action, like every other action that navigates the browser away — a step after it would race the page being replaced.

#### Parameters

###### object
- `token: string`: The single-use magic-link token. Defaults to the `token` parameter in the landing page's URL fragment.
- `callbackUrl: object`: Where a successful sign-in lands. Defaults to the `callbackURL` parameter in the URL fragment.
  - `home: boolean`: Land on the app's home page.
  - `pageId: string`: The pageId to land on.
  - `url: string`: The URL to land on. An absolute URL is not `basePath`-prefixed, so it can be an external landing page.
  - `urlQuery: object`: The urlQuery to set on the destination.
  - `pathParams: object`: Values for the placeholders in the destination page's [`path`](/page-paths), by placeholder name.
- `newUserCallbackUrl: object`: Where a sign-in that creates a new account lands, for a first-run or onboarding page. Defaults to the `newUserCallbackURL` parameter in the URL fragment. Same fields as `callbackUrl`.
- `errorCallbackUrl: object`: Where a failed verification lands, with the reason in `?error=`. Defaults to the `errorCallbackURL` parameter in the URL fragment, then to `auth.authPages.error`. Same fields as `callbackUrl`.

#### Examples

###### The landing page, with everything taken from the URL fragment:
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
