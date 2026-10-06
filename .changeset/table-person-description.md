---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-table': minor
---

feat(blocks-table): Person cells can show a second line, and headers are quieter

An `avatar` cell takes `descriptionField`, a path in the row shown under the name in the secondary text colour, such as a person's email. With a description the avatar is 32px and the cell is two lines tall, so the table needs `size: default` or `size: comfortable`.

Table headers are now the small font size in the secondary text colour, so the header no longer reads larger and louder than the rows. Tag chips use weight 500 instead of 600.
