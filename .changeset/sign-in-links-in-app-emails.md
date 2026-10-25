---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/engine': minor
'@lowdefy/actions-core': minor
'@lowdefy/plugin-better-auth': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
'@lowdefy/docs': minor
---

feat(auth): sign-in links in app emails

An app email can carry a link that signs its recipient in. The `CreateSignInToken` routine step (system only) mints a token for a member, bound to their organization, a `scope` declared in the new `auth.sessionScopes`, and a landing (`pageId` with `urlQuery`/`pathParams`, or a path in the app). The new `SignInWithToken` action, run on a click on a public landing page, trades it for a session and lands on the bound landing; the action takes no destination of its own.

A token is single-use (spent atomically on its first exchange), short-lived (`expiresIn` seconds, one hour by default, seven days at most, and the session ends with it), stored only as a hash, and never spent on a GET. `RevokeSignInTokens` revokes a user's tokens, optionally by organization or scope, and ends the sessions they opened. Unknown, altered, spent, expired and revoked tokens, banned users, users with a second factor and users no longer in the organization are refused with one answer, which the action throws as a user error.

The session carries the scope as `_user.session_scope`, and its `_user.roles` are the scope's roles from `auth.sessionScopes` in place of the member's own, so page and endpoint role gates limit it. A scoped session may not run auth steps or session-bound auth routes, and the next ordinary sign-in drops the scope.
