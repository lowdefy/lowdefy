---
'@lowdefy/build': minor
'@lowdefy/api': minor
'lowdefy': patch
---

feat: Email branding defaults from app config, and relative logo paths.

Notification email branding (`app.email`) now inherits from your existing app config when not set explicitly:

- `companyName` defaults to the app's root `name:`. Note this means apps with a `name:` now render a company name header in emails by default — set `companyName: ''` to opt out.
- `primaryColor` defaults to `theme.antd.token.colorPrimary`, so branded apps get brand-colored email buttons without repeating the color.

The email `logo` can now be an app-relative path to a `public/` asset (for example `logo: /logo-light-theme.png`). It resolves against the `serverUrl` passed to the `RenderNotification` step, so one config works across environments. When no server URL is available — including the `lowdefy emails` preview — the logo is omitted and the header falls back to the `companyName` text instead of a broken image.
