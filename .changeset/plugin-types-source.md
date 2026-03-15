---
'@lowdefy/blocks-antd': major
'@lowdefy/blocks-basic': major
'@lowdefy/blocks-loaders': major
'@lowdefy/blocks-echarts': major
'@lowdefy/blocks-markdown': major
'@lowdefy/blocks-aggrid': major
'@lowdefy/blocks-google-maps': major
'@lowdefy/blocks-algolia': major
'@lowdefy/blocks-qr': major
'@lowdefy/connection-axios-http': major
'@lowdefy/connection-elasticsearch': major
'@lowdefy/connection-google-sheets': major
'@lowdefy/connection-knex': major
'@lowdefy/connection-redis': major
'@lowdefy/connection-sendgrid': major
'@lowdefy/connection-stripe': major
'@lowdefy/connection-test': major
'@lowdefy/operators-js': major
'@lowdefy/operators-jsonata': major
'@lowdefy/operators-mql': major
'@lowdefy/operators-nunjucks': major
'@lowdefy/operators-uuid': major
'@lowdefy/operators-yaml': major
'@lowdefy/operators-change-case': major
'@lowdefy/operators-diff': major
'@lowdefy/actions-core': major
'@lowdefy/actions-pdf-make': major
'@lowdefy/plugin-auth0': major
'@lowdefy/plugin-next-auth': major
'@lowdefy/plugin-aws': major
'@lowdefy/plugin-csv': major
'@lowdefy/node-utils': major
'@lowdefy/build': major
---

Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

### Breaking Changes

- **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
- **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.
