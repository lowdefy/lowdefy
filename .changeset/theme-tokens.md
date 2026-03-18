---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/operators-js': minor
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

Add theme token system. Use `_theme` operator to access Ant Design v6 design tokens (colors, spacing, typography) at runtime. Theme is configured via `theme.antd.token` and `theme.antd.algorithm` in `lowdefy.yaml`. The `_theme` operator resolves the full computed token set including antd defaults.
