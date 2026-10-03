---
'@lowdefy/ai-utils': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': patch
---

feat: Typed decisions outside a request, the known-text set, and dev errors that know which browser caused them

`@lowdefy/ai-utils` exports `decide({ model, backend, state, questions, options })`, the typed-decision call behind the `Decide` request, for code that holds a model but has no connection or request. It returns the answers, the token usage and the provider metadata, which on the AI Gateway carries the call's cost. The `Decide` request returns the same result as before.

`@lowdefy/node-utils` exports `collectKnownText({ buildDirectory, pageIds, dataSet, typed })`: the strings that are safe to show outside your machine, taken from the given pages' build artifacts, the menus, the default locale's messages, a journey data set's fixtures and users, and values typed earlier. It never reads a data set's snapshot.

In the development server, browser and server errors now record which browser context caused them. Errors caused by the dev server's own headless browser during a journey exploration stay out of the build status and the agent event stream. Tabs that the dev server's own browser opens are still counted, but the agent tools that read state from a live tab no longer pick them over your own tab.
