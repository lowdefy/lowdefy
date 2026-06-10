---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): Fix broken image URLs when pasting or dropping images into the editor.

Images pasted or dropped into `TiptapInput` and `TiptapMentionInput` produced a broken `src` containing a double slash between the S3 bucket host and the object key, so the image failed to load. The uploaded image URL is now constructed correctly.
