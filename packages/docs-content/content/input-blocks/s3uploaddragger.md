# S3UploadDragger

__Deprecated__ — use the provider-neutral <a href="/UploadDragger">UploadDragger</a> block with `uploadPolicyRequestId` instead. S3UploadDragger remains as an alias so existing apps keep working. Drag-and-drop file upload area for AWS S3. Supports file type filtering, upload limits, custom drag zone styling, and paste-to-upload. Requires an `AwsS3PresignedPostPolicy` request to define the S3 upload policy.

> The S3UploadDragger requires an AwsS3Bucket connection and AwsS3PresignedPostPolicy request to upload files. The examples on this page demonstrate UI configuration only — uploads will not function without a configured S3 connection.

```yaml
- id: basic_default
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
- id: basic_custom_title
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Drop your files here
- id: basic_html_title
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: <b>Upload</b> your <i>documents</i> here
```

```yaml
basic_default:
  _state: basic_default
basic_custom_title:
  _state: basic_custom_title
basic_html_title:
  _state: basic_html_title
```

```yaml
- id: accept_images
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Drag images here
    accept: image/*
- id: accept_pdfs
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Drag PDF files here
    accept: .pdf
- id: accept_specific
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Drag image files here (.jpg, .png, .gif)
    accept: .jpg,.png,.gif
```

```yaml
accept_images:
  _state: accept_images
accept_pdfs:
  _state: accept_pdfs
accept_specific:
  _state: accept_specific
```

```yaml
- id: limit_single
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Upload a single file
    singleFile: true
- id: limit_max_three
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Upload up to 3 files
    maxCount: 3
- id: limit_single_images
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Upload a single image
    singleFile: true
    accept: image/*
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
- id: style_light_blue
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Light blue background
    style:
      background: "#e6f7ff"
- id: style_dashed_border
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Dashed border style
    style:
      border: 2px dashed
      borderRadius: 12
- id: style_large_padding
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Larger drop area with custom font
    style:
      padding: 40
      fontSize: 18
```

```yaml
style_light_blue:
  _state: style_light_blue
style_dashed_border:
  _state: style_dashed_border
style_large_padding:
  _state: style_large_padding
```

```yaml
- id: disabled_default
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
- id: disabled_custom_title
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
    title: Uploads are currently disabled
- id: disabled_hidden_list
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
    title: Disabled with hidden list
    showUploadList: false
```

```yaml
disabled_default:
  _state: disabled_default
disabled_custom_title:
  _state: disabled_custom_title
disabled_hidden_list:
  _state: disabled_hidden_list
```

```yaml
- id: list_visible
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Upload list visible (default)
    showUploadList: true
- id: list_hidden
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Upload list hidden
    showUploadList: false
- id: list_single_hidden
  type: S3UploadDragger
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Single file, list hidden
    singleFile: true
    showUploadList: false
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
- id: style_element_bg
  type: S3UploadDragger
  style:
    .element:
      background: "#f6ffed"
      borderRadius: 12
      padding: 8
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Custom element background
- id: style_element_border
  type: S3UploadDragger
  style:
    .element:
      border: 2px solid
      boxShadow: 0 2px 8px rgba(0,0,0,0.1)
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Styled with border and shadow
- id: style_class_tailwind
  type: S3UploadDragger
  class: rounded-xl shadow-md
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Tailwind rounded with shadow
```

```yaml
style_element_bg:
  _state: style_element_bg
style_element_border:
  _state: style_element_border
style_class_tailwind:
  _state: style_class_tailwind
```

```yaml
- id: submission_card
  type: Card
  properties:
    title: Submit Files
    size: small
  blocks:
    - id: submission_description
      type: TextInput
      required: true
      properties:
        label:
          title: File Description
        placeholder: Describe the file you are uploading
    - id: submission_category
      type: Selector
      required: true
      properties:
        label:
          title: File Category
        placeholder: Select a category
        options:
          - label: Documents
            value: documents
          - label: Images
            value: images
          - label: Spreadsheets
            value: spreadsheets
          - label: Other
            value: other
    - id: submission_upload
      type: S3UploadDragger
      properties:
        s3PostPolicyRequestId: s3_upload_policy_request
        title: Drag files here or click to browse
        accept: .pdf,.docx,.xlsx,.png,.jpg
    - id: submission_actions
      type: Box
      layout:
        justify: flex-end
      blocks:
        - id: submission_submit
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Submit
            color: primary
            variant: solid
            icon: AiOutlineUpload
          events:
            onClick:
              - id: submit_validate
                type: Validate
              - id: submit_msg
                type: DisplayMessage
                params:
                  content: Files submitted successfully!
                  status: success
```

```yaml
submission_card:
  _state: submission_card
```

```yaml
- id: gallery_card
  type: Card
  properties:
    title: Upload Photos
    size: small
  blocks:
    - id: gallery_album_name
      type: TextInput
      required: true
      properties:
        label:
          title: Album Name
        placeholder: Enter album name
    - id: gallery_upload
      type: S3UploadDragger
      properties:
        s3PostPolicyRequestId: s3_upload_policy_request
        title: Drag photos here or click to browse
        accept: image/*
        maxCount: 10
    - id: gallery_actions
      type: Box
      layout:
        justify: flex-end
      blocks:
        - id: gallery_submit
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Upload Photos
            color: primary
            variant: solid
            icon: AiOutlineCloudUpload
          events:
            onClick:
              - id: gallery_msg
                type: DisplayMessage
                params:
                  content: Photos uploaded to album!
                  status: success
```

```yaml
gallery_card:
  _state: gallery_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `height` | number \| string | - | Height of the dragger area. A number is applied in pixels; a string is passed through as a CSS length (e.g. "300px", "50vh"). Defaults to the antd `controlHeight` theme token. If `style.element.height` is set, it overrides this. |
| `title` | string | - | Title of the file input to be displayed on the draggable area. |
| `accept` | string | - | File types accepted by the input. See html file type input accept property at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept. |
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

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The outer dragger box (height container, background, border, shadow). |
| `/hint` | The hint content shown inside the drop area. |
| `/trigger` | The antd drag surface (.ant-upload-drag). Target for hover/drag-hover border and background. |
| `/list` | The uploaded file list container. |
| `/item` | Each uploaded file row in the list. |

No slots defined.
