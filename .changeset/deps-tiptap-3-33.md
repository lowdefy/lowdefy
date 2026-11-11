---
'@lowdefy/blocks-tiptap': patch
---

fix(deps): Update Tiptap to 3.33.1 and turndown to 7.2.5

Tiptap 3.33.1 fixes marks staying active after deleting the whole document, links extending as spaces are typed after them, Enter splitting a checked task item, list toggling between list types, and pasted links without a protocol ignoring the link's `defaultProtocol`. Table cells no longer write the default `colspan="1"` and `rowspan="1"` into the HTML value. turndown 7.2.5 fixes indentation of ordered list content and escaping of link and image destinations in the Markdown value, and converts long documents faster.
