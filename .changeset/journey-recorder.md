---
'@lowdefy/engine': minor
'@lowdefy/client': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

feat: apps record their own user journeys

Every completed block event becomes one trace event naming the page, block, event, each action's outcome, the requests it fired and the state paths it wrote, all as config ids and never DOM selectors, batched in the browser and beaconed to a same-origin `POST /api/journey`, which emits it as a `journey_event` wide event through the app's logger. Values are the privacy line: production traces carry paths and JSON types only, development traces carry the event payload and written values, and the server drops any path whose last segment is a field the `collections` declaration marked `pii: true`. Configure with `logger.journeys: { enabled, sample_rate }`: on by default, sampling 5% of production sessions (per session, so a recorded session is complete) and every session under `lowdefy dev`.
