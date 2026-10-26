# @lowdefy/blocks-tiptap

## 7.1.0

### Patch Changes

- Updated dependencies [c6d665a]
- Updated dependencies [3df29f3]
  - @lowdefy/blocks-antd@7.1.0
  - @lowdefy/blocks-files@7.1.0
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/helpers@7.1.0

## 7.0.0

### Major Changes

- 36f864c: feat!: Lucide icons replace react-icons, with icon settings and icon-set plugins.

  Lowdefy icons are now [Lucide](https://lucide.dev) icons rendered by `lucide-react`. react-icons names such as `AiOutlineUser` no longer resolve. Run `lowdefy upgrade` to rewrite them, or follow the migration guide at `/v6-to-v7` in the docs.

  Breaking changes:

  - **Icon names.** Use a semantic name (`edit`, `delete`, `chevron-down`, …), a Lucide name in PascalCase (`Pencil`, `Trash`), or a set-qualified name (`lucide:Pencil`). An unknown name at an icon property fails the build with a suggestion; old react-icons and Ant Design names get a migration message.
  - **Block and Ant Design icons are Lucide.** Every icon a block chooses (validation marks, date picker calendar, menu and sidebar toggles, dark-mode switch, upload lists, pagination arrows, …) and Ant Design's own close, status, expand and loading icons now render through semantic names, so they follow the app's icon set and `theme.icons.aliases`.
  - **`theme.icons.aliases` targets lose the `Lu` prefix** (`LuPencil` → `Pencil`), and several semantic names now point at Lucide 1.x names (`delete` → `Trash`, `filter` → `Funnel`, `help` → `CircleQuestionMark`, `history` → `RotateCcwClock`).
  - **Icon hover titles** are generated from the new names ("Pencil", "Arrow left right").

  New:

  - **Icon settings.** `theme.icons.size` (default `1em`), `theme.icons.strokeWidth` (default `2`) and `theme.icons.nonScalingStroke` set app-wide defaults; every icon accepts `strokeWidth` and `nonScalingStroke`.
  - **Icon-set plugins.** A plugin declares `iconSets` in `types.js` and exports icon data from `./iconSets`. Sets are layered in plugin order - the last plugin wins per icon name, and a partial set falls through - so a plugin can add a single icon to `lucide` or replace one. `theme.icons.set` picks the default set for PascalCase names and can re-skin semantic names.
  - **`@lowdefy/icons-react-icons`** holds every react-icons 5.6.0 icon under its old name. Install it and set `theme.icons.set: react-icons` to keep old names, for example icon names stored in a database.
  - **`lowdefy upgrade`** gains a `7.0.0` phase that rewrites react-icons names to semantic or Lucide names from a table covering every Ant Design, Lucide and commonly used react-icons name.

  Fixes: the header locale selector and the AgGrid row menu icons now bundle in production builds, and the dev server reports unknown icon names on pages written inline in `lowdefy.yaml`.

### Patch Changes

- 6144814: Allow only safe link schemes in block hrefs

  An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

  `@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.

- d2c8e01: feat(api)!: Data read into a Dynamic block's `:return` stays data.

  **Breaking:** a Dynamic block without a dynamic blocks policy no longer renders blocks or actions that its endpoint read as data. In v6, stored operator-free block config returned from a Dynamic endpoint rendered as it was; in v7 the block renders its fallback. Every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, fails resolution. Operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`) may return written config; content that breaks the rule renders the fallback, with an error naming the operator and the path in its result. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` fail: build them inside `:return` with `_array.map`/`_array.concat`, share block config with `_ref`, and write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Data may still fill values inside written blocks, as in the documented `_array.map` pattern, and a block built by config from a stored field renders even when it equals the field. To render stored or generated block config, put the Dynamic block under a dynamic blocks policy and return the content through a `ValidateDynamic` step. See the v6 to v7 migration guide.

  Also:

  - Only operator keys lose their escaping underscore in the returned content (`__state` becomes `_state`); data keys such as `__typename` pass through unchanged.
  - Data read into a Dynamic `:return` may nest at most 200 levels deep, and dynamic blocks policy content likewise (`limits.depth`); deeper data fails resolution with an error saying so.
  - An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
  - Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
  - Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. Every value no schema marks is still judged by its key name; `urlKind: false` opts a URL-named property out (`Search` `result.url`, the Tiptap `image` settings). URLs are read as the browser's URL parser reads them, so surrounding spaces and embedded tabs or newlines do not change the verdict.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [f0162f4]
- Updated dependencies [2735310]
- Updated dependencies [80b5cbf]
- Updated dependencies [26a1894]
- Updated dependencies [6f20e75]
- Updated dependencies [7c4879b]
- Updated dependencies [7836aa2]
- Updated dependencies [2bdb855]
- Updated dependencies [80c0ad2]
- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [ae6afbf]
- Updated dependencies [6144814]
- Updated dependencies [cfc8f71]
- Updated dependencies [81bd4f0]
- Updated dependencies [10bee50]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [575a5ee]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [5852b65]
- Updated dependencies [d2c8e01]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [1bb3012]
- Updated dependencies [2ffac21]
- Updated dependencies [a2b5466]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [49490b6]
- Updated dependencies [a79fb1d]
- Updated dependencies [1766343]
- Updated dependencies [08f76bb]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [a9442cc]
- Updated dependencies [3c2258c]
- Updated dependencies [81bd4f0]
- Updated dependencies [3eb3691]
- Updated dependencies [537bf54]
- Updated dependencies [9de3cf9]
- Updated dependencies [3f3a320]
- Updated dependencies [ecdfb65]
- Updated dependencies [4a69885]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/blocks-antd@7.0.0
  - @lowdefy/blocks-files@7.0.0
  - @lowdefy/block-utils@7.0.0

## 6.1.0

### Patch Changes

- 08e05f9: fix(blocks-tiptap): The `TiptapInput` and `TiptapMentionInput` blocks now use TipTap v3 internally, which includes the fix for the `@tiptap/core` security advisory GHSA-cp6q-959q-f8rh. No config changes are needed: block properties, events and methods are unchanged, and content saved by the blocks loads and saves with the same html, text, markdown and mentions values as before.

  Editing and pasting now follow TipTap v3:

  - Escape in the mention popup now ends the suggestion; before, a following Enter inserted the hidden first match.
  - With a multi-character mention trigger such as `@@`, Backspace after a mention leaves the trigger as typed.
  - Typing inline code around existing backticks no longer drops a character.
  - Dragging an image that is already in the editor moves it instead of starting an upload.
  - Text typed straight after a pasted link, or after pasted markdown formatting such as `**bold**`, at the end of the paste continues that link or formatting.
  - Backspace at the start of a paragraph in a blockquote lifts the paragraph out of the quote; before, it joined the paragraph to the one above.
  - Delete at the end of a list item that is followed by a nested list whose items have their own sublists moves those nested items up into the list.
  - Pasting plain text that starts with `1. ` creates an ordered list.
  - Links with relative or protocol-less hrefs, such as `docs/page` or `example.org/path`, are kept; before, the link was dropped.
  - Pasted or seeded html keeps more of its formatting: `width` and `height` on images, `title` on links, `text-align` on table cells, and an ordered list's CSS `list-style-type`. Highlight colours are kept as written instead of as `rgb()`, and `type="1"` on an ordered list is dropped because it is the default.
  - A table with `table.resizable: false` now updates its column widths when columns change. In the editor it renders inside a `div.tableWrapper`, as resizable tables already did.

- Updated dependencies [ae9803e]
- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/blocks-antd@6.1.0
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/blocks-files@6.1.0

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
