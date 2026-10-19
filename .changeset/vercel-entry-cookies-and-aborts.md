---
'lowdefy': patch
---

fix(cli): The Vercel function entry keeps every `Set-Cookie` header and survives dropped requests.

- A response with several `Set-Cookie` headers, such as a sign-in that sets the session cookie and clears another, reached the browser with only the last one.
- A client that disconnected while its request body was read stopped the whole function process, and every other request it was serving, with an unhandled `aborted` error. The entry now answers a failed request with a 500, or closes it when the response had started.
