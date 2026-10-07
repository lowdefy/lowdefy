---
'@lowdefy/api': minor
'@lowdefy/ai-utils': minor
'@lowdefy/build': minor
---

feat(api): `CallAgent` routine steps take `files` beside their prompt

A `CallAgent` step can now hand the model images and documents: `files: [{ url, mediaType }]` sends the prompt and one part per file as a single user message, an image part for `image/*` and a document part otherwise. The link goes to the provider as a URL, so the server never downloads the file; pass a presigned link to a private file. A `files` that is not an array, or an entry without a `url` and a `mediaType`, fails the step with a `ConfigError`. Without `files` a step runs as before.
