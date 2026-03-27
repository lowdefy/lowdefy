---
'@lowdefy/plugin-aws': patch
---

refactor(plugin-aws): Migrate S3 presigned URL operations from deprecated `aws-sdk` v2 to modular `@aws-sdk` v3.

Replaced the monolithic `aws-sdk` package with the modular v3 packages (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/s3-presigned-post`). No changes to the request/connection API — existing configs work without modification.
