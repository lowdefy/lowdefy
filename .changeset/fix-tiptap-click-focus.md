---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): Clicking anywhere in a multi-line editor places the cursor.

The editable `.ProseMirror` area now fills the input wrapper's full height (the wrapper is a flex
column and the editable grows to fill it). Previously the editable only grew to its content, so on
an empty multi-line `TiptapInput` only the first line was clickable — clicking below it focused the
block but left the cursor unplaced. Now a click anywhere in the box lands the cursor in the editor.
