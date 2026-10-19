# EmailOtpSend

```
(params: {
  email: string
  captchaToken?: string
}): void
```

The `EmailOtpSend` action emails a one-time sign-in code to an address. It requires `auth.emailOTP` to be enabled — see [Configuration](/auth-configuration).

A code is typed into the tab the person started from, so the sign-in survives corporate mail security that pre-fetches links (which consumes a single-use magic link before the person clicks it), and it works when the email is read on another device.

Use [`EmailOtpVerify`](/EmailOtpVerify) to complete the sign-in with the code.

When `auth.magicLink` is enabled alongside `auth.emailOTP`, the magic-link email already carries the code: the [`Login`](/Login) action with `magicLink: true` sends one email that serves both paths, and `EmailOtpSend` is then only needed for a code-only page that offers no link at all.

Under an invite-only signup policy an address that is not admitted gets no email, and the action still resolves successfully — the response is identical either way, so the "check your email" screen gives nothing away about who has an account.

#### Parameters

###### object
- `email: string`: __required__ - The email address to send the sign-in code to.
- `captchaToken: string`: A captcha token minted by a `Captcha` block, sent as the `x-captcha-response` header when `auth.captcha` is enabled. Tokens are single-use, so reset the `Captcha` block in `onError` for retries.

#### Examples

###### Send a sign-in code:
```yaml
- id: send_code
  type: EmailOtpSend
  params:
    email:
      _state: email
```

###### Send a code and tell the user to check their inbox:
```yaml
- id: send_code
  type: Button
  properties:
    title: Send code
  events:
    onClick:
      - id: validate
        type: Validate
        params:
          regex: ^email$
      - id: send
        type: EmailOtpSend
        params:
          email:
            _state: email
      - id: sent
        type: DisplayMessage
        params:
          content: Check your email for the sign-in code.
```
