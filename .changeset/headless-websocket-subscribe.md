---
'@lowdefy/journey-headless': patch
'lowdefy': patch
---

fix(journey-headless): A page's websocket subscriptions succeed headless and get no messages

A page that subscribed to a websocket failed a headless journey: the subscribe waited out its 10 second timeout and reported "Subscribe to ... timed out." as an app error. Headless, a page's subscriptions now open as they do in the browser (on mount, or with `Subscribe`) and each succeeds at once: `onSubscribe` runs and the channel reads connected. No message ever arrives, so a journey that waits for a live message fails on that wait. A `Publish` marks the journey browser-only at that point.
