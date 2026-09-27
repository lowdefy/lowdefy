---
'@lowdefy/blocks-antd': minor
---

feat: Expose more antd 6.6 features on the text, number, date, colour and range input blocks.

Existing properties, events, cssKeys and defaults are unchanged. A few fixes change what existing
apps see; they are listed under **Behaviour changes**.

**Text inputs**

- `TextInput`, `TextArea`: new `onClear` event. New Input tokens on the `TextInput` theme:
  `inputFontSize`, `inputFontSizeLG`, `inputFontSizeSM`.
- `PasswordInput`: new `allowClear`, `maxLength`, `prefix` and `prefixIcon` properties, a
  `prefixIcon` cssKey, an `onClear` event, and the Input font size tokens.
- `NumberInput`: new `prefix`, `prefixIcon`, `suffix` and `suffixIcon` properties (with
  `prefixIcon` and `suffixIcon` cssKeys), `mode: spinner` for minus and plus buttons on either side
  of the input, and `changeOnWheel`.
- `AutoComplete`: new `prefix` and `prefixIcon` properties, an `onSelect` event that fires when an
  option is picked from the dropdown, and `popup` and `prefixIcon` cssKeys.
- `PhoneNumberInput`: new `onClear` event, and a `selectorBg` theme token for the region selector
  background.
- The `underlined` variant works on every input with a `variant` property.

**Date selectors** (`DateSelector`, `DateTimeSelector`, `DateRangeSelector`, `MonthSelector`,
`WeekSelector`)

- New `prefix`, `prefixIcon`, `placement` and `inputReadOnly` properties, a `prefixIcon` cssKey,
  the `underlined` variant, and `onFocus`, `onBlur`, `onClear` and `onOpenChange` events.
  `DateRangeSelector` passes `{ range: 'start' | 'end' }` with `onFocus` and `onBlur`.
- `showWeek` on `DateSelector`, `DateTimeSelector` and `DateRangeSelector`.
- `DateTimeSelector`: `needConfirm: false` removes the OK button and saves the selection when the
  popup closes.
- `DateRangeSelector`: `allowEmpty` for open-ended ranges (the empty end is `null` in the value), and
  `disabled` accepts `[true, false]` to disable only one end.
- The five blocks document the same design token set, now including `presetsWidth`,
  `presetsMaxWidth`, `hoverBg`, `activeBg` and `withoutTimeCellHeight`.

**Colour, range and toggle inputs**

- `ColorSelector`: `mode` accepts `[single, gradient]` to offer both, `presets` items are
  documented, and a new `popup` cssKey.
- `Slider`: `disabled` accepts an array to disable individual range handles, `range` accepts
  `{ draggableTrack, editable, minCount, maxCount }`, new `autoFocus` and `keyboard` properties,
  `onChangeComplete`, `onFocus` and `onBlur` events, and `rail`, `track` and `handle` cssKeys.
- `Switch`: new `loading` property.
- `CheckboxSwitch`: new `indeterminate` and `autoFocus` properties.

**Behaviour changes**

- `ColorSelector`: clearing the colour sets the value to `null`, where it used to be the last colour
  with zero alpha, eg. `#1677ff00`. A cleared, required ColorSelector now fails validation. In
  gradient mode the value is a `linear-gradient(...)` CSS string.
- `PhoneNumberInput`: the region selector and the input are siblings in an `.ant-space-compact`
  group instead of an `.ant-input-group-addon`. The `ldf-phone-number-input` class and the `element`
  style stay on the outer wrapper, but CSS that targets `.ant-input-group-addon` or
  `.ant-input-group-wrapper` needs updating. The `theme` applies to both the region selector and the
  input. `addonBg` no longer applies, since there is no addon; use `selectorBg`.
- `AutoComplete` and `ColorSelector`: `theme` tokens used to be ignored and now apply (see Fixes).

**Fixes**

- `AutoComplete` theme tokens now apply. They targeted a component token set antd does not have;
  they now target `Select`, which AutoComplete renders.
- `ColorSelector` theme tokens now apply (they targeted `ColorSelector` instead of `ColorPicker`).
  The `colorPicker*` tokens are no longer documented, since antd computes them and ignores
  overrides.
- `ColorSelector` gradient mode works: a gradient is stored as a `linear-gradient(...)` CSS string
  and read back as a gradient, where it used to collapse to its first colour and switch the picker
  back to single mode. Clearing the colour sets the value to `null` instead of a transparent hex.
- The `popup` cssKey of the date selectors now reaches the calendar popup. The date selectors no
  longer document `addonBg`, which the DatePicker never reads.
- The `variant` description says that `bordered: false` takes precedence, which is how the input
  blocks behave.
- `PhoneNumberInput` renders the region selector and the input in a `Space.Compact` group instead of
  the deprecated `addonBefore`.
- `AutoComplete` and `PhoneNumberInput` pass options as an `options` array and search settings
  through `showSearch`, instead of the deprecated `Select.Option` children and top-level
  `filterOption`, `onSearch` and `optionFilterProp`.
- `DateTimeSelector` no longer passes the deprecated `onSelect`, which antd 6 ignores.
  `showToday` is passed to antd as `showNow` on `DateSelector` and `DateTimeSelector`.
- `Switch` passes `size: medium` to antd for the `default` size, which antd 6 deprecates.
- `Search` passes `destroyOnHidden` to its modal instead of the deprecated `destroyOnClose`.
- `Search` `theme` now applies. It targeted an antd component that doesn't exist; the tokens now style the trigger Button, the search Modal and its Input.
- `RatingSlider` no longer passes Lowdefy's `components` and `events` to the antd Slider.
- `DateTimeSelector` documents the `secondStep` default (30) and description correctly, and
  `MonthSelector` and `WeekSelector` document that `showToday` has no effect.
- Examples that used the removed `inputStyle`, `optionsStyle` and object `options` properties now
  use `style` cssKeys or are removed.
