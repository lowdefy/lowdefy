---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/helpers': minor
---

fix(api,build): Tighten what an MCP view's config may hold

- An `mcp.viewSources` entry must be exactly one `https` or `wss` origin, with no path and no wildcard. The entries become the content security policy of a view, so anything else is refused: a literal by the build, a `_secret` by the server at start, without repeating its value.
- The `pathParams` and `urlQuery` of a view can use only `_payload`, `_response` and operators that shape a value: `_and`, `_array`, `_boolean`, `_eq`, `_get`, `_if`, `_if_none`, `_ne`, `_not`, `_number`, `_object`, `_or`, `_regex`, `_string`, `_switch`, `_type` and `_uri`. The address they build is sent to the MCP client, so the build refuses any other operator there, such as `_secret`, `_user` or `_js`, and the server evaluates a view with that list alone, with no secrets and no user.
- The build refuses an MCP endpoint whose tool name is `lowdefy_view_session`, which the server keeps for a view's session.
- The view loader appends only a path that starts with `/` to the app's origin, for the view's address and for the files of the boot answer. The boot answer's files are paths under the app's origin that hold the basePath.
- A view operator that fails is never quoted in the warning line, whatever error class it throws.

`@lowdefy/helpers` exports `isViewSourceOrigin` and `mcpViewOperators`.
