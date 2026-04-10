---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Format PhoneNumberInput phone_number value.

PhoneNumberInput now strips leading zeros and non-digit characters from user input when building the `phone_number` value. Typing `0821234567` with +27 selected now produces `+27821234567` instead of `+270821234567`. Empty input produces an empty string instead of just the dial code.
