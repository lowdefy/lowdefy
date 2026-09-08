# S3Download

__Deprecated__ — use the provider-neutral &lt;a href=&quot;/Download&quot;&gt;Download&lt;/a&gt; block with `downloadPolicyRequestId` instead. S3Download remains as an alias so existing apps keep working. Download files from AWS S3. Requires an AwsS3Bucket connection and an AwsS3PresignedGetObject request. The s3GetPolicyRequestId property must reference the request id. If files were uploaded with S3Upload, its fileList value can be mapped directly to this block.

> The S3Download block requires an AwsS3Bucket connection and an AwsS3PresignedGetObject request. The examples below show configuration structure but will not download files without a configured connection.

```yaml
- id: basic_download
  type: S3Download
  properties:
    s3GetPolicyRequestId: download_file
    fileList:
      - key: report.pdf
        type: application/pdf
        name: report.pdf
      - key: photo.jpg
        type: image/jpeg
        name: photo.jpg
```

```yaml
- id: single_file
  type: S3Download
  properties:
    s3GetPolicyRequestId: download_file
    fileList:
      - key: invoice_2026_001.pdf
        type: application/pdf
        name: invoice_2026_001.pdf
```

```yaml
- id: multi_type
  type: S3Download
  properties:
    s3GetPolicyRequestId: download_file
    fileList:
      - key: documents/contract.pdf
        type: application/pdf
        name: contract.pdf
      - key: images/logo.png
        type: image/png
        name: logo.png
      - key: data/export.csv
        type: text/csv
        name: export.csv
      - key: archives/backup.zip
        type: application/zip
        name: backup.zip
```

```yaml
- id: styled_download
  type: S3Download
  style:
    .element:
      background: "#f6ffed"
      border: 1px solid
      borderRadius: 8
      padding: 12
  properties:
    s3GetPolicyRequestId: download_file
    fileList:
      - key: report.pdf
        type: application/pdf
        name: Quarterly Report.pdf
      - key: summary.pdf
        type: application/pdf
        name: Executive Summary.pdf
```

```yaml
- id: themed_download
  type: S3Download
  properties:
    s3GetPolicyRequestId: download_file
    theme:
      actionsColor: "#f5222d"
      controlItemBgHover: "#f9f0ff"
      colorIcon: "#f5222d"
      fontSize: 18
    fileList:
      - key: contracts/nda.pdf
        type: application/pdf
        name: Non-Disclosure Agreement.pdf
      - key: contracts/sla.pdf
        type: application/pdf
        name: Service Level Agreement.pdf
      - key: contracts/msa.pdf
        type: application/pdf
        name: Master Services Agreement.pdf
```

Full page config with connection, request, and S3Download block:
```yaml
# lowdefy.yaml
connections:
  - id: project_files
    type: AwsS3Bucket
    properties:
      accessKeyId:
        _secret: FILES_S3_ACCESS_KEY_ID
      secretAccessKey:
        _secret: FILES_S3_SECRET_ACCESS_KEY
      region: us-east-1
      bucket:
        _secret: FILES_S3_BUCKET

# page config
id: document_portal
type: PageSiderMenu
blocks:
  - id: documents_card
    type: Card
    properties:
      title: Project Documents
    blocks:
      - id: download_files
        type: S3Download
        properties:
          s3GetPolicyRequestId: download_file
          fileList:
            - key: projects/alpha/proposal.pdf
              type: application/pdf
              name: Project Alpha - Proposal.pdf
            - key: projects/alpha/budget.xlsx
              type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
              name: Project Alpha - Budget.xlsx
        requests:
          - id: download_file
            type: AwsS3PresignedGetObject
            connectionId: project_files
            payload:
              key:
                _event: file.key
              type:
                _event: file.type
            properties:
              key:
                _payload: key
              responseContentType:
                _payload: type
```

Upload and download files on the same page by mapping the S3Upload fileList to S3Download:
```yaml
# lowdefy.yaml
connections:
  - id: attachments
    type: AwsS3Bucket
    properties:
      accessKeyId:
        _secret: FILES_S3_ACCESS_KEY_ID
      secretAccessKey:
        _secret: FILES_S3_SECRET_ACCESS_KEY
      region: us-east-1
      bucket:
        _secret: FILES_S3_BUCKET
      write: true

# page config
id: file_management
type: PageSiderMenu
blocks:
  - id: upload_card
    type: Card
    properties:
      title: Upload Files
    blocks:
      - id: upload_files
        type: S3Upload
        properties:
          s3PutPolicyRequestId: upload_policy
        requests:
          - id: upload_policy
            type: AwsS3PresignedPutObject
            connectionId: attachments
            payload:
              filename:
                _event: filename
            properties:
              key:
                _payload: filename
  - id: download_card
    type: Card
    properties:
      title: Download Uploaded Files
    blocks:
      - id: download_files
        type: S3Download
        properties:
          s3GetPolicyRequestId: download_policy
          # Map fileList directly from S3Upload state
          fileList:
            _state: upload_files
        requests:
          - id: download_policy
            type: AwsS3PresignedGetObject
            connectionId: attachments
            payload:
              key:
                _event: file.key
              type:
                _event: file.type
            properties:
              key:
                _payload: key
              responseContentType:
                _payload: type
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `fileList` | array | - | List of files to be downloaded. If files were uploaded using an S3Upload block, the fileList value can just be mapped to this field. |
| `fileList.$.key` | string | - | S3 file key. |
| `fileList.$.lastModified` | string | - | File last modified date. |
| `fileList.$.name` | string | - | File name. |
| `fileList.$.size` | number | - | File size in bytes. |
| `fileList.$.type` | string | - | File MIME type. |
| `s3GetPolicyRequestId` | string | - | Id of a request of type AwsS3PresignedGetObject that defines which S3 bucket and file to download. |
| `showRemoveIcon` | boolean | `false` | Show a remove (×) icon next to each file in the list. Clicking it fires the `onRemove` event; the file is not removed from `fileList` automatically — the action handler is responsible. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/upload#design-token). See [Ant Design upload tokens](https://ant.design/components/upload#design-token). |
| `theme.actionsColor` | string | - | Color of action icons (download, preview, remove). |
| `theme.pictureCardSize` | number | - | Size of list items in card type (affects both picture-card and picture-circle). |
| `theme.controlItemBgHover` | string | - | Background color of file item on hover. |
| `theme.colorIcon` | string | - | Color of file icons. |
| `theme.fontSize` | number | - | Font size of file name text. |
| `theme.borderRadiusSM` | number | - | Border radius of file list items. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | \- | Triggered when the upload state is changing. |
| `onRemove` | `{ file }` | Triggered when a file remove icon is clicked. The file is NOT removed automatically — the handler is responsible for updating `fileList` (e.g. via `SetState`). |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The S3Download element. |

No slots defined.
