---
'@lowdefy/blocks-basic': minor
---

feat(blocks-basic): new `PollingTimer` block

A headless block that renders nothing and triggers its `onTick` event every `interval`
milliseconds while it is running, for polling a request until a background job completes
or refreshing a page on a schedule. It is started and stopped with the `start`, `stop`
and `toggle` methods, or with `autoStart` on mount, and it always stops when the block
unmounts. The `onTick` event carries the tick count as `{ tick }`, `maxTicks` stops the
timer after a given number of ticks, and `pauseWhenHidden` (on by default) pauses ticking
while the browser tab is hidden and resumes when it becomes visible again.
