---
'@lowdefy/engine': patch
---

fix(engine): A message that fails to display no longer breaks the action that raised it. When the Message block threw while showing an action's loading, success or error message, the raw error replaced the action's result: a failed action lost its error, `catch` actions were skipped, and the page threw an unhandled `Cannot read properties of undefined (reading 'message')`. The display failure is now reported through the error handler on its own, and the action's result stands.
