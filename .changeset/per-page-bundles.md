---
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/api': patch
'lowdefy': patch
'@lowdefy/actions-core': patch
'@lowdefy/actions-pdf-make': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-captcha': patch
'@lowdefy/blocks-diff': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/blocks-files': patch
'@lowdefy/blocks-google-maps': patch
'@lowdefy/blocks-loaders': patch
'@lowdefy/blocks-markdown': patch
'@lowdefy/blocks-qr': patch
'@lowdefy/blocks-tiptap': patch
'@lowdefy/connection-ai-gateway': patch
'@lowdefy/connection-anthropic': patch
'@lowdefy/connection-axios-http': patch
'@lowdefy/connection-elasticsearch': patch
'@lowdefy/connection-google-sheets': patch
'@lowdefy/connection-google': patch
'@lowdefy/connection-knex': patch
'@lowdefy/connection-mcp': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/connection-openai': patch
'@lowdefy/connection-redis': patch
'@lowdefy/connection-sendgrid': patch
'@lowdefy/connection-smtp': patch
'@lowdefy/connection-stripe': patch
'@lowdefy/connection-test': patch
'@lowdefy/operators-change-case': patch
'@lowdefy/operators-cron': patch
'@lowdefy/operators-dayjs': patch
'@lowdefy/operators-diff': patch
'@lowdefy/operators-js': patch
'@lowdefy/operators-jsonata': patch
'@lowdefy/operators-mql': patch
'@lowdefy/operators-nunjucks': patch
'@lowdefy/operators-uuid': patch
'@lowdefy/operators-yaml': patch
'@lowdefy/plugin-aws': patch
'@lowdefy/plugin-azure': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/plugin-csv': patch
'@lowdefy/plugin-gcp': patch
'@lowdefy/plugin-posthog': patch
'@lowdefy/websockets-core': patch
---

Production pages load only the plugin code they use.

The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

- The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
- Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
- Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
- A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

No config changes. The dev server is unchanged.
