---
'@lowdefy/plugin-aws': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: AwsS3PutObject copies a file from a URL

`AwsS3PutObject` takes a `url` in place of `content` and streams what that `https:` link answers into the bucket, so a routine can copy a file it is handed as a presigned link without the bytes passing through the routine as base64.

- **Limits.** `maxBytes` (required with `url`) caps the copy: a `Content-Length` over it is refused before reading, and a body that passes it is cut off. `contentTypes` (such as `image/*`) limits what the link may answer with, and `timeout` (default 20 seconds) covers the whole fetch and upload.
- **Refusals name their reason.** A refused copy stores nothing and throws an error whose `code` is `url_not_https`, `too_large`, `content_type`, `fetch_failed` or `timeout`, so a `:catch` can answer each its own way.
- **Return value.** `AwsS3PutObject` returns `{ bucket, key, size, contentType }`, with `content` as well as with `url`.
