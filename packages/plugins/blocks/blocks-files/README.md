# @lowdefy/blocks-files

Provider-neutral file upload and download blocks for Lowdefy.

## Blocks

- `Upload` — upload button with file list.
- `UploadPhoto` — picture-card image upload.
- `UploadDragger` — drag-and-drop (and paste) upload area.
- `Download` — file list that resolves a download URL per file on demand.

The blocks carry no provider knowledge. An upload block calls an upload-policy
request by id (`uploadPolicyRequestId`) and acts on the standard descriptor the
request returns:

```jsonc
// POST + multipart form (S3, R2, MinIO, GCS POST policy)
{ "method": "POST", "url": "https://...", "key": "uploads/file.pdf", "bucket": "my-bucket",
  "fields": { "key": "uploads/file.pdf", "policy": "..." } }

// PUT + raw body (Azure SAS, presigned PUT)
{ "method": "PUT", "url": "https://...?sig=...", "key": "uploads/file.pdf", "bucket": "uploads",
  "headers": { "x-ms-blob-type": "BlockBlob" } }
```

Upload-policy requests: `AwsS3PresignedPostPolicy` (`@lowdefy/plugin-aws`),
`GcsSignedPostPolicy` (`@lowdefy/plugin-gcp`), `AzureBlobUploadSas`
(`@lowdefy/plugin-azure`). Download requests: `AwsS3PresignedGetObject`,
`GcsSignedGetUrl`, `AzureBlobDownloadSas`.

With `emitFileContent: true` the upload blocks skip uploading and emit
`{ name, size, type, content }` (`content` a base64 string) as their value and
`onChange` event, for storing the file through an API endpoint routine with a
server-side write request (`AwsS3PutObject`, `GcsPutObject`, `AzureBlobPut`).

For more Lowdefy documentation, see [lowdefy.com](https://lowdefy.com).

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
