---
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless, server-dev): A headless journey on the dev server reads the `_js` of pages built after the first journey

The dev server builds pages on demand, and each build rewrites the client `_js` map. Its headless host imported that map once per process, so a journey on a page built later failed on open with `_js function not found`. The host now sends each page's `_js` with its config as the page route sends it to the browser (`_jsEntries`), and the headless actor lays them over the loaded map, as the dev client's `Page` does. No restart is needed between journeys.
