# Migration: S3 Blocks → Provider-Neutral File Blocks

## Context

The S3-specific file blocks are deprecated in favour of provider-neutral blocks in
`@lowdefy/blocks-files` that work with any storage connection (AWS S3 and S3-compatible
services, Google Cloud Storage, Azure Blob Storage):

- `S3UploadButton` → `Upload`
- `S3UploadPhoto` → `UploadPhoto`
- `S3UploadDragger` → `UploadDragger`
- `S3Download` → `Download`

The request-id properties are renamed with them:

- `s3PostPolicyRequestId` → `uploadPolicyRequestId` (upload blocks, TiptapInput,
  TiptapMentionInput, AgentChat `sender.attachments`)
- `s3GetPolicyRequestId` → `downloadPolicyRequestId` (Download block)

**This migration is optional.** The S3\* block names and legacy properties keep working as
deprecated aliases — they log a console deprecation warning and will be removed in a future
major. Migrating now silences the warnings and drops the misleading S3 naming.

The requests behind the blocks (`AwsS3PresignedPostPolicy`, `AwsS3PresignedGetObject`) are
NOT renamed — only the block types and their request-id properties change.

## What to Do

| Old                                              | New                                          |
| ------------------------------------------------ | -------------------------------------------- |
| `type: S3UploadButton`                           | `type: Upload`                               |
| `type: S3UploadPhoto`                            | `type: UploadPhoto`                          |
| `type: S3UploadDragger`                          | `type: UploadDragger`                        |
| `type: S3Download`                               | `type: Download`                             |
| `properties.s3PostPolicyRequestId`               | `properties.uploadPolicyRequestId`           |
| `properties.s3GetPolicyRequestId`                | `properties.downloadPolicyRequestId`         |
| `sender.attachments.s3PostPolicyRequestId` (AgentChat) | `sender.attachments.uploadPolicyRequestId` |

Rename the block `type:` and its request-id property together in one pass — the generic
blocks do not read the legacy property names (only the aliases map them).

`TiptapInput` and `TiptapMentionInput` keep their block type; only rename their
`s3PostPolicyRequestId` property.

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `S3UploadButton|S3UploadPhoto|S3UploadDragger|S3Download|s3PostPolicyRequestId|s3GetPolicyRequestId`

## Examples

### Before — upload button

```yaml
- id: file_upload
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: upload_policy
    accept: '.pdf'
```

### After

```yaml
- id: file_upload
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy
    accept: '.pdf'
```

### Before — download list

```yaml
- id: file_list
  type: S3Download
  properties:
    s3GetPolicyRequestId: download_policy
    fileList:
      _state: uploaded.fileList
```

### After

```yaml
- id: file_list
  type: Download
  properties:
    downloadPolicyRequestId: download_policy
    fileList:
      _state: uploaded.fileList
```

### Before — Tiptap editor image uploads

```yaml
- id: editor
  type: TiptapInput
  properties:
    s3PostPolicyRequestId: image_upload_policy
```

### After

```yaml
- id: editor
  type: TiptapInput
  properties:
    uploadPolicyRequestId: image_upload_policy
```

### Before — AgentChat attachments

```yaml
sender:
  attachments:
    enabled: true
    s3PostPolicyRequestId: get_upload_policy
```

### After

```yaml
sender:
  attachments:
    enabled: true
    uploadPolicyRequestId: get_upload_policy
```

## Edge Cases

- **Custom CSS selectors:** the generic blocks emit `lf-upload`, `lf-upload-photo`, and
  `lf-upload-dragger` element classes instead of `lf-s3-upload-button`, `lf-s3-upload-photo`,
  and `lf-s3-upload-dragger` (the aliases keep the legacy classes; the renamed blocks do not).
  Grep CSS/`style:` config for `lf-s3-` and update selectors — including inner classes like
  `.lf-s3-upload-photo-icon` → `.lf-upload-photo-icon` and the CSS variable
  `--lf-s3-dragger-height` → `--lf-dragger-height`.
- If a request-id property value is an operator expression, rename the key and keep the value.
- Do not rename request types (`AwsS3PresignedPostPolicy`, `AwsS3PresignedGetObject`) or
  connection types (`AwsS3Bucket`) — they are unchanged.
- References in markdown/help text (e.g. docs strings inside the app) can be renamed too, but
  flag them for human review rather than assuming.

## Verification

No old block types or legacy property names should remain:

```
grep -rnE 'type: S3(UploadButton|UploadPhoto|UploadDragger|Download)|s3PostPolicyRequestId|s3GetPolicyRequestId' --include='*.yaml' --include='*.yml' .
```

Also confirm no stale CSS selectors:

```
grep -rn 'lf-s3-' --include='*.yaml' --include='*.yml' --include='*.css' .
```
