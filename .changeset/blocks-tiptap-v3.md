---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): The `TiptapInput` and `TiptapMentionInput` blocks now use TipTap v3 internally, which includes the fix for the `@tiptap/core` security advisory GHSA-cp6q-959q-f8rh. No config or content changes are needed: block properties, events and methods are unchanged, and existing content loads and saves with the same html, text, markdown and mentions values as before.

A few editing edge cases follow TipTap v3's fixes:

- Escape in the mention popup now ends the suggestion; before, a following Enter inserted the hidden first match.
- With a multi-character mention trigger such as `@@`, Backspace after a mention leaves the trigger as typed.
- Typing inline code around existing backticks no longer drops a character.
- Dragging an image that is already in the editor moves it instead of starting an upload.
