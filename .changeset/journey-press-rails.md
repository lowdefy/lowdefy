---
'@lowdefy/client': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): Data-set rails check `press` steps and the option a `select` picks

On a data-set journey a `press` went unchecked, though it can fire a block's events: `press: Mod+s` fires the `onClick` of a block whose event sets `shortcut: mod+s`, `press: Enter` fires the focused input's `onPressEnter` or button's `onClick`, and `press: Escape` fires an open modal's `onCancel`. A press is now checked before the key goes down, against the blocks around the focused element (an open modal or drawer included) and every shown block whose `shortcut` the keys match, and fails on an auth action as a click does: `... so a data-set journey cannot press a key that fires its events.`

A `select` on a container that holds two radio or checkbox groups checked the first group's block, though the option it picked could be in the second. It now checks the block of the option it picks.
