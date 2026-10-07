---
'@lowdefy/api': minor
'@lowdefy/ai-utils': minor
'@lowdefy/build': minor
---

feat(api): `CallAgent` routine steps take `files` beside their prompt

A `CallAgent` step can now hand the model images and documents: `files: [{ url, mediaType }]` sends the prompt and one part per file as a single user message, an image part for `image/*` and a document part otherwise. The link goes to the provider as a URL, which a provider that takes that media type as a link fetches itself; otherwise the server downloads the file first, refusing private and local addresses. Pass a presigned link to a private file. A `files` that is not an array, or an entry without a `url` and a `mediaType`, fails the step with a `ConfigError`. Without `files` a step runs as before.
