# @lowdefy/plugin-azure

Microsoft Azure connections for Lowdefy.

## Connections

- `AzureBlobContainer` — an Azure Blob Storage container.

## Requests

- `AzureBlobUploadSas` — mints a write SAS URL for direct browser uploads.
  Returns the standard upload-policy descriptor
  `{ method: 'PUT', url, key, bucket, headers }` (with the
  `x-ms-blob-type: BlockBlob` header) used by the `@lowdefy/blocks-files`
  upload blocks.
- `AzureBlobDownloadSas` — mints a read SAS URL for downloads, or returns a
  stable public URL when the request sets `public: true`.
- `AzureBlobPut` — server-side write request that stores base64 content as a
  block blob. Used from API endpoint routines.

For more Lowdefy documentation, see [lowdefy.com](https://lowdefy.com).

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
