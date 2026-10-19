---
'@lowdefy/block-utils': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/blocks-aggrid': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
'@lowdefy/docs': minor
---

feat: in-app links and status tags in HTML.

- **Links.** In any HTML string, `<a data-page-id="contacts" data-url-query="_id=42">` links to an app page: Lowdefy sets the `href` (with the app's `basePath`), and a plain click opens the page without reloading the app, like a `Link` action. `data-link` does the same for an existing app-relative `href="/path"`, and `data-new-tab` opens any link in a new tab (sanitising removes `target`, so `target="_blank"` never worked in HTML). The build warns when a `data-page-id` in page config or in an API endpoint names a page that does not exist, with a suggestion for a likely typo.
- **Status tags and dots.** `<span data-tag="success">Approved</span>` renders a tinted tag and `data-status="warning"` a status dot, in theme colours that follow dark mode. Values are antd status names and preset colours, CSS colours, or any other value, which picks a stable colour. HTML tags look exactly like the ag-grid `tag` cells: both now use the same formatting code in `@lowdefy/block-utils`.
- **Docs.** A new HTML attributes page describes every attribute HTML understands, and the Html block's schema, hazards and examples teach agents to use them instead of hard-coded hrefs and inline-styled pills.
