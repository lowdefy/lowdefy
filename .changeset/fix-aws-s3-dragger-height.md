---
'@lowdefy/plugin-aws': patch
---

fix(plugin-aws): S3 upload blocks — working `height` on `S3UploadDragger` in antd v6, antd semantic-slot passthrough across all three upload blocks, cleaner `classNames`/`styles` wiring.

After the antd v6 upgrade the Upload wrapper changed from a `<div>` to an inline `<span>`, which caused the antd `Dragger` `height` prop to resize only the inner drag box — the wrapping element and the clickable `ant-upload-btn` (which uses `height: 100%`) collapsed, so the drag area looked unchanged.

This release:

- Makes `properties.height` actually resize the full drag surface. Height is applied to the block's outer wrapper, and the antd `Upload` wrapper is forced to `display: block; height: 100%` so nested `height: 100%` rules resolve correctly.
- Defaults `height` to the antd `controlHeight` theme token (matches the default button height and follows the compact algorithm).
- Accepts `height` as a number or a string so CSS lengths like `"50vh"` / `"300px"` are supported.
- Exposes the antd v6 Upload semantic slots (`trigger`, `list`, `item`) through Lowdefy's `classNames` / `styles` API, so file-list rows and the drop trigger can be styled from YAML (`style: { .trigger: { … }, .list: { … }, .item: { … } }`).
- Moves `classNames.element` / `styles.element` onto the block's outer wrapper (matching the convention used in `blocks-antd/Search`), merges marker classes via `cn()`, and adds a `lf-s3-upload-dragger-hint` marker to the hint node for future scoped CSS.
- Fixes precedence: `style.element.height` now overrides `properties.height` again, matching the original schema docs.

`S3UploadButton` and `S3UploadPhoto` receive the same treatment: `classNames.element` / `styles.element` move to an outer block wrapper carrying a marker class (`lf-s3-upload-button`, `lf-s3-upload-photo`), and the antd v6 semantic slots `trigger` / `list` / `item` are piped through as Lowdefy slots. `S3UploadPhoto` also keeps `.icon` and `.title` slots for styling the content of the upload trigger card. The `avatar-uploader` hardcoded class on `S3UploadPhoto` (which had no CSS attached) was removed in favour of the marker-class pattern.

`S3UploadDragger`, `S3UploadButton`, and `S3UploadPhoto` are now wrapped in `withTheme('Upload', …)` (previously only `S3Download` was). Each block's `meta.js` exposes a `theme` property whose object is forwarded into a scoped `<ConfigProvider theme={{ components: { Upload: theme } }}>`, giving per-instance overrides of antd Upload design tokens (`actionsColor`, `pictureCardSize`, `controlItemBgHover`, `colorIcon`, `fontSize`, `borderRadiusSM`) — the tokens that semantic `classNames` / `styles` slots cannot reach. The shared schema lives at `packages/plugins/plugins/plugin-aws/src/schemas/uploadTheme.js` and is imported by all four upload/download block metas.

`S3Download` gains a `showRemoveIcon` property (default `false`) and an `onRemove` event. When the remove icon is clicked, the block fires `onRemove` with the clicked `file` and returns `false` to antd — the controlled `fileList` stays authoritative, and the action handler decides whether to update state (e.g. via `SetState`).

**Migration note:** Apps that relied on `style: { .element: { … } }` styling the inner `.ant-upload-drag` / `.ant-upload-select` div (e.g. custom hover interactions coupled to that selector) should move those declarations to `style: { .trigger: { … } }`. All visual styling cases in the gallery (background, border, shadow, padding) render identically on the outer wrapper, so typical apps need no changes.
