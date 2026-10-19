---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'@lowdefy/engine': patch
---

feat(cli): `lowdefy journeys session` prints a recorded dev session as a log to write journeys from

`lowdefy journeys session` lists the sessions the development server recorded, newest first, with each one's id, time span, pages, interactions and failures. `lowdefy journeys session <id>` prints that session as a log, one line per interaction with what the app did in response, such as `click save → Validate failed [priority]` and `click save → ran Validate, request createTicket ok`, with a `page <pageId>` line per page view. A failed attempt and its retry both show, typed values and generated ids show as recorded, and nothing is turned into an assertion. Agents connected to the development server read the same list and logs with the new `lowdefy_journey_session` tool.

The development recorder now also records which actions an event ran and which API endpoints its `CallAPI` actions called, so a log can say `endpoint syncInvoices ok`.
