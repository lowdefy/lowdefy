---
'lowdefy': patch
---

fix(cli): One Ctrl+C stops `lowdefy dev`

Pressing Ctrl+C once left `lowdefy dev` showing "Shutting down server..." indefinitely, and a second Ctrl+C was needed to get the terminal back. The dev server's last message starts that spinner, then the server exits, so nothing ever stopped the spinner and its timer kept the CLI running. The CLI now ends the spinner with "Development server stopped." once the dev server exits, and returns to the prompt.
