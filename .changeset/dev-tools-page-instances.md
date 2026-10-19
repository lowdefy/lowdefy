---
'@lowdefy/server-dev': minor
---

Dev in-page tools follow page instances. The inspector, the feedback overlay and open-in-editor take the page id and instance from the fetched page, not the URL, so they name the right page on a first load of a page with path placeholders. The inspector reads state and input under the instance key and reports `{ pageId, pathParams, instanceKey }` for its tab to the dev server, which keeps each tab's instance on screen and the instances it has rendered: a tab request for a page reads the instance on screen when a tab shows that page, else the page's most recently rendered instance. Feedback batches carry `pathParams` next to `urlQuery`, and the formatted feedback names them.
