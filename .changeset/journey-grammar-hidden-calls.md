---
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
---

feat: Journeys can assert that something is hidden (`expect.hidden`), that a request was sent a given number of times (`expect.calls`), and can double-click (`click.count`)

- `expect: { hidden: <target> }` passes once nothing the target names is visible.
- `expect: { calls: { request, pageId, count } }` (or `{ endpoint, count }`) compares, once the page settles, how many times this person's browser called the request or endpoint since the journey started. Counts survive full page loads.
- `click: { ...target, count: 2 }` clicks twice in quick succession, as a person's double click.
