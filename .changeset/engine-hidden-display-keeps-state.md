---
'@lowdefy/engine': patch
---

fix(engine): Hiding a display or container block no longer deletes state at its id

Only inputs and lists own a state field at their block id. Hiding a Button, Paragraph, Box or any other display or container block used to delete the state field with the same name, so `state.status` disappeared when a Button with id `status` was hidden. Hidden display and container blocks now leave state alone, while hidden inputs and lists (including those nested in a hidden container) are still removed as before. Fixes #1521.
