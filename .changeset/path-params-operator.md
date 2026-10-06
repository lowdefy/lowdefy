---
'@lowdefy/operators-js': minor
'@lowdefy/actions-core': minor
'@lowdefy/operators': patch
'@lowdefy/build': patch
---

Pages read their path values with the `_path_params` operator (the same `key` / `all` / `default` arguments as `_url_query`, values always strings), and `_js` functions read them with a `pathParams` accessor. The `Link` action and the auth actions' callback targets (`Login`, `Logout`, `SignUp`, `EmailOtpVerify`, `MagicLinkVerify`, `PhoneNumberVerify`, `TwoFactorVerify`, `SendVerificationEmail`, `PasskeySignIn`) accept `pathParams` next to `urlQuery`.
