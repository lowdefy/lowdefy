---
'@lowdefy/blocks-antd-x': minor
---

feat(blocks-antd-x): AgentChat passes `styles` and `classNames` through to the bubbles and the composer.

The filled user bubble, the outlined assistant border and the composer border take their colour from the theme's `colorPrimary`, which antd-x applies with a precedence no page stylesheet beats, so an app whose primary is a neutral had to reach them with `!important` on every property. `messageDisplay.roles.user`, `messageDisplay.roles.assistant` and `sender` now accept antd-x's own `styles` and `classNames`, keyed by semantic part.
