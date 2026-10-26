---
'@lowdefy/shell': patch
---

fix(shell): Run the quick action that launched the app once

The app's services start again after every sign-out, and the quick action or shortcut link that launched the app stayed as it was, so the next person to sign in was sent to the shortcut's page and `onShortcut` fired again. It now runs once per launch.
