---
'@lowdefy/build': patch
'lowdefy': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-echarts': patch
'@lowdefy/blocks-markdown': patch
'@lowdefy/connection-axios-http': patch
'@lowdefy/connection-knex': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/connection-smtp': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/block-utils': patch
'@lowdefy/e2e-utils': patch
'@lowdefy/nunjucks': patch
'@lowdefy/api': patch
---

Update dependencies to releases with published security fixes.

- `hono` 4.13.5 and `@hono/node-server` 2.0.10 in the servers.
- `ws` 8.21.0 and `webpack` 5.104.1 in the servers; `postcss` 8.5.23 in the dev server.
- `axios` 1.18.0 in the CLI and AxiosHttp.
- `dompurify` 3.4.13 in `block-utils`, `blocks-basic` and `blocks-markdown`.
- `echarts` 6.1.0, `mysql2` 3.23.1, `nodemailer` 9.1.1, `uuid` 13.0.1 and `@auth/mongodb-adapter` 3.11.3 in their plugins.
- `tar` 7.5.21 and `picomatch` 4.0.4 in the build, `js-yaml` 4.3.2 in `e2e-utils`, and `@babel/core` 7.29.6 in `block-utils`.
- `nodemailer` 9.1.1 in `@lowdefy/api` as well. `@auth/mongodb-adapter` 3.11.3 brings its `@auth/core` to 0.41.3.

Two of these change output an app can see:

- **`echarts` 6.1.0** changes chart defaults. Bar, pictorialBar, candlestick and boxplot series no longer draw past the grid edge; set `containShape: false` on the axis to restore the previous look. `axis.startValue` no longer sets `min`. The second argument of a `tooltip.valueFormatter` function is now `rawDataIndex`.
- **`dompurify` 3.4.13** keeps a few attributes and elements that earlier releases removed: `command` / `commandfor`, `<selectedcontent>`, and some SVG attributes. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.
