---
'@lowdefy/blocks-native': minor
'@lowdefy/build': patch
'@lowdefy/shell': patch
---

feat(blocks-native): Add the native MultipleSelector block

- `MultipleSelector` on mobile picks several options in a bottom sheet of checkable rows. Its value is an array of the chosen options' values, as on the web.
- `variant: sheet` draws the field as the iOS Settings-style row a Selector `variant: sheet` draws: the title at the left, and the chosen labels joined with ", " at the right, "agent-rules, ui +2" when they overflow, or "None", then the up-down chevron. Other variants draw an input box under the title that opens the same sheet.
- The sheet shows `menuTitle` with Done at the right, a search field past `searchThreshold`, and the options with the tinted checkmark on the chosen ones. Tapping a row toggles it without closing the sheet. The options chosen when the sheet opens are listed first, and keep their place while rows are toggled. Options take `disabled`, `description`, `avatar`, `icon`, `symbol` and `iconColor` as in the Selector, and `maxCount` limits how many can be chosen.
- `onChange` fires once, as the sheet closes (Done, a swipe down, or its screen no longer being shown), when the set of values changed, with the new array as `_event: value`. `changeOn: toggle` fires it on each toggle instead. `onOpenChange` fires as the sheet opens and closes.
- `allowCreate: true` adds an "Add “text”" row at the top of the sheet while the search text is no option. `createPattern` (a regular expression) checks the text, and `createPatternMessage` shows in the row while it does not match. An added value is chosen, and stays an option while the block is shown.
- To a screen reader the rows are checkboxes with their checked state, and the field's value is the chosen labels.
- The Selector sheet's pieces (`PickerSheet`, `PickerOptionRow`, `PickerSearchField`, `getPickerSheetRows`) now serve both blocks; a Selector sheet looks and behaves as before.
