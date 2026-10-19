---
'@lowdefy/plugin-aws': minor
'@lowdefy/docs-content': minor
---

feat(plugin-aws): new `AwsS3DeleteObject` request

An `AwsS3Bucket` request that deletes objects from the connection's bucket, so a routine can remove
objects it stored and no longer wants. Takes one `key`, or `keys` (1 to 1000) deleted in one call,
and returns `{ bucket, deleted, errors }`, with each key S3 could not delete in `errors` as
`{ key, code, message }`. A key with no object counts as deleted. A failure of the call itself
throws. The request takes no bucket and refuses one, so it only touches the connection's own
bucket, and it is gated by the connection's `write` setting.
