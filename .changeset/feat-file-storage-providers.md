---
'@lowdefy/blocks-files': minor
'@lowdefy/plugin-aws': minor
'@lowdefy/plugin-gcp': minor
'@lowdefy/plugin-azure': minor
'@lowdefy/blocks-tiptap': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/build': minor
'@lowdefy/codemods': minor
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

feat: Provider-neutral file storage — upload and download files to S3-compatible providers, Google Cloud Storage, and Azure Blob Storage.

**Generic file blocks (`@lowdefy/blocks-files`, new)**

- New `Upload`, `UploadPhoto`, `UploadDragger`, and `Download` blocks that work with any storage provider. Upload blocks call an upload-policy request by id (`uploadPolicyRequestId`) and support both POST form uploads (S3, R2, MinIO, GCS) and PUT body uploads (Azure SAS), with upload progress on both.
- `emitFileContent: true` reads the file in the browser and emits `{ name, size, type, content }` (base64) as the block value and `onChange` event, for storing files through an API endpoint routine with a server-side write request.

**S3-compatible providers (`@lowdefy/plugin-aws`)**

- `AwsS3Bucket` connections accept `endpoint` and `forcePathStyle`, unlocking Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, and Wasabi with a one-line config change.
- `AwsS3PresignedGetObject` returns a stable, non-expiring public URL when the request sets `public: true`; the connection-level `publicUrlBase` overrides the constructed URL for CDN domains.
- New `AwsS3PutObject` write request stores base64 content as an object from endpoint routines or page requests.
- The `S3UploadButton`, `S3UploadPhoto`, `S3UploadDragger`, and `S3Download` blocks are now deprecated aliases of the generic blocks — existing apps keep working unchanged.

**Google Cloud Storage (`@lowdefy/plugin-gcp`, new)**

- `GoogleCloudStorageBucket` connection with `GcsSignedPostPolicy`, `GcsSignedGetUrl`, and `GcsPutObject` requests.

**Azure Blob Storage (`@lowdefy/plugin-azure`, new)**

- `AzureBlobContainer` connection with `AzureBlobUploadSas`, `AzureBlobDownloadSas`, and `AzureBlobPut` requests.

**Editor and chat uploads (`@lowdefy/blocks-tiptap`, `@lowdefy/blocks-antd-x`)**

- Tiptap editors and AgentChat attachments now upload through the shared provider-neutral flow. New `uploadPolicyRequestId` and `downloadPolicyRequestId` properties replace `s3PostPolicyRequestId` (kept as a deprecated alias). Inline image and attachment URLs resolve through the download request when configured.

**Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

- `/api/endpoints/*` request bodies are capped at 10 MiB (matching the agent route), bounding base64 file payloads sent via `CallAPI`.

**Codemod (`@lowdefy/codemods`)**

- Optional `s3-blocks-to-file-blocks` codemod renames the deprecated S3\* blocks and `s3PostPolicyRequestId`/`s3GetPolicyRequestId` properties to the provider-neutral names via `lowdefy upgrade`.
