# UploadPhoto

Upload images to any storage provider with a picture-card interface — AWS S3 (and S3-compatible services), Google Cloud Storage, or Azure Blob Storage. The block calls an upload-policy request by id (`uploadPolicyRequestId`) and uploads directly from the browser. Set `emitFileContent: true` to instead emit the image as a base64 payload for server-side storage through an API endpoint routine.

> The UploadPhoto block requires an upload-policy request (AwsS3PresignedPostPolicy, GcsSignedPostPolicy, or AzureBlobUploadSas) referenced by uploadPolicyRequestId, unless emitFileContent is true. The examples on this page demonstrate UI configuration only — uploads will not function without a configured storage connection.

```yaml
- id: basic_default
  type: UploadPhoto
  properties:
    uploadPolicyRequestId: upload_policy_request
- id: basic_custom_title
  type: UploadPhoto
  properties:
    uploadPolicyRequestId: upload_policy_request
    title: Add Photo
```

```yaml
basic_default:
  _state: basic_default
basic_custom_title:
  _state: basic_custom_title
```

```yaml
- id: limit_single
  type: UploadPhoto
  properties:
    uploadPolicyRequestId: upload_policy_request
    singleFile: true
- id: limit_max_three
  type: UploadPhoto
  properties:
    uploadPolicyRequestId: upload_policy_request
    maxCount: 3
```

```yaml
limit_single:
  _state: limit_single
limit_max_three:
  _state: limit_max_three
```

```yaml
- id: emit_file_content
  type: UploadPhoto
  properties:
    emitFileContent: true
    singleFile: true
```

```yaml
emit_file_content:
  _state: emit_file_content
```

```yaml
- id: disabled_default
  type: UploadPhoto
  properties:
    uploadPolicyRequestId: upload_policy_request
    disabled: true
```

```yaml
disabled_default:
  _state: disabled_default
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `"Upload image"` | Title of the file input to be displayed instead of 'Upload image'. |
| `disabled` | boolean | - | Disable the file input. |
| `emitFileContent` | boolean | `false` | Instead of uploading, read the file and emit { name, size, type, content } — content a base64 string — as the block value and onChange event. Use with a CallAPI action to store the file with a server-side write request (e.g. AwsS3PutObject). Replaces uploadPolicyRequestId. |
| `maxCount` | number | - | Maximum number of files that can be uploaded. |
| `uploadPolicyRequestId` | string | - | Id of an upload-policy request (e.g. AwsS3PresignedPostPolicy, GcsSignedPostPolicy, AzureBlobUploadSas) that defines to which storage bucket and how the file should be uploaded. Required unless emitFileContent is true. |
| `showUploadList` | boolean | `true` | Whether to show default upload list. |
| `singleFile` | boolean | `false` | Only allow a single file to be uploaded. Only one file can be selected in the prompt. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/upload#design-token). See [Ant Design upload tokens](https://ant.design/components/upload#design-token). |
| `theme.actionsColor` | string | - | Color of action icons (download, preview, remove). |
| `theme.pictureCardSize` | number | - | Size of list items in card type (affects both picture-card and picture-circle). |
| `theme.controlItemBgHover` | string | - | Background color of file item on hover. |
| `theme.colorIcon` | string | - | Color of file icons. |
| `theme.fontSize` | number | - | Font size of file name text. |
| `theme.borderRadiusSM` | number | - | Border radius of file list items. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBeforeUpload` | `{ file: object }` | Triggered before upload starts. If any action throws, the upload is cancelled. |
| `onChange` | `{ file: object, fileList: array }` | Triggered when the upload state is changing. With emitFileContent, triggered once the file content has been read, where file includes the base64 content. |
| `onProgress` | `{ file: object, fileList: array }` | Triggered when the upload state is in progress. |
| `onSuccess` | `{ file: object, fileList: array }` | Triggered when the upload state is done uploading. |
| `onRemove` | `{ file: object, fileList: array }` | Triggered when the upload has been removed. |
| `onError` | `{ file: object, fileList: array }` | Triggered when the upload has failed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer block wrapper around the upload card and list. |
| `/trigger` | The antd upload trigger card (.ant-upload-select) — the dashed upload tile. |
| `/list` | The uploaded photos list container. |
| `/item` | Each uploaded photo tile in the list. |
| `/icon` | The icon shown inside the upload trigger card (camera / loading). |
| `/title` | The title text shown below the icon inside the upload trigger card. |

No slots defined.
