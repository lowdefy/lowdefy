---
'@lowdefy/api': minor
'@lowdefy/server': minor
---

feat(api): Views on the app's MCP server

The MCP server at `/api/mcp` serves MCP App views for an app whose `mcp` block has a tool with a `view`.

- `tools/list`: a tool with a view carries `_meta.ui.resourceUri: ui://lowdefy/view` and the older flat key `ui/resourceUri`. With `entrypoint: true` it also carries `_meta['openai/ui'].entrypoints: [{ type: 'global' }]`.
- `tools/call`: a tool with a view also returns its response as `structuredContent` and the address of the page to show as `_meta['lowdefy/view'].path`. `pathParams` and `urlQuery` are evaluated after the routine, with `_payload` and `_response`. A failed call, a failed view operator and a path value that is missing, `.` or `..` return the text result alone, and the server logs why.
- `resources/read` of `ui://lowdefy/view` returns one fixed loader for every view and every build, with the host's `domain` and the `csp` lists (the app's origin and `mcp.viewSources`) in the content item's `_meta.ui`. A `_secret` in `viewSources` is resolved on the server, and a secret that is not set fails the start. The loader connects to the host, asks the app for `GET /api/view/boot` and loads the client entry it names. When the app cannot be reached or the view cannot sign in, it shows the tool's title, the result as text and a button that opens the page in the browser.
- `lowdefy_view_session` is a built-in tool the view calls for its session. It is listed with `_meta.ui.visibility: ['app']`, returns the bearer in the result's `_meta['lowdefy/viewSession']` with empty `content`, refuses a member token and an anonymous caller, and does not run `afterToolCall`.

The view resource and the session tool are for a caller who can see at least one tool with a view. Anyone else gets the answers an app with no view gives.

The dev server serves no views: it has no built client, so it leaves the view metadata off its tools, registers no resources and logs why once. An app with no canonical URL does the same.

At start, the production server logs the URL the connector must be added with and the origin its views run on.
