---
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/block-utils': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/server-dev': minor
'lowdefy': patch
'@lowdefy/docs': minor
---

feat: semantic icon names, and icons, tooltips and popovers in HTML.

- **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
- **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
- **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
- **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.
