---
'@lowdefy/helpers': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): A journey target scoped to a Modal or Drawer reaches its footer and content

A Modal or Drawer renders its content and footer in a portal outside the block's own element, so `{ blockId: unlink_modal, text: Unlink }` found nothing and timed out, while `{ text: Unlink }` page-wide worked. The Modal and Drawer now mark their portal with a class naming the block, and a journey target scoped to the block (`click`, `fill`, `expect.text` and the other steps that name a control or text) searches the block and that portal.
