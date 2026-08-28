---
'@lowdefy/server-dev': patch
---

fix: Annotated feedback screenshots now capture the developer's actual tab

Annotation screenshots (Cmd/Ctrl+/ Feedback Mode) previously re-rendered the page in a headless browser, which could diverge from what the developer was looking at — wrong theme, unsettled loading skeletons, missing client-only state. The overlay now rasterizes the live tab itself (theme, loaded data, exact pixels) with the annotations drawn on, and posts the PNG to the dev server to save under `.lowdefy/annotations/`. The headless render remains as a fallback when the in-tab capture is unavailable.
