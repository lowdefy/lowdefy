---
'@lowdefy/journey-headless': patch
'@lowdefy/node-utils': patch
'@lowdefy/client-core': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless): Headless data-set journeys check their steps against the rails

A headless run of a journey with a data set now refuses a `click`, `open`, `fill`, `select` or `press` before it acts when the block it acts on reaches a connection a data set cannot run against, with the same message the browser run gives. A click on a modal's or dropdown's control is checked before the dropdown opens. Before, the headless run acted and the data-set gate refused the request, so the step failed with app errors where the browser failed with none.

The rails (`createDataSetRails`) move from the dev server to `@lowdefy/node-utils`, so both runners share them. A headless host now gives the runner the app's connection plugin map (`connections`).
