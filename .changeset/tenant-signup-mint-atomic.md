---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': minor
---

fix(api,connection-mongodb): Mint one organization and one owner per tenant signup, even under concurrent sessions

Under `policy: tenant` with open signup and `create: auto`, concurrent sessions of the same user (two tabs, a double submit) could mint two organizations or write two owner rows, and a user could be made owner again of an organization every member had left, with its data and pending invitations.

- The minted organization carries a server-only marker until its owner row exists. Only a marked organization is joined as owner, so an organization the user was ever a member of is never handed back; the user gets a fresh organization on the next slug.
- The server now creates unique indexes on the organization `slug` and on the member `(user, organization)` pair at startup, and the mint checks them again before it writes. A session that loses a race joins the organization and owner row the other session wrote. An equivalent unique index created by hand, under any name, is accepted.
- If the indexes can not be created (the database user lacks the privilege, or duplicate rows already exist), the server logs an error naming the index, and a sign-in that needs a new organization is refused with status 503 and the code `ORGANIZATION_SETUP_UNAVAILABLE`. Refusals do not touch the database; the server retries at most every 30 seconds, so a fix recovers without a restart.
- A marker left by a mint that failed after writing the owner row is cleared the next time the user needs an organization, instead of letting them take that organization back.

`MongoDBAuthAdapter` gains the `ensureUniqueIndexes` capability the engine uses for this.
