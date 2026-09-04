---
'@lowdefy/node-utils': minor
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(test): one journey grammar, with `set`, `expect.dom`, `expect.reject` and more

The journey step grammar lives in one place, `@lowdefy/node-utils`, so `lowdefy test` and the dev server's journey tool accept exactly the same steps. A journey file with a typo'd top-level key, a step with two keys, or a step malformed below its key (`fill: title`) is reported with its file path and step index before a browser is opened, and unknown keys on a journey or a request test are errors instead of being silently ignored.

The grammar gains `set: { blockId, value }` (writes through the block's own `setValue`, for inputs a `fill` cannot type into; `fill` falls back to it automatically), `press: { blockId, key }`, `expect.dom` (`hasClass`, `notHasClass`, `matches`, `attribute` + `equals`), `expect.text` `equals` and `notContains`, and `expect.durationMsUnder`. Request tests can assert a refusal with `expect: { reject: { messageContains, name } }` and membership with `expect: { contains: [...] }`; `~schema` is an alias for the `schema` marker where a response has a literal `schema` key. Journeys run under a fixed locale, timezone and colour scheme so formatted values assert the same locally and in CI; a select picks its option inside the dropdown that was just opened; and a step that navigates waits for the new page before settling instead of burning its whole timeout. The undocumented `screenshot: true` alias was removed.
