---
'@lowdefy/engine': patch
'@lowdefy/client': patch
'@lowdefy/journey-headless': patch
---

fix(engine): Freeze shared block config in dev and in tests

Every container and list row of a page reads one copy of its block config, so a block or plugin that wrote into its own config would change it for every other row and container on the page. On the dev and e2e servers, in headless journeys and in the engine's tests that copy is now frozen, so such a write throws where it happens instead. Production builds don't freeze it, so they pay nothing.
