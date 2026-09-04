# S3UploadButton

__Deprecated__ — use the provider-neutral <a href="/Upload">Upload</a> block with `uploadPolicyRequestId` instead. S3UploadButton remains as an alias so existing apps keep working. Upload files to AWS S3 with a button trigger. Supports file type filtering, upload limits, and custom button styling. Requires an `AwsS3PresignedPostPolicy` request to define the S3 upload policy.

> The S3UploadButton requires an AwsS3Bucket connection and AwsS3PresignedPostPolicy request to upload files. The examples on this page demonstrate UI configuration only — uploads will not function without a configured S3 connection.

```yaml
- id: basic_default
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
- id: basic_custom_title
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    button:
      icon: UploadOutlined
      title: Choose File
      type: default
- id: basic_custom_icon
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
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
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    accept: image/*
    button:
      icon: AiOutlinePicture
      title: Upload Image
      type: default
- id: accept_pdf
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    accept: .pdf
    button:
      icon: AiOutlineFilePdf
      title: Upload PDF
      type: default
- id: accept_specific
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    accept: .jpg,.png,.gif
    button:
      icon: AiOutlinePicture
      title: Upload JPG, PNG, or GIF
      type: default
```

```yaml
accept_images:
  _state: accept_images
accept_pdf:
  _state: accept_pdf
accept_specific:
  _state: accept_specific
```

```yaml
- id: limit_single
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    singleFile: true
    button:
      icon: UploadOutlined
      title: Upload Single File
      type: default
- id: limit_max_three
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    maxCount: 3
    button:
      icon: UploadOutlined
      title: Upload (Max 3)
      type: default
- id: limit_single_images
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    singleFile: true
    accept: image/*
    button:
      icon: AiOutlinePicture
      title: Upload One Image
      type: default
```

```yaml
limit_single:
  _state: limit_single
limit_max_three:
  _state: limit_max_three
limit_single_images:
  _state: limit_single_images
```

```yaml
- id: button_primary
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    button:
      icon: UploadOutlined
      title: Upload
      type: primary
- id: button_large
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    button:
      icon: UploadOutlined
      title: Upload Files
      type: default
      size: large
- id: button_different_icon
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    button:
      icon: AiOutlinePaperClip
      title: Attach Files
      type: default
```

```yaml
button_primary:
  _state: button_primary
button_large:
  _state: button_large
button_different_icon:
  _state: button_different_icon
```

```yaml
- id: disabled_default
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
- id: disabled_primary
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
    button:
      icon: UploadOutlined
      title: Upload
      type: primary
- id: disabled_hidden_list
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
    showUploadList: false
```

```yaml
disabled_default:
  _state: disabled_default
disabled_primary:
  _state: disabled_primary
disabled_hidden_list:
  _state: disabled_hidden_list
```

```yaml
- id: list_visible
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    showUploadList: true
    button:
      icon: UploadOutlined
      title: Upload (List Visible)
      type: default
- id: list_hidden
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    showUploadList: false
    button:
      icon: UploadOutlined
      title: Upload (No List)
      type: default
- id: list_single_hidden
  type: S3UploadButton
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    singleFile: true
    showUploadList: false
    button:
      icon: UploadOutlined
      title: Upload Single (No List)
      type: default
```

```yaml
list_visible:
  _state: list_visible
list_hidden:
  _state: list_hidden
list_single_hidden:
  _state: list_single_hidden
```

```yaml
- id: label_default
  type: S3UploadButton
  properties:
    title: Upload Attachment
    s3PostPolicyRequestId: s3_upload_policy_request
- id: label_inline
  type: S3UploadButton
  properties:
    title: Attachment
    s3PostPolicyRequestId: s3_upload_policy_request
    label:
      inline: true
      span: 8
- id: label_extra
  type: S3UploadButton
  properties:
    title: Upload Document
    s3PostPolicyRequestId: s3_upload_policy_request
    label:
      extra: Accepted formats are PDF, DOCX, and PNG. Max size 10MB.
```

```yaml
label_default:
  _state: label_default
label_inline:
  _state: label_inline
label_extra:
  _state: label_extra
```

```yaml
- id: style_element_bg
  type: S3UploadButton
  style:
    .element:
      background: "#f6ffed"
      border: 1px solid
      borderRadius: 8
      padding: 12
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    button:
      icon: UploadOutlined
      title: Upload
      type: default
- id: style_label
  type: S3UploadButton
  style:
    .label:
      color: "#722ed1"
      fontWeight: bold
  properties:
    title: Upload Files
    s3PostPolicyRequestId: s3_upload_policy_request
- id: style_tailwind
  type: S3UploadButton
  class: shadow-md rounded-lg
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    button:
      icon: UploadOutlined
      title: Upload
      type: default
```

```yaml
style_element_bg:
  _state: style_element_bg
style_label:
  _state: style_label
style_tailwind:
  _state: style_tailwind
```

```yaml
- id: doc_mgmt_card
  type: Card
  properties:
    title: Upload Document
  blocks:
    - id: doc_name
      type: TextInput
      required: true
      properties:
        title: Document Name
        placeholder: Enter document name
        label:
          colon: false
    - id: doc_category
      type: Selector
      properties:
        title: Category
        placeholder: Select category
        label:
          colon: false
        options:
          - label: Contracts
            value: contracts
          - label: Invoices
            value: invoices
          - label: Reports
            value: reports
          - label: Other
            value: other
    - id: doc_upload
      type: S3UploadButton
      properties:
        title: Attachment
        s3PostPolicyRequestId: s3_upload_policy_request
        accept: .pdf,.docx,.xlsx
        button:
          icon: AiOutlineFilePdf
          title: Choose Document
          type: default
        label:
          colon: false
          extra: Accepted formats are PDF, DOCX, and XLSX.
    - id: doc_save
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Save Document
        color: primary
        variant: solid
        icon: AiOutlineSave
      events:
        onClick:
          - id: save_validate
            type: Validate
          - id: save_msg
            type: DisplayMessage
            params:
              content: Document saved successfully!
              status: success
```

```yaml
doc_mgmt_card:
  _state: doc_mgmt_card
```

```yaml
- id: profile_card
  type: Card
  properties:
    title: Update Profile
  blocks:
    - id: profile_avatar
      type: S3UploadButton
      properties:
        title: Profile Picture
        s3PostPolicyRequestId: s3_upload_policy_request
        singleFile: true
        accept: image/*
        button:
          icon: AiOutlineCamera
          title: Choose Photo
          type: default
        label:
          colon: false
          extra: Upload a JPG, PNG, or GIF image.
    - id: profile_display_name
      type: TextInput
      required: true
      properties:
        title: Display Name
        prefixIcon: AiOutlineUser
        placeholder: Enter your display name
        label:
          colon: false
    - id: profile_update
      type: Button
      layout:
        flex: 0 0 auto
      properties:
        title: Update Profile
        color: primary
        variant: solid
        icon: AiOutlineCheck
      events:
        onClick:
          - id: update_validate
            type: Validate
          - id: update_msg
            type: DisplayMessage
            params:
              content: Profile updated successfully!
              status: success
```

```yaml
profile_card:
  _state: profile_card
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
| `maxCount` | number | - | Maximum number of files that can be uploaded. |
| `s3PostPolicyRequestId` | string | - | Id of a request of type AwsS3PresignedPostPolicy that defines to which S3 bucket and how the file should be uploaded. |
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
| `onBeforeUpload` | `{ file }` | Triggered before a file is uploaded. If an action throws, the upload is cancelled. |
| `onChange` | \- | Triggered when the upload state is changing. |
| `onProgress` | `{ file, fileList }` | Triggered when the upload state is in progress. |
| `onSuccess` | `{ file, fileList }` | Triggered when the upload state is done uploading. |
| `onRemove` | `{ file, fileList }` | Triggered when the upload has been removed. |
| `onError` | `{ file, fileList }` | Triggered when the upload has failed. |
| `onClick` | \- | Triggered when the upload button is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer block wrapper around the upload button and list. |
| `/trigger` | The antd upload trigger (.ant-upload-select) that wraps the button. |
| `/list` | The uploaded file list container. |
| `/item` | Each uploaded file row in the list. |

No slots defined.
