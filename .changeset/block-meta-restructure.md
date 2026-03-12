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
'@lowdefy/blocks-algolia': major
'@lowdefy/blocks-qr': major
'@lowdefy/plugin-aws': major
'@lowdefy/server-dev': major
---

Restructure block metadata from component static properties to dedicated `meta.js` files with build-time schema generation.

### Breaking Changes

- **`schema.js` renamed to `meta.js`**: Every block's schema definition has moved from `schema.js` to `meta.js` with a new format. The `meta.js` files export `category`, `icons`, `valueType`, `cssKeys` (as `{key: description}` objects), `events` (as flat `{name: description}` maps), and `properties` (JSON Schema).

- **`schemas.js` barrel renamed to `metas.js`**: All block packages now export `./metas` instead of `./schemas`. The `schemas.js` barrel files have been removed.

- **`.meta` removed from block components**: Block components no longer have a `.meta` static property. Metadata is now loaded from the `blockMetas.json` build artifact at runtime.

- **`blockMetas.json` build artifact**: The build pipeline now writes `plugins/blockMetas.json` containing `category`, `valueType`, and `initValue` for each block type. The runtime reads from this map instead of `Component.meta`.

- **`buildBlockSchema(meta)` added to `@lowdefy/block-utils`**: New function that takes a meta object and generates a complete JSON Schema with operator support, `--`-prefixed CSS slot key validation, and event validation.

- **`withTheme` no longer merges `blockDefaultProps`**: The `withTheme` HOC in `@lowdefy/blocks-antd` and `@lowdefy/plugin-aws` now only handles theme extraction. Default props are handled by `withBlockDefaults` on each block individually.

- **Runtime reads from `blockMetas` map**: `CategorySwitch.js`, `LoadingBlock.js` (client), and `Block.js` (engine) now read block category, valueType, and initValue from `lowdefy._internal.blockMetas` instead of `Component.meta`.
