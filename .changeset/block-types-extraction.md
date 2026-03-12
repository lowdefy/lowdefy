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

Replace hand-written `types.js` files in all 34 plugin packages with auto-generated `types.json`.

### Breaking Changes

- **Plugin type resolution**: Plugin types are now read from `types.json` (generated at build time) instead of `types.js`. This eliminates fragile import chains that loaded full module trees — including CSS files, browser APIs, and heavy libraries — just to resolve type names.
- **Build-time extraction**: A shared extraction script in `@lowdefy/node-utils` runs as a post-build step, extracting type metadata from compiled `dist/` outputs into `types.json`.
- **Block schema format**: Block schemas migrated from JSON files to JS modules with structured property, event, and method documentation, including `designTokens` sections.
