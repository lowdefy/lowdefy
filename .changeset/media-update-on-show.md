---
'@lowdefy/client-core': patch
---

fix(client-core): `_media` picks up the real window size when a hidden tab is shown

A page that loads in a hidden or background browser tab reads a window width of 0, so blocks that use `_media` show the narrowest (`xs`) layout. They only moved to the real size when a resize event reached the page, and the page starts listening for resizes after its `onInit` finishes. A tab shown while `onInit` was still running, or a browser that did not fire resize on showing the tab, left the page on the `xs` layout until the window was resized by hand. The page now re-reads the window size when it starts listening and whenever it becomes visible.
