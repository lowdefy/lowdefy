---
'@lowdefy/api': minor
'@lowdefy/operators-js': patch
'@lowdefy/plugin-aws': patch
---

fix: Error logs keep derived credentials out of `received`

A request type can name properties that carry a credential in `meta.credentialProperties`. When the request fails, the error's `received` holds `[REDACTED]` in their place, so a value derived from a secret, which the log's secret scrub does not know, never reaches the log. `AwsS3PutObject` names `url`, since a presigned link carries its signature. Every `_hmac` refusal is now a config error reported without the operator's params, so a derived `key` is not logged either.
