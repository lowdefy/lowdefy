# @lowdefy/blocks-native

The native block set: React Native components a Lowdefy mobile shell renders through `@lowdefy/client-native`. Each block keeps its web block's type name, properties, events, methods and slots, so one page can be shared by web and mobile.

## Blocks

Layout and display blocks: `Box`, `Card`, `Divider`, `Tabs`, `Title`, `Paragraph`, `Markdown`, `Icon`, `Tag`, `Alert`, `Empty`, `Skeleton`, `Spinner` and `PageDots`. List, input and action blocks: `List`, `ListItem`, `Avatar`, `StatusIcon`, `TextInput`, `TextArea`, `NumberInput`, `Selector`, `ChipSelector`, `Switch`, `DateSelector` and `Button`. `Screen` (the mobile page type) has its meta here and its component in `@lowdefy/client-native`. `Empty`, `ListItem`, `Avatar`, `StatusIcon`, `ChipSelector` and `PageDots` have no web block; a page that uses one is mobile only. Box's `onSwipeLeft`, `onSwipeRight` and `swipeFeedback` are mobile only.

| Block                 | Web source          | Native notes                                                                                    |
| --------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `Box`                 | blocks-basic        | A `View`, or a `Pressable` button with `onClick`; swipe events (see Swipes below).              |
| `Card`                | blocks-antd         | Header (title, extra), cover, body, actions; `loading` draws skeleton rows.                     |
| `Divider`             | blocks-antd         | Dashed and dotted lines are zero-height views with a split border (iOS draws dashes only so).   |
| `Tabs`                | blocks-antd         | Top tabs in a scrolling bar (RN views, not `@expo/ui`); `setActiveKey` method; `bottom` too.    |
| `Title`, `Paragraph`  | blocks-antd         | Text styles from antd's typography; `ellipsis` with expand/collapse fires `onExpand`.           |
| `Markdown`            | blocks-markdown     | Read-only GFM drawn with RN views by `react-native-marked` (below); `onLinkPress`, `linkChips`. |
| `Icon`                | blocks-basic        | Drawn by the native icon renderer; a button with `onClick`.                                     |
| `Tag`                 | blocks-antd         | Status and preset colours from the computed palette tokens; closable; `href` opens outside.     |
| `Alert`               | blocks-antd         | Type colours and icon; closable fires `onClose` then `afterClose`; `action` slot.               |
| `Skeleton`, `Spinner` | blocks-loaders      | A shimmering shape or `variant` layout (below); the platform `ActivityIndicator`.               |
| `Empty`               | none (antd `Empty`) | The empty tray or an icon, a description and a `footer` slot.                                   |

The list, input and action blocks:

| Block          | Notes                                                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextInput`    | `type` picks the keyboard (`getKeyboardProps`); `replaceInput`, `allowClear`, `showCount`, `prefix`/`suffix` as on the web.                                                                                                            |
| `NumberInput`  | Keeps its own text so "-" and "1." can be typed; sets a number on each valid change; clamps to `min`/`max` and rounds to `precision` on blur; `mode: spinner` shows step buttons.                                                      |
| `Selector`     | The picker works on option indices, so option values may be any type (matched by stable serialization, as the web). A placeholder item stands for no value. Disabled options are left out.                                             |
| `DateSelector` | The value is the picked day at midnight UTC, as the web. Shows the calendar under the field on iOS and Material's dialog on Android. Only `disabledDates.min`/`max` are supported.                                                     |
| `ChipSelector` | Mobile only. A horizontally scrolling strip of chips that picks one option (`valueType: string`), such as a space switcher. See Chip strips below.                                                                                     |
| `List`         | Web model and methods; a `SectionList` (a `FlatList` for a row List). `variant: insetGrouped` (default) or `plain`; sections from `header`, or `sectionKey` with `sections`. Scrolls itself only with `scroll: true`. See Lists below. |
| `ListItem`     | Mobile only, a container for its `leading` and `trailing` slots. Leading glyph, title, subtitle, trailing parts, chevron, press highlight, swipe actions and a context menu. See Lists below.                                          |
| `Button`       | `getButtonColors` follows antd: `color` + `variant`, or the deprecated `type` (where a preset colour has no effect and a custom colour replaces primary). The spinner comes from `events.onClick.loading`.                             |

## Lists

- **Colours.** `shared/getSemanticColors` reads the iOS semantic colours (grouped background, cell, cell pressed, separator, label tiers) from the theme (`colorGroupedBackground`, `colorCell`, `colorCellPressed`, `colorSystemBackground`, `colorSeparator`, `colorLabel`, `colorSecondaryLabel`, `colorTertiaryLabel`, from client-native's semantic tokens), and falls back to the closest antd token (`colorBgLayout`, `colorBgContainer`, `colorFill`, `colorBorder`, `colorText*`). Colour names in config (`teal`, `amber`, `grey`, `colorSuccess`, a hex) go through `shared/resolveColor`: a hue is its mode-adjusted 6th shade.
- **Type.** Rows and headers use the iOS text styles in `shared/iosTextStyles` (Headline title with a subtitle, Body alone, Footnote subtitle and headers), in the system font.
- **Sections.** `getSections` turns `header`, or `sectionKey` and `sections`, into SectionList sections. Without `sections`, neighbouring items with the same key share a section (the list order is kept); with it, every item joins its key's section in the order given, unlisted keys follow and empty sections are hidden.
- **Rows.** `ListRow` draws each item as a cell (inset, first and last rounded, clipped) and the hairline separator under all but a section's last row. It provides `ListRowContext`: a ListItem in the row sets the separator inset to its title (`getListItemParts` computes it; a `leading` slot is measured with `onLayout`) and swipes on the row's background.
- **Swipe actions.** `shared/SwipeableRow` (Animated and PanResponder, JS driven): leading and trailing trays that grow with the drag, the first action at the edge, open past half, and a full swipe past 60% of the row runs the edge action on the sides `fullSwipe` allows (ListItem: leading by default). SwiftUI's SwipeActions only work inside a SwiftUI List, and List items are React Native views. No haptics: the shell links no haptics module.
- **Context menu.** On iOS `ListItemContextMenu` hosts the row in `@expo/ui/swift-ui`'s `ContextMenu` trigger (`Host` and `RNHostView`), its items as SwiftUI buttons with SF Symbols (`getSfSymbol`; a Lucide name shows no icon). It requires `@expo/ui/swift-ui` when drawn, so Android and the shell's Jest never load SwiftUI. Elsewhere a long press shows an alert (`showContextMenuAlert`). Screen readers get swipe and menu items as accessibility actions on the row.
- **Avatar and StatusIcon.** `getInitials` (first and last word, an email's name part) and `getAvatarColor` (an FNV-1a hash of the lower-cased name into nine antd hues, deeper shades for bright hues in light mode). `StatusGlyph` draws each glyph on a 16 unit grid with react-native-svg; marks inside filled glyphs use the cell colour so they read as cut out. `StatusMark` adds the label and accessibility, and is shared by StatusIcon, ListItem and section headers.

## Swipes

A Box with `onSwipeLeft` or `onSwipeRight` takes horizontal swipes, such as swiping through recent records (with `PageDots` for the place among them). `Box/useSwipeGesture` is a PanResponder on the Box (around its Pressable when it has `onClick`, since a Pressable sets its own responder handlers), and the thresholds are plain functions with tests:

- **Taking a drag.** `isSwipeGesture` answers the bubble-phase `onMoveShouldSetPanResponder` only, so rows inside the Box with their own swipes (a ListItem's swipe actions take the capture phase) win, and a press inside the Box is cancelled once the Box takes the drag. It takes a drag that `getSwipeDirection` calls a swipe (across more than 40pt and more than twice as far across as down, or a flick faster than 0.5pt/ms past 10pt) in a direction the Box has an event for, and never one that started within 20pt of the screen's left edge (`moveX - dx`), which is iOS's back gesture. Vertical drags stay with the page's scroll view. Once taken, the Box refuses to give the drag up.
- **Release.** The pan responder measures from its grant, so the hook keeps the distance it took the drag at and judges the release on the whole drag: a drag dragged back short of a swipe fires nothing.
- **Feedback.** `swipeFeedback: true` moves the Box on a rubber band (`getRubberBand`: iOS's `1 - 1 / (x * 0.55 / 48 + 1)` stretch, never past 48pt) from where it took the drag, so it does not jump by the 40pt, and only toward a direction it has an event for; it springs back on release, on the native driver.
- **Native scroll views inside.** A UIScrollView's pan recogniser takes a drag natively, before the JS responder system negotiates, and cancels the JS touch (`cancelsTouchesInView`), so no capture or bubble choice in the Box can win a drag a horizontal scroll view inside it begins. A ChipSelector therefore scrolls only when its chips overflow (`scrollEnabled`, and `alwaysBounceHorizontal: false`), so a strip that fits leaves the drag to the Box. The Box provides `shared/SwipeContext` (`{ directions, swipe }`, only a Box with swipe events, so a plain Box between leaves it); a strip that overflows passes a drag released past an end it cannot scroll further toward (`getOverscrollSwipe`: 20pt past, about the 40pt drag under iOS's rubber band, or a flick past 0.5pt/ms) on as the Box's swipe that way, from `onScrollEndDrag`. Android does not scroll past the ends, so there a swipe across an overflowing strip only scrolls it.
- **Screen readers.** Each swipe event is an accessibility action (`swipeLeft`, `swipeRight`) on the Box's accessible element.

`PageDots` is iOS's page control: `count` 7pt dots 9pt apart in `color` (a hue, token or hex through `resolveColor`; the label colour by default) at 30%, and an active dot over them in full that slides to `index` on a spring as it stretches across and settles round (native driver). Screen readers read "Page 2 of 5". An index past the end shows the last page.

## Chip strips

`ChipSelector` is a space switcher in the style of Linear's and GitHub's iOS apps: a horizontal `Animated.ScrollView` of chips, 16pt leading and trailing padding and 8pt between chips.

- **Chip.** 32pt tall, 16pt radius (continuous corners), a 1pt border that is clear until selected (so selection never moves the layout). A 20pt rounded-square tile (radius 6) holds the option's Lucide icon at 13pt, then the label in Subheadline semibold and an optional `badge` in Footnote semibold with tabular numbers. Pressing scales the chip to 0.97 (`Animated`, native driver) and springs back.
- **Colour.** `getChipColors` reads the option's `color`: `{ fg, bg, fgDark, bgDark }` is a mark drawn fg on bg (as a Pelican space's mark on the web), a string is a palette hue, token or hex through `shared/resolveColor` drawn as a tile with a white icon, and no colour is `colorTint`. Unselected chips sit on `colorSystemFill` in `colorLabel`; the selected chip fills with bg (or the colour at 15%, 24% in dark mode, through `withAlpha`) with its border and label in the colour, and a mark's tile flips to fg with the icon in bg so it stays visible on the bg fill. Dark mode takes the dark variants, and never a mark's light bg.
- **Scrolling.** `getScrollTarget` scrolls as little as brings the selected chip into view, 24pt clear of the edge (the fade): without animation once the strip, its content and the chip are laid out (`onLayout`, `onContentSizeChange`), animated on each later change. `getFadeRanges` gives each edge fade an interpolation of the native-driven scroll offset, so the leading fade grows in over the first 24pt scrolled and the trailing one fades out over the last; none while the content fits. The fades (`EdgeFade`, react-native-svg gradients) go from `fadeColor` (the grouped background by default) to clear, since React Native has no alpha mask without a native module.
- **Scrolling only when needed.** The strip scrolls only when its chips overflow, and never bounces when they fit, so a Box with swipe events around it takes swipes across it (see Swipes).
- **More chip.** `moreChip: { label, icon }` adds a trailing chip, its icon drawn plain, that fires `onMore` (a Sheet of every option) and sets no value.
- **Edge to edge.** In an area that provides `EdgeInsetContext` (a Screen's `headerBottom`), the strip cancels the area's padding with a negative margin so it scrolls to the screen edges.

## Markdown

`Markdown` draws GitHub-flavoured markdown (headings, emphasis, strikethrough, code, block quotes, ordered, unordered and task lists, tables, images, links) with React Native views. It takes the web block's `content` and `skipHtml`, and adds `onLinkPress` and `linkChips`.

- **Library.** `react-native-marked` parses with `marked` and draws with `Text`, `View` and `Image`. Its native peers are `react-native-svg` and `expo-web-browser` (for the in-app browser), which the `basic` profile already links, so the block adds no native module and reaches shells in an update. `react-native-markdown-display` was not chosen: its last release was in 2023, on `markdown-it` 10. A web-view `Markdown` costs a web view per instance.
- **Scrolling.** The block uses the `useMarkdown` hook, not the library's `FlatList` component, because a block sits in the page's scroll view.
- **Theme.** `getMarkdownStyles` maps the iOS semantic tokens onto the library's styles (body text, headings in the title1 to footnote text styles, inline code on `colorTertiarySystemFill` in the platform's monospace font) and gives a `palette` the block's own components draw with.
- **Drawing.** `MarkdownRenderer` replaces most of the library's drawing: lists with a marker column, bullets and numbers by depth (`MarkdownList`, `getListMarker`, depth through a context), fenced code as a rounded card with its language that scrolls sideways (`MarkdownCode`), quotes with a tint bar, tables in a rounded box with a semibold header row and columns measured once (`MarkdownTable`), hairline rules and rounded images. `trimOuterSpace` drops the space above the first and below the last element.
- **Links.** Every link, wherever it sits (headings, emphasis, lists, quotes, table cells), presses through one handler. With `onLinkPress` the block triggers the event with `{ href }` and opens nothing; without it, an http(s) link opens in the in-app browser (`expo-web-browser`) and any other through `Linking.openURL`. The library reads an href without a scheme from the app root, so `page` passes `/page` and `#notes` passes `/#notes`.
- **Link chips.** A link whose scheme is in `linkChips` is a `LinkChip`: an inline pill with the chip's icon, the key (the part of the text the address names, `getLinkChip`) and the title, tinted by `tone` (`getLinkChipColors`), one line wide at most the block's width (`ChipWidthContext`). Chips press through `onLinkPress` only. Pelican's phone pages rewrite `[[PEL-12]]` as `[PEL-12 Title](pelican:PEL-12)` and `[[user:id]]` as `[@Name](mention:id)` for them. The library reads an href without a scheme from the app root, so `page` passes `/page` and `#notes` passes `/#notes`.
- **Raw HTML** is drawn as its source text, as the web block escapes it. With `skipHtml` it is left out.
- **Task lists.** The library draws no checkbox token, so `MarkdownTokenizer` puts a private-use mark in front of a task item's text. The renderer draws it as a `TaskMark`, which tells its list item (through a context, before paint) to draw a `TaskBox` where its marker goes.

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

`Screen` is the mobile page type. Its properties: `title`, `largeTitle` (an iOS large title that collapses as the page scrolls), `presentation` (`card`, `modal`, `sheet`), `backgroundTint` (`{ color, colorDark, height }`, a gradient wash of colour fixed at the top of the screen behind the bar and content, fading out at `height` of the screen, cross-faded on change; drawn by client-native), `headerSearch` (`{ placeholder, autoFocus, debounce, hideWhenScrolling }`, a native search bar) and `headerActions` (`[{ id, icon, sfSymbol, title, placement, event, disabled, items }]`, header icon buttons at their natural size, native SF Symbol bar buttons on iOS; with `items`, `[{ id, title, symbol, destructive, disabled }]`, the button opens a menu, a native UIMenu on iOS, and the picked item's id is the event's `_event: id`). Its events: `onFocus` (each time the screen is shown, after onMount the first time), `onRefresh` (turns on pull-to-refresh; the spinner holds until its actions finish), `onSearch` and `onSearchChange` (`_event: value` is the text; changes are debounced) and `onHeaderAction` (`_event: id`; an action's `event` names another). Its slots: `content`, `headerLeft`/`headerRight` for blocks drawn in the header at their natural size, and `headerBottom` for blocks pinned under the header (under the large title or the search field) as the page scrolls, such as a ChipSelector and a SegmentedControl: client-native draws it as the page's first content and moves it with the page's scroll offset and the shell's header inset (see code-docs/packages/client-native.md), and `footer`, pinned below the scroll view above the tab bar and the keyboard (where a Composer goes). `src/blocks/Screen/examples.yaml` shows a list page, a list page with a space switcher and filter under the header, a detail page a search tab page, and a detail page with a backgroundTint.

## Icons

Blocks draw every icon through `components.Icon`, as on the web. `@lowdefy/client-native` installs it (`createIcon` over its `Icon` IconData renderer, the same renderer the shell's menus use), from `types.icons`, the icon data by name. The `Icon` block wraps it, as a button when it has `onClick`.

## Tests

Each block has a Jest test under React Native's preset that renders a page through `LowdefyPage` with the real blocks (`src/test/renderPage.js`): the computed theme of an app with `colorPrimary: #6366f1` (`src/test/theme.json`), a few lucide icons (`src/test/icons.json`) and the `SetState`, `CallMethod`, `Validate`, `Wait` and `Record` actions, so a test types, picks and validates as a person would. `fixtures/display-blocks` is an app whose shared page uses every native block with a web version; `lowdefy build` builds it for both targets.

`@expo/ui` is mapped to stand-ins in `src/test/` that keep the props the blocks pass; a test fires their callbacks with `fireEvent(view, 'valueChange', ...)`.

`packages/shell/fixtures/formPage.test.js` builds the `fixtures/form` app with `@lowdefy/build` in a
child process and renders its page with these blocks: the build check that a form page of the
native set builds and renders. It lives in the shell because `@lowdefy/build` depends on this
package.

## Skeleton

`Skeleton` draws a placeholder shaped like the content that replaces it, so nothing jumps when data lands. `variant` picks the shape: `listRow` (a leading 22pt circle, a title bar 60 to 80% wide varied by row, shorter subtitle bars, an optional trailing 20pt circle), `insetGroup` (sections of rows in rounded cell cards with a header bar, at the inset grouped List's spacing; `count` may list each section's rows), `hero` (chip, key, two Title 1 bars, avatar and meta), `paragraph` (ragged body lines), `card` (paragraph lines in a cell card) and `timeline` (rail circles with one or two lines). Without a variant, `count`, `rows` or `avatar` draw list rows and anything else one shape of `width` and `height`.

- **Shimmer** (`src/skeleton/`): every shape is the `colorSkeleton` fill with a soft wide band of `colorSkeletonHighlight` sweeping left to right. One clock (`shimmerClock`, a 1.2s native-driver loop) runs while any shape is mounted, and each shape places the band by its x in its Skeleton block (`SkeletonFrameContext`, `measureLayout`), so all the shapes on a screen sweep as one band. With Reduce Motion on (`useReduceMotion` from client-native) the shapes are the plain fill and the clock does not run.
- **Bars** stand for an iOS text style (`skeletonText`): the bar sits in the style's line height, with round caps, so the text that replaces it takes the same room.
- **Accessibility:** the whole skeleton is one "Loading" progress bar.
- **Fade:** put `loading` and `skeleton` on the block that loads; client-native fades its content in when it stops loading (see client-native).
