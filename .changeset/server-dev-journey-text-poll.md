---
'@lowdefy/server-dev': patch
---

The journey steps `expect: { text }` and `expect: { state }` now wait, up to the step timeout, for the block's text or the state value to match, as `expect: { url }` and `expect: { title }` already did. They used to read once, so a list that renders its rows once its request answers, or a page still reloading after a sign-out, failed the step at random. After an interaction the runner now settles the page for at most 5 seconds, whatever the step timeout: a send button that ends in a resend cooldown used to hold every step for the full timeout.
