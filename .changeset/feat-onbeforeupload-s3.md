---
'@lowdefy/plugin-aws': minor
---

feat(plugin-aws): Add onBeforeUpload event to S3 upload blocks.

S3UploadButton, S3UploadDragger, and S3UploadPhoto now fire an `onBeforeUpload` event before the upload starts. If any action throws, the upload is cancelled. This allows validation, confirmation prompts, or other logic to run before files are sent to S3.
