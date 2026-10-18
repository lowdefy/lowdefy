# @lowdefy/blocks-native

The native block set: React Native components a Lowdefy mobile shell renders through `@lowdefy/client-native`. Each block keeps its web block's type name, properties, events, methods and slots, so one page can be shared by web and mobile.

## Blocks

Layout and display blocks: `Box`, `Card`, `Divider`, `Tabs`, `Title`, `Paragraph`, `Markdown`, `Icon`, `Tag`, `Alert`, `Empty`, `Skeleton` and `Spinner`. List, input and action blocks: `List`, `ListItem`, `TextInput`, `TextArea`, `NumberInput`, `Selector`, `Switch`, `DateSelector` and `Button`. `Screen` (the mobile page type) has its meta here and its component in `@lowdefy/client-native`. `Empty` and `ListItem` have no web block; a page that uses one is mobile only.

| Block                 | Web source          | Native notes                                                                                  |
| --------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `Box`                 | blocks-basic        | A `View`, or a `Pressable` button with `onClick`.                                             |
| `Card`                | blocks-antd         | Header (title, extra), cover, body, actions; `loading` draws skeleton rows.                   |
| `Divider`             | blocks-antd         | Dashed and dotted lines are zero-height views with a split border (iOS draws dashes only so). |
| `Tabs`                | blocks-antd         | Top tabs in a scrolling bar (RN views, not `@expo/ui`); `setActiveKey` method; `bottom` too.  |
| `Title`, `Paragraph`  | blocks-antd         | Text styles from antd's typography; `ellipsis` with expand/collapse fires `onExpand`.         |
| `Markdown`            | blocks-markdown     | Read-only GFM drawn with RN views by `react-native-marked` (below); adds `onLinkPress`.       |
| `Icon`                | blocks-basic        | Drawn by the native icon renderer; a button with `onClick`.                                   |
| `Tag`                 | blocks-antd         | Status and preset colours from the computed palette tokens; closable; `href` opens outside.   |
| `Alert`               | blocks-antd         | Type colours and icon; closable fires `onClose` then `afterClose`; `action` slot.             |
| `Skeleton`, `Spinner` | blocks-loaders      | A pulsing shape; the platform `ActivityIndicator`, scaled to the web sizes.                   |
| `Empty`               | none (antd `Empty`) | The empty tray or an icon, a description and a `footer` slot.                                 |

The list, input and action blocks:

| Block          | Notes                                                                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextInput`    | `type` picks the keyboard (`getKeyboardProps`); `replaceInput`, `allowClear`, `showCount`, `prefix`/`suffix` as on the web.                                                                                                                   |
| `NumberInput`  | Keeps its own text so "-" and "1." can be typed; sets a number on each valid change; clamps to `min`/`max` and rounds to `precision` on blur; `mode: spinner` shows step buttons.                                                             |
| `Selector`     | The picker works on option indices, so option values may be any type (matched by stable serialization, as the web). A placeholder item stands for no value. Disabled options are left out.                                                    |
| `DateSelector` | The value is the picked day at midnight UTC, as the web. Shows the calendar under the field on iOS and Material's dialog on Android. Only `disabledDates.min`/`max` are supported.                                                            |
| `List`         | Web model and methods; `FlatList`, or `SectionList` with `sectionKey`. Scrolls itself only with `scroll: true`, since it sits in the page's scroll view. `swipeActions` use a `PanResponder` row (`SwipeableRow`) with accessibility actions. |
| `ListItem`     | Mobile only. A cell with avatar or icon, title, description, `extra` detail and a chevron that shows by default when it has `onClick`.                                                                                                        |
| `Button`       | `getButtonColors` follows antd: `color` + `variant`, or the deprecated `type` (where a preset colour has no effect and a custom colour replaces primary). The spinner comes from `events.onClick.loading`.                                    |

## Markdown

`Markdown` draws GitHub-flavoured markdown (headings, emphasis, strikethrough, code, block quotes, ordered, unordered and task lists, tables, images, links) with React Native views. It takes the web block's `content` and `skipHtml`, and adds `onLinkPress`.

- **Library.** `react-native-marked` parses with `marked` and draws with `Text`, `View` and `Image`. Its only native peer is `react-native-svg`, which the `basic` profile already links, so the block adds no native module and reaches shells in an update. `react-native-markdown-display` was not chosen: its last release was in 2023, on `markdown-it` 10. A web-view `Markdown` costs a web view per instance.
- **Scrolling.** The block uses the `useMarkdown` hook, not the library's `FlatList` component, because a block sits in the page's scroll view.
- **Theme.** `getMarkdownStyles` maps the computed tokens onto the library's styles: body text as `Paragraph`, headings 1 to 5 as `Title`, code in the platform's monospace font on `colorFillTertiary`.
- **Links.** `MarkdownRenderer` overrides `link` and `linkImage`. With `onLinkPress` the block triggers the event with `{ href }` and opens nothing; without it, `Linking.openURL(href)` opens the link, as an outside `Link` does. The library reads an href without a scheme from the app root, so `page` passes `/page` and `#notes` passes `/#notes`.
- **Raw HTML** is drawn as its source text, as the web block escapes it. With `skipHtml` it is left out.
- **Task lists.** The library draws no checkbox token, so `MarkdownTokenizer` puts ☐ or ☑ in front of a task item's text.

## Metas

Each `meta.js` mirrors the web meta (copied, not imported, so the shell never installs web block packages). Two additions:

- **`nativeIgnored: true`** on a property a phone cannot honour (`hoverable`, `copyable`, `animated`, `target`, input `label.align` and `label.span`, `prefixIcon`, ...), with "Ignored on mobile" in its description. The schema still accepts the property, so a shared page stays valid. `extractBlockTypes` lists the marked paths in the block meta, and the build warns once per page for each one a page sets (`validateNativeIgnoredProperties`). Mark every property whose description says it is ignored on mobile, nested ones included.
- Descriptions say where mobile differs: "supports html" text is shown plain (tags removed by `htmlToText`), events that never fire on a phone say so.

## Theme and styles

Blocks read the computed antd tokens of the mode showing with `useTheme()` from `@lowdefy/client-native`; `useComponentTokens` lays a block's own `theme` property over them, as antd applies component tokens. Component tokens antd derives from global ones (`bodyPadding`, `headerHeight`, `cardBg`) fall back to those global tokens. Every block lays its own defaults and tokens under the `styles` slots the renderer passes (`element`, `header`, `title`, ...), so the order is block defaults, theme, class, style.

## Inputs

- Inputs draw `blocks/Label/Label.js`: title, `required` mark, colon (inline only), the `extra`
  text, and the first validation message once the engine shows validation. `getLabelState` holds
  the rules, which follow the web Label's `labelLogic`.
- The input box (`shared/getInputBoxStyle.js`) follows `variant`, `bordered: false`, `size` and
  the validation status. Sizes are one antd step taller than the web (`getControlSize`): a phone
  is touched, not clicked.
- Controls come from `@expo/ui` (a peer dependency the shell carries): `Picker` (Selector),
  `Switch`, and the community `DateTimePicker` (DateSelector). Picker and Switch sit in a
  `Host` seeded with the theme's primary colour and mode.

## Screen

`Screen` is the mobile page type. Its properties: `title`, `largeTitle` (an iOS large title that collapses as the page scrolls), `presentation` (`card`, `modal`, `sheet`), `headerSearch` (`{ placeholder, autoFocus, debounce, hideWhenScrolling }`, a native search bar) and `headerActions` (`[{ id, icon, sfSymbol, title, placement, event, disabled }]`, header icon buttons at their natural size, native SF Symbol bar buttons on iOS). Its events: `onFocus` (each time the screen is shown, after onMount the first time), `onRefresh` (turns on pull-to-refresh; the spinner holds until its actions finish), `onSearch` and `onSearchChange` (`_event: value` is the text; changes are debounced) and `onHeaderAction` (`_event: id`; an action's `event` names another). Its slots: `content`, and `headerLeft`/`headerRight` for blocks drawn in the header at their natural size. `src/blocks/Screen/examples.yaml` shows a list page, a detail page and a search tab page.

## Icons

Blocks draw every icon through `components.Icon`, as on the web. `@lowdefy/client-native` installs it (`createIcon` over its `Icon` IconData renderer, the same renderer the shell's menus use), from `types.icons`, the icon data by name. The `Icon` block wraps it, as a button when it has `onClick`.

## Tests

Each block has a Jest test under React Native's preset that renders a page through `LowdefyPage` with the real blocks (`src/test/renderPage.js`): the computed theme of an app with `colorPrimary: #6366f1` (`src/test/theme.json`), a few lucide icons (`src/test/icons.json`) and the `SetState`, `CallMethod`, `Validate`, `Wait` and `Record` actions, so a test types, picks and validates as a person would. `fixtures/display-blocks` is an app whose shared page uses every native block with a web version; `lowdefy build` builds it for both targets.

`@expo/ui` is mapped to stand-ins in `src/test/` that keep the props the blocks pass; a test fires their callbacks with `fireEvent(view, 'valueChange', ...)`.

`packages/shell/fixtures/formPage.test.js` builds the `fixtures/form` app with `@lowdefy/build` in a
child process and renders its page with these blocks: the build check that a form page of the
native set builds and renders. It lives in the shell because `@lowdefy/build` depends on this
package.
