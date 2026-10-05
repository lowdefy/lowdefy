---
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
---

feat(journeys): journeys record and replay pages with path parameters

A journey names a visit as a page and its values, never as a raw path. The dev recorder writes each pageview with the page id and `path_params` the server matched to the path, so moving between two records of one patterned page is two visits. A compiled journey that enters on a patterned page carries `pathParams` next to `urlQuery`, the `goto` step takes `pathParams` (an object of strings, one per placeholder), and dev replay builds every URL from the page's path pattern, refusing a journey whose path is missing a value. `lowdefy journeys pull` reads the page from `lowdefy_page_id` and its values from `lowdefy_path_params` and no longer reads a page from the URL path; an event that names no page is dropped as `no_page`. The journey sequence reads the page an `expect.url` path landed on by matching it against the build's route table, so the steps after a navigation by click count on the page they ran on, in compiled segments and committed journeys alike. Journey files, `lowdefy test`, variants and lint rule L7 carry `pathParams` where they carry `urlQuery`.
