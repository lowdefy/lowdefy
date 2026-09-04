# Upload

Upload files to any storage provider with a button trigger — AWS S3 (and S3-compatible services like Cloudflare R2 and MinIO), Google Cloud Storage, or Azure Blob Storage. The block calls an upload-policy request by id (`uploadPolicyRequestId`) and uploads the file directly from the browser to the provider. Set `emitFileContent: true` to instead emit the file as `{ name, size, type, content }` (base64) for server-side storage through an API endpoint routine. Supports file type filtering, upload limits, and custom button styling.

> The Upload block requires an upload-policy request (AwsS3PresignedPostPolicy, GcsSignedPostPolicy, or AzureBlobUploadSas) referenced by uploadPolicyRequestId, unless emitFileContent is true. The examples on this page demonstrate UI configuration only — uploads will not function without a configured storage connection.

```yaml
- id: basic_default
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
- id: basic_custom_title
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    button:
      icon: UploadOutlined
      title: Choose File
      type: default
- id: basic_custom_icon
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    button:
      icon: AiOutlineCloudUpload
      title: Upload to Cloud
      type: default
```

```yaml
basic_default:
  _state: basic_default
basic_custom_title:
  _state: basic_custom_title
basic_custom_icon:
  _state: basic_custom_icon
```

```yaml
- id: accept_images
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    accept: image/*
    button:
      icon: AiOutlinePicture
      title: Upload Image
      type: default
- id: accept_pdf
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    accept: .pdf
    button:
      icon: AiOutlineFilePdf
      title: Upload PDF
      type: default
```

```yaml
accept_images:
  _state: accept_images
accept_pdf:
  _state: accept_pdf
```

```yaml
- id: limit_single
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    singleFile: true
    button:
      icon: UploadOutlined
      title: Upload Single File
      type: default
- id: limit_max_three
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    maxCount: 3
    button:
      icon: UploadOutlined
      title: Upload (Max 3)
      type: default
```

```yaml
limit_single:
  _state: limit_single
limit_max_three:
  _state: limit_max_three
```

```yaml
- id: emit_file_content
  type: Upload
  properties:
    emitFileContent: true
    singleFile: true
    button:
      icon: UploadOutlined
      title: Attach File
      type: default
```

```yaml
emit_file_content:
  _state: emit_file_content
```

```yaml
- id: disabled_default
  type: Upload
  properties:
    uploadPolicyRequestId: upload_policy_request
    disabled: true
```

```yaml
disabled_default:
  _state: disabled_default
```

```yaml
- id: label_default
  type: Upload
  properties:
    title: Upload Attachment
    uploadPolicyRequestId: upload_policy_request
- id: label_extra
  type: Upload
  properties:
    title: Upload Document
    uploadPolicyRequestId: upload_policy_request
    label:
      extra: Accepted formats are PDF, DOCX, and PNG. Max size 10MB.
```

```yaml
label_default:
  _state: label_default
label_extra:
  _state: label_extra
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `accept` | string | - | File types accepted by the input. See html file type input accept property at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept. |
| `button` | object | `{"icon":"UploadOutlined","title":"Upload","type":"default"}` | Button block properties. See [Button](/Button) for all properties. |
| `button.title` | string | - | Button title text. |
| `button.icon` | string \| object | - | Button icon name or Icon block properties. |
| `button.type` | string | `"default"` | Button type. Enum: `default`, `primary`, `dashed`, `text`, `link`. |
| `button.danger` | boolean | `false` | Set button style to danger. |
| `button.disabled` | boolean | `false` | Disable the button. |
| `button.size` | string | `"default"` | Button size. Enum: `small`, `default`, `large`. |
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
| `onBeforeUpload` | `{ file: object }` | Triggered before a file is uploaded. If an action throws, the upload is cancelled. |
| `onChange` | `{ file: object, fileList: array }` | Triggered when the upload state is changing. With emitFileContent, triggered once the file content has been read, where file includes the base64 content. |
| `onProgress` | `{ file: object, fileList: array }` | Triggered when the upload state is in progress. |
| `onSuccess` | `{ file: object, fileList: array }` | Triggered when the upload state is done uploading. |
| `onRemove` | `{ file: object, fileList: array }` | Triggered when the upload has been removed. |
| `onError` | `{ file: object, fileList: array }` | Triggered when the upload has failed. |
| `onClick` | \- | Triggered when the upload button is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer block wrapper around the upload button and list. |
| `/trigger` | The antd upload trigger (.ant-upload-select) that wraps the button. |
| `/list` | The uploaded file list container. |
| `/item` | Each uploaded file row in the list. |

No slots defined.
