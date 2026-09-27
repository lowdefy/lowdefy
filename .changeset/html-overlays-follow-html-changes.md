---
'@lowdefy/block-utils': patch
---

fix(block-utils): an open popover or confirm stays open when the HTML changes, and the `data-copy` label shows the whole copied value.

When a block's HTML changed while a `data-popover` popover or a `data-confirm` confirmation was
open (a request refreshing the rows it is built from, for example), the overlay closed without a
word. It now stays open on the same element in the new HTML, an element with the same tag and
`data-*` attributes, and a popover shows its new content. A confirmation's OK still fires the event
it was opened for. When the new HTML no longer has the element, the overlay closes.

When a `data-copy` value differs from the element's text, the copy button's label showed only its
first 40 characters. It now shows the whole value, with invisible format characters such as
zero-width spaces and direction marks written as `[U+200B]`, so the label matches what is copied.
