---
'@lowdefy/client-core': patch
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(journey-headless): A page's websocket subscriptions succeed headless and get no messages

A `Subscribe` action on a headless page waited out its 10 second timeout and failed the journey with "Subscribe to ... timed out." as an app error, and a page's subscribe-on-mount subscriptions never opened headless, so every step's settle waited out its cap. Headless, a page's subscriptions now open as they do in the browser (on mount, or with `Subscribe`) and each succeeds straight away: `onSubscribe` runs and the channel reads connected. No message ever arrives, so a journey that waits for a live message fails on that wait. A `Publish` marks the journey browser-only at that point.

The settle after a step, headless and in the browser, no longer waits on a subscription the page declares and has not opened (`client.subscribeOnMount: false`) or has closed.
