---
'@lowdefy/operators-js': minor
'@lowdefy/actions-core': minor
'@lowdefy/engine': minor
'@lowdefy/client': minor
'@lowdefy/operators': patch
'@lowdefy/docs': minor
---

feat: Add the `_mcp` operator and the `McpSendMessage` and `McpOpenLink` actions

A page shown inside an MCP host as the view of an MCP tool can now tell that it is, and act on the host.

- `_mcp: embedded` is `true` inside a host, so a layout can drop its own menu and header there. `_mcp: displayMode` is `inline`, `fullscreen` or `pip`, and a block that reads it updates when the host changes the display mode. Both are `null` outside a host.
- `McpSendMessage` sends the host a message, as if the person had typed it.
- `McpOpenLink` asks the host to open a link in the browser: an `http` or `https` URL, or a page of the app at its own address.

Both actions fail when the host refuses, so `catch` actions run, and when the page is not inside a host.
