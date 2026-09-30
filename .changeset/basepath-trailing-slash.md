---
'@lowdefy/build': patch
---

fix(build): A `config.basePath` with a trailing slash (`/app/`) is now read as `/app`. With the slash, `lowdefy dev` served the page HTML for the Vite client again, and the dev docs tools were reached at `/app//lowdefy-docs`.
