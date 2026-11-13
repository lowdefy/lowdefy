---
'@lowdefy/server-dev': patch
---

fix(server-dev): Only the dev server's own headless browser can choose the user it acts as

The dev server's headless browser (used by the screenshot, journey and other page tools) tells the dev server which user to act as through a cookie. The dev server now signs that cookie with a secret it creates each time it starts, the same way it already signs the journey cookies, and ignores the cookie when the signature is missing or wrong. Before, any request that reached the dev server could send that cookie and act as any user with any roles. The production server never read this cookie and is not affected.
