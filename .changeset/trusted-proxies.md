---
'@lowdefy/api': major
'@lowdefy/server': major
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'lowdefy': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

- **Breaking:** auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check now use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
- On Vercel nothing changes for apps: the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
- The production request and error logs record the resolved address as `client_address`.
- `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
- In `lowdefy test` journeys, each actor keeps its own client address through a cookie only the dev server's own headless browser can set, instead of an `X-Forwarded-For` header.
