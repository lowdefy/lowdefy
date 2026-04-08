# Upstream PhoneNumberInput Formatting to Lowdefy

## Background

The PRP project has two behavioral improvements to `PhoneNumberInput` that should be upstreamed into Lowdefy. Currently, Lowdefy does raw string concatenation to build the `phone_number` value (`` `${region?.dial_code ?? ''}${input}` ``), which produces malformed phone numbers when users type leading zeros or non-digit characters. It also stores the dial code as `phone_number` when the input is empty.

### Current behavior (Lowdefy) vs desired behavior (PRP)

With ZA (+27) dial code selected:

| User types | Current `phone_number` | Desired `phone_number` |
|---|---|---|
| `0821234567` | `+270821234567` | `+27821234567` |
| `(082) 123-4567` | `+27(082) 123-4567` | `+27821234567` |
| (empty) | `+27` | `""` |

## Changes

All paths relative to `packages/plugins/blocks/blocks-antd/src/blocks/PhoneNumberInput/`.

### A. Create `formatPhoneNumber.js`

New file. Strips non-digit characters and leading zeros from input before concatenating with the dial code. Returns empty string when the cleaned input is empty.

```js
const formatPhoneNumber = (dialCode = '', input) => {
  // Strip all non-digit characters from input, then strip leading zeros
  const cleanInput = (input || '').replace(/\D/g, '').replace(/^0+/, '');

  // If the cleaned input is empty, return an empty string
  if (cleanInput.length === 0) {
    return '';
  }
  // Concatenate the cleaned dial code and input
  return `${dialCode}${cleanInput}`;
};

export default formatPhoneNumber;
```

### B. Update `PhoneNumberInput.js`

1. Add import at the top with the other imports:

```js
import formatPhoneNumber from './formatPhoneNumber.js';
```

2. Replace the two raw concatenation lines with `formatPhoneNumber` calls:

**In `AddOnSelect` onChange handler (line 78):**

```diff
- const phone_number = `${region?.dial_code ?? ''}${input}`;
+ const phone_number = formatPhoneNumber(region?.dial_code, input);
```

**In main `Input` onChange handler (line 224):**

```diff
- const phone_number = `${region?.dial_code ?? ''}${input}`;
+ const phone_number = formatPhoneNumber(region?.dial_code, input);
```

3. Fix null initialization (line 163–169) — remove `phone_number` so the initial value doesn't store just a dial code as a phone number:

```diff
  if (value === null) {
    methods.setValue({
      input: '',
      region: allowedRegions[defaultValue],
-     phone_number: allowedRegions[defaultValue].dial_code,
    });
  }
```

### C. Update e2e tests

**In `tests/PhoneNumberInput.e2e.yaml`**, add test blocks:

```yaml
- id: phone_format_test
  type: PhoneNumberInput
  properties:
    title: Format Test
    defaultRegion: ZA
    allowedRegions:
      - ZA

- id: format_display
  type: Span
  properties:
    content:
      _if:
        test:
          _ne:
            - _state: phone_format_test.phone_number
            - null
        then:
          _string.concat:
            - 'Formatted: '
            - _state: phone_format_test.phone_number
        else: ''

- id: phone_empty_test
  type: PhoneNumberInput
  properties:
    title: Empty Init Test
    defaultRegion: ZA
    allowedRegions:
      - ZA

- id: empty_display
  type: Span
  properties:
    content:
      _if:
        test:
          _ne:
            - _state: phone_empty_test
            - null
        then:
          _string.concat:
            - 'PhoneNumber: ['
            - _state: phone_empty_test.phone_number
            - ']'
        else: 'null'
```

**In `tests/PhoneNumberInput.e2e.spec.js`**, add tests:

```js
test('strips leading zeros from phone number value', async ({ page }) => {
  const input = getInput(page, 'phone_format_test');
  await input.fill('0821234567');
  await expect(input).toHaveValue('0821234567');

  const display = getBlock(page, 'format_display');
  await expect(display).toHaveText('Formatted: +27821234567');
});

test('strips non-digit characters from phone number value', async ({ page }) => {
  const input = getInput(page, 'phone_format_test');
  await input.fill('(082) 123-4567');
  await expect(input).toHaveValue('(082) 123-4567');

  const display = getBlock(page, 'format_display');
  await expect(display).toHaveText('Formatted: +27821234567');
});

test('empty input produces empty phone_number, not just dial code', async ({ page }) => {
  const display = getBlock(page, 'empty_display');
  // On init with no input, phone_number should not be set to "+27"
  await expect(display).not.toContainText('+27');
});
```

## Files to modify

1. **New:** `formatPhoneNumber.js`
2. **Edit:** `PhoneNumberInput.js` — import + 2 line replacements + null init fix
3. **Edit:** `tests/PhoneNumberInput.e2e.yaml` — add formatting test blocks
4. **Edit:** `tests/PhoneNumberInput.e2e.spec.js` — add formatting tests

## Acceptance criteria

- Typing `0821234567` with +27 dial code produces `phone_number: "+27821234567"` (not `"+270821234567"`)
- Typing `(082) 123-4567` produces `phone_number: "+27821234567"`
- Empty input produces `phone_number: ""` (not `"+27"`)
- Initial null value does not set `phone_number` to the dial code
- The `input` field in the value object still stores exactly what the user typed (formatting only affects `phone_number`)
- All existing e2e tests pass
- New formatting tests pass
