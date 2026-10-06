---
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: `expect: { effect: true }` checks that the interaction before it did something

A journey step `expect: { effect: true }` fails when the click, open, fill, select, press or back just before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It must directly follow one of those steps, and `true` is its only value. Put it after a click on a control that should do something, so the journey fails while the control does nothing.
