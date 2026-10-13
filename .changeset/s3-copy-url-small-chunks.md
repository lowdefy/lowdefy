---
'@lowdefy/plugin-aws': patch
---

fix(plugin-aws): `AwsS3PutObject` with `url` no longer fails on files that arrive in small pieces

Copying a file from a link into a bucket could fail with `InvalidChunkSizeError` ("Only the last chunk is allowed to have a size less than 8192 bytes") when the link's server sent the file in small pieces, as presigned S3 links do. The S3 client now buffers uploaded streams, so the copy succeeds whatever size the pieces are.
