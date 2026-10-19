---
'@lowdefy/build': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': patch
'@lowdefy/api': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

- **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
- **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
- **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
- **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.
