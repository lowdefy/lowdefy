---
'@lowdefy/blocks-native': minor
---

feat: iOS Settings-style rows for the native NumberInput, TextInput and DateSelector

- `variant: row` draws the input as the row a Selector `variant: menu` draws: the title at the left in Body, and the value right-aligned in the secondary label colour, or "Not set" while it is empty. The rows share the Selector row's height and padding, so an insetGrouped List mixing Selector, NumberInput, TextInput and DateSelector rows lines up.
- Pressing a NumberInput or TextInput row focuses its field (the number keyboard for a NumberInput). A DateSelector row opens a native menu: Today, Tomorrow, Next week, "Pick a date…" (the calendar under the row) and Clear.
- The Selector menu and sheet rows now draw their title in the iOS label colour and their value and placeholder in the secondary label colour, as these rows do.
