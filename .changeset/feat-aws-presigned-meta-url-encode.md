---
'@lowdefy/plugin-aws': patch
---

feat(plugin-aws): Auto URL-encode `x-amz-meta-*` fields on `AwsS3PresignedPostPolicy`.

`AwsS3PresignedPostPolicy` now URL-encodes any field whose name starts with `x-amz-meta-` (case-insensitive) before signing the policy. S3 user metadata must be ASCII, so values containing names, URLs, or other non-ASCII characters previously had to be wrapped with `_uri.encode` in every request config.

With this change, upload policies can pass values through directly:

```yaml
fields:
  x-amz-meta-uploaded-by-name:
    _user: profile.name
  x-amz-meta-uploaded-by-url:
    _payload: url
```

Other protocol fields (`acl`, `Content-Type`, `success_action_redirect`, etc.) continue to pass through literally. Readers of the metadata (e.g., Lambda triggers that ingest S3 events) should URL-decode `x-amz-meta-*` values via `decodeURIComponent` before use.
