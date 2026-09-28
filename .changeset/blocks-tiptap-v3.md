---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): The `TiptapInput` and `TiptapMentionInput` blocks now use TipTap v3 internally, which includes the fix for the `@tiptap/core` security advisory GHSA-cp6q-959q-f8rh. No config changes are needed: block properties, events and methods are unchanged, and content saved by the blocks loads and saves with the same html, text, markdown and mentions values as before.

Editing and pasting now follow TipTap v3:

- Escape in the mention popup now ends the suggestion; before, a following Enter inserted the hidden first match.
- With a multi-character mention trigger such as `@@`, Backspace after a mention leaves the trigger as typed.
- Typing inline code around existing backticks no longer drops a character.
- Dragging an image that is already in the editor moves it instead of starting an upload.
- Text typed straight after a pasted link, or after pasted markdown formatting such as `**bold**`, at the end of the paste continues that link or formatting.
- Backspace at the start of a paragraph in a blockquote lifts the paragraph out of the quote; before, it joined the paragraph to the one above.
- Delete at the end of a list item that is followed by a nested list whose items have their own sublists moves those nested items up into the list.
- Pasting plain text that starts with `1. ` creates an ordered list.
- Links with relative or protocol-less hrefs, such as `docs/page` or `example.org/path`, are kept; before, the link was dropped.
- Pasted or seeded html keeps more of its formatting: `width` and `height` on images, `title` on links, `text-align` on table cells, and an ordered list's CSS `list-style-type`. Highlight colours are kept as written instead of as `rgb()`, and `type="1"` on an ordered list is dropped because it is the default.
- A table with `table.resizable: false` now updates its column widths when columns change. In the editor it renders inside a `div.tableWrapper`, as resizable tables already did.
