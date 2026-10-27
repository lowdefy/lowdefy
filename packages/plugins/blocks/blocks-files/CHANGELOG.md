# @lowdefy/blocks-files

## 7.2.0

### Patch Changes

- Updated dependencies [df6fa3c]
- Updated dependencies [02842fe]
- Updated dependencies [d143e29]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [0f0cd03]
- Updated dependencies [a461f7c]
- Updated dependencies [7aec569]
- Updated dependencies [fcea703]
- Updated dependencies [b1d42ca]
- Updated dependencies [962ac05]
- Updated dependencies [0dd2e9d]
  - @lowdefy/errors@7.2.0
  - @lowdefy/blocks-antd@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/block-utils@7.2.0

## 7.1.0

### Patch Changes

- Updated dependencies [c6d665a]
- Updated dependencies [3df29f3]
  - @lowdefy/blocks-antd@7.1.0
  - @lowdefy/block-utils@7.1.0
  - @lowdefy/errors@7.1.0
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

### Minor Changes

- 7c4879b: feat: Expose antd 6 options on the overlay, feedback, layout and file blocks.

  The overlay, feedback, layout and upload blocks now expose the antd 6.6 features that fit
  declarative config, and several properties that silently did nothing now work.

  **Modal, ConfirmModal and Drawer**

  - `mask` also takes an object: `enabled`, `blur` (blur the page behind the dialog) and `closable`.
    `maskClosable` still works and is folded into `mask.closable`.
  - `closable` also takes an object: `disabled` shows the close button disabled; on Drawer,
    `placement: end` moves it to the end of the header.
  - New `focusable` object (`trap`, `focusTriggerAfterClose`; ConfirmModal adds `autoFocusButton`).
  - New `keyboard` (Modal, ConfirmModal) and `scrollLock` (Modal, ConfirmModal).
  - New `loading`, `destroyOnHidden` and `forceRender` (Modal, Drawer).
  - Modal: responsive `width` object (`xs` to `xxl`), `afterOpenChange` event with `{ open }`, `title`
    cssKey. The `afterClose` event it already fired is now documented.
  - Drawer: `size` (`default`, `large`, a number or a CSS length), `resizable` with `maxSize` and an
    `onResizeEnd` event with `{ size }`, html `title`, `title` cssKey, and `open` on the
    `afterOpenChange` event. The `getContainer` property it already passed to antd is now documented:
    `false` renders the drawer in place, a CSS selector mounts it in the matching element.
  - ConfirmModal: `okButton` and `cancelButton` document their button properties, including
    `iconPlacement: end`.

  **Message and Notification**

  - Notification: `showProgress`, `pauseOnHover`, `closable`, `role`, the `placement` values `top`
    and `bottom`, and `title`, `description`, `actions` and `progress` cssKeys.
  - Notification: the `button` now closes the notification when clicked, as documented.
  - Message: `pauseOnHover` and an `onClick` event.

  **Tooltip and Popover**

  - `arrow` (`false` hides it, `{ pointAtCenter: true }` centres it), the `contextMenu` trigger, and
    `{ open }` on the `onOpenChange` event.
  - Popover: `destroyOnHidden`, html `title`, and the `width` and `minWidth` theme tokens.
  - Tooltip: `destroyOnHidden`, the antd 6 name for `destroyTooltipOnHide`, which still works.

  **Flex, Masonry, MasonryList, Splitter and ConfigProvider**

  - Flex: `orientation`, the `medium` gap preset, and the `start`, `end`, `left`, `right`, `normal`,
    `self-start` and `self-end` alignment values.
  - Masonry and MasonryList: `item` cssKey and responsive `gutter` objects.
  - Splitter: `collapsible` (`motion`, custom `icon.start` and `icon.end`), `destroyOnHidden` (also per
    panel), `draggerIcon`, the `onDraggerDoubleClick` event with `{ index }`, and `panel`, `dragger`,
    `draggerIcon` and `collapseIcon` cssKeys. Panel `collapsible` objects document `start`, `end` and
    `showCollapsibleIcon`. The default collapse arrows are now the `chevron-left`, `chevron-right`,
    `chevron-up` and `chevron-down` icons, so they follow the app icon set.
  - ConfigProvider: `virtual`, `popupMatchSelectWidth`, `popupOverflow`, `wave` and the `medium`
    component size.

  **Upload, UploadDragger and UploadPhoto**

  - `showUploadList` also takes an object with `showPreviewIcon`, `showRemoveIcon` and
    `showDownloadIcon`.
  - Upload and UploadDragger: `directory` (upload a folder) and `listType` (`text` or `picture`).
  - Upload and UploadPhoto: `pastable` (upload files pasted on the page).
  - UploadDragger: `openFileDialogOnClick`, for a drop or paste only area.
  - UploadPhoto: `capture` (`user` or `environment` camera on mobile) and `listType`
    (`picture-card` or `picture-circle`).
  - Upload documents `iconPlacement` on its `button`.

  **Fixes**

  - Notification status icons lost their colour on antd 6.6; the colour class now reaches antd's icon
    wrapper. Notification passes `actions` instead of the deprecated `btn`.
  - Modal and ConfirmModal no longer pass the deprecated `maskClosable`, Tooltip no longer passes
    `destroyTooltipOnHide` or the removed `arrowPointAtCenter`, Popover no longer passes
    `overlayInnerStyle`, and Splitter no longer passes `layout`. The Lowdefy properties keep working.
  - The Modal `content` cssKey and the Tooltip `inner` cssKey styled nothing, because antd 6 renamed
    those parts to `container`. Modal `header`, `footer` and `content` styles were not passed.
  - The Popover `inner`, `title` and `content` cssKeys were never wired.
  - ConfirmModal ignored `theme` and never fired its `onClose` event.
  - ConfigProvider ignored its `theme` property; it is now merged into the design tokens, with
    `token` taking precedence.
  - ConfigProvider `componentSize: middle` and Flex `gap: middle` now reach antd as `medium`, the
    name antd 6 uses.
  - Corrected documented defaults and descriptions: Drawer size (378px), Message duration (3s) and
    status (`success`), Popover placement (`top`) and hover delays (seconds), Masonry `fresh`, and
    the Flex theme tokens (the gap preset tokens `paddingXS`, `padding` and `paddingLG`).
  - The MasonryList docs page linked to the antd List component instead of Masonry.
  - Message and Notification `theme`, Notification `top` and `bottom`, and Masonry and MasonryList
    `sequential` never had an effect. They stay valid, and their descriptions now say so: set
    Message and Notification tokens app-wide under `theme.antd.components` in `lowdefy.yaml`, and
    move notifications with the `--notification-top` and `--notification-bottom` CSS variables on
    `.ant-notification`.

### Patch Changes

- 7836aa2: fix: ConfigProvider `componentDisabled` now disables the Lowdefy blocks inside it.

  `componentDisabled: true` on a ConfigProvider block was documented to disable every child
  component, but Lowdefy's input blocks and buttons ignored it: they passed `disabled={false}` to
  antd whenever the block was not loading, and antd lets an explicit `false` beat the
  ConfigProvider. Blocks now pass their `disabled` property through unchanged (and `true` while
  loading), so inside a ConfigProvider with `componentDisabled: true`:

  - Every input, selector, date selector, switch, slider, color selector and button is disabled,
    including TagSelector and TagMultipleSelector pills, SegmentedSelector, RatingSlider,
    PhoneNumberInput, DropdownButton (its hover menu no longer opens either), the ControlledList add
    button and remove icons, and the textInput, selector, switch and buttons cells of the AgGrid
    blocks.
  - A block that sets `disabled: false` itself stays enabled, and `disabled: true` still disables a
    block anywhere.
  - Pasting into an UploadDragger does nothing while it is disabled by the ConfigProvider.

  Nothing changes for blocks outside a ConfigProvider, or when `componentDisabled` is not set. As in
  antd, ParagraphInput, TitleInput (whose `disabled` is a style only) and Pagination don't follow
  `componentDisabled`.

  AutoComplete now matches the other Select-based blocks:

  - New `onOpenChange` event with `{ open }` when the dropdown opens or closes.
  - New `listHeight`, `placement`, `popupMatchSelectWidth` and `virtual` properties, the same as
    Selector.
  - `size: default` is passed to antd as `medium`, so antd 6 no longer warns about it.
  - An empty `prefix` no longer falls back to `prefixIcon`, matching Selector.

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
- Updated dependencies [4d08b55]
- Updated dependencies [99a4f35]
- Updated dependencies [1227e62]
- Updated dependencies [ae6afbf]
- Updated dependencies [6144814]
- Updated dependencies [cfc8f71]
- Updated dependencies [81bd4f0]
- Updated dependencies [10bee50]
- Updated dependencies [cb3551c]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [575a5ee]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [5852b65]
- Updated dependencies [d2c8e01]
- Updated dependencies [36f864c]
- Updated dependencies [eaa6517]
- Updated dependencies [09717e8]
- Updated dependencies [1bb3012]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
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
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [3eb3691]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
- Updated dependencies [537bf54]
- Updated dependencies [9de3cf9]
- Updated dependencies [3f3a320]
- Updated dependencies [ecdfb65]
- Updated dependencies [4a69885]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/blocks-antd@7.0.0
  - @lowdefy/errors@7.0.0
  - @lowdefy/block-utils@7.0.0

## 6.1.0

### Patch Changes

- Updated dependencies [ae9803e]
- Updated dependencies [ea69869]
- Updated dependencies [6d6f8fa]
- Updated dependencies [1d3a0b8]
- Updated dependencies [6d6f8fa]
  - @lowdefy/blocks-antd@6.1.0
  - @lowdefy/block-utils@6.1.0
  - @lowdefy/helpers@6.1.0
  - @lowdefy/errors@6.1.0

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

- Updated dependencies [37c8c14]
- Updated dependencies [ef707bd]
- Updated dependencies [46029df]
- Updated dependencies [28cb944]
- Updated dependencies [ae5f618]
- Updated dependencies [01d7552]
- Updated dependencies [629837d]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
- Updated dependencies [fb80e0a]
- Updated dependencies [0e71ebd]
- Updated dependencies [c2e0823]
  - @lowdefy/errors@6.0.0
  - @lowdefy/blocks-antd@6.0.0
  - @lowdefy/helpers@6.0.0
  - @lowdefy/block-utils@6.0.0
