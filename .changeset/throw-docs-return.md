---
'@lowdefy/docs-content': patch
---

docs(actions): Point the Throw docs at `:return` for ending an event without an error

The `Throw` docs showed a "Fail silently" example that set `messages.error: false` to stop an event's actions on purpose. That only hides the message: the `Throw` is still logged to the browser console as an empty `UserError` and the event's `catch` actions still run, so every deliberate stop looked like an error. The docs now say a thrown `Throw` is always logged, relabel that example as hiding the message, and add an example that ends the event early with `:if` and `:return`, which logs nothing and shows no message.
