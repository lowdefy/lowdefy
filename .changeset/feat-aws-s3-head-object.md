---
'@lowdefy/plugin-aws': minor
'@lowdefy/docs-content': minor
---

feat(plugin-aws): new `AwsS3HeadObject` request

An `AwsS3Bucket` request that checks on the server whether an object exists and returns its
metadata without reading its content: `{ exists: true, bucket, key, size, contentType, etag,
lastModified, versionId }`. When S3 answers not found it returns `{ exists: false, bucket, key }`
instead of throwing, so a routine can act on a missing object as data, for example to confirm a
browser upload made with `AwsS3PresignedPostPolicy` arrived before recording it, taking its size
and content type from S3 rather than from the caller. Any other S3 error throws. Takes `key` and
an optional `versionId`, and is gated by the connection's `read` setting.
