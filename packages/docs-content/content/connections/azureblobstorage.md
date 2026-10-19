# Azure Blob Storage

Azure Blob Storage is the object storage service provided by Microsoft Azure. Data is stored as blobs in containers within a storage account. You can read more [here](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction).

Lowdefy integrates with Azure Blob Storage using SAS (shared access signature) tokens — short-lived credentials that let the browser upload and download blobs directly, without file content passing through the Lowdefy server. Azure uploads use a `PUT` request with the file as the raw request body, which the provider-neutral <a href="/Upload">Upload</a> and <a href="/Download">Download</a> blocks handle automatically.

Direct browser uploads require [CORS configuration on the storage account](https://learn.microsoft.com/en-us/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services) that allows your app's origin.

## Connections

Connection types:
  - AzureBlobContainer

### AzureBlobContainer

The `AzureBlobContainer` connection is used to connect to an Azure Blob Storage container.

#### Properties
- `account: string`: __Required__ - Azure storage account name.
- `accountKey: string`: __Required__ - Azure storage account access key.
- `container: string`: __Required__ - Blob container name.
- `publicUrlBase: string`: Base URL used to construct stable public object URLs (e.g. a CDN domain in front of the container). Used by download requests when the request sets `public: true`.
- `read: boolean`: Default: `true` - Allow reads from the container.
- `write: boolean`: Default: `false` - Allow writes to the container.

#### Examples

###### Reads and writes on a container:
```yaml
connections:
  - id: blob
    type: AzureBlobContainer
    properties:
      account: mystorageacct
      container: uploads
      accountKey:
        _secret: AZURE_STORAGE_KEY
      write: true
```
Environment variables:
```
LOWDEFY_SECRET_AZURE_STORAGE_KEY = your-storage-account-key
```

## Requests

Request types:
  - AzureBlobUploadSas
  - AzureBlobDownloadSas
  - AzureBlobGet
  - AzureBlobPut

### AzureBlobUploadSas

The `AzureBlobUploadSas` request mints a write SAS URL for direct browser uploads. It returns the standard upload-policy descriptor `{ method: 'PUT', url, key, bucket, headers }` (with the `x-ms-blob-type: BlockBlob` header) used by the <a href="/Upload">Upload</a>, <a href="/UploadPhoto">UploadPhoto</a> and <a href="/UploadDragger">UploadDragger</a> blocks — reference the request id in the block's `uploadPolicyRequestId` property. The connection must set `write: true`.

#### Properties
- `key: string`: __Required__ - Key (blob name) under which the object will be stored. If another file is saved with the same key, that file will be overwritten, so a random string in this field is probably needed.
- `expires: number`: Default: `3600` - Number of seconds for which the SAS token should be valid.
- `contentType: string`: MIME type set as the Content-Type header of the upload.

#### Examples

###### Upload a file with the user's filename:
```yaml
requests:
  - id: upload_policy
    type: AzureBlobUploadSas
    connectionId: blob
    payload:
      name:
        _event: file.name
    properties:
      key:
        _string.concat:
          - 'uploads/'
          - _payload: name
```

### AzureBlobDownloadSas

The `AzureBlobDownloadSas` request mints a read SAS URL for downloads. Reference the request id in the <a href="/Download">Download</a> block's `downloadPolicyRequestId` property, or open the returned URL with the `Link` action.

#### Properties
- `key: string`: __Required__ - Key (blob name) under which the object is stored.
- `expires: number`: Default: `3600` - Number of seconds for which the SAS token should be valid.
- `public: boolean`: Default: `false` - Return a stable, non-expiring public URL (`https://{account}.blob.core.windows.net/{container}/{key}`, or `${publicUrlBase}/${key}` when the connection sets `publicUrlBase`) instead of a SAS URL. The blob must be publicly readable (public container access); this is author-declared and never checked at runtime.
- `contentDisposition: string`: Sets the Content-Disposition header of the response.
- `contentType: string`: Sets the Content-Type header of the response.

### AzureBlobGet

The `AzureBlobGet` request reads a blob from the container on the server and returns its content
as a base64 encoded string, so [API endpoint](/lowdefy-api) routine steps can process file content
with operators and pass it to other steps. The connection must allow reads (`read` is `true` by
default). Returns `{ bucket, key, content, contentType, size }`.

#### Properties
- `key: string`: __Required__ - Key (blob name) under which the blob is stored.

### AzureBlobPut

The `AzureBlobPut` request writes a block blob to the container from the server. It accepts base64 encoded content, which makes it the storage half of the server-side file handling pattern: an upload block with `emitFileContent: true` sends the file as a base64 payload to an [API endpoint](/lowdefy-api) with the `CallAPI` action, and a routine step stores it. The connection must set `write: true`.

#### Properties
- `key: string`: __Required__ - Key (blob name) under which the blob will be stored.
- `content: string`: __Required__ - Blob content as a base64 encoded string.
- `contentType: string`: MIME type of the blob (sets the Content-Type of the stored blob).

#### Examples

###### Store a file sent as an endpoint payload:
```yaml
api:
  - id: store_report
    type: Api
    routine:
      - id: put_object
        type: AzureBlobPut
        connectionId: blob
        properties:
          key:
            _string.concat:
              - 'reports/'
              - _payload: name
          content:
            _payload: content
          contentType:
            _payload: type
      - ':return':
          key:
            _step: put_object.key
```
