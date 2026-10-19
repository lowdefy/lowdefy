---
'@lowdefy/blocks-native': minor
---

feat: A tinted checkmark accessory on the native ListItem

- `trailing: { check: true }` draws the iOS checkmark (the `checkmark` SF Symbol at 17pt semibold, in the tint colour) at the end of the row, where the chevron goes, for the picked rows of a multi-select list such as labels in a sheet. A checked row has no chevron unless `chevron: true`, and a screen reader reads it as selected.
