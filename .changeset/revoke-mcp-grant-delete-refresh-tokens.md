---
'@lowdefy/plugin-better-auth': patch
---

fix(plugin-better-auth): RevokeMcpGrant no longer signs the assistant out of every organization

`RevokeMcpGrant` marked the grant's refresh tokens revoked. The assistant's next refresh presented one of them, and the authorization server treats a revoked refresh token presented again as theft: it deleted every token that client held for the user, so the assistant was also disconnected from every other organization it was connected to. The step now deletes the grant's refresh tokens (and the access tokens minted from them) instead, so the next refresh is refused as an unknown token and only this one grant is disconnected. The "Disconnecting assistants from the app" example on the MCP Server & OAuth docs page has the same fix: delete the refresh tokens rather than setting `revoked`.
