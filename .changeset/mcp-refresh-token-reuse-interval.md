---
'@lowdefy/api': patch
---

fix(api): Concurrent MCP token refreshes no longer sign every session out

An MCP client that runs several sessions under one sign-in (several terminals or agents sharing one stored refresh token) refreshes the same token from each of them when the hourly access token lapses. The first refresh rotated the token, and every other request presenting the just-rotated token was treated as token theft, which revoked every refresh and access token that client held for the user: all sessions, all organizations, all machines. The authorization server now allows a rotated refresh token to be presented again for two minutes after its rotation: a matching request gets the same tokens the rotation issued, and a request that arrives before the rotation finishes is refused without revoking anything. A rotated token presented after that window still revokes the family.
