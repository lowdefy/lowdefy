---
'@lowdefy/node-utils': patch
'@lowdefy/ai-utils': patch
'@lowdefy/plugin-aws': patch
---

chore(node-utils): One copy of the public address checks

The check that a server fetch reaches only a public address (`isPublicAddress`, the checked DNS lookup and the undici connector built on it) now lives in `@lowdefy/node-utils`. The `AwsS3PutObject` url copy and the agent file download both use it, each with its own refusal message and `url_not_public` code, so a range added to the check covers both.
