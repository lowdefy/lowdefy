---
'@lowdefy/api': patch
'@lowdefy/client': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(api): Websockets re-check their caller and close when it changes

An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, without backing off, which authenticates afresh, and resubscribes as the current caller; a subscription that caller may not hold fails as it would on a freshly loaded page.

Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. Websocket types declare it with `meta.checkRead`, as request types do.
