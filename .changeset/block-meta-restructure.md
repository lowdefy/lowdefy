---
'@lowdefy/block-utils': major
'@lowdefy/build': major
'@lowdefy/client': major
'@lowdefy/engine': major
'@lowdefy/blocks-antd': major
'@lowdefy/blocks-basic': major
'@lowdefy/blocks-loaders': major
'@lowdefy/blocks-echarts': major
'@lowdefy/blocks-markdown': major
'@lowdefy/blocks-aggrid': major
'@lowdefy/blocks-qr': major
'@lowdefy/blocks-google-maps': major
'@lowdefy/plugin-aws': major
'@lowdefy/server-dev': major
---

Restructure block metadata from component static properties to dedicated `meta.js` files.

### Breaking Changes

- **`schema.js` renamed to `meta.js`**: Block definitions moved from `schema.js` to `meta.js`. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys`, `events`, and `properties` (JSON Schema).
- **`schemas.js` barrel renamed to `metas.js`**: Block packages export `./metas` instead of `./schemas`.
- **`.meta` removed from components**: Block components no longer have a `.meta` static property. Metadata is loaded from the `blockMetas.json` build artifact at runtime.
- **`blockMetas.json` build artifact**: The build pipeline writes `plugins/blockMetas.json` containing category, valueType, and initValue for each block type.
- **`buildBlockSchema(meta)`**: New function in `@lowdefy/block-utils` generates complete JSON Schema from meta objects with operator support and CSS slot key validation.
