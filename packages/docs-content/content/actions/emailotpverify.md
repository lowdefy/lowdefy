# EmailOtpVerify

```
(params: {
  email: string
  otp: string
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  } | false
}): void
```

The `EmailOtpVerify` action signs a user in with the one-time code emailed to them by [`EmailOtpSend`](/EmailOtpSend), or carried on the magic-link email when `auth.magicLink` and `auth.emailOTP` are both enabled. It requires `auth.emailOTP` to be enabled — see [Configuration](/auth-configuration).

On success the session cookie is set — creating the account on first sign-in, unless `emailOTP.disableSignUp` is `true` — and the browser lands on the resolved `callbackUrl`. Three sources are consulted, in order:

1. The `callbackUrl` param, if given.
2. The `?callbackUrl=` query parameter, which Lowdefy sets when it redirects an unauthenticated user to the sign-in page.
3. The app's home page.

To sign in without navigating, set `callbackUrl: false` — valid here, unlike on the magic-link and social paths, because this is a plain JSON sign-in with no redirect hop.

If the user has two-factor authentication enrolled, the code mints a challenge rather than a session: the action navigates to `authPages.twoFactor` carrying the resolved destination as `?callbackUrl=`, where [`TwoFactorVerify`](/two-factor) finishes the sign-in, and the event chain stops.

An expired, mistyped or already-used code is the auth server rejecting the attempt, not an app fault. The action throws a `UserError`: `catch` actions still run and the message still displays, but it is logged to the browser console only and is never reported to the server.

#### Parameters

###### object
- `email: string`: __required__ - The email address the code was sent to.
- `otp: string`: __required__ - The one-time code from the email.
- `callbackUrl: object | false`: Set to `false` to sign in without navigating. As an object:
  - `home: boolean`: Land on the app's home page.
  - `pageId: string`: The pageId to land on.
  - `url: string`: The URL to land on. An absolute URL is not `basePath`-prefixed, so it can be an external landing page.
  - `urlQuery: object`: The urlQuery to set on the destination.

#### Examples

###### Sign in with the code and land on the home page (or the page the user was bounced from):
```yaml
- id: verify_code
  type: EmailOtpVerify
  params:
    email:
      _state: email
    otp:
      _state: otp
```

###### Sign in and land on a specific page:
```yaml
- id: verify_code
  type: EmailOtpVerify
  params:
    email:
      _state: email
    otp:
      _state: otp
    callbackUrl:
      pageId: dashboard
```

###### Sign in inside a modal, without navigating:
```yaml
- id: verify_code
  type: EmailOtpVerify
  params:
    email:
      _state: email
    otp:
      _state: otp
    callbackUrl: false
```
