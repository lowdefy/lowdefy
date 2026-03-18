---
'@lowdefy/blocks-antd': major
---

Replace boolean `bordered` property with enum `variant` on 16 input and display blocks.

**Migration:**

- `bordered: true` (default) -> `variant: outlined`
- `bordered: false` -> `variant: borderless`
- New option: `variant: filled`

Affected blocks: AutoComplete, Card, Collapse, Descriptions, DateSelector, DateRangeSelector, DateTimeSelector, MonthSelector, WeekSelector, MultipleSelector, NumberInput, PasswordInput, PhoneNumberInput, Selector, TextArea, TextInput.
