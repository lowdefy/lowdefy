---
'@lowdefy/engine': patch
'@lowdefy/actions-core': patch
'@lowdefy/server-dev': patch
'@lowdefy/shell': patch
---

fix(server-dev): A page that polls with a Wait no longer holds journeys and screenshots

A page with an event that sleeps in a `Wait` and then runs again, such as a clock that waits a minute, reads a request and calls itself, always has one event running. The dev server's headless tools treat a page as settled only when no event is running, so a journey on such a page waited out the whole 15 s page open and 5 s more after every click, fill or select, and reported `ready: false` with "Page did not settle". A screenshot or state read of the page waited 15 s too.

The engine now records on an event that it is only waiting, and until when (`waitingUntil` on the event, set by the `Wait` action through a new `wait` action method). Each headless wait skips an event whose `Wait` ends after the time that wait itself would give up, because it could never have outlasted it. A `Wait` that ends sooner, such as a pause before a request in a click handler, still holds the page as before, so journeys do not assert earlier than they did. A page `onInitAsync` or app `onInitAsync` that sleeps the same way is treated the same. The native shell's journey steps follow the same rule.

Action plugins that sleep can call `methods.wait({ ms })` instead of their own timer to get the same treatment.
