# @lowdefy/plugin-gcp

Google Cloud Platform connections for Lowdefy.

## Connections

- `GoogleCloudStorageBucket` — a Google Cloud Storage bucket.

## Requests

- `GcsSignedPostPolicy` — signs a V4 POST policy for direct browser uploads.
  Returns the standard upload-policy descriptor
  `{ method: 'POST', url, key, bucket, fields }` used by the
  `@lowdefy/blocks-files` upload blocks.
- `GcsSignedGetUrl` — signs a V4 read URL for downloads, or returns a stable
  public URL when the request sets `public: true`.
- `GcsPutObject` — server-side write request that stores base64 content as an
  object. Used from API endpoint routines.

For more Lowdefy documentation, see [lowdefy.com](https://lowdefy.com).

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
