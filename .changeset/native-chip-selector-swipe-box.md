---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): A swipe Box takes swipes across a ChipSelector

A `ChipSelector` scrolls only when its chips overflow, and does not bounce when they fit, so a `Box` with `onSwipeLeft` or `onSwipeRight` around it takes swipes across the chips. A strip that overflows passes a drag that pulls it past an end it cannot scroll further toward on as the Box's swipe that way.
