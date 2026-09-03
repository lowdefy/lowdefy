---
'@lowdefy/server-dev': minor
---

feat(server-dev): Send feedback annotations directly from the annotation panel.

The separate review step is gone: "Copy for agent" now sends straight from the panel and always includes the annotation you are writing, "Add another" banks it and returns to picking, and banked annotations stay visible in a pending tray where they can be removed before sending. Enter triggers the send in both states.
