---
'@lowdefy/e2e-utils': patch
---

fix(e2e-utils): Use domcontentloaded for page navigation.

Page navigation now uses `waitUntil: 'domcontentloaded'` instead of the default `load` event. This prevents hangs on pages with WebSocket connections or slow-loading resources, since the Lowdefy client readiness check is already a stronger signal.
