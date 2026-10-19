---
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

The build warns when `config.requestTimeout` is not shorter than the Vercel function's `maxDuration`.

Vercel stops the function at `config.vercel.maxDuration` (60 seconds by default), so a request timeout that is not shorter never answers, and the calls a request left running, such as an AI model call, are not cancelled. The warning applies when the app sets `config.vercel` or the build runs on Vercel.

The Vercel deployment and AI request docs also note that on Vercel only the request timeout cancels a model call: a client disconnect does not.
