---
'@lowdefy/block-utils': patch
---

fix(block-utils): an open popover stays open when the HTML changes, and the `data-copy` label shows the whole copied value.

When a block's HTML changed while a `data-popover` popover was open (a request refreshing the rows
it is built from, for example), the popover disappeared. It now stays open on the same trigger in
the new HTML, an element with the same tag and `data-*` attributes, and shows its new content. When
the new HTML no longer has the trigger, it closes. An open `data-confirm` confirmation still closes
without firing when the HTML changes, now through its normal close path, since the event's `data-*`
values may name a different record in the new HTML.

When a `data-copy` value differs from the element's text, the copy button's label showed only its
first 40 characters. It now shows the whole value, with invisible format characters such as
zero-width spaces and direction marks written as `[U+200B]`, so the label matches what is copied.
