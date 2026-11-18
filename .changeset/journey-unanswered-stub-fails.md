---
'@lowdefy/test-utils': patch
'@lowdefy/journey-headless': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless): A journey's answer stub that never answered fails the journey

A journey's answer stub that no request reached used to pass silently, while a fail gate that never fired failed the journey. Now both fail it at its last step, unless something failed before. Only a stub that names its request (`requestId`, `endpoint`, `pageId` or `match`) must answer: one keyed only by `connectionType` and `requestType` is a fallback, such as a shared stub list or a case whose branch makes no outside call, and may go unused. Both checks wait for the session's background work (`context.waitUntil`) first, so a stub only that work reaches counts. The message names the stub's connection and request type and what narrows it (`requestId`, `endpoint`, `pageId`, `match`), and says that no request matched it or an earlier stub answered first. This holds on every host: `lowdefy test`, the dev server's headless runs and browser runs.

A test's `session.stub` is unchanged: it lasts across a file's tests and is never reported.
