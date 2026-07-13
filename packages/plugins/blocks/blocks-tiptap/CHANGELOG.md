# @lowdefy/blocks-tiptap

## 5.4.0

### Patch Changes

- d1fb1d7: feat: Plugin-driven `serverExternalPackages` for Next.js.

  Plugins can now declare which of their dependencies need to be passed
  through to Next.js's `serverExternalPackages` config — used for CJS
  packages whose runtime `require()` chains Turbopack can't resolve
  through pnpm's isolated symlink layout (e.g. `turndown` →
  `@mixmark-io/domino`, `@aws-sdk/client-s3` → `fast-xml-parser` →
  `strnum`).

  Declare in the plugin's `package.json`:

  ```json
  {
    "lowdefy": {
      "serverExternalPackages": ["turndown"]
    }
  }
  ```

  Build aggregates declarations from every plugin the app actually uses
  (across blocks, connections, operators, actions, agents, auth, icons,
  requests) and writes a per-app `serverExternalPackages.json` artifact,
  read by `server`, `server-dev`, and `server-e2e` Next.js configs.

  Replaces a hardcoded list in the three server configs. Apps not using
  `blocks-tiptap` or `plugin-aws` no longer carry their externals.

  Initial declarations:

  - `@lowdefy/blocks-tiptap` → `turndown`
  - `@lowdefy/plugin-aws` → `@aws-sdk/client-s3`

- 86919df: fix(blocks-tiptap): Fix broken image URLs when pasting or dropping images into the editor.

  Images pasted or dropped into `TiptapInput` and `TiptapMentionInput` produced a broken `src` containing a double slash between the S3 bucket host and the object key, so the image failed to load. The uploaded image URL is now constructed correctly.

- Updated dependencies [c2c3a7f]
- Updated dependencies [25225ab]
- Updated dependencies [2aaf365]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [5f00be7]
- Updated dependencies [27659ef]
- Updated dependencies [4e189a0]
- Updated dependencies [0027a41]
- Updated dependencies [27659ef]
- Updated dependencies [e324c72]
- Updated dependencies [f8a5d80]
- Updated dependencies [60c193c]
  - @lowdefy/blocks-antd@5.4.0
  - @lowdefy/helpers@5.4.0
  - @lowdefy/block-utils@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies [54d30f7]
  - @lowdefy/blocks-antd@5.3.0
  - @lowdefy/block-utils@5.3.0
  - @lowdefy/helpers@5.3.0

## 5.2.0

### Minor Changes

- 762755c: feat(blocks-tiptap): Add new default block package with `TiptapInput` and `TiptapMentionInput` rich-text editors.

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

### Patch Changes

- Updated dependencies [01e249b]
- Updated dependencies [6ec2cd9]
- Updated dependencies [fd1604f]
- Updated dependencies [cea34ac]
  - @lowdefy/blocks-antd@5.2.0
  - @lowdefy/block-utils@5.2.0
  - @lowdefy/helpers@5.2.0
