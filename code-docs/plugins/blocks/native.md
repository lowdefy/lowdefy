# @lowdefy/blocks-native

The native block set: React Native components a Lowdefy mobile shell renders through `@lowdefy/client-native`. Each block keeps its web block's type name, properties, events, methods and slots, so one page can be shared by web and mobile.

## Blocks

Phase 1 layout and display blocks: `Box`, `Card`, `Divider`, `Tabs`, `Title`, `Paragraph`, `Icon`, `Tag`, `Alert`, `Empty`, `Skeleton` and `Spinner`. `Screen` (the mobile page type) has its meta here and its component in `@lowdefy/client-native`. `Empty` has no web block; a page that uses it is mobile only.

| Block                 | Web source          | Native notes                                                                                  |
| --------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `Box`                 | blocks-basic        | A `View`, or a `Pressable` button with `onClick`.                                             |
| `Card`                | blocks-antd         | Header (title, extra), cover, body, actions; `loading` draws skeleton rows.                   |
| `Divider`             | blocks-antd         | Dashed and dotted lines are zero-height views with a split border (iOS draws dashes only so). |
| `Tabs`                | blocks-antd         | Top tabs in a scrolling bar (RN views, not `@expo/ui`); `setActiveKey` method; `bottom` too.  |
| `Title`, `Paragraph`  | blocks-antd         | Text styles from antd's typography; `ellipsis` with expand/collapse fires `onExpand`.         |
| `Icon`                | blocks-basic        | Drawn by the native icon renderer; a button with `onClick`.                                   |
| `Tag`                 | blocks-antd         | Status and preset colours from the computed palette tokens; closable; `href` opens outside.   |
| `Alert`               | blocks-antd         | Type colours and icon; closable fires `onClose` then `afterClose`; `action` slot.             |
| `Skeleton`, `Spinner` | blocks-loaders      | A pulsing shape; the platform `ActivityIndicator`, scaled to the web sizes.                   |
| `Empty`               | none (antd `Empty`) | The empty tray or an icon, a description and a `footer` slot.                                 |

## Metas

Each `meta.js` mirrors the web meta (copied, not imported, so the shell never installs web block packages). Two additions:

- **`nativeIgnored: true`** on a property a phone cannot honour (`hoverable`, `copyable`, `animated`, `target`), with "Ignored on mobile." in its description. The schema still accepts the property, so a shared page stays valid; the build is meant to warn once per page for these, which it does not do yet.
- Descriptions say where mobile differs: "supports html" text is shown plain (tags removed by `htmlToText`), events that never fire on a phone say so.

## Theme and styles

Blocks read the computed antd tokens of the mode showing with `useTheme()` from `@lowdefy/client-native`; `useComponentTokens` lays a block's own `theme` property over them, as antd applies component tokens. Component tokens antd derives from global ones (`bodyPadding`, `headerHeight`, `cardBg`) fall back to those global tokens. Every block lays its own defaults and tokens under the `styles` slots the renderer passes (`element`, `header`, `title`, ...), so the order is block defaults, theme, class, style.

## Icons

`src/icon/createIcon.js` is the native icon renderer: `createIcon({ icons, iconTheme })` returns the `Icon` component a renderer installs as `lowdefy._internal.components.Icon`, as the web client installs its own. `icons` is the icon data the build loads (`{ node, attrs, size }` by name, including `loading` and `icon-missing`); `renderIconNodes` draws the nodes with `react-native-svg`. Props follow the web's (`properties` is a name or the Icon block's properties); an element style's `color` and `fontSize` stand in for CSS `currentColor` and `1em`. Blocks draw every icon through `components.Icon`.

## Tests

Each block has a Jest test under React Native's preset that renders a page through `LowdefyPage` with the real blocks (`src/test/renderPage.js`): the computed theme of an app with `colorPrimary: #6366f1` (`src/test/theme.json`), a few lucide icons (`src/test/icons.json`) and the `SetState`, `CallMethod` and `Record` actions. `fixtures/display-blocks` is an app whose shared page uses every phase 1 block with a web version; `lowdefy build` builds it for both targets.
