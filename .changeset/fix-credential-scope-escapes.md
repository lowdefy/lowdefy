---
'@lowdefy/api': patch
'@lowdefy/node-utils': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix: Values marked with `_credential` no longer reach Sentry transactions or a detached endpoint's logs

- A Sentry transaction is sent after the response, once the request's credential scope has ended, so a marked value in a span (an outgoing URL's query string) reached Sentry in full. Every Sentry event of a request is now scrubbed of what that request marked.
- An endpoint run through a `CallApi` step with `detached: true` runs as a new request. It now marks the values its dispatcher had marked, so its logs show `[REDACTED]` for a credential it gets in its payload.
- The development server's fallback for an error it fails to log scrubs marked values too.
