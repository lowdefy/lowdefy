---
'@lowdefy/server-dev': patch
---

fix(server-dev): A page past the map budget is built once, not on every request

When a page build pushed the dev server's build context past its map budget, the server threw the context away and treated every page as edited. A page whose own build passed the budget then rebuilt on every request and API call, making a new build context each time, and its open requests could come back empty. On a large app this used most of a CPU core and made journeys on the page fail.

Passing the budget now only releases the context, so the next page build makes a new one in the same generation, and pages built on the released one stay current. The budget is raised from 48,000 to 480,000 map entries, so editing a large page usually rebuilds it rather than making a new context. Making a context now parses each build artifact once, which saves about a third of its time.
