# Download

Download files from any storage provider — AWS S3 (and S3-compatible services), Google Cloud Storage, or Azure Blob Storage. Requires a download request (AwsS3PresignedGetObject, GcsSignedGetUrl, or AzureBlobDownloadSas) referenced by the downloadPolicyRequestId property. Clicking a file resolves a URL through the request on demand — set `public: true` on the request for stable, non-expiring URLs to publicly readable objects. If files were uploaded with an Upload block, its fileList value can be mapped directly to this block.

> The Download block requires a storage connection and a download request. The examples below show configuration structure but will not download files without a configured connection.

```yaml
- id: basic_default
  type: Download
  properties:
    downloadPolicyRequestId: download_policy_request
    fileList:
      - key: reports/report.pdf
        name: report.pdf
        size: 1024
        type: application/pdf
```

```yaml
- id: removable
  type: Download
  properties:
    downloadPolicyRequestId: download_policy_request
    showRemoveIcon: true
    fileList:
      - key: reports/report.pdf
        name: report.pdf
      - key: reports/summary.xlsx
        name: summary.xlsx
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `downloadPolicyRequestId` | string | - | Id of a download request (e.g. AwsS3PresignedGetObject, GcsSignedGetUrl, AzureBlobDownloadSas) that returns a URL for the file to download. |
| `fileList` | array | - | List of files to be downloaded. If files were uploaded using an Upload block, the fileList value can just be mapped to this field. |
| `fileList.$.key` | string | - | Storage object key. |
| `fileList.$.lastModified` | string | - | File last modified date. |
| `fileList.$.name` | string | - | File name. |
| `fileList.$.size` | number | - | File size in bytes. |
| `fileList.$.type` | string | - | File MIME type. |
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
| `onRemove` | `{ file: object }` | Triggered when a file remove icon is clicked. The file is NOT removed automatically — the handler is responsible for updating `fileList` (e.g. via `SetState`). |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Download element. |

No slots defined.
