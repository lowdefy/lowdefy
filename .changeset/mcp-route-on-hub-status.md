---
'lowdefy': patch
---

fix(cli): `lowdefy mcp` sends dev tool calls to the server the hub reports ready

Once the hub had started a dev server, `lowdefy mcp` read the app's instance record again itself before forwarding a tool call, and when that read disagreed with the hub's it failed every forwarded tool with `Cannot read properties of null (reading 'url')`, while `lowdefy_dev_status` still showed the server ready. A CLI older than the dev server that wrote the record does this, for example a project's installed CLI that predates the start time format the dev server now records. Forwarded calls now go to the server in the hub's answer, the same one `lowdefy_dev_status` reports, and the hub's status includes the server's Lowdefy version. A server with no URL yet gets an error that says so.
