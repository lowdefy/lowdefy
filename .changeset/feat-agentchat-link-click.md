---
'@lowdefy/blocks-antd-x': minor
---

feat: AgentChat reports link clicks and routes in-app links client-side

Links in an agent's answer were rendered as plain anchors, so following a citation was a full browser navigation: the conversation was left behind, and an app had no way to do anything else with the click.

Markdown links now render through the app's `Link` component when the href is an in-app path, making them client-side routes rather than reloads. Links with a scheme open in a new tab, so the conversation stays on screen.

A new `onLinkClick` event reports the click with `href` and `text`. Wiring it suppresses the default navigation for plain left clicks, so an app can show the target in place — a guide in a modal, a record in a drawer — instead of navigating. Apps that do not wire it are unaffected. Modified and non-primary clicks (new tab, middle click) are never intercepted.
