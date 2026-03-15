---
'@lowdefy/build': minor
'@lowdefy/engine': minor
'@lowdefy/client': minor
'@lowdefy/block-utils': minor
---

feat: Add keyboard shortcut support for block events.

Blocks can now define keyboard shortcuts on events using the `shortcut` property in the event long-form object. Shortcuts are platform-aware (`mod+K` maps to Cmd+K on Mac, Ctrl+K on Windows), support sequences (`g i`), and can be arrays for multiple bindings.

- **Build validation** warns on duplicate shortcuts within a page and conflicts with browser defaults (e.g. `mod+N`)
- **ShortcutManager** registers a single global keydown listener via tinykeys with visibility gating and input field suppression
- **ShortcutBadge** component renders platform-appropriate key symbols (e.g. `⌘ K`) and is available to all blocks via `components.ShortcutBadge`
