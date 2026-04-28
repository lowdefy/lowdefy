---
'@lowdefy/blocks-antd': patch
---

fix(PageSidebarLayout): Render notifications, profile, and dark-mode toggle as labeled, left-aligned rows when the sider is expanded.

When the sider is open, the bottom actions now render as `[icon] [label]` rows that match the visual style of the menu items above (e.g. "Notifications", "Profile", "Light mode"). When the sider is collapsed, the actions remain as a centered icon stack. Two new optional schema fields — `notifications.title` (default `Notifications`) and `profile.title` (default `Profile`) — let consumers customise the expanded labels; consumers can also bind `_user: name` to `profile.title` to show the authenticated user's name.

The profile dropdown's default `trigger` now depends on whether the sider is expanded: `click` when expanded (the labeled row invites click), `hover` when collapsed (original small-avatar behavior). Consumers passing `profile.trigger` explicitly are unaffected.

No change to `PageSiderMenu` or `PageHeaderMenu` — their header-bar rendering still uses the icon-only layout and `hover` trigger.
