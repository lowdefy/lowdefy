---
'@lowdefy/server-dev': minor
---

The headless dev tools address page instances. Screenshot, inspect state, eval operator, snapshot state and the journey and screenshot page opens take `pathParams` for a page whose `path` has placeholders, read contexts and inputs under the instance key, and return the URL builder's error naming a missing placeholder. State checkpoints keep `pathParams` next to `urlQuery`, and loading one opens that instance. The page-ready check waits for an instance key, or the instance on screen. The app map shows each page's `path`, the overview lists the patterned pages, and the screenshot, page-config and inspect-state routes take multi-segment page ids.

The in-page dev tools follow page instances too. The inspector, the feedback overlay and open-in-editor take the page id and instance from the fetched page, so they name the right page on a first load of a page with path placeholders. The inspector reads state and input under the instance key, and a headless tool request for a page reads the instance a browser tab shows, else the page's most recently rendered instance. Feedback batches carry `pathParams` next to `urlQuery`.
