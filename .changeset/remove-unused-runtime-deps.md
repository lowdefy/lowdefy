---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/operators-js': patch
'@lowdefy/operators-diff': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-table': patch
'@lowdefy/plugin-aws': patch
'@lowdefy/server-dev': patch
---

chore(deps): Remove runtime dependencies nothing imports

Each was left behind when its code moved elsewhere. Nothing changes for apps; installs get smaller.

- `@lowdefy/api`: `nodemailer` (sending moved to `@lowdefy/connection-smtp`) and `@lowdefy/nunjucks`.
- `@lowdefy/build`: `ajv` (it uses `@lowdefy/ajv`).
- `@lowdefy/operators-js`: `intl-messageformat` (message formatting moved to `@lowdefy/helpers`).
- `@lowdefy/operators-diff`: `@lowdefy/helpers`.
- `@lowdefy/connection-mongodb`: `saslprep` (the MongoDB driver uses `@mongodb-js/saslprep`).
- `@lowdefy/blocks-basic`: `dompurify` (HTML renders through `@lowdefy/block-utils`).
- `@lowdefy/blocks-table`: `@lowdefy/nunjucks` (templates load through `@lowdefy/blocks-antd`).
- `@lowdefy/plugin-aws`: `@lowdefy/blocks-antd` (it reaches it through `@lowdefy/blocks-files`).
- `@lowdefy/server-dev`: `html-to-image` and `tinykeys`, left over from the removed annotation overlay.
