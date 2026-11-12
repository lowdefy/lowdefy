---
'@lowdefy/client-core': minor
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-antd-x': minor
'lowdefy': minor
---

feat: A page shown as an MCP App view reaches its app for everything that assumed the app's origin. Usage logging posts to the app's `/api/usage` with the view's bearer session and keeps its machine id in the view host's store. Client errors post to `/api/client-error` with the bearer and no cookie. The websocket connects to the app's `wss://` address and offers two subprotocols, `lowdefy.view` and the base64url-encoded session token; a connection that never opened, or that the server closed for a caller change, mints a new session before it reconnects. The `AgentChat` block streams through a new block method, `methods.fetchApi(path, init)`, which signs the call with the view's session and sends it again after a 401. The default logos of `PageHeaderMenu`, `PageSiderMenu`, `PageSidebarLayout` and `MobileMenu` load from a new block prop, `apiBase`, which is the app's origin and `basePath` in a view and `basePath` on the web. A request or endpoint call refused because the connection is read-only (`view_write_required`) shows the server's message asking the person to reconnect with write access; it is not reported as an error and the page is not loaded again. On the web and in a native shell every call is sent as before.
