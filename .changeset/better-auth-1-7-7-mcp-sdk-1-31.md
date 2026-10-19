---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(api): Update better-auth to 1.7.7, fixing a Magic Link account takeover

better-auth before 1.7.7 accepted an OAuth sign-in state value as a Magic Link token ([GHSA-965c-763c-88jm](https://github.com/better-auth/better-auth/security/advisories/GHSA-965c-763c-88jm), critical). An app with Magic Link and any social or generic OAuth provider enabled let anyone who knew a user's email address sign in as that user, without access to the mailbox. better-auth, `@better-auth/oauth-provider`, `@better-auth/cimd` and `@better-auth/passkey` are now 1.7.7.

After upgrading, Magic Links sent before the upgrade no longer work and in-progress OAuth sign-ins must be restarted. Upgrade every server that shares the auth database at the same time. Verification rows now carry a `magic-link:` or `auth-state:` prefix on their identifier: an app hook on `verification.create.before` or `verification.create.after` that matches on the identifier must allow for it.

The MCP SDK is updated to 1.31.0 and `@hono/mcp` to 0.3.2.
