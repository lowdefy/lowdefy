---
'@lowdefy/e2e-utils': minor
---

feat(e2e-utils): Add ldf.api() assertions for API endpoint testing

- New `api.js` core module with `getApiState`, `getApiResponse`, `expectApi` functions
- Reads from `window.lowdefy.apiResponses[endpointId][0]` (mirrors request pattern)
- `ldf.api(endpointId).expect.toFinish()` — wait for API call completion
- `ldf.api(endpointId).expect.toHaveResponse(response)` — assert response
- `ldf.api(endpointId).expect.toHavePayload(payload)` — assert sent payload
- `ldf.api(endpointId).response()` — get raw response value
- `ldf.api(endpointId).state()` — get full API state object
- `ldf.mock.api()` now captures payloads for assertion
- `ldf.mock.getCapturedApi(endpointId)` — retrieve captured API data
