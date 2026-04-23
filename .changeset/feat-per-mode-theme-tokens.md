---
'@lowdefy/client': minor
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

feat(client): Per-mode theme tokens for dark/light customization.

`theme.antd` now accepts four new sibling keys so apps can soften base surfaces without juggling two theme files. Each is merged on top of the shared equivalent only when the matching mode is active:

- `lightToken` / `darkToken` — override antd design tokens (e.g. `colorBgLayout`, `colorBgContainer`, `colorBgElevated`) per mode.
- `lightComponents` / `darkComponents` — override component-level tokens per mode (e.g. `Layout.siderBg`, `Layout.headerBg`, `Menu.darkItemBg`) that aren't reachable via seed tokens.

The `<html>` pre-hydration inline script now reads `darkToken.colorBgLayout` / `lightToken.colorBgLayout` from the built theme, so the first paint matches your configured surface color with no flash of `#000` or `#fff`.

```yaml
theme:
  antd:
    token:
      colorPrimary: '#6366f1'
    darkToken:
      colorBgLayout: '#131419'
      colorBgContainer: '#1a1b22'
    darkComponents:
      Layout:
        headerBg: '#0e0f13'
        siderBg: '#0e0f13'
      Menu:
        darkItemBg: '#0e0f13'
        darkItemSelectedBg: '#252731'
  darkMode: system
```

Backwards compatible — apps that only use `theme.antd.token` keep antd's default base colors (dark `#000`, light browser-default).
