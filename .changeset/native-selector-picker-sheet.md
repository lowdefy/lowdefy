---
'@lowdefy/blocks-native': minor
'@lowdefy/build': patch
---

feat(blocks-native): Selector `variant: sheet`, a picker sheet that shows avatar pictures

- Selector takes `variant: sheet`: the property row of `variant: menu`, opening a bottom sheet of the options in place of a native menu, as the assignee pickers of Linear's and GitHub's iOS apps. Native menus draw SF Symbols only; the sheet draws each option's avatar picture (or its initials), SF Symbol or icon.
- The sheet centres `menuTitle` with a close button, shows a search field when there are more options than `searchThreshold` (default 7) that matches labels ignoring case and accents, and lists 52pt rows with an optional `description` and a checkmark in the tint colour on the chosen row. Options with `pinned: true` sit in a group at the top, under the placeholder item drawn as a dashed circle, above a hairline.
- A short list rests at the medium detent; a long list or one with a search field can be dragged to the large detent, which focusing the search field opens. Picking a row fires onChange (and onClear for the placeholder) as the menu does and closes the sheet.
- @lowdefy/build's native block types list the Selector's new fallback icons.
