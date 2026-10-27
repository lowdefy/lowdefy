---
'@lowdefy/ai-utils': patch
'@lowdefy/api': patch
'@lowdefy/block-utils': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-markdown': patch
'@lowdefy/blocks-table': patch
'@lowdefy/connection-smtp': patch
'@lowdefy/email-templates': patch
'@lowdefy/node-utils': patch
'@lowdefy/plugin-aws': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'lowdefy': patch
---

fix(deps): Update dependencies for security advisories

- vite 8.0.16 -> 8.1.6: the dev server no longer serves files outside `server.fs.allow` when a project path matches a system path, and launch-editor's command handling is fixed.
- @modelcontextprotocol/sdk 1.31.0 -> 1.32.2: bounds request validation memory, ties experimental tasks to their session, checks a bearer token's audience and stops forwarding headers on cross-origin redirects.
- hono 4.13.7 -> 4.13.14: `serveStatic` no longer decodes the path a second time, which let a request bypass middleware.
- dompurify 3.4.16 -> 3.4.17: fixes three sanitizer bypasses, one critical.
- markdown-it 14.3.1 -> 14.3.3, nodemailer 10.0.13 -> 10.1.7 and undici 7.30.0 -> 7.30.1.
