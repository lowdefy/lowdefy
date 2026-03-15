---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-basic': minor
---

feat: Render ShortcutBadge in Button, Anchor, Tag, and Search blocks.

Button, Anchor, and Tag now display a platform-aware keyboard shortcut badge (e.g. `⌘S` / `Ctrl+S`) next to the title when the event has a `shortcut` defined. The badge respects `hideTitle` and circle shapes on Button. Search replaces its hardcoded `⌘K` label with the ShortcutBadge component, so custom shortcuts (e.g. `mod+j`) are reflected in the trigger button.
