---
'@lowdefy/client-core': patch
---

fix(client-core): A sign-in made during an OAuth authorization returns to the authorization. Before, `Login` with a password or passkey navigated to its `callbackUrl` or the home page over the auth server's redirect, so an MCP client such as Claude never reached the consent page and could not connect.
