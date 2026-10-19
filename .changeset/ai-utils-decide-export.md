---
'@lowdefy/ai-utils': minor
'@lowdefy/server-dev': patch
---

feat: Typed decisions outside a request, and dev errors that know which browser caused them

`@lowdefy/ai-utils` exports `decide({ model, backend, state, questions, options })`, the typed-decision call behind the `Decide` request, for code that holds a model but has no connection or request. It returns the answers, the token usage and the provider metadata, which on the AI Gateway carries the call's cost.

In the development server, browser and server errors now record which browser context caused them. Errors caused by the dev server's own headless browser during a journey run stay out of the build status and the agent event stream. Tabs that the dev server's own browser opens are still counted, but the agent tools that read state from a live tab no longer pick them over your own tab.
