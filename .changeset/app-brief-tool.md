---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): `lowdefy_app_brief`, a deterministic brief of what a page does

`lowdefy_app_brief` (MCP) and `GET /lowdefy-docs/app-brief[/{pageId}]?since={ref}` join build artefacts rather than reading config files. For a page it names the collections it reads and writes, through its own requests and through every `Api` endpoint its `CallAPI` actions call, the journeys and request tests covering it, and every declared `(blockId, event)` triple no journey exercises. Given `since` (a git ref) it reports which changed files the page is made of and the blocks, requests and endpoints they define. Without a `pageId` it returns one line per page, ordered changed-first and capped, naming what was truncated. Every result carries both JSON and a compact markdown rendering.
