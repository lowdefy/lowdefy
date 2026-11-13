---
'@lowdefy/build': patch
---

feat(build): Warn when an agent on Vercel has no time limit

On Vercel, an agent chat turn is not covered by `config.requestTimeout` and keeps running after the browser goes away. An agent with no `timeout` of its own, on a connection with none, was stopped only when Vercel ended the function at `config.vercel.maxDuration`. The reply then stopped mid-stream with no error, and the agent's `onFinish` hooks, which save the conversation, never ran. A production app had test turns cut off this way. The build now warns for each such agent, and for an agent whose timeout is not shorter than `maxDuration`, when the app targets Vercel. With its own timeout, a turn that runs too long is cancelled, the user sees an error and the `onFinish` hooks still run. Timeouts set with an operator are not checked.
