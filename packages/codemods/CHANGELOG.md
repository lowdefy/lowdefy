# @lowdefy/codemods

## 7.0.0

### Minor Changes

- 575a5ee: feat(blocks-basic)!: `ClickableHtml` fires only the events its `dataEvents` property lists.

  **Breaking:** a `data-event` in a `ClickableHtml` block's HTML now fires its event only when the
  block's new `dataEvents` property lists that event. A block without `dataEvents` fires no events
  from its HTML, and a click on an unlisted `data-event` does nothing and logs a console warning.
  Until now any `data-event` in the HTML fired the block event it named. HTML is often built from
  request or user data, and sanitising keeps `data-*` attributes, so the block now has the author
  say which events its HTML may fire.

  ```yaml
  - id: rows
    type: ClickableHtml
    properties:
      dataEvents:
        - onEdit
        - name: onDelete
          confirm: Delete this row?
      html: ...
  ```

  An entry is an event name, or `{ name, confirm }`. With `confirm`, every click on the event asks
  first whatever the markup says: `confirm: true` uses the element's `data-confirm` message or "Are
  you sure?", and a string is the message. Any `confirm` other than `false` asks, so an empty or
  missing message still asks, with the default message. Unlisted targets are no longer made keyboard
  focusable.

  To migrate, run `lowdefy upgrade`: the `clickable-html-data-events` codemod adds `dataEvents` to
  each `ClickableHtml` block and reports HTML built from data that inserts values without escaping
  them. `ClickableHtml` blocks that `Dynamic` content builds at page load, from config stored outside
  the app's files, need `dataEvents` added where that config lives. The docs now state that HTML
  built from user or request data must escape that data.

  `HtmlComponent` in `@lowdefy/block-utils` takes the list as its `dataEvents` prop, next to
  `onDataEvent`, and applies it inside popover content too.

- 10c20fc: Two new v6.0.0 codemods for `lowdefy upgrade`

  - **`request-timeout`:** v6 cuts requests off after 30 seconds by default, where v5 had no timeout. A cut-off request shows a generic error while the rest of the page renders from the requests that finished. The codemod adds `config.requestTimeout: 0` to keep the v5 behaviour, and reports how to choose a real limit.
  - **`report-type-overrides`:** report-only. After a build, it lists custom plugin types that override a Lowdefy built-in type of the same name. A plugin holding a v5 copy of a built-in (for example an old `AwsS3Bucket` connection) keeps its v5 behaviour and can break v6 blocks without an error. Each override is reported for the author to keep, delete or rename.

- 7c20d1b: feat: Events no longer bubble to the blocks around the block that handled them

  A click on a block inside another clickable block used to run the events of both, so a Button in a clickable Card also opened the card, and a Box in a List row also ran the row's `onClick`. Now a browser event runs only the innermost event that handles it: once a block with actions for the event fires, the blocks around it skip that same browser event. A block without an event for the interaction, like a Paragraph in the card, still passes the click on to the card. Only blocks on the browser event's own path skip it: events that blocks fire from effects, events of blocks inside the one that handled it, events from method calls, and events a block runs for its own machinery (a file upload's policy request, a table's row fetch) all still run.

  Set `bubble: true` on an event to also run the events of the blocks around it:

  ```yaml
  events:
    onClick:
      bubble: true
      try:
        - id: select
          type: SetState
          params:
            selected: true
  ```

  Inside AgGrid blocks, clicks on a cell's buttons, links, menus, inputs, selectors, switches or selection checkbox no longer trigger `onRowClick` or `onCellClick`. They only fire the control's own event.

  This changes behaviour for apps that relied on a nested click running both events: add `bubble: true` to the inner event to keep it. The `nested-event-bubbling` codemod in `lowdefy upgrade` adds `bubble: true` only where an outer event reads a value the inner event sets, moves AgGrid row-click state setup into the cell control events that relied on it, and lists the other nested events for review. Closes #1154.

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

## 6.1.0

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

## 0.0.0-experimental-20260610101734

## 5.6.0

## 5.5.1

## 5.5.0

### Minor Changes

- 9c93ab2: feat: Port MongoDB community plugin features into @lowdefy/connection-mongodb.

  All features of `@lowdefy/community-plugin-mongodb` are now part of the core MongoDB connection, so apps can drop the community plugin.

  **Change log auditing**

  - New `changeLog` connection property (`collection`, `meta`). All write requests log a change record — request arguments, request context, timestamp, and either the driver response or before/after document snapshots (`MongoDBUpdateOne`, `MongoDBVersionedUpdateOne`, `MongoDBDeleteOne`) — to the log collection. Response shapes are the same with or without a log collection.

  **MongoDBUpdateOne no-match error (behavior change)**

  - `MongoDBUpdateOne` now throws `No matching record to update.` when no document matches the filter and `upsert` is not set. Set `disableNoMatchError: true` on the request to keep the previous silent behavior. Running `lowdefy upgrade` applies a codemod that adds the flag to existing requests, so upgraded apps behave exactly as before. Apps already using the community plugin are unaffected.

  **New requests**

  - `MongoDBVersionedUpdateOne`: updates a document while preserving the previous version as a copy under a new `_id`.
  - `MongoDBInsertConsecutiveId` and `MongoDBInsertManyConsecutiveIds`: insert documents with sequential human-readable ids (for example `INV0001`), assigned inside a transaction (requires a replica set). Also fixes a community plugin bug where the id lookup ran outside the transaction.

  **New auth adapter**

  - `MultiAppMongoDBAdapter`: next-auth adapter for multiple apps sharing one `user-contacts` collection, with per-app membership, roles, and an invite-required sign up flow.

  `MongoDBInsertMany` now also returns `insertedIds`, matching the community plugin response.

## 5.4.0

## 5.3.0

## 5.2.0

## 5.1.0

## 5.0.0

### Minor Changes

- deac108c66: feat: Add `lowdefy upgrade` command with prompt-based codemod system

  New CLI command that guides version migrations using markdown prompts. Resolves a chain of upgrade phases from current to target version, presents migration prompts in order, and tracks progress for `--resume` support.

  **CLI (`lowdefy`)**

  - `lowdefy upgrade` command with `--to`, `--plan`, `--resume` options
  - Version chain resolver computes ordered upgrade phases from semver ranges
  - Fetches `@lowdefy/codemods` package from npm, presents migration prompts
  - Each prompt can be copied to clipboard for AI tools, viewed as a manual guide, or skipped
  - Upgrade state persistence in `.lowdefy/upgrade-state.json` for interrupted upgrades
  - Build-time warning when skipped codemods are detected

  **Codemods (`@lowdefy/codemods`)**

  - v5.0 entry with 20 migration prompts
  - Covers antd v6 upgrade (14 prompts), layout grid migration (4 prompts), dayjs migration (2 prompts)
  - Self-contained markdown prompts with context, examples, edge cases, and verification steps
