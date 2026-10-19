---
'@lowdefy/connection-sendgrid': patch
'@lowdefy/plugin-aws': patch
---

Update dependencies to releases with published security fixes.

- `@sendgrid/mail` 8.1.6 in `connection-sendgrid`. Its HTTP client moves from `axios` 0.26 to 1.x. The connection's properties and results do not change.
- `@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post` and `@aws-sdk/s3-request-presigner` 3.1141.0 in `plugin-aws`. The SDK no longer depends on `fast-xml-parser` 4.
