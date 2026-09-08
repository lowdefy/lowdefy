# @lowdefy/blocks-tiptap

## 6.0.0

### Minor Changes

- 6730996: feat: Provider-neutral file storage — upload and download files to S3-compatible providers, Google Cloud Storage, and Azure Blob Storage.

  **Generic file blocks (`@lowdefy/blocks-files`, new)**

  - New `Upload`, `UploadPhoto`, `UploadDragger`, and `Download` blocks that work with any storage provider. Upload blocks call an upload-policy request by id (`uploadPolicyRequestId`) and support both POST form uploads (S3, R2, MinIO, GCS) and PUT body uploads (Azure SAS), with upload progress on both.
  - `emitFileContent: true` reads the file in the browser and emits `{ name, size, type, content }` (base64) as the block value and `onChange` event, for storing files through an API endpoint routine with a server-side write request.

  **S3-compatible providers (`@lowdefy/plugin-aws`)**

  - `AwsS3Bucket` connections accept `endpoint` and `forcePathStyle`, unlocking Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, and Wasabi with a one-line config change.
  - `AwsS3PresignedGetObject` returns a stable, non-expiring public URL when the request sets `public: true`; the connection-level `publicUrlBase` overrides the constructed URL for CDN domains.
  - New `AwsS3PutObject` write and `AwsS3GetObject` read requests store and read base64 object content from endpoint routines or page requests, so routines can process file content in steps.
  - The `S3UploadButton`, `S3UploadPhoto`, `S3UploadDragger`, and `S3Download` blocks are now deprecated aliases of the generic blocks — existing apps keep working unchanged.

  **Google Cloud Storage (`@lowdefy/plugin-gcp`, new)**

  - `GoogleCloudStorageBucket` connection with `GcsSignedPostPolicy`, `GcsSignedGetUrl`, `GcsGetObject`, and `GcsPutObject` requests.

  **Azure Blob Storage (`@lowdefy/plugin-azure`, new)**

  - `AzureBlobContainer` connection with `AzureBlobUploadSas`, `AzureBlobDownloadSas`, `AzureBlobGet`, and `AzureBlobPut` requests.

  **Editor and chat uploads (`@lowdefy/blocks-tiptap`, `@lowdefy/blocks-antd-x`)**

  - Tiptap editors and AgentChat attachments now upload through the shared provider-neutral flow. New `uploadPolicyRequestId` and `downloadPolicyRequestId` properties replace `s3PostPolicyRequestId` (kept as a deprecated alias). Inline image and attachment URLs resolve through the download request when configured.

  **Servers (`@lowdefy/server`, `@lowdefy/server-dev`)**

  - `/api/endpoints/*` request bodies are capped at 10 MiB (matching the agent route), bounding base64 file payloads sent via `CallAPI`.

  **Codemod (`@lowdefy/codemods`)**

  - Optional `s3-blocks-to-file-blocks` codemod renames the deprecated S3\* blocks and `s3PostPolicyRequestId`/`s3GetPolicyRequestId` properties to the provider-neutral names via `lowdefy upgrade`.

### Patch Changes

- 28cb944: feat: Dev server docs and MCP endpoint for AI coding agents

  The dev server now always serves documentation for everything installed in your project — every block, operator, action, connection and request type, from core plugins and your own local plugins — plus the full Lowdefy docs as markdown.

  **Docs API and MCP endpoint (`@lowdefy/server-dev`)**

  - Plain GET routes under `/lowdefy-docs`: list all available types per kind, JSON schemas per type, block usage examples, docs pages as markdown, and search.
  - An MCP endpoint (streamable HTTP) at `/lowdefy-docs/mcp` exposing the same as tools (`lowdefy_list_types`, `lowdefy_get_schema`, `lowdefy_get_examples`, `lowdefy_get_doc`, ...) so agents like Claude Code can look up exact type contracts instead of guessing.
  - The `/lowdefy-docs` page path prefix is now reserved in dev.

  **Discovery build artifacts (`@lowdefy/build`)**

  - Dev builds now write `plugins/availableTypes.json` (every installed type, used or not) and `plugins/connectionSchemas.json` + `plugins/requestSchemas.json` (collected from connection definitions).
  - Fixed custom/local plugin schemas being silently missing from all schema maps — plugin modules now also resolve from the server directory.

  **Docs content package (`@lowdefy/docs-content`)**

  - New package shipping the Lowdefy docs extracted as markdown with a manifest, generated from the docs app build (`pnpm docs:content`).

  **Block plugins**

  - Block packages now publish their `gallery.yaml`/`examples.yaml`/`tests.yaml` files in `dist/`, so the docs API can serve real examples.

- 01d7552: fix(blocks-tiptap): Editor styles now apply in production builds.

  The Tiptap block styles (wrapper, ProseMirror content, mention menu, tables) are global
  stylesheets, but they were shipped as CSS Modules (`style.module.css`) imported for side effect
  (`import './style.module.css'`) with every rule wrapped in `:global(...)`. The Vite dev server
  injected them, but the production client build dropped them — so on `lowdefy build` + `lowdefy
start` (and on Vercel) the Tiptap inputs rendered unstyled while `lowdefy dev` looked correct.

  The files are now plain `.css` (the redundant `:global()` wrappers removed, since the selectors are
  already global), which the production build includes reliably. No config or markup changes.

- 6d7cd8e: fix(blocks-tiptap): Clicking anywhere in a multi-line editor places the cursor.

  The editable `.ProseMirror` area now fills the input wrapper's full height (the wrapper is a flex
  column and the editable grows to fill it). Previously the editable only grew to its content, so on
  an empty multi-line `TiptapInput` only the first line was clickable — clicking below it focused the
  block but left the cursor unplaced. Now a click anywhere in the box lands the cursor in the editor.

- Updated dependencies [ef707bd]
- Updated dependencies [46029df]
- Updated dependencies [28cb944]
- Updated dependencies [6730996]
- Updated dependencies [ae5f618]
- Updated dependencies [01d7552]
- Updated dependencies [629837d]
- Updated dependencies [6446ae6]
- Updated dependencies [fb80e0a]
- Updated dependencies [0e71ebd]
- Updated dependencies [c2e0823]
  - @lowdefy/blocks-antd@6.0.0
  - @lowdefy/blocks-files@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/block-utils@6.0.0

## 5.6.0

### Patch Changes

- 5b4c305: fix(blocks-tiptap): Mentions with object options serialise a real identifier in `data-id` instead of `[object Object]`. `TiptapMentionInput` now renders `data-id` from the option's scalar identity (`value`, `value._id`/`value.id`, or the option's own `_id`/`id`) — or omits it when there is none — and always writes the display label to `data-label`, so saved html round-trips with a readable mention.
- Updated dependencies [3ead269]
- Updated dependencies [9399e4e]
- Updated dependencies [79bbd84]
- Updated dependencies [508708d]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/blocks-antd@5.6.0
  - @lowdefy/block-utils@5.6.0

## 5.5.1

### Patch Changes

- Updated dependencies [59cae71]
  - @lowdefy/blocks-antd@5.5.1
  - @lowdefy/block-utils@5.5.1
  - @lowdefy/helpers@5.5.1

## 5.5.0

### Minor Changes

- 6dcdb6a: feat: Group mentions for TiptapMentionInput

  `TiptapMentionInput` can now treat mention options as app-defined **groups** (roles, teams, queues, segments) in addition to individual people. All group data — which groups exist, their labels, colours, and members — comes from your config; the block ships no groups of its own.

  - **Menu sections** — options with a `tag.section` are grouped under headings in the suggestion dropdown; options without one render flat, as before.
  - **Group chips** — an option with `tag.group` renders a distinct chip carrying `class="tiptap-mention tiptap-mention-group"` and `data-mention-group="<group>"`, coloured inline from `tag.color` so the colour travels with the saved HTML.
  - **Hover member popover** — `mentions.groupMembers` (a `{ '<group>': [{ name, email }] }` map, which may be loaded from a request) shows a group's current members when you hover its chip in the live editor.
  - **Configurable suggestion cap** — `mentions.limit` (default 5) caps results, applied per section when sections are used so a large section can't crowd out a small one.

  Also fixes a latent `getHref` bug: the element is now chosen by the function's return value, so a nullish return renders a plain `<span>` instead of `<a href="null">`. Options with no `tag.section`, `tag.group`, or `tag.color` are unaffected and render exactly as before.

### Patch Changes

- f88fe33: fix(blocks-tiptap): Restore editor formatting that appeared stripped.

  Lists, blockquotes, headings, code, horizontal rules and line breaks rendered as flat, unstyled text in the TipTap editor because the global antd reset flattened their styles (the underlying HTML was always intact). The editor now restores correct rendering for all of these, themed to match the active antd theme. Applies to both `TiptapInput` and `TiptapMentionInput`.

- 7ab09d6: fix: Prevent rich-text editor crash when navigating away mid-edit.

  Fixed a "removeChild" crash in the Tiptap editor blocks that could occur when the
  editor was unmounted while the formatting menu or an `@`-mention popup was open, or
  while an image upload was still in progress — for example when a user submitted or
  started editing content and immediately navigated away. The editor now tears these
  down safely, so navigating away no longer throws or leaves the editor in a broken
  state.

  - @lowdefy/blocks-antd@5.5.0
  - @lowdefy/block-utils@5.5.0
  - @lowdefy/helpers@5.5.0

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
