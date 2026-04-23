---
'@lowdefy/blocks-tiptap': minor
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

feat(blocks-tiptap): Add new default block package with `TiptapInput` and `TiptapMentionInput` rich-text editors.

`@lowdefy/blocks-tiptap` ships two rich-text editor blocks built on [TipTap](https://tiptap.dev):

- **`TiptapInput`** — standard rich-text editor with bold/italic/strike-through, multi-color highlight, headings, lists, tables, links, and a bubble menu.
- **`TiptapMentionInput`** — everything `TiptapInput` does, plus an @-mention dropdown populated from a static options list or a Lowdefy request. Resolved mentions are returned on the block value as `mentions: [...]`.

Both blocks emit an object value shaped `{ html, text, markdown, fileList, mentions? }` and register `clear`, `setContent`, and `focus` methods.

**Configurable extensions** — defaults preserve the bundled editor; override any of these to trim the editor down or tune it:

- `properties.starterKit` — object forwarded to TipTap [StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit), e.g. `{ heading: false, codeBlock: false }`.
- `properties.image` — `{ enabled, maxWidth, zoom }`
- `properties.table` — `{ enabled, resizable }`
- `properties.link` — `{ enabled, autolink, linkOnPaste, openOnClick, defaultProtocol }`
- `properties.highlight` — `{ enabled, multicolor }`
- `properties.mentions.char` / `properties.mentions.allowSpaces` — change the trigger char (e.g. `#` for hashtags) or disable spaces inside a mention query (`TiptapMentionInput` only).

Image drag/drop and paste are supported by pointing `properties.s3PostPolicyRequestId` at a request that returns an S3 presigned POST policy (e.g. `AwsS3PresignedPostPolicy`). The file handler is optional — omit the request id to disable uploads entirely.

The blocks are registered in the default types map and are available out of the box on `@lowdefy/server-dev`. No private-registry tokens are required: the blocks use the open-source [`@tiptap/extension-file-handler`](https://www.npmjs.com/package/@tiptap/extension-file-handler) instead of `@tiptap-pro/extension-file-handler`, so projects that migrated from a custom TipTap plugin can drop their `TIPTAP_PRO_TOKEN` environment variable and `.npmrc` scoped-registry config.
