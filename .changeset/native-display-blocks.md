---
'@lowdefy/blocks-native': minor
---

feat(blocks-native): Native layout and display blocks

`@lowdefy/blocks-native` now carries React Native components for `Box`, `Card`, `Divider`, `Tabs`, `Title`, `Paragraph`, `Icon`, `Tag`, `Alert`, `Empty`, `Skeleton` and `Spinner`, exported from `./blocks`.

- Each block takes its web block's type name, properties, events, methods and slots, so a page in both `pages` and `mobile.pages` renders on web and on a phone. `Empty` is new and mobile only.
- Blocks draw with the app's computed antd tokens in light and dark mode, and a block's own `theme` tokens apply where it has the matching token. Each block's style slots (`element`, `header`, `title`, ...) take its `class` and `style`.
- Properties a phone cannot honour (`hoverable`, `copyable`, `animated`, `target`) are accepted and marked `nativeIgnored` in the native metas. Text that supports html on the web is shown as plain text.
- `Tabs` is a scrolling top tab bar, with `onChange`, each tab's `eventName` and the `setActiveKey` method. `Title` and `Paragraph` support `ellipsis` with expand and collapse.
- `./icon/createIcon.js` is the native icon renderer: it draws the icon data the build resolves with `react-native-svg`, for a renderer to install as `components.Icon`.
