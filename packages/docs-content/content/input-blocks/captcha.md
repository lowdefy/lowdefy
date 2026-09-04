# Captcha

Renders a captcha widget (Cloudflare Turnstile) and writes the minted token into state under its blockId. Configure `provider` and `siteKey` from the `_build.authConfig` projection when `auth.captcha` is enabled. The `reset` method clears the value and mints a fresh token; expiry clears the value automatically.

> The widget script loads from the provider's CDN at render - apps behind a strict CSP should allowlist challenges.cloudflare.com. Tokens are single-use and short-lived: pass the block value as the `captchaToken` param of auth actions, and call the block's `reset` method from the action's `onError` chain to mint a fresh token for retries.

```yaml
- id: captcha_basic
  type: Captcha
  properties:
    provider: cloudflare-turnstile
    siteKey: 1x00000000000000000000AA
```

```yaml
captcha_basic:
  _state: captcha_basic
```

```yaml
- id: captcha_compact
  type: Captcha
  properties:
    provider: cloudflare-turnstile
    siteKey: 1x00000000000000000000AA
    theme: light
    size: compact
```

```yaml
captcha_compact:
  _state: captcha_compact
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `provider` | string | `"cloudflare-turnstile"` | Captcha provider to render. Normally fed from the auth config projection: { _build.authConfig: captcha.provider }. Enum: `cloudflare-turnstile`. |
| `siteKey` | string | - | The provider site key - public, rendered into the page. Normally fed from the auth config projection: { _build.authConfig: captcha.siteKey }. |
| `theme` | string | `"auto"` | Widget theme. Enum: `auto`, `light`, `dark`. |
| `size` | string | `"normal"` | Widget size. Enum: `normal`, `compact`, `flexible`. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onSuccess` | \- | Trigger actions when the captcha challenge succeeds and a token is minted. |
| `onExpire` | \- | Trigger actions when the minted token expires - the block value is cleared so a late submit fails with a clear missing-token error. |
| `onError` | \- | Trigger actions when the captcha provider reports an error. |

No CSS keys defined.

No slots defined.
