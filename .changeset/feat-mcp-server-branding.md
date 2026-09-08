---
'@lowdefy/build': minor
'@lowdefy/api': minor
---

feat: MCP server branding — `mcp.title`, `mcp.websiteUrl` and `mcp.icons`

MCP clients such as claude.ai render a card for each connected server, and with only `name` and `version` in `serverInfo` they fall back to guessing a logo from the host — often a stale or unrelated favicon. The app's `mcp` block now accepts the MCP `Implementation` branding fields, passed through verbatim in the `initialize` result:

```yaml
mcp:
  name: encircle
  version: '1.0.0'
  title: Encircle
  websiteUrl: https://encircle.co.za
  icons:
    - src: https://app.encircle.co.za/icon-512.png
      mimeType: image/png
      sizes: ['512x512']
  endpoints: [...]
```

Each icon needs a `src`; `mimeType`, `sizes` and `theme` (`light` | `dark`) are optional. Keys that are not configured are omitted from `serverInfo` rather than sent as `undefined`.
