---
'@lowdefy/ai-utils': patch
'@lowdefy/node-utils': patch
'@lowdefy/plugin-aws': patch
---

fix(deps): Update undici to 8.12.4

Updates `undici`, which downloads files for AI file inputs and `AwsS3PutObject` copies from a URL
while refusing private addresses, from 7.30.1 to 8.12.4, which includes two security releases.
undici 8 offers HTTP/2 by default; these downloads stay on HTTP/1.1 as before.
