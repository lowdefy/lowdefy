---
'@lowdefy/blocks-native': minor
'@lowdefy/shell': minor
---

feat(blocks-native): Native List, ListItem, TextInput, TextArea, NumberInput, Selector, Switch, DateSelector and Button

`@lowdefy/blocks-native` now has components, exported from `./blocks`, for the phase 1 list, input and action blocks. They keep the web blocks' names, properties, events, methods and value types, so a page shared with the web works on a phone; web properties a phone cannot honour are accepted and described as ignored on mobile.

- `TextInput`, `TextArea` and `NumberInput` use React Native's text input with the keyboard each input needs (email, phone, URL, number or decimal pad, hidden password entry). `NumberInput` keeps its value within `min` and `max` and rounds to `precision` when it loses focus, and shows step buttons with `mode: spinner`.
- `Selector`, `Switch` and `DateSelector` use `@expo/ui`'s native picker, switch and date picker, now a dependency of the shell. `Selector` options may hold any value, as on the web, and `appearance: wheel` shows the iOS scroll wheel. `DateSelector` sets the picked day at midnight UTC, as on the web, and takes `disabledDates.min` and `max`.
- Every input has the web label: title, `required` mark, colon when inline, extra text, and the validation message once `Validate` shows it.
- `List` keeps the web model (an array in state, its `content` slot per item, and `pushItem`, `unshiftItem`, `removeItem`, `moveItemUp` and `moveItemDown`) and renders with a virtualised list. Phone-only: `swipeActions` (buttons a swiped item shows, each firing the event it names with the item index), `sectionKey` (sticky section headers) and the `onRefresh` event (pull to refresh, for a List with `scroll: true`).
- `ListItem` is new: a list cell with a title, description, avatar or icon, a detail on the right and a chevron, and `onClick`.
- `Button` follows `color`, `variant`, `danger`, `ghost`, `size`, `shape`, `block` and the deprecated `type`, and shows a spinner while its `onClick` runs.
- Blocks draw with the app's theme tokens in light and dark mode, with a block's own `theme` overrides over them, under its classes and style.
