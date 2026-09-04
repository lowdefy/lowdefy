# S3UploadPhoto

__Deprecated__ — use the provider-neutral <a href="/UploadPhoto">UploadPhoto</a> block with `uploadPolicyRequestId` instead. S3UploadPhoto remains as an alias so existing apps keep working. Picture-card style image upload for AWS S3. Displays a camera icon with upload text in a card format. Only accepts image files. Requires an `AwsS3PresignedPostPolicy` request to define the S3 upload policy.

> The S3UploadPhoto requires an AwsS3Bucket connection and AwsS3PresignedPostPolicy request to upload files. The examples on this page demonstrate UI configuration only — uploads will not function without a configured S3 connection.

```yaml
- id: basic_default
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
- id: basic_custom_title
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Add Photo
- id: basic_html_title
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Upload <b>profile</b> photo
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
- id: limit_single
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    singleFile: true
    title: Single Photo
- id: limit_max_three
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    maxCount: 3
    title: Max 3 Photos
- id: limit_single_hidden
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    singleFile: true
    showUploadList: false
    title: Single (No List)
```

```yaml
limit_single:
  _state: limit_single
limit_max_three:
  _state: limit_max_three
limit_single_hidden:
  _state: limit_single_hidden
```

```yaml
- id: list_visible
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    showUploadList: true
    title: List Visible
- id: list_hidden
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    showUploadList: false
    title: List Hidden
- id: list_multi_hidden
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    maxCount: 5
    showUploadList: false
    title: Multi (No List)
```

```yaml
list_visible:
  _state: list_visible
list_hidden:
  _state: list_hidden
list_multi_hidden:
  _state: list_multi_hidden
```

```yaml
- id: disabled_default
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
- id: disabled_custom_title
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
    title: Photo Locked
- id: disabled_hidden_list
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    disabled: true
    showUploadList: false
    title: Disabled (No List)
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
- id: style_rounded
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Rounded
    style:
      borderRadius: 50%
- id: style_large
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Large Card
    style:
      width: 150
      height: 150
- id: style_colored
  type: S3UploadPhoto
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Tinted
    style:
      backgroundColor: "#f0f5ff"
      color: "#1677ff"
```

```yaml
style_rounded:
  _state: style_rounded
style_large:
  _state: style_large
style_colored:
  _state: style_colored
```

```yaml
- id: style_element_bg
  type: S3UploadPhoto
  style:
    .element:
      background: "#f6ffed"
      borderRadius: 8
      padding: 8
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Green Background
- id: style_element_border
  type: S3UploadPhoto
  style:
    .element:
      border: 2px solid
      borderRadius: 12
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Purple Border
- id: style_tailwind
  type: S3UploadPhoto
  class: shadow-md rounded-lg
  properties:
    s3PostPolicyRequestId: s3_upload_policy_request
    title: Tailwind Shadow
```

```yaml
style_element_bg:
  _state: style_element_bg
style_element_border:
  _state: style_element_border
style_tailwind:
  _state: style_tailwind
```

```yaml
- id: profile_card
  type: Card
  properties:
    title: Edit Profile
  blocks:
    - id: profile_photo
      type: S3UploadPhoto
      properties:
        title: Profile Photo
        s3PostPolicyRequestId: s3_upload_policy_request
        singleFile: true
        style:
          borderRadius: 50%
    - id: profile_name
      type: TextInput
      required: true
      properties:
        title: Full Name
        placeholder: Enter your name
        prefixIcon: AiOutlineUser
    - id: profile_email
      type: TextInput
      properties:
        title: Email
        placeholder: you@example.com
        prefixIcon: AiOutlineMail
    - id: profile_save
      type: Button
      properties:
        title: Save Profile
        color: primary
        variant: solid
        icon: AiOutlineSave
      events:
        onClick:
          - id: validate_profile
            type: Validate
          - id: save_msg
            type: DisplayMessage
            params:
              content: Profile saved successfully!
              status: success
```

```yaml
profile_card:
  _state: profile_card
```

```yaml
- id: product_card
  type: Card
  properties:
    title: Add Product
  blocks:
    - id: product_photos
      type: S3UploadPhoto
      properties:
        title: Product Photos
        s3PostPolicyRequestId: s3_upload_policy_request
        maxCount: 5
      events:
        onChange:
          - id: photo_state
            type: SetState
            params:
              photosUploaded: true
    - id: product_name
      type: TextInput
      required: true
      properties:
        title: Product Name
        placeholder: Enter product name
    - id: product_category
      type: Selector
      properties:
        title: Category
        placeholder: Select category
        options:
          - label: Electronics
            value: electronics
          - label: Clothing
            value: clothing
          - label: Home & Garden
            value: home
          - label: Sports
            value: sports
    - id: product_price
      type: NumberInput
      properties:
        title: Price
        placeholder: "0.00"
        min: 0
        precision: 2
    - id: product_submit
      type: Button
      properties:
        title: List Product
        color: primary
        variant: solid
        icon: AiOutlineCheck
        block: true
      events:
        onClick:
          - id: validate_product
            type: Validate
          - id: list_msg
            type: DisplayMessage
            params:
              content: Product listed successfully!
              status: success
```

```yaml
product_card:
  _state: product_card
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | `"Upload image"` | Title of the file input to be displayed instead of 'Upload image'. |
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
| `onBeforeUpload` | `{ file }` | Triggered before upload starts. If any action throws, the upload is cancelled. |
| `onChange` | \- | Triggered when the upload state is changing. |
| `onProgress` | `{ file, fileList }` | Triggered when the upload state is in progress. |
| `onSuccess` | `{ file, fileList }` | Triggered when the upload state is done uploading. |
| `onRemove` | `{ file, fileList }` | Triggered when the upload has been removed. |
| `onError` | `{ file, fileList }` | Triggered when the upload has failed. |

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
