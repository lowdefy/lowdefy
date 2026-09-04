---
'@lowdefy/build': minor
'@lowdefy/docs-content': patch
'@lowdefy/docs': patch
---

feat(build): three declarative theme levers, `theme.mode`, `theme.density` and `theme.radius`

`theme.mode` (`system` | `light` | `dark`), `theme.density` (`default` | `compact`) and `theme.radius` (px) are validated at build time and resolved into antd's theme: `mode` drives the dark algorithm and still follows `prefers-color-scheme` live under `system`, `density: compact` applies antd's compact algorithm (composing with dark), and `radius` sets the `borderRadius` seed token. `theme.antd` is merged after the levers, so an explicit token always wins. `theme.mode` supersedes `theme.darkMode`, which keeps working as an alias. Tailwind's `dark:` variant is bound to the resolved mode too: the client toggles a `dark` class on `<html>` (before hydration as well), so antd and Tailwind utilities agree under `mode: dark` on a light OS and under a user toggle.
