---
'@lowdefy/operators-js': minor
'@lowdefy/actions-core': minor
'@lowdefy/engine': minor
'@lowdefy/client': minor
'@lowdefy/api': minor
'@lowdefy/shell': patch
'@lowdefy/docs': minor
'@lowdefy/docs-content': patch
---

feat: Add `_mcp: writable` and the `McpUpdateModelContext` action

A page shown inside an MCP host as the view of an MCP tool can now tell whether its connection can make changes, and tell the model what the person did without posting a message as them.

- `_mcp: writable` is `true` in a view opened from an `mcp:write` connection, `false` on a read-only connection and `null` outside a host. Use it to hide edit controls a read-only view cannot use. It only changes what the page shows: the app still refuses every write on a read-only connection.
- `McpUpdateModelContext` sends the host `ui/update-model-context` with the text it is given. The host gives the text to the model on its next turn without starting a reply, and each call replaces the last. Use it after a save, where `McpSendMessage` would post as the person and make the host reply. It fails when the host refuses and when the page is not inside a host, so `catch` actions run.

A view whose loader the host cached before this release cannot update the model context: the action fails and says to open the view again.
