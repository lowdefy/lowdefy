---
'@lowdefy/plugin-aws': minor
---

feat(plugin-aws): Add `onBeforeUpload` event and improve S3 upload error handling.

S3UploadButton and S3UploadDragger now fire an `onBeforeUpload` event before each file upload begins. If any action in the event handler throws, the upload is cancelled — useful for file validation, size checks, or confirmation prompts.

Upload error handling has been rewritten: XHR uploads are now Promise-based with proper error propagation, CORS/network failures throw a `ServiceError` with a diagnostic message, and file metadata is serialized into a plain object so `_event` resolution no longer destroys File/Blob references.
