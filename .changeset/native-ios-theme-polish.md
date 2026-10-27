---
'@lowdefy/client-native': minor
'@lowdefy/blocks-native': minor
'@lowdefy/shell': minor
'@lowdefy/build': patch
---

feat(blocks-native): iOS semantic theme, dark mode and native block polish

- The native theme tokens carry the iOS semantic colours for each mode: `colorGroupedBackground`, `colorCell`, `colorCellNested`, `colorCellPressed`, `colorSystemBackground`, `colorSeparator`, `colorOpaqueSeparator`, `colorLabel`, `colorSecondaryLabel`, `colorTertiaryLabel`, `colorQuaternaryLabel`, `colorSystemFill` to `colorQuaternarySystemFill`, `colorTint` (the mode's `colorPrimary`) and `colorTintFill`. An app sets any of them per mode in `theme.antd.token`, `lightToken` or `darkToken`, and `_theme` reads them.
- Dark mode works end to end: pages draw on the grouped background, the shell's navigators take a theme built from the tokens (in place of React Navigation's light grey default), the status bar follows the mode, and the app window takes a mode fixed by config or SetDarkMode so native bars and controls match.
- Text follows the iOS text styles in the system font. Title levels 1 to 5 are largeTitle, title1, title2, title3 and headline, and Title and Paragraph take `textStyle`.
- An input without a title shows no label, in place of its block id.
- `TextInput` takes `variant: search`, the iOS search field. `TextArea` takes `variant: composer`, which grows from one line to six and shows a send button that fires the new `onSend` event and clears the field when its actions succeed.
- `Tag` is a pill with `size` (small or default) and a leading `dot`. `Empty` is a ContentUnavailableView with `icon`, `title` and `description`. `Skeleton` shimmers and draws loading list rows with `count`, `rows` and `avatar`. `Button` takes the iOS styles (`solid` as filled, and `tinted`, `gray` and `plain`), iOS sizes and `iconPlacement`, and shows an icon alone when it has no title. `Alert` is an iOS callout, and `Card` an iOS grouped cell.
