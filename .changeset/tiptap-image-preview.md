---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): A pasted or dropped image shows straight away, before the content is saved

With `imageSrc`, `TiptapInput` and `TiptapMentionInput` save an uploaded image at a stable app link, such as a link endpoint. Some of those links answer only once the content is saved, so until then the editor showed a broken image. The editor now draws a newly uploaded image from the file that was chosen, while the value's `html`, `markdown` and `fileList` keep the stable `src`. A saved value still loads its images from the stored `src`.
