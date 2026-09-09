---
'@lowdefy/client': minor
'@lowdefy/engine': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(client,engine): page lifecycle events for the browser tab, network and window

Pages can now react to the browser instead of polling to notice that something
changed while the user was away. Five new events can be defined on the first
blocks of a page: `onVisible` and `onHidden` when the tab is shown or hidden, or
the window regains or loses focus (coalesced over 300ms so a focus and
visibility pair only runs the chain once, with `_event` carrying `visible` and
`reason`); `onOnline` and `onOffline` when the browser reports the network
connection was regained or lost (`_event` carrying `online`); and `onResize`
when the window is resized, debounced by 200ms (`_event` carrying `width` and
`height`).

The listeners are attached once while the page is mounted and removed when the
user navigates away, so they never trigger for a page that is no longer open,
and none of them trigger on the initial page load. The action chains run
non-blocking, like `onMountAsync`, so they never hold the page in loading.
