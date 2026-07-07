---
'@lowdefy/blocks-tiptap': patch
---

fix: Prevent rich-text editor crash when navigating away mid-edit.

Fixed a "removeChild" crash in the Tiptap editor blocks that could occur when the
editor was unmounted while the formatting menu or an `@`-mention popup was open, or
while an image upload was still in progress — for example when a user submitted or
started editing content and immediately navigated away. The editor now tears these
down safely, so navigating away no longer throws or leaves the editor in a broken
state.
